// FORK: Zellate — F1 Financeiro: driver Asaas.
// Contrato FinanceiroProvider preparado para múltiplos provedores;
// criarSubconta/statusSubconta são reservados à F5 (Zellate Pay).
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import axios, { AxiosInstance } from 'axios';

export type ProviderCliente = {
  id: string;
};

export type ProviderCobranca = {
  id: string;
  invoiceUrl: string | null;
  status: string;
};

export type ProviderPix = {
  payload: string | null;
  encodedImage: string | null;
};

export type CriarCobrancaParams = {
  clienteId: string;
  valorCentavos: number;
  vencimento: string; // YYYY-MM-DD
  descricao: string;
  // PIX | CREDIT_CARD | BOLETO | UNDEFINED (cliente escolhe no link)
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  // F2: encargos de atraso e desconto por antecipação (opcionais)
  jurosPercent?: number | null;
  multaPercent?: number | null;
  descontoCentavos?: number | null;
};

export type ServicoMunicipal = {
  id: string;
  descricao: string;
  issPadrao: number | null;
};

export type NfseResultado = {
  id: string;
  status: string;
  pdfUrl: string | null;
  erro: string | null;
};

export type EmitirNfseParams = {
  paymentId: string;
  descricaoServico: string;
  municipalServiceId: string;
  municipalServiceName: string;
  aliquotaIss: number | null;
  valorCentavos: number;
};

export type CriarAssinaturaParams = {
  clienteId: string;
  valorCentavos: number;
  proximoVencimento: string; // YYYY-MM-DD
  descricao: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  jurosPercent?: number | null;
  multaPercent?: number | null;
};

export interface FinanceiroProvider {
  testarConexao(apiKey: string, ambiente: string): Promise<{ nome: string }>;
  criarWebhook(
    apiKey: string,
    ambiente: string,
    url: string,
    authToken: string,
  ): Promise<void>;
  criarCliente(
    apiKey: string,
    ambiente: string,
    dados: {
      nome: string;
      cpfCnpj?: string | null;
      email?: string | null;
      telefone?: string | null;
    },
  ): Promise<ProviderCliente>;
  criarCobranca(
    apiKey: string,
    ambiente: string,
    params: CriarCobrancaParams,
  ): Promise<ProviderCobranca>;
  obterPix(
    apiKey: string,
    ambiente: string,
    cobrancaId: string,
  ): Promise<ProviderPix>;
  cancelarCobranca(
    apiKey: string,
    ambiente: string,
    cobrancaId: string,
  ): Promise<void>;
  // F2: recorrência
  criarAssinatura(
    apiKey: string,
    ambiente: string,
    params: CriarAssinaturaParams,
  ): Promise<{ id: string }>;
  cancelarAssinatura(
    apiKey: string,
    ambiente: string,
    assinaturaId: string,
  ): Promise<void>;
  // F3: NFS-e
  buscarServicosMunicipais(
    apiKey: string,
    ambiente: string,
    busca: string,
  ): Promise<ServicoMunicipal[]>;
  emitirNfse(
    apiKey: string,
    ambiente: string,
    params: EmitirNfseParams,
  ): Promise<NfseResultado>;
  consultarNfse(
    apiKey: string,
    ambiente: string,
    nfseId: string,
  ): Promise<NfseResultado>;
  // ── Reservados para a F5 (Zellate Pay) ──
  criarSubconta?(...args: unknown[]): Promise<unknown>;
  statusSubconta?(...args: unknown[]): Promise<unknown>;
}

@Injectable()
export class AsaasProvider implements FinanceiroProvider {
  private readonly logger = new Logger(AsaasProvider.name);

  private client(apiKey: string, ambiente: string): AxiosInstance {
    const baseURL =
      ambiente === 'PRODUCAO'
        ? 'https://api.asaas.com/v3'
        : 'https://api-sandbox.asaas.com/v3';

    return axios.create({
      baseURL,
      headers: { access_token: apiKey, 'Content-Type': 'application/json' },
      timeout: 20_000,
    });
  }

  // Extrai a mensagem real do Asaas para o usuário (padrão META_ERROR)
  private lancarErroAmigavel(err: unknown, contexto: string): never {
    const desc = (
      err as {
        response?: { data?: { errors?: Array<{ description?: string }> } };
      }
    )?.response?.data?.errors?.[0]?.description;

    this.logger.warn(
      `Asaas ${contexto} falhou: ${desc ?? (err instanceof Error ? err.message : String(err))}`,
    );

    throw new BadRequestException(
      `ASAAS_ERROR: ${desc ?? 'Falha na comunicação com o provedor de pagamento.'}`,
    );
  }

