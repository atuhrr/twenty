// FORK: Zellate — F1 Financeiro: conexão da conta de recebimento (Asaas)
import { useMutation, useQuery } from '@apollo/client/react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  ATUALIZAR_FINANCEIRO_CONFIG,
  CONECTAR_FINANCEIRO,
  FINANCEIRO_CONFIG,
  FINANCEIRO_STATUS,
} from '@/financeiro/graphql/financeiroQueries';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type StatusData = {
  financeiroStatus: {
    conectado: boolean;
    nomeConta: string | null;
    ambiente: string | null;
    statusConta: string | null;
  };
};

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type ConfigData = {
  financeiroConfig: {
    jurosPadraoPercent: number | null;
    multaPadraoPercent: number | null;
    reguaAtiva: boolean;
    reguaDiasAntes: number[];
    reguaDiasDepois: number[];
    templateLembrete: string | null;
  };
};

// FORK: Zellate — F2: juros/multa padrão + régua de lembretes por WhatsApp
function CobrancaAutomatica() {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { data, refetch } = useQuery<ConfigData>(FINANCEIRO_CONFIG, {
    fetchPolicy: 'cache-and-network',
  });
  const config = data?.financeiroConfig;

  const [juros, setJuros] = useState('');
  const [multa, setMulta] = useState('');
  const [reguaAtiva, setReguaAtiva] = useState(true);
  const [diasAntes, setDiasAntes] = useState<number[]>([1]);
  const [diasDepois, setDiasDepois] = useState<number[]>([1, 3, 7]);
  const [template, setTemplate] = useState('');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (config && !carregado) {
      setJuros(
        config.jurosPadraoPercent != null
          ? String(config.jurosPadraoPercent)
          : '',
      );
      setMulta(
        config.multaPadraoPercent != null
          ? String(config.multaPadraoPercent)
          : '',
      );
      setReguaAtiva(config.reguaAtiva);
      setDiasAntes(config.reguaDiasAntes);
      setDiasDepois(config.reguaDiasDepois);
      setTemplate(config.templateLembrete ?? '');
      setCarregado(true);
    }
  }, [config, carregado]);

  const [salvar, { loading: salvando }] = useMutation(
    ATUALIZAR_FINANCEIRO_CONFIG,
  );

  const toggleDia = (
    lista: number[],
    setLista: (v: number[]) => void,
    dia: number,
  ) => {
    setLista(
      lista.includes(dia)
        ? lista.filter((d) => d !== dia)
        : [...lista, dia].sort((a, b) => a - b),
    );
  };

  const handleSalvar = async () => {
    try {
      await salvar({
        variables: {
          input: {
            jurosPadraoPercent: juros ? Number(juros.replace(',', '.')) : null,
            multaPadraoPercent: multa ? Number(multa.replace(',', '.')) : null,
            reguaAtiva,
            reguaDiasAntes: diasAntes,
            reguaDiasDepois: diasDepois,
            templateLembrete: template.trim() || null,
          },
        },
      });
      await refetch();
      enqueueSuccessSnackBar({ message: 'Cobrança automática salva.' });
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível salvar.' });
    }
  };

  const checkboxDia = (
    lista: number[],
    setLista: (v: number[]) => void,
    dia: number,
    rotulo: string,
  ) => (
    <label
      key={rotulo}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
    >
      <input
        type="checkbox"
        checked={lista.includes(dia)}
        onChange={() => toggleDia(lista, setLista, dia)}
      />
      {rotulo}
    </label>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
        Cobrança automática
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Juros e multa aplicados em atraso, e lembretes enviados sozinhos pelo
        WhatsApp — a cobrança que se cobra.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Juros ao mês em atraso (%)
            </label>
            <input
              className={inputClass}
              value={juros}
              onChange={(e) => setJuros(e.target.value)}
              placeholder="Ex.: 1"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Multa por atraso (%)
            </label>
            <input
              className={inputClass}
              value={multa}
              onChange={(e) => setMulta(e.target.value)}
              placeholder="Ex.: 2"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={reguaAtiva}
              onChange={(e) => setReguaAtiva(e.target.checked)}
            />
            Enviar lembretes de cobrança pelo WhatsApp
          </label>
          {reguaAtiva && (
            <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="flex flex-wrap gap-4">
                <span className="text-xs font-medium text-gray-500">
                  Antes do vencimento:
                </span>
                {checkboxDia(diasAntes, setDiasAntes, 3, '3 dias antes')}
                {checkboxDia(diasAntes, setDiasAntes, 1, '1 dia antes')}
              </div>
              <div className="flex flex-wrap gap-4">
                <span className="text-xs font-medium text-gray-500">
                  Depois de vencer:
                </span>
                {checkboxDia(diasDepois, setDiasDepois, 1, '+1 dia')}
                {checkboxDia(diasDepois, setDiasDepois, 3, '+3 dias')}
                {checkboxDia(diasDepois, setDiasDepois, 7, '+7 dias')}
              </div>
              <p className="text-[11px] text-gray-400">
                O lembrete no dia do vencimento é sempre enviado quando a régua
                está ativa.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Template da Meta para fora da janela de 24h (opcional)
          </label>
          <input
            className={inputClass}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="nome_do_template_aprovado"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            O WhatsApp só permite mensagem livre até 24h após o último contato
            do cliente. Fora da janela, o lembrete usa este template aprovado —
            sem ele, o lembrete é pulado (fica registrado na fatura).
          </p>
        </div>

        <button
          onClick={() => void handleSalvar()}
          disabled={salvando}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar cobrança automática'}
        </button>
      </div>
    </div>
  );
}

export const SettingsFinanceiro = () => {
  const { enqueueErrorSnackBar } = useSnackBar();
  const { data, refetch } = useQuery<StatusData>(FINANCEIRO_STATUS, {
    fetchPolicy: 'cache-and-network',
  });
  const status = data?.financeiroStatus;

  const [apiKey, setApiKey] = useState('');
  const [ambiente, setAmbiente] = useState<'SANDBOX' | 'PRODUCAO'>('SANDBOX');
  const [conectar, { loading: conectando }] = useMutation(CONECTAR_FINANCEIRO);

  const handleConectar = async () => {
    if (apiKey.trim() === '') return;
    try {
      await conectar({
        variables: { input: { apiKey: apiKey.trim(), ambiente } },
      });
      setApiKey('');
      await refetch();
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Asaas recusou a conexão: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : 'Não foi possível conectar. Confira a chave e o ambiente.',
      });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Financeiro — Receba dos seus clientes
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Conecte sua conta Asaas para cobrar por Pix, cartão e boleto direto
          das conversas e leads — e ver o pagamento confirmar sozinho.
        </p>
      </div>

      {/* Status da conexão */}
      {status?.conectado === true && (
        <div className="flex items-center gap-3 rounded-xl border border-success-500/30 bg-success-50 px-4 py-3 dark:bg-success-500/10">
          <CheckCircle2 className="text-success-500" size={20} />
          <div className="text-sm">
            <div className="font-semibold text-gray-900 dark:text-white">
              Conta conectada: {status.nomeConta ?? 'Asaas'}
            </div>
            <div className="text-gray-500">
              Ambiente: {status.ambiente === 'PRODUCAO' ? 'Produção' : 'Sandbox (testes)'}
              {' · '}o webhook de pagamentos foi configurado automaticamente
            </div>
          </div>
        </div>
      )}

      {/* Passo a passo de conexão */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {status?.conectado === true
            ? 'Reconectar / trocar de conta'
            : 'Como conectar (leva minutos)'}
        </h3>
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>
            Crie sua conta grátis no{' '}
            <a
              href="https://www.asaas.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Asaas <ExternalLink size={12} />
            </a>{' '}
            (o dinheiro cai direto na sua conta — o Zellate não intermedia
            valores);
          </li>
          <li>No painel do Asaas: Integrações → API → gerar chave;</li>
          <li>Cole a chave abaixo e teste a conexão.</li>
        </ol>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Chave de API
            </label>
            <input
              type="password"
              className={inputClass}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="$aact_…"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Ambiente
            </label>
            <select
              className={inputClass}
              value={ambiente}
              onChange={(e) =>
                setAmbiente(e.target.value as 'SANDBOX' | 'PRODUCAO')
              }
            >
              <option value="SANDBOX">Sandbox (testes, sem dinheiro real)</option>
              <option value="PRODUCAO">Produção</option>
            </select>
          </div>
          <button
            onClick={() => void handleConectar()}
            disabled={conectando || apiKey.trim() === ''}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {conectando ? 'Testando conexão…' : 'Conectar e testar'}
          </button>
        </div>
      </div>

      {status?.conectado === true && <CobrancaAutomatica />}

      {/* Custos — transparência é feature */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
          Custos do provedor (pagos ao Asaas, não ao Zellate)
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Cobrados apenas quando a cobrança é <strong>efetivamente paga</strong>{' '}
          — emitir cobrança que não foi paga não custa nada. O Zellate não
          cobra nada sobre seus recebimentos.
        </p>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <tr>
              <td className="py-2 text-gray-600 dark:text-gray-300">Pix</td>
              <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                R$ 1,99 por cobrança recebida
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gray-600 dark:text-gray-300">Boleto</td>
              <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                R$ 1,99 por cobrança recebida
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gray-600 dark:text-gray-300">
                Cartão de crédito
              </td>
              <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                percentual + fixo por transação
              </td>
            </tr>
          </tbody>
        </table>
        <a
          href="https://www.asaas.com/precos-e-taxas"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Ver tabela oficial vigente <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
};
