// FORK: Voka CRM — Fase 2
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MotivoPerdaEntity } from './entities/motivo-perda.entity';
import { ProdutoEntity } from './entities/produto.entity';
import { ClienteRecorrenteEntity } from './entities/cliente-recorrente.entity';
import { VokaNotificationEntity } from './entities/voka-notification.entity';
import {
  CreateMotivoPerdaInput,
  CreateProdutoInput,
  UpdateProdutoInput,
  CreateClienteRecorrenteInput,
  UpdateClienteRecorrenteInput,
} from './dtos/voka-crm.input';

@Injectable()
export class VokaCrmService {
  constructor(
    @InjectRepository(MotivoPerdaEntity)
    private readonly motivoPerdaRepo: Repository<MotivoPerdaEntity>,

    @InjectRepository(ProdutoEntity)
    private readonly produtoRepo: Repository<ProdutoEntity>,

    @InjectRepository(ClienteRecorrenteEntity)
    private readonly clienteRepo: Repository<ClienteRecorrenteEntity>,

    @InjectRepository(VokaNotificationEntity)
    private readonly notificationRepo: Repository<VokaNotificationEntity>,
  ) {}

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
