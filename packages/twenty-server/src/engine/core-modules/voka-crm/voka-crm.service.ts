// FORK: Voka CRM — Fase 2
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

import { MotivoPerdaEntity } from './entities/motivo-perda.entity';
import { ProdutoEntity } from './entities/produto.entity';
import { LeadProdutoEntity } from './entities/lead-produto.entity';
import { ClienteRecorrenteEntity } from './entities/cliente-recorrente.entity';
import { VokaNotificationEntity } from './entities/voka-notification.entity';
import { LeadProdutoDTO } from './dtos/voka-crm.dto';
import {
  AddLeadProdutoInput,
  CreateMotivoPerdaInput,
  CreateProdutoInput,
  UpdateLeadProdutoInput,
  UpdateProdutoInput,
  CreateClienteRecorrenteInput,
  UpdateClienteRecorrenteInput,
} from './dtos/voka-crm.input';

const subtotalDoItem = (i: {
  quantidade: number | string;
  preco: number | string;
  desconto: number | string;
}): number =>
  Math.max(
    0,
    Number(i.quantidade) * Number(i.preco) - Number(i.desconto),
  );

@Injectable()
export class VokaCrmService {
  constructor(
    @InjectRepository(MotivoPerdaEntity)
    private readonly motivoPerdaRepo: Repository<MotivoPerdaEntity>,

    @InjectRepository(ProdutoEntity)
    private readonly produtoRepo: Repository<ProdutoEntity>,

    @InjectRepository(LeadProdutoEntity)
    private readonly leadProdutoRepo: Repository<LeadProdutoEntity>,

    @InjectRepository(ClienteRecorrenteEntity)
    private readonly clienteRepo: Repository<ClienteRecorrenteEntity>,

    @InjectRepository(VokaNotificationEntity)
    private readonly notificationRepo: Repository<VokaNotificationEntity>,
  ) {}

  // ── F3: Itens de negócio (produto × qtd × preço − desconto) ────────────────

  async listItensDoLead(
    workspaceId: string,
    leadId: string,
  ): Promise<LeadProdutoDTO[]> {
    const itens = await this.leadProdutoRepo.find({
      where: { workspaceId, leadId },
      order: { createdAt: 'ASC' },
    });

    if (itens.length === 0) return [];

    const produtos = await this.produtoRepo.find({
      where: { workspaceId, id: In(itens.map((i) => i.produtoId)) },
    });
    const porId = new Map(produtos.map((p) => [p.id, p]));

    return itens.map((i) => {
      const p = porId.get(i.produtoId);

      return {
        id: i.id,
        leadId: i.leadId,
        produtoId: i.produtoId,
        produtoNome: p?.nome ?? 'Produto removido',
        produtoUnidade: p?.unidade ?? 'un',
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        desconto: Number(i.desconto),
        subtotal: subtotalDoItem(i),
        createdAt: i.createdAt,
      };
    });
  }

  async addLeadProduto(
    workspaceId: string,
    input: AddLeadProdutoInput,
  ): Promise<LeadProdutoDTO[]> {
    // Preço default vem do catálogo quando não informado
    const produto = await this.produtoRepo.findOne({
      where: { workspaceId, id: input.produtoId },
    });

    await this.leadProdutoRepo.save(
      this.leadProdutoRepo.create({
        workspaceId,
        leadId: input.leadId,
        produtoId: input.produtoId,
        quantidade: input.quantidade ?? 1,
        preco: input.preco ?? Number(produto?.preco ?? 0),
        desconto: input.desconto ?? 0,
      }),
    );

    await this.recomputarValorDoNegocio(workspaceId, input.leadId);

    return this.listItensDoLead(workspaceId, input.leadId);
  }

