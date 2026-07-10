// FORK: Zellate — F1 Financeiro: regras de negócio das faturas
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import {
  FaturaEntity,
  FaturaMeios,
  FaturaStatus,
} from 'src/engine/core-modules/financeiro/fatura.entity';
import { FaturaEventoEntity } from 'src/engine/core-modules/financeiro/fatura-evento.entity';
import {
  FinanceiroContaEntity,
  FinanceiroContaStatus,
} from 'src/engine/core-modules/financeiro/financeiro-conta.entity';
import { AsaasProvider } from 'src/engine/core-modules/financeiro/asaas.provider';
import { NotificationsService } from 'src/engine/core-modules/notifications/notifications.service';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

const MEIO_PARA_BILLING: Record<
  FaturaMeios,
  'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
> = {
  [FaturaMeios.PIX]: 'PIX',
  [FaturaMeios.CARTAO]: 'CREDIT_CARD',
  [FaturaMeios.BOLETO]: 'BOLETO',
  [FaturaMeios.TODOS]: 'UNDEFINED',
};

const formatarBRL = (centavos: number): string =>
  (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export const numeroDaFatura = (seq: number): string =>
  `ZLT-${String(seq).padStart(4, '0')}`;

@Injectable()
export class FinanceiroService {
  private readonly logger = new Logger(FinanceiroService.name);

  // eslint-disable twenty/prefer-workspace-scoped-repository -- todas as
  // queries filtram por workspaceId explicitamente (padrão do módulo whatsapp)
  constructor(
    @InjectRepository(FinanceiroContaEntity)
    private readonly contaRepo: Repository<FinanceiroContaEntity>,
    @InjectRepository(FaturaEntity)
    private readonly faturaRepo: Repository<FaturaEntity>,
    @InjectRepository(FaturaEventoEntity)
    private readonly eventoRepo: Repository<FaturaEventoEntity>,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
    private readonly asaas: AsaasProvider,
    private readonly secretEncryptionService: SecretEncryptionService,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsappService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  private async contaOuErro(
    workspaceId: string,
  ): Promise<{ conta: FinanceiroContaEntity; apiKey: string }> {
    const conta = await this.contaRepo.findOne({ where: { workspaceId } });

    if (!conta) {
      throw new BadRequestException(
        'FINANCEIRO_NAO_CONECTADO: Conecte sua conta em Configurações → Financeiro.',
      );
    }

    return {
      conta,
      apiKey: this.secretEncryptionService.decrypt(conta.apiKeyEncrypted),
    };
  }

  private async registrarEvento(
    workspaceId: string,
    faturaId: string,
    tipo: string,
    payload: Record<string, unknown> | null = null,
  ): Promise<void> {
    await this.eventoRepo.save(
      this.eventoRepo.create({ workspaceId, faturaId, tipo, payload }),
    );
  }

  // ── Conexão da conta ──────────────────────────────────────────────────────

  async conectar(
    workspaceId: string,
    apiKey: string,
    ambiente: 'SANDBOX' | 'PRODUCAO',
  ): Promise<FinanceiroContaEntity> {
    const { nome } = await this.asaas.testarConexao(apiKey, ambiente);

    const webhookToken = randomBytes(24).toString('hex');
    const serverUrl = process.env.SERVER_URL ?? '';
    const webhookUrl = `${serverUrl}/financeiro/webhook/${workspaceId}`;

    await this.asaas.criarWebhook(apiKey, ambiente, webhookUrl, webhookToken);

    const existente = await this.contaRepo.findOne({ where: { workspaceId } });
    const conta = this.contaRepo.create({
      ...(existente ? { id: existente.id } : {}),
      workspaceId,
      provider: 'ASAAS',
      apiKeyEncrypted: this.secretEncryptionService.encrypt(apiKey),
      ambiente,
      webhookToken,
      statusConta: FinanceiroContaStatus.CONECTADA,
      nomeConta: nome,
    });

    return this.contaRepo.save(conta);
  }

  async status(workspaceId: string): Promise<FinanceiroContaEntity | null> {
    return this.contaRepo.findOne({ where: { workspaceId } });
  }

  // ── Faturas ───────────────────────────────────────────────────────────────

  async criarFatura(
    workspaceId: string,
    input: {
      leadId?: string | null;
      personId?: string | null;
      clienteNome: string;
      clienteCpfCnpj?: string | null;
      clienteEmail?: string | null;
      clienteTelefone?: string | null;
      descricao: string;
      valorCentavos: number;
      vencimento: string;
      meios: FaturaMeios;
    },
  ): Promise<FaturaEntity> {
    if (input.valorCentavos < 100) {
      throw new BadRequestException('Valor mínimo da fatura é R$ 1,00.');
    }
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    const cliente = await this.asaas.criarCliente(apiKey, conta.ambiente, {
      nome: input.clienteNome,
      cpfCnpj: input.clienteCpfCnpj,
      email: input.clienteEmail,
      telefone: input.clienteTelefone,
    });

    const cobranca = await this.asaas.criarCobranca(apiKey, conta.ambiente, {
      clienteId: cliente.id,
      valorCentavos: input.valorCentavos,
      vencimento: input.vencimento,
      descricao: input.descricao,
      billingType: MEIO_PARA_BILLING[input.meios],
    });

    const pix =
      input.meios === FaturaMeios.PIX || input.meios === FaturaMeios.TODOS
        ? await this.asaas.obterPix(apiKey, conta.ambiente, cobranca.id)
        : { payload: null, encodedImage: null };

    const ultimo = await this.faturaRepo
      .createQueryBuilder('f')
      .select('COALESCE(MAX(f.numeroSeq), 0)', 'max')
      .where('f.workspaceId = :workspaceId', { workspaceId })
      .getRawOne<{ max: number }>();

    const fatura = await this.faturaRepo.save(
      this.faturaRepo.create({
        workspaceId,
        numeroSeq: Number(ultimo?.max ?? 0) + 1,
        leadId: input.leadId ?? null,
        personId: input.personId ?? null,
        clienteNome: input.clienteNome,
        clienteCpfCnpj: input.clienteCpfCnpj ?? null,
        clienteEmail: input.clienteEmail ?? null,
        clienteTelefone: input.clienteTelefone ?? null,
        descricao: input.descricao,
        valorCentavos: input.valorCentavos,
        vencimento: input.vencimento,
        meios: input.meios,
        status: FaturaStatus.PENDENTE,
        provider: 'ASAAS',
        providerCobrancaId: cobranca.id,
        providerClienteId: cliente.id,
        linkPagamento: cobranca.invoiceUrl,
        pixPayload: pix.payload,
        pixQrCodeBase64: pix.encodedImage,
      }),
    );

    await this.registrarEvento(workspaceId, fatura.id, 'CRIADA', {
      providerCobrancaId: cobranca.id,
    });

    return fatura;
  }

  async cancelarFatura(workspaceId: string, faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura) throw new BadRequestException('Fatura não encontrada.');
    if (fatura.status === FaturaStatus.PAGA) {
      throw new BadRequestException('Fatura paga não pode ser cancelada.');
    }

    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    if (fatura.providerCobrancaId) {
      await this.asaas.cancelarCobranca(
        apiKey,
        conta.ambiente,
        fatura.providerCobrancaId,
      );
    }

    await this.faturaRepo.update(
      { id: faturaId, workspaceId },
      { status: FaturaStatus.CANCELADA },
    );
    await this.registrarEvento(workspaceId, faturaId, 'CANCELADA');
  }

  async enviarPorWhatsapp(
    workspaceId: string,
    faturaId: string,
  ): Promise<void> {
    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura) throw new BadRequestException('Fatura não encontrada.');

    // Conversa do lead vinculado, ou por telefone do pagador
    const window = fatura.leadId
      ? await this.contactWindowRepo.findOne({
          where: { workspaceId, opportunityId: fatura.leadId },
        })
      : fatura.clienteTelefone
        ? await this.contactWindowRepo.findOne({
            where: {
              workspaceId,
              phoneNumber: fatura.clienteTelefone.replace(/\D/g, ''),
            },
          })
        : null;

    if (!window?.phoneNumber) {
      throw new BadRequestException(
        'Sem conversa de WhatsApp vinculada a esta fatura.',
      );
    }

    const linhas = [
      `Olá, ${fatura.clienteNome}! Segue sua cobrança:`,
      ``,
      `📄 ${fatura.descricao}`,
      `💰 ${formatarBRL(fatura.valorCentavos)}`,
      `📅 Vencimento: ${fatura.vencimento.split('-').reverse().join('/')}`,
    ];

    if (fatura.pixPayload) {
      linhas.push(
        ``,
        `Pague com Pix (copia e cola):`,
        fatura.pixPayload,
      );
    }
    if (fatura.linkPagamento) {
      linhas.push(
        ``,
        `Ou pague com cartão/boleto pelo link:`,
        fatura.linkPagamento,
      );
    }

    await this.whatsappService.sendTextMessage(
      workspaceId,
      window.phoneNumber,
      linhas.join('\n'),
    );

    await this.registrarEvento(workspaceId, faturaId, 'ENVIADA_WHATSAPP', {
      phone: window.phoneNumber,
    });
  }

  async listarFaturas(workspaceId: string): Promise<FaturaEntity[]> {
    return this.faturaRepo.find({
      where: { workspaceId },
      order: { numeroSeq: 'DESC' },
      take: 500,
    });
  }

  async resumo(workspaceId: string): Promise<{
    vencidasCentavos: number;
    aVencer30dCentavos: number;
    tempoMedioDias: number | null;
    recebidoMesCentavos: number;
  }> {
    const rows = await this.faturaRepo.query(
      `SELECT
        COALESCE(SUM("valorCentavos") FILTER (WHERE status = 'VENCIDA'), 0) AS vencidas,
        COALESCE(SUM("valorCentavos") FILTER (
          WHERE status = 'PENDENTE'
            AND vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
        ), 0) AS a_vencer,
        AVG(EXTRACT(EPOCH FROM ("pagaEm" - "createdAt")) / 86400)
          FILTER (WHERE status = 'PAGA' AND "pagaEm" IS NOT NULL) AS tempo_medio,
        COALESCE(SUM(COALESCE("valorPagoCentavos", "valorCentavos")) FILTER (
          WHERE status = 'PAGA'
            AND date_trunc('month', "pagaEm") = date_trunc('month', now())
        ), 0) AS recebido_mes
      FROM core."fatura"
      WHERE "workspaceId" = $1`,
      [workspaceId],
    );
    const r = rows[0] ?? {};

    return {
      vencidasCentavos: Number(r.vencidas ?? 0),
      aVencer30dCentavos: Number(r.a_vencer ?? 0),
      tempoMedioDias:
        r.tempo_medio != null ? Math.round(Number(r.tempo_medio)) : null,
      recebidoMesCentavos: Number(r.recebido_mes ?? 0),
    };
  }

  // ── Webhook (chamado pelo job) ────────────────────────────────────────────

  async processarEventoWebhook(
    workspaceId: string,
    evento: {
      id?: string;
      event?: string;
      payment?: {
        id?: string;
        value?: number;
        billingType?: string;
        paymentDate?: string;
      };
    },
  ): Promise<void> {
    const cobrancaId = evento.payment?.id;

    if (!cobrancaId || !evento.event) return;

    const fatura = await this.faturaRepo.findOne({
      where: { workspaceId, providerCobrancaId: cobrancaId },
    });

    if (!fatura) {
      this.logger.debug(
        `Webhook para cobrança desconhecida ${cobrancaId} — ignorado`,
      );

      return;
    }

    // Idempotência: evento do provedor processado uma única vez
    if (evento.id) {
      const jaProcessado = await this.eventoRepo.findOne({
        where: { workspaceId, faturaId: fatura.id, tipo: `ASAAS:${evento.id}` },
      });

      if (jaProcessado) return;
      await this.registrarEvento(
        workspaceId,
        fatura.id,
        `ASAAS:${evento.id}`,
        { event: evento.event },
      );
    }

    switch (evento.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        if (fatura.status === FaturaStatus.PAGA) return;

        await this.faturaRepo.update(
          { id: fatura.id },
          {
            status: FaturaStatus.PAGA,
            pagaEm: new Date(),
            valorPagoCentavos: evento.payment?.value
              ? Math.round(evento.payment.value * 100)
              : fatura.valorCentavos,
            formaPagamento: evento.payment?.billingType ?? null,
          },
        );
        await this.registrarEvento(workspaceId, fatura.id, 'PAGA');
        await this.aplicarEfeitosDePagamento(workspaceId, fatura);
        break;
      }
      case 'PAYMENT_OVERDUE': {
        if (fatura.status !== FaturaStatus.PENDENTE) return;
        await this.faturaRepo.update(
          { id: fatura.id },
          { status: FaturaStatus.VENCIDA },
        );
        await this.registrarEvento(workspaceId, fatura.id, 'VENCIDA');
        break;
      }
      case 'PAYMENT_REFUNDED': {
        await this.faturaRepo.update(
          { id: fatura.id },
          { status: FaturaStatus.ESTORNADA },
        );
        await this.registrarEvento(workspaceId, fatura.id, 'ESTORNADA');
        break;
      }
      default:
        break;
    }
  }

  private async aplicarEfeitosDePagamento(
    workspaceId: string,
    fatura: FaturaEntity,
  ): Promise<void> {
    // Lead vinculado vira GANHO (e sai de "não classificados")
    if (fatura.leadId) {
      const authContext = buildSystemAuthContext(workspaceId);

      await this.globalWorkspaceOrmManager
        .executeInWorkspaceContext(async () => {
          const repo = await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            'opportunity',
            { shouldBypassPermissionChecks: true },
          );

          await repo.update(fatura.leadId as string, {
            stage: 'GANHO',
            isUnclassified: false,
          } as never);
        }, authContext)
        .catch((err) => {
          this.logger.warn(
            `Falha ao mover lead ${fatura.leadId} para GANHO: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    await this.notificationsService
      .create(workspaceId, {
        title: `💰 Fatura ${numeroDaFatura(fatura.numeroSeq)} paga`,
        body: `${formatarBRL(fatura.valorCentavos)} de ${fatura.clienteNome}`,
        type: 'FINANCEIRO',
        link: '/faturas',
      })
      .catch((err) =>
        this.logger.warn(`Falha ao notificar pagamento: ${String(err)}`),
      );
  }

  async validarWebhookToken(
    workspaceId: string,
    token: string | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const conta = await this.contaRepo.findOne({ where: { workspaceId } });

    return conta != null && conta.webhookToken === token;
  }
}