  async testarConexao(
    apiKey: string,
    ambiente: string,
  ): Promise<{ nome: string }> {
    try {
      const { data } = await this.client(apiKey, ambiente).get('/myAccount/');

      return {
        nome:
          (data as { name?: string; companyName?: string }).companyName ??
          (data as { name?: string }).name ??
          'Conta Asaas',
      };
    } catch (err) {
      this.lancarErroAmigavel(err, 'testarConexao');
    }
  }

  async criarWebhook(
    apiKey: string,
    ambiente: string,
    url: string,
    authToken: string,
  ): Promise<void> {
    try {
      await this.client(apiKey, ambiente).post('/webhooks', {
        name: 'Zellate CRM',
        url,
        email: null,
        enabled: true,
        interrupted: false,
        authToken,
        sendType: 'SEQUENTIALLY',
        events: [
          'PAYMENT_CREATED',
          'PAYMENT_RECEIVED',
          'PAYMENT_CONFIRMED',
          'PAYMENT_OVERDUE',
          'PAYMENT_REFUNDED',
          'PAYMENT_DELETED',
          'INVOICE_AUTHORIZED',
          'INVOICE_CANCELED',
          'INVOICE_ERROR',
        ],
      });
    } catch (err) {
      // Webhook duplicado (reconexão) não é fatal
      const desc = (
        err as {
          response?: { data?: { errors?: Array<{ description?: string }> } };
        }
      )?.response?.data?.errors?.[0]?.description;

      if (desc?.toLowerCase().includes('já existe')) {
        this.logger.log('Webhook Asaas já existia — mantendo o atual.');

        return;
      }
      this.lancarErroAmigavel(err, 'criarWebhook');
    }
  }

  async criarCliente(
    apiKey: string,
    ambiente: string,
    dados: {
      nome: string;
      cpfCnpj?: string | null;
      email?: string | null;
      telefone?: string | null;
    },
  ): Promise<ProviderCliente> {
    try {
      const { data } = await this.client(apiKey, ambiente).post('/customers', {
        name: dados.nome,
        ...(dados.cpfCnpj ? { cpfCnpj: dados.cpfCnpj } : {}),
        ...(dados.email ? { email: dados.email } : {}),
        ...(dados.telefone ? { mobilePhone: dados.telefone } : {}),
      });

      return { id: (data as { id: string }).id };
    } catch (err) {
      this.lancarErroAmigavel(err, 'criarCliente');
    }
  }

  async criarCobranca(
    apiKey: string,
    ambiente: string,
    params: CriarCobrancaParams,
  ): Promise<ProviderCobranca> {
    try {
      const { data } = await this.client(apiKey, ambiente).post('/payments', {
        customer: params.clienteId,
        billingType: params.billingType,
        value: params.valorCentavos / 100,
        dueDate: params.vencimento,
        description: params.descricao,
        ...(params.multaPercent
          ? { fine: { value: params.multaPercent, type: 'PERCENTAGE' } }
          : {}),
        ...(params.jurosPercent
          ? { interest: { value: params.jurosPercent } }
          : {}),
        ...(params.descontoCentavos
          ? {
              discount: {
                value: params.descontoCentavos / 100,
                dueDateLimitDays: 0,
                type: 'FIXED',
              },
            }
          : {}),
      });
      const d = data as {
        id: string;
        invoiceUrl?: string;
        status: string;
      };

      return {
        id: d.id,
        invoiceUrl: d.invoiceUrl ?? null,
        status: d.status,
      };
    } catch (err) {
      this.lancarErroAmigavel(err, 'criarCobranca');
    }
  }

  async obterPix(
    apiKey: string,
    ambiente: string,
    cobrancaId: string,
  ): Promise<ProviderPix> {
    try {
      const { data } = await this.client(apiKey, ambiente).get(
        `/payments/${cobrancaId}/pixQrCode`,
      );
      const d = data as { payload?: string; encodedImage?: string };

      return {
        payload: d.payload ?? null,
        encodedImage: d.encodedImage ?? null,
      };
    } catch (err) {
      // Pix indisponível (ex.: cobrança só cartão) não derruba a fatura
      this.logger.warn(
        `Pix indisponível para cobrança ${cobrancaId}: ${err instanceof Error ? err.message : String(err)}`,
      );

      return { payload: null, encodedImage: null };
    }
  }

