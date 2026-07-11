// FORK: Zellate — F1 Financeiro: regras de negócio das faturas
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import {
  AssinaturaEntity,
  AssinaturaStatus,
} from 'src/engine/core-modules/financeiro/assinatura.entity';
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

// F4: eventos para o motor de automações (gatilhos FATURA_PAGA/FATURA_VENCIDA)
export type FaturaEventoAutomacao = {
  workspaceId: string;
  faturaId: string;
  numero: string;
  leadId: string | null;
  clienteNome: string;
  valorCentavos: number;
};

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
    @InjectRepository(AssinaturaEntity)
    private readonly assinaturaRepo: Repository<AssinaturaEntity>,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
    private readonly asaas: AsaasProvider,
    private readonly secretEncryptionService: SecretEncryptionService,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsappService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    // F4: dispara gatilhos do motor de automações
    private readonly eventEmitter: EventEmitter2,
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
      jurosPercent?: number | null;
      multaPercent?: number | null;
      descontoCentavos?: number | null;
      lembretesAtivos?: boolean;
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
      jurosPercent: input.jurosPercent ?? conta.jurosPadraoPercent,
      multaPercent: input.multaPercent ?? conta.multaPadraoPercent,
      descontoCentavos: input.descontoCentavos ?? null,
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
        jurosPercent: input.jurosPercent ?? conta.jurosPadraoPercent,
        multaPercent: input.multaPercent ?? conta.multaPadraoPercent,
        descontoCentavos: input.descontoCentavos ?? null,
        lembretesAtivos: input.lembretesAtivos ?? true,
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
      invoice?: {
        id?: string;
        status?: string;
        pdfUrl?: string;
        statusDescription?: string;
      };
    },
  ): Promise<void> {
    if (!evento.event) return;

    // F3: eventos de NFS-e
    if (evento.event.startsWith('INVOICE_')) {
      await this.processarEventoNfse(workspaceId, evento);

      return;
    }

    const cobrancaId = evento.payment?.id;

    if (!cobrancaId) return;

    let fatura = await this.faturaRepo.findOne({
      where: { workspaceId, providerCobrancaId: cobrancaId },
    });

    // F2: cobrança gerada por ASSINATURA no Asaas → materializa fatura local
    if (!fatura && evento.event === 'PAYMENT_CREATED') {
      const subscriptionId = (
        evento.payment as { subscription?: string } | undefined
      )?.subscription;

      if (subscriptionId) {
        fatura = await this.criarFaturaDeAssinatura(
          workspaceId,
          subscriptionId,
          evento.payment as {
            id: string;
            value?: number;
            dueDate?: string;
            invoiceUrl?: string;
          },
        );
      }
    }

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

        {
          const netValue = (
            evento.payment as { netValue?: number } | undefined
          )?.netValue;

          await this.faturaRepo.update(
            { id: fatura.id },
            {
              status: FaturaStatus.PAGA,
              pagaEm: new Date(),
              valorPagoCentavos: evento.payment?.value
                ? Math.round(evento.payment.value * 100)
                : fatura.valorCentavos,
              valorLiquidoCentavos:
                netValue != null ? Math.round(netValue * 100) : null,
              formaPagamento: evento.payment?.billingType ?? null,
            },
          );
          await this.registrarEvento(workspaceId, fatura.id, 'PAGA');
          await this.aplicarEfeitosDePagamento(workspaceId, fatura);
          this.eventEmitter.emit('fatura.paga', {
            workspaceId,
            faturaId: fatura.id,
            numero: numeroDaFatura(fatura.numeroSeq),
            leadId: fatura.leadId,
            clienteNome: fatura.clienteNome,
            valorCentavos: fatura.valorCentavos,
          } satisfies FaturaEventoAutomacao);
        }
        break;
      }
      case 'PAYMENT_OVERDUE': {
        if (fatura.status !== FaturaStatus.PENDENTE) return;
        await this.faturaRepo.update(
          { id: fatura.id },
          { status: FaturaStatus.VENCIDA },
        );
        await this.registrarEvento(workspaceId, fatura.id, 'VENCIDA');
        this.eventEmitter.emit('fatura.vencida', {
          workspaceId,
          faturaId: fatura.id,
          numero: numeroDaFatura(fatura.numeroSeq),
          leadId: fatura.leadId,
          clienteNome: fatura.clienteNome,
          valorCentavos: fatura.valorCentavos,
        } satisfies FaturaEventoAutomacao);
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

    // F3: emissão automática da NFS-e quando configurada para "ao pagar"
    const conta = await this.contaRepo.findOne({ where: { workspaceId } });

    if (conta?.nfseAtiva && conta.nfseMomento === 'AO_PAGAR') {
      await this.emitirNfse(workspaceId, fatura.id).catch((err) => {
        this.logger.warn(
          `NFS-e automática da fatura ${fatura.id} falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }
  }

  // ── F3: NFS-e ─────────────────────────────────────────────────────────────

  private async processarEventoNfse(
    workspaceId: string,
    evento: {
      event?: string;
      invoice?: {
        id?: string;
        status?: string;
        pdfUrl?: string;
        statusDescription?: string;
      };
    },
  ): Promise<void> {
    const nfseId = evento.invoice?.id;

    if (!nfseId) return;

    const fatura = await this.faturaRepo.findOne({
      where: { workspaceId, nfseProviderId: nfseId },
    });

    if (!fatura) return;

    if (evento.event === 'INVOICE_AUTHORIZED') {
      await this.faturaRepo.update(
        { id: fatura.id },
        {
          nfseStatus: 'EMITIDA',
          nfsePdfUrl: evento.invoice?.pdfUrl ?? fatura.nfsePdfUrl,
          nfseErro: null,
        },
      );
      await this.registrarEvento(workspaceId, fatura.id, 'NFSE_EMITIDA');
      await this.notificationsService
        .create(workspaceId, {
          title: `🧾 NFS-e emitida — fatura ${numeroDaFatura(fatura.numeroSeq)}`,
          body: fatura.clienteNome,
          type: 'FINANCEIRO',
          link: '/faturas',
        })
        .catch(() => undefined);
    } else if (evento.event === 'INVOICE_ERROR') {
      await this.faturaRepo.update(
        { id: fatura.id },
        {
          nfseStatus: 'ERRO',
          nfseErro:
            evento.invoice?.statusDescription ??
            'Erro na emissão junto à prefeitura.',
        },
      );
      await this.registrarEvento(workspaceId, fatura.id, 'NFSE_ERRO', {
        motivo: evento.invoice?.statusDescription ?? null,
      });
    } else if (evento.event === 'INVOICE_CANCELED') {
      await this.faturaRepo.update(
        { id: fatura.id },
        { nfseStatus: 'CANCELADA' },
      );
      await this.registrarEvento(workspaceId, fatura.id, 'NFSE_CANCELADA');
    }
  }

  async emitirNfse(workspaceId: string, faturaId: string): Promise<void> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    if (!conta.nfseAtiva) {
      throw new BadRequestException(
        'NFS-e desativada — ative em Configurações → Financeiro.',
      );
    }
    if (!conta.nfseCodigoServico || !conta.nfseNomeServico) {
      throw new BadRequestException(
        'Configure o serviço municipal da NFS-e em Configurações → Financeiro.',
      );
    }

    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura) throw new BadRequestException('Fatura não encontrada.');
    if (fatura.status !== FaturaStatus.PAGA) {
      throw new BadRequestException(
        'A NFS-e é emitida após o pagamento da fatura.',
      );
    }
    if (fatura.nfseStatus === 'EMITIDA' || fatura.nfseStatus === 'AGENDADA') {
      throw new BadRequestException('Esta fatura já tem NFS-e.');
    }
    if (!fatura.providerCobrancaId) {
      throw new BadRequestException('Fatura sem cobrança no provedor.');
    }

    const resultado = await this.asaas.emitirNfse(apiKey, conta.ambiente, {
      paymentId: fatura.providerCobrancaId,
      descricaoServico: conta.nfseDescricaoPadrao?.trim()
        ? conta.nfseDescricaoPadrao
        : fatura.descricao,
      municipalServiceId: conta.nfseCodigoServico,
      municipalServiceName: conta.nfseNomeServico,
      aliquotaIss:
        conta.nfseAliquotaIss != null ? Number(conta.nfseAliquotaIss) : null,
      valorCentavos: fatura.valorPagoCentavos ?? fatura.valorCentavos,
    });

    const statusLocal =
      resultado.status === 'AUTHORIZED'
        ? 'EMITIDA'
        : resultado.status === 'ERROR'
          ? 'ERRO'
          : 'AGENDADA';

    await this.faturaRepo.update(
      { id: fatura.id },
      {
        nfseProviderId: resultado.id,
        nfseStatus: statusLocal,
        nfsePdfUrl: resultado.pdfUrl,
        nfseErro: statusLocal === 'ERRO' ? resultado.erro : null,
      },
    );
    await this.registrarEvento(
      workspaceId,
      fatura.id,
      statusLocal === 'ERRO' ? 'NFSE_ERRO' : 'NFSE_SOLICITADA',
      { nfseId: resultado.id, status: resultado.status },
    );
  }

  async atualizarStatusNfse(
    workspaceId: string,
    faturaId: string,
  ): Promise<void> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);
    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura?.nfseProviderId) return;

    const resultado = await this.asaas.consultarNfse(
      apiKey,
      conta.ambiente,
      fatura.nfseProviderId,
    );

    const statusLocal =
      resultado.status === 'AUTHORIZED'
        ? 'EMITIDA'
        : resultado.status === 'ERROR'
          ? 'ERRO'
          : resultado.status === 'CANCELED'
            ? 'CANCELADA'
            : 'AGENDADA';

    await this.faturaRepo.update(
      { id: fatura.id },
      {
        nfseStatus: statusLocal,
        nfsePdfUrl: resultado.pdfUrl ?? fatura.nfsePdfUrl,
        nfseErro: statusLocal === 'ERRO' ? resultado.erro : null,
      },
    );
  }

  async enviarNfseWhatsapp(
    workspaceId: string,
    faturaId: string,
  ): Promise<void> {
    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura?.nfsePdfUrl) {
      throw new BadRequestException('Esta fatura não tem NFS-e emitida.');
    }

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

    await this.whatsappService.sendTextMessage(
      workspaceId,
      window.phoneNumber,
      [
        `Olá, ${fatura.clienteNome}! Sua nota fiscal está disponível:`,
        ``,
        `🧾 NFS-e da fatura ${numeroDaFatura(fatura.numeroSeq)}`,
        fatura.nfsePdfUrl,
      ].join('\n'),
    );
    await this.registrarEvento(workspaceId, faturaId, 'NFSE_ENVIADA_WHATSAPP');
  }

  async buscarServicosMunicipais(
    workspaceId: string,
    busca: string,
  ): Promise<Array<{ id: string; descricao: string; issPadrao: number | null }>> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    return this.asaas.buscarServicosMunicipais(apiKey, conta.ambiente, busca);
  }

  private async criarFaturaDeAssinatura(
    workspaceId: string,
    providerAssinaturaId: string,
    payment: {
      id: string;
      value?: number;
      dueDate?: string;
      invoiceUrl?: string;
    },
  ): Promise<FaturaEntity | null> {
    const assinatura = await this.assinaturaRepo.findOne({
      where: { workspaceId, providerAssinaturaId },
    });

    if (!assinatura) return null;

    const { conta, apiKey } = await this.contaOuErro(workspaceId);
    const pix = await this.asaas.obterPix(apiKey, conta.ambiente, payment.id);

    const ultimo = await this.faturaRepo
      .createQueryBuilder('f')
      .select('COALESCE(MAX(f.numeroSeq), 0)', 'max')
      .where('f.workspaceId = :workspaceId', { workspaceId })
      .getRawOne<{ max: number }>();

    const fatura = await this.faturaRepo.save(
      this.faturaRepo.create({
        workspaceId,
        numeroSeq: Number(ultimo?.max ?? 0) + 1,
        leadId: assinatura.leadId,
        clienteNome: assinatura.clienteNome,
        clienteCpfCnpj: assinatura.clienteCpfCnpj,
        clienteTelefone: assinatura.clienteTelefone,
        descricao: `${assinatura.descricao} (assinatura)`,
        valorCentavos: payment.value
          ? Math.round(payment.value * 100)
          : assinatura.valorCentavos,
        vencimento:
          payment.dueDate ?? assinatura.proximoVencimento,
        meios: assinatura.meios as FaturaMeios,
        status: FaturaStatus.PENDENTE,
        provider: 'ASAAS',
        providerCobrancaId: payment.id,
        providerClienteId: assinatura.providerClienteId,
        linkPagamento: payment.invoiceUrl ?? null,
        pixPayload: pix.payload,
        pixQrCodeBase64: pix.encodedImage,
        assinaturaId: assinatura.id,
      }),
    );

    if (payment.dueDate) {
      await this.assinaturaRepo.update(
        { id: assinatura.id },
        { proximoVencimento: payment.dueDate },
      );
    }

    await this.registrarEvento(workspaceId, fatura.id, 'CRIADA', {
      origem: 'ASSINATURA',
      assinaturaId: assinatura.id,
    });

    return fatura;
  }

  // ── F2: configuração de cobrança automática ───────────────────────────────

  async atualizarConfig(
    workspaceId: string,
    config: {
      jurosPadraoPercent?: number | null;
      multaPadraoPercent?: number | null;
      reguaLembretes?: {
        ativo: boolean;
        diasAntes: number[];
        diasDepois: number[];
      };
      templateLembrete?: string | null;
      nfseAtiva?: boolean;
      nfseMomento?: string;
      nfseCodigoServico?: string | null;
      nfseNomeServico?: string | null;
      nfseAliquotaIss?: number | null;
      nfseDescricaoPadrao?: string | null;
    },
  ): Promise<void> {
    const conta = await this.contaRepo.findOne({ where: { workspaceId } });

    if (!conta) {
      throw new BadRequestException(
        'FINANCEIRO_NAO_CONECTADO: Conecte sua conta primeiro.',
      );
    }

    await this.contaRepo.update(
      { id: conta.id },
      {
        ...(config.jurosPadraoPercent !== undefined
          ? { jurosPadraoPercent: config.jurosPadraoPercent }
          : {}),
        ...(config.multaPadraoPercent !== undefined
          ? { multaPadraoPercent: config.multaPadraoPercent }
          : {}),
        ...(config.reguaLembretes !== undefined
          ? { reguaLembretes: config.reguaLembretes }
          : {}),
        ...(config.templateLembrete !== undefined
          ? { templateLembrete: config.templateLembrete }
          : {}),
        ...(config.nfseAtiva !== undefined
          ? { nfseAtiva: config.nfseAtiva }
          : {}),
        ...(config.nfseMomento !== undefined
          ? { nfseMomento: config.nfseMomento }
          : {}),
        ...(config.nfseCodigoServico !== undefined
          ? { nfseCodigoServico: config.nfseCodigoServico }
          : {}),
        ...(config.nfseNomeServico !== undefined
          ? { nfseNomeServico: config.nfseNomeServico }
          : {}),
        ...(config.nfseAliquotaIss !== undefined
          ? { nfseAliquotaIss: config.nfseAliquotaIss }
          : {}),
        ...(config.nfseDescricaoPadrao !== undefined
          ? { nfseDescricaoPadrao: config.nfseDescricaoPadrao }
          : {}),
      },
    );
  }

  // ── F2: assinaturas (recorrência) ─────────────────────────────────────────

  async criarAssinatura(
    workspaceId: string,
    input: {
      leadId?: string | null;
      clienteNome: string;
      clienteCpfCnpj?: string | null;
      clienteTelefone?: string | null;
      descricao: string;
      valorCentavos: number;
      proximoVencimento: string;
      meios: FaturaMeios;
    },
  ): Promise<AssinaturaEntity> {
    if (input.valorCentavos < 100) {
      throw new BadRequestException('Valor mínimo da assinatura é R$ 1,00.');
    }
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    const cliente = await this.asaas.criarCliente(apiKey, conta.ambiente, {
      nome: input.clienteNome,
      cpfCnpj: input.clienteCpfCnpj,
      telefone: input.clienteTelefone,
    });

    const providerAssinatura = await this.asaas.criarAssinatura(
      apiKey,
      conta.ambiente,
      {
        clienteId: cliente.id,
        valorCentavos: input.valorCentavos,
        proximoVencimento: input.proximoVencimento,
        descricao: input.descricao,
        billingType: MEIO_PARA_BILLING[input.meios],
        jurosPercent: conta.jurosPadraoPercent,
        multaPercent: conta.multaPadraoPercent,
      },
    );

    return this.assinaturaRepo.save(
      this.assinaturaRepo.create({
        workspaceId,
        leadId: input.leadId ?? null,
        clienteNome: input.clienteNome,
        clienteCpfCnpj: input.clienteCpfCnpj ?? null,
        clienteTelefone: input.clienteTelefone ?? null,
        descricao: input.descricao,
        valorCentavos: input.valorCentavos,
        ciclo: 'MENSAL',
        proximoVencimento: input.proximoVencimento,
        meios: input.meios,
        status: AssinaturaStatus.ATIVA,
        provider: 'ASAAS',
        providerAssinaturaId: providerAssinatura.id,
        providerClienteId: cliente.id,
      }),
    );
  }

  async listarAssinaturas(workspaceId: string): Promise<AssinaturaEntity[]> {
    return this.assinaturaRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  // Pausar cancela no provedor (Asaas não tem pausa nativa) e mantém o
  // registro local PAUSADA; retomar cria uma assinatura nova com os mesmos
  // dados.
  async pausarAssinatura(
    workspaceId: string,
    assinaturaId: string,
  ): Promise<void> {
    const assinatura = await this.assinaturaRepo.findOne({
      where: { id: assinaturaId, workspaceId },
    });

    if (!assinatura || assinatura.status !== AssinaturaStatus.ATIVA) {
      throw new BadRequestException('Assinatura não está ativa.');
    }
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    if (assinatura.providerAssinaturaId) {
      await this.asaas.cancelarAssinatura(
        apiKey,
        conta.ambiente,
        assinatura.providerAssinaturaId,
      );
    }
    await this.assinaturaRepo.update(
      { id: assinaturaId },
      { status: AssinaturaStatus.PAUSADA, providerAssinaturaId: null },
    );
  }

  async retomarAssinatura(
    workspaceId: string,
    assinaturaId: string,
    proximoVencimento: string,
  ): Promise<void> {
    const assinatura = await this.assinaturaRepo.findOne({
      where: { id: assinaturaId, workspaceId },
    });

    if (!assinatura || assinatura.status !== AssinaturaStatus.PAUSADA) {
      throw new BadRequestException('Assinatura não está pausada.');
    }
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    if (!assinatura.providerClienteId) {
      throw new BadRequestException('Assinatura sem cliente no provedor.');
    }

    const nova = await this.asaas.criarAssinatura(apiKey, conta.ambiente, {
      clienteId: assinatura.providerClienteId,
      valorCentavos: assinatura.valorCentavos,
      proximoVencimento,
      descricao: assinatura.descricao,
      billingType: MEIO_PARA_BILLING[assinatura.meios as FaturaMeios],
      jurosPercent: conta.jurosPadraoPercent,
      multaPercent: conta.multaPadraoPercent,
    });

    await this.assinaturaRepo.update(
      { id: assinaturaId },
      {
        status: AssinaturaStatus.ATIVA,
        providerAssinaturaId: nova.id,
        proximoVencimento,
      },
    );
  }

  async cancelarAssinatura(
    workspaceId: string,
    assinaturaId: string,
  ): Promise<void> {
    const assinatura = await this.assinaturaRepo.findOne({
      where: { id: assinaturaId, workspaceId },
    });

    if (!assinatura) throw new BadRequestException('Assinatura não encontrada.');
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    if (
      assinatura.status === AssinaturaStatus.ATIVA &&
      assinatura.providerAssinaturaId
    ) {
      await this.asaas.cancelarAssinatura(
        apiKey,
        conta.ambiente,
        assinatura.providerAssinaturaId,
      );
    }
    await this.assinaturaRepo.update(
      { id: assinaturaId },
      { status: AssinaturaStatus.CANCELADA },
    );
  }

  // ── F2: régua de lembretes (chamada pelo cron) ────────────────────────────

  async processarLembretes(): Promise<void> {
    const contas = await this.contaRepo.find();

    for (const conta of contas) {
      const regua = conta.reguaLembretes;

      if (!regua?.ativo) continue;

      const marcos: Array<{ chave: string; dataVencimento: string }> = [];
      const hoje = new Date();
      const dataStr = (d: Date) => d.toISOString().slice(0, 10);

      for (const dias of regua.diasAntes ?? []) {
        const alvo = new Date(hoje);
        alvo.setDate(alvo.getDate() + dias);
        marcos.push({ chave: `D-${dias}`, dataVencimento: dataStr(alvo) });
      }
      marcos.push({ chave: 'D0', dataVencimento: dataStr(hoje) });
      for (const dias of regua.diasDepois ?? []) {
        const alvo = new Date(hoje);
        alvo.setDate(alvo.getDate() - dias);
        marcos.push({ chave: `D+${dias}`, dataVencimento: dataStr(alvo) });
      }

      for (const marco of marcos) {
        const faturas = await this.faturaRepo
          .createQueryBuilder('f')
          .where('f.workspaceId = :w', { w: conta.workspaceId })
          .andWhere('f.status IN (:...st)', {
            st: [FaturaStatus.PENDENTE, FaturaStatus.VENCIDA],
          })
          .andWhere('f.lembretesAtivos = true')
          .andWhere('f.vencimento = :v', { v: marco.dataVencimento })
          .getMany();

        for (const fatura of faturas) {
          await this.enviarLembrete(conta, fatura, marco.chave).catch((err) =>
            this.logger.warn(
              `Lembrete ${marco.chave} da fatura ${fatura.id} falhou: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
        }
      }
    }
  }

  private async enviarLembrete(
    conta: FinanceiroContaEntity,
    fatura: FaturaEntity,
    marco: string,
  ): Promise<void> {
    const tipoEvento = `LEMBRETE:${marco}:${fatura.vencimento}`;
    const jaEnviado = await this.eventoRepo.findOne({
      where: {
        workspaceId: conta.workspaceId,
        faturaId: fatura.id,
        tipo: tipoEvento,
      },
    });

    if (jaEnviado) return;

    const window = fatura.leadId
      ? await this.contactWindowRepo.findOne({
          where: { workspaceId: conta.workspaceId, opportunityId: fatura.leadId },
        })
      : fatura.clienteTelefone
        ? await this.contactWindowRepo.findOne({
            where: {
              workspaceId: conta.workspaceId,
              phoneNumber: fatura.clienteTelefone.replace(/\D/g, ''),
            },
          })
        : null;

    if (!window?.phoneNumber) return;

    const dentroDaJanela =
      window.lastInboundAt != null &&
      Date.now() - new Date(window.lastInboundAt).getTime() <
        24 * 60 * 60 * 1000;

    const atrasada = marco.startsWith('D+');
    const texto = [
      atrasada
        ? `Olá, ${fatura.clienteNome}! Sua cobrança está em aberto:`
        : `Olá, ${fatura.clienteNome}! Lembrete da sua cobrança:`,
      ``,
      `📄 ${fatura.descricao}`,
      `💰 ${formatarBRL(fatura.valorCentavos)}`,
      `📅 Vencimento: ${fatura.vencimento.split('-').reverse().join('/')}`,
      ...(fatura.pixPayload
        ? [``, `Pix copia e cola:`, fatura.pixPayload]
        : []),
      ...(fatura.linkPagamento
        ? [``, `Link de pagamento:`, fatura.linkPagamento]
        : []),
    ].join('\n');

    if (dentroDaJanela) {
      await this.whatsappService.sendTextMessage(
        conta.workspaceId,
        window.phoneNumber,
        texto,
      );
    } else if (conta.templateLembrete) {
      // Fora da janela de 24h só template aprovado da Meta passa
      await this.whatsappService.sendTemplateMessage(
        conta.workspaceId,
        window.phoneNumber,
        conta.templateLembrete,
        'pt_BR',
        [],
      );
    } else {
      await this.registrarEvento(
        conta.workspaceId,
        fatura.id,
        'LEMBRETE_PULADO',
        { marco, motivo: 'fora da janela de 24h e sem template configurado' },
      );

      return;
    }

    await this.registrarEvento(conta.workspaceId, fatura.id, tipoEvento, {
      marco,
    });
    await this.registrarEvento(
      conta.workspaceId,
      fatura.id,
      'LEMBRETE_ENVIADO',
      { marco },
    );
  }

  // ── F2: estatísticas de receita ───────────────────────────────────────────

  async receitaStats(workspaceId: string): Promise<{
    recebidoPorMes: Array<{ mes: string; centavos: number }>;
    inadimplenciaPercent: number;
    ticketMedioCentavos: number;
    previsaoMesCentavos: number;
    topClientes: Array<{ nome: string; centavos: number }>;
  }> {
    const meses = await this.faturaRepo.query(
      `SELECT to_char(date_trunc('month', "pagaEm"), 'YYYY-MM') AS mes,
              SUM(COALESCE("valorPagoCentavos", "valorCentavos")) AS total
       FROM core."fatura"
       WHERE "workspaceId" = $1 AND status = 'PAGA'
         AND "pagaEm" >= date_trunc('month', now()) - interval '11 months'
       GROUP BY 1 ORDER BY 1`,
      [workspaceId],
    );

    const agregados = await this.faturaRepo.query(
      `SELECT
        COALESCE(SUM("valorCentavos") FILTER (WHERE status = 'VENCIDA'), 0) AS vencido,
        COALESCE(SUM("valorCentavos") FILTER (WHERE status IN ('PAGA','VENCIDA','PENDENTE')), 0) AS emitido,
        AVG(COALESCE("valorPagoCentavos", "valorCentavos"))
          FILTER (WHERE status = 'PAGA') AS ticket,
        COALESCE(SUM("valorCentavos") FILTER (
          WHERE status = 'PENDENTE'
            AND date_trunc('month', vencimento::timestamp) = date_trunc('month', now())
        ), 0) AS previsao
      FROM core."fatura" WHERE "workspaceId" = $1`,
      [workspaceId],
    );

    const clientes = await this.faturaRepo.query(
      `SELECT "clienteNome" AS nome,
              SUM(COALESCE("valorPagoCentavos", "valorCentavos")) AS total
       FROM core."fatura"
       WHERE "workspaceId" = $1 AND status = 'PAGA'
       GROUP BY 1 ORDER BY 2 DESC LIMIT 5`,
      [workspaceId],
    );

    const a = agregados[0] ?? {};
    const emitido = Number(a.emitido ?? 0);

    return {
      recebidoPorMes: (meses as Array<{ mes: string; total: string }>).map(
        (m) => ({ mes: m.mes, centavos: Number(m.total) }),
      ),
      inadimplenciaPercent:
        emitido > 0
          ? Math.round((Number(a.vencido ?? 0) / emitido) * 1000) / 10
          : 0,
      ticketMedioCentavos: Math.round(Number(a.ticket ?? 0)),
      previsaoMesCentavos: Number(a.previsao ?? 0),
      topClientes: (clientes as Array<{ nome: string; total: string }>).map(
        (c) => ({ nome: c.nome, centavos: Number(c.total) }),
      ),
    };
  }

  // ── F4: conciliação, estorno e links avulsos ───────────────────────────────

  async obterSaldo(workspaceId: string): Promise<number> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    return this.asaas.obterSaldo(apiKey, conta.ambiente);
  }

  // Estorno: devolve o dinheiro ao pagador. O lead NÃO regride de etapa
  // sozinho — apenas notifica (decisão comercial é humana).
  async estornarFatura(workspaceId: string, faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.findOne({
      where: { id: faturaId, workspaceId },
    });

    if (!fatura) throw new BadRequestException('Fatura não encontrada.');
    if (fatura.status !== FaturaStatus.PAGA) {
      throw new BadRequestException('Só é possível estornar fatura paga.');
    }
    if (!fatura.providerCobrancaId) {
      throw new BadRequestException('Fatura sem cobrança no provedor.');
    }

    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    await this.asaas.estornarCobranca(
      apiKey,
      conta.ambiente,
      fatura.providerCobrancaId,
    );

    await this.faturaRepo.update(
      { id: faturaId },
      { status: FaturaStatus.ESTORNADA },
    );
    await this.registrarEvento(workspaceId, faturaId, 'ESTORNADA', {
      origem: 'MANUAL',
    });
    await this.notificationsService
      .create(workspaceId, {
        title: `↩️ Fatura ${numeroDaFatura(fatura.numeroSeq)} estornada`,
        body: `${formatarBRL(fatura.valorCentavos)} devolvido a ${fatura.clienteNome}`,
        type: 'FINANCEIRO',
        link: '/faturas',
      })
      .catch(() => undefined);
  }

  async criarLinkPagamento(
    workspaceId: string,
    input: { nome: string; valorCentavos: number | null; meios: FaturaMeios },
  ): Promise<{ id: string; url: string }> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    return this.asaas.criarLinkPagamento(apiKey, conta.ambiente, {
      nome: input.nome.trim(),
      valorCentavos: input.valorCentavos,
      billingType: MEIO_PARA_BILLING[input.meios],
    });
  }

  async listarLinksPagamento(workspaceId: string) {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    return this.asaas.listarLinksPagamento(apiKey, conta.ambiente);
  }

  async desativarLinkPagamento(
    workspaceId: string,
    linkId: string,
  ): Promise<void> {
    const { conta, apiKey } = await this.contaOuErro(workspaceId);

    await this.asaas.desativarLinkPagamento(apiKey, conta.ambiente, linkId);
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