  async updateLeadProduto(
    workspaceId: string,
    input: UpdateLeadProdutoInput,
  ): Promise<LeadProdutoDTO[]> {
    const item = await this.leadProdutoRepo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });

    await this.leadProdutoRepo.update(
      { id: input.id, workspaceId },
      {
        ...(input.quantidade !== undefined
          ? { quantidade: input.quantidade }
          : {}),
        ...(input.preco !== undefined ? { preco: input.preco } : {}),
        ...(input.desconto !== undefined ? { desconto: input.desconto } : {}),
      },
    );

    await this.recomputarValorDoNegocio(workspaceId, item.leadId);

    return this.listItensDoLead(workspaceId, item.leadId);
  }

  async removeLeadProduto(
    workspaceId: string,
    id: string,
  ): Promise<LeadProdutoDTO[]> {
    const item = await this.leadProdutoRepo.findOne({
      where: { id, workspaceId },
    });

    if (!item) return [];

    await this.leadProdutoRepo.delete({ id, workspaceId });
    await this.recomputarValorDoNegocio(workspaceId, item.leadId);

    return this.listItensDoLead(workspaceId, item.leadId);
  }

  // O valor do negócio passa a ser a soma dos itens. A conexão core alcança
  // qualquer schema do banco, então atualizamos as colunas da moeda direto.
  private async recomputarValorDoNegocio(
    workspaceId: string,
    leadId: string,
  ): Promise<void> {
    const itens = await this.leadProdutoRepo.find({
      where: { workspaceId, leadId },
    });
    const totalReais = itens.reduce((s, i) => s + subtotalDoItem(i), 0);
    const micros = Math.round(totalReais * 1_000_000);
    const schema = getWorkspaceSchemaName(workspaceId);

    await this.leadProdutoRepo.manager.query(
      `UPDATE "${schema}"."opportunity"
         SET "amountAmountMicros" = $1, "amountCurrencyCode" = 'BRL'
       WHERE id = $2`,
      [micros, leadId],
    );
  }

  // ── Motivo de Perda ────────────────────────────────────────────────────────

  listMotivoPerda(workspaceId: string): Promise<MotivoPerdaEntity[]> {
    return this.motivoPerdaRepo.find({
      where: { workspaceId, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  createMotivoPerda(
    workspaceId: string,
    input: CreateMotivoPerdaInput,
  ): Promise<MotivoPerdaEntity> {
    return this.motivoPerdaRepo.save(
      this.motivoPerdaRepo.create({ workspaceId, ...input }),
    );
  }

  async deleteMotivoPerda(workspaceId: string, id: string): Promise<boolean> {
    await this.motivoPerdaRepo.update({ id, workspaceId }, { ativo: false });
    return true;
  }

  // ── Produto / Catálogo ────────────────────────────────────────────────────

  listProdutos(workspaceId: string, apenasAtivos = true): Promise<ProdutoEntity[]> {
    return this.produtoRepo.find({
      where: apenasAtivos ? { workspaceId, ativo: true } : { workspaceId },
      order: { nome: 'ASC' },
    });
  }

  createProduto(
    workspaceId: string,
    input: CreateProdutoInput,
  ): Promise<ProdutoEntity> {
    return this.produtoRepo.save(
      this.produtoRepo.create({ workspaceId, ...input }),
    );
  }

  async updateProduto(
    workspaceId: string,
    input: UpdateProdutoInput,
  ): Promise<ProdutoEntity> {
    const { id, ...rest } = input;
    await this.produtoRepo.update({ id, workspaceId }, rest as Partial<ProdutoEntity>);
    return this.produtoRepo.findOneOrFail({ where: { id, workspaceId } });
  }

  async deleteProduto(workspaceId: string, id: string): Promise<boolean> {
    await this.produtoRepo.update({ id, workspaceId }, { ativo: false });
    return true;
  }

  // ── Cliente Recorrente ────────────────────────────────────────────────────

  listClientes(workspaceId: string): Promise<ClienteRecorrenteEntity[]> {
    return this.clienteRepo.find({
      where: { workspaceId },
      order: { proximoContato: 'ASC', nome: 'ASC' },
    });
  }

  createCliente(
    workspaceId: string,
    input: CreateClienteRecorrenteInput,
  ): Promise<ClienteRecorrenteEntity> {
    return this.clienteRepo.save(
      this.clienteRepo.create({ workspaceId, ...input }),
    );
  }

  async updateCliente(
    workspaceId: string,
    input: UpdateClienteRecorrenteInput,
  ): Promise<ClienteRecorrenteEntity> {
    const { id, ...rest } = input;
    await this.clienteRepo.update({ id, workspaceId }, rest as Partial<ClienteRecorrenteEntity>);
    return this.clienteRepo.findOneOrFail({ where: { id, workspaceId } });
  }

  async deleteCliente(workspaceId: string, id: string): Promise<boolean> {
    await this.clienteRepo.delete({ id, workspaceId });
    return true;
  }

  // ── Notificações ──────────────────────────────────────────────────────────

  listNotifications(
    workspaceId: string,
    userId: string,
    apenasNaoLidas = false,
    limit = 50,
  ): Promise<VokaNotificationEntity[]> {
    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n."workspaceId" = :workspaceId', { workspaceId })
      .andWhere('n."userId" = :userId', { userId })
      .orderBy('n."createdAt"', 'DESC')
      .take(limit);

    if (apenasNaoLidas) {
      qb.andWhere('n.lida = false');
    }

    return qb.getMany();
  }

  countUnread(workspaceId: string, userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { workspaceId, userId, lida: false },
    });
  }

  async markAllAsRead(workspaceId: string, userId: string): Promise<boolean> {
    await this.notificationRepo.update(
      { workspaceId, userId, lida: false },
      { lida: true },
    );
    return true;
  }

  async markAsRead(workspaceId: string, userId: string, id: string): Promise<boolean> {
    await this.notificationRepo.update({ id, workspaceId, userId }, { lida: true });
    return true;
  }

  async createNotification(
    workspaceId: string,
    userId: string,
    tipo: string,
    titulo: string,
    corpo?: string,
    link?: string,
  ): Promise<VokaNotificationEntity> {
    return this.notificationRepo.save(
      this.notificationRepo.create({ workspaceId, userId, tipo, titulo, corpo, link }),
    );
  }
}