  async cancelarCobranca(
    apiKey: string,
    ambiente: string,
    cobrancaId: string,
  ): Promise<void> {
    try {
      await this.client(apiKey, ambiente).delete(`/payments/${cobrancaId}`);
    } catch (err) {
      this.lancarErroAmigavel(err, 'cancelarCobranca');
    }
  }

  async criarAssinatura(
    apiKey: string,
    ambiente: string,
    params: CriarAssinaturaParams,
  ): Promise<{ id: string }> {
    try {
      const { data } = await this.client(apiKey, ambiente).post(
        '/subscriptions',
        {
          customer: params.clienteId,
          billingType: params.billingType,
          value: params.valorCentavos / 100,
          nextDueDate: params.proximoVencimento,
          cycle: 'MONTHLY',
          description: params.descricao,
          ...(params.multaPercent
            ? { fine: { value: params.multaPercent, type: 'PERCENTAGE' } }
            : {}),
          ...(params.jurosPercent
            ? { interest: { value: params.jurosPercent } }
            : {}),
        },
      );

      return { id: (data as { id: string }).id };
    } catch (err) {
      this.lancarErroAmigavel(err, 'criarAssinatura');
    }
  }

  async cancelarAssinatura(
    apiKey: string,
    ambiente: string,
    assinaturaId: string,
  ): Promise<void> {
    try {
      await this.client(apiKey, ambiente).delete(
        `/subscriptions/${assinaturaId}`,
      );
    } catch (err) {
      this.lancarErroAmigavel(err, 'cancelarAssinatura');
    }
  }

  // ── F3: NFS-e ──────────────────────────────────────────────────────────────

  private mapearNfse(data: Record<string, unknown>): NfseResultado {
    return {
      id: String(data.id),
      status: String(data.status ?? ''),
      pdfUrl: (data.pdfUrl as string | undefined) ?? null,
      erro:
        (data.statusDescription as string | undefined) ??
        (data.observations as string | undefined) ??
        null,
    };
  }

  async buscarServicosMunicipais(
    apiKey: string,
    ambiente: string,
    busca: string,
  ): Promise<ServicoMunicipal[]> {
    try {
      const { data } = await this.client(apiKey, ambiente).get(
        '/invoices/municipalServices',
        { params: { description: busca, limit: 20 } },
      );
      const lista =
        (data as { data?: Array<Record<string, unknown>> }).data ?? [];

      return lista.map((sv) => ({
        id: String(sv.id ?? sv.municipalServiceCode ?? ''),
        descricao: String(sv.description ?? ''),
        issPadrao: sv.issTax != null ? Number(sv.issTax) : null,
      }));
    } catch (err) {
      this.lancarErroAmigavel(err, 'buscarServicosMunicipais');
    }
  }

  async emitirNfse(
    apiKey: string,
    ambiente: string,
    params: EmitirNfseParams,
  ): Promise<NfseResultado> {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await this.client(apiKey, ambiente).post('/invoices', {
        payment: params.paymentId,
        serviceDescription: params.descricaoServico,
        observations: params.descricaoServico,
        value: params.valorCentavos / 100,
        deductions: 0,
        effectiveDate: hoje,
        municipalServiceId: params.municipalServiceId,
        municipalServiceName: params.municipalServiceName,
        taxes: {
          retainIss: false,
          iss: params.aliquotaIss ?? 0,
          cofins: 0,
          csll: 0,
          inss: 0,
          ir: 0,
          pis: 0,
        },
      });
      const criada = data as Record<string, unknown>;

      // Autoriza (emite) imediatamente; a prefeitura processa assíncrono
      const { data: autorizada } = await this.client(apiKey, ambiente).post(
        `/invoices/${String(criada.id)}/authorize`,
        {},
      );

      return this.mapearNfse(autorizada as Record<string, unknown>);
    } catch (err) {
      this.lancarErroAmigavel(err, 'emitirNfse');
    }
  }

  async consultarNfse(
    apiKey: string,
    ambiente: string,
    nfseId: string,
  ): Promise<NfseResultado> {
    try {
      const { data } = await this.client(apiKey, ambiente).get(
        `/invoices/${nfseId}`,
      );

      return this.mapearNfse(data as Record<string, unknown>);
    } catch (err) {
      this.lancarErroAmigavel(err, 'consultarNfse');
    }
  }
}
