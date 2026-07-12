// FORK: Zellate — F4: orçamento/proposta a partir dos itens do negócio.
// Em vez de gerar PDF no servidor (dependência pesada), a proposta é uma
// PÁGINA WEB PÚBLICA (link) que o cliente abre no celular e salva como PDF pelo
// próprio navegador — e o link é enviado pelo WhatsApp com o sendTextMessage.
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { v5 as uuidv5 } from 'uuid';

import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { VokaCrmService } from 'src/engine/core-modules/voka-crm/voka-crm.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Namespace fixo (server-only) — o token não é derivável pelo front
const ORCAMENTO_NAMESPACE = 'ca733f41-628b-4eef-a948-8179e435b23b';

export type OrcamentoItem = {
  produtoNome: string;
  produtoUnidade: string;
  quantidade: number;
  preco: number;
  desconto: number;
  subtotal: number;
};

export type OrcamentoDados = {
  negocioNome: string;
  empresaNome: string | null;
  workspaceNome: string;
  itens: OrcamentoItem[];
  total: number;
  geradoEm: string;
};

export type OrcamentoEnvio = {
  link: string;
  enviado: boolean;
  aviso: string | null;
};

@Injectable()
export class OrcamentoService {
  private readonly logger = new Logger(OrcamentoService.name);

  constructor(
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
    private readonly vokaCrmService: VokaCrmService,
    private readonly whatsappService: WhatsappService,
  ) {}

  token(workspaceId: string, leadId: string): string {
    return uuidv5(`${workspaceId}:${leadId}`, ORCAMENTO_NAMESPACE);
  }

  private link(baseUrl: string, workspaceId: string, leadId: string): string {
    const base = baseUrl.replace(/\/$/, '');

    return `${base}/orcamento/${workspaceId}/${leadId}/${this.token(workspaceId, leadId)}`;
  }

  async montarDados(
    workspaceId: string,
    leadId: string,
  ): Promise<OrcamentoDados | null> {
    const schema = getWorkspaceSchemaName(workspaceId);

    const linhas: Array<{ negocio: string | null; empresa: string | null }> =
      await this.contactWindowRepo.manager.query(
        `SELECT o.name AS negocio, c.name AS empresa
           FROM "${schema}"."opportunity" o
           LEFT JOIN "${schema}"."company" c ON c.id = o."companyId"
          WHERE o.id = $1`,
        [leadId],
      );

    if (linhas.length === 0) return null;

    const [ws]: Array<{ displayName: string | null }> =
      await this.contactWindowRepo.manager.query(
        `SELECT "displayName" FROM core."workspace" WHERE id = $1`,
        [workspaceId],
      );

    const itens = await this.vokaCrmService.listItensDoLead(workspaceId, leadId);
    const total = itens.reduce((s, i) => s + i.subtotal, 0);

    return {
      negocioNome: linhas[0].negocio ?? 'Proposta',
      empresaNome: linhas[0].empresa,
      workspaceNome: ws?.displayName ?? 'Zellate',
      itens: itens.map((i) => ({
        produtoNome: i.produtoNome,
        produtoUnidade: i.produtoUnidade,
        quantidade: i.quantidade,
        preco: i.preco,
        desconto: i.desconto,
        subtotal: i.subtotal,
      })),
      total,
      geradoEm: new Date().toISOString(),
    };
  }

  async enviarPorWhatsapp(
    workspaceId: string,
    leadId: string,
    baseUrl: string,
  ): Promise<OrcamentoEnvio> {
    const link = this.link(baseUrl, workspaceId, leadId);

    const janela = await this.contactWindowRepo.findOne({
      where: { workspaceId, opportunityId: leadId },
    });
    const phone = janela?.phoneNumber;

    if (!phone) {
      return {
        link,
        enviado: false,
        aviso:
          'Nenhum contato de WhatsApp vinculado a este negócio — copie o link e envie manualmente.',
      };
    }

    const dados = await this.montarDados(workspaceId, leadId);
    const totalTxt = (dados?.total ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const mensagem = `Olá! Segue a sua proposta${dados?.negocioNome ? ` — ${dados.negocioNome}` : ''}.\n\nTotal: ${totalTxt}\n\nAbra pelo link: ${link}`;

    try {
      await this.whatsappService.sendTextMessage(workspaceId, phone, mensagem);

      return { link, enviado: true, aviso: null };
    } catch (err) {
      // sendTextMessage já lança WINDOW_EXPIRED / META_ERROR com mensagem amigável
      const msg = err instanceof Error ? err.message : String(err);

      this.logger.warn(`Falha ao enviar orçamento por WhatsApp: ${msg}`);

      return { link, enviado: false, aviso: msg };
    }
  }
}
