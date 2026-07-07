// FORK: Voka CRM — T-8: Campanhas de disparo (tabs + wizard + relatórios, TailAdmin)
import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import {
  useBroadcastCampaigns,
  useCancelBroadcastCampaign,
  useCreateBroadcastCampaign,
  useLaunchBroadcastCampaign,
  type BroadcastCampaign,
} from '@/broadcast/hooks/useBroadcast';
import Badge from '@/tailadmin/ui/Badge';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';

type Aba = 'campanhas' | 'criar' | 'relatorios';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  RUNNING: 'Enviando',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  FAILED: 'Falhou',
};

const STATUS_BADGE: Record<
  string,
  'light' | 'warning' | 'primary' | 'success' | 'error'
> = {
  DRAFT: 'light',
  SCHEDULED: 'warning',
  RUNNING: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
  FAILED: 'error',
};

const formatData = (iso: string | null) =>
  typeof iso === 'string' && iso !== ''
    ? new Date(iso).toLocaleDateString('pt-BR')
    : '—';

const taxaLeitura = (c: BroadcastCampaign) =>
  c.deliveredCount > 0 ? Math.round((c.readCount / c.deliveredCount) * 100) : 0;

/** Lê uma cor do tema TailAdmin (CSS var) em runtime — evita hex hardcoded. */
const themeColor = (name: string): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

// ─── Wizard: Criar Nova ───────────────────────────────────────────────────────

type WizardForm = {
  nome: string;
  canal: 'WHATSAPP';
  tipo: 'imediato' | 'agendado';
  scheduledAt: string;
  numeros: string;
  templateName: string;
  languageCode: string;
};

const wizardVazio = (): WizardForm => ({
  nome: '',
  canal: 'WHATSAPP',
  tipo: 'imediato',
  scheduledAt: '',
  numeros: '',
  templateName: '',
  languageCode: 'pt_BR',
});

const PASSOS = ['Dados', 'Audiência', 'Conteúdo', 'Confirmação'];

function parseNumeros(texto: string): string[] {
  return texto
    .split(/[\n,;]+/)
    .map((n) => n.trim().replace(/[^\d+]/g, ''))
    .filter((n) => n.length >= 8);
}

interface CriarNovaWizardProps {
  onCriada: () => void;
}

function CriarNovaWizard({ onCriada }: CriarNovaWizardProps) {
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<WizardForm>(wizardVazio);
  const [enviando, setEnviando] = useState(false);
  const { create } = useCreateBroadcastCampaign();

  const numeros = useMemo(() => parseNumeros(form.numeros), [form.numeros]);

  const podeAvancar =
    passo === 0
      ? form.nome.trim() !== '' &&
        (form.tipo === 'imediato' || form.scheduledAt !== '')
      : passo === 1
        ? numeros.length > 0
        : passo === 2
          ? form.templateName.trim() !== ''
          : true;

  const lerCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result ?? '');
      setForm((f) => ({ ...f, numeros: f.numeros + '\n' + texto }));
    };
    reader.readAsText(file);
  };

  const criar = async () => {
    setEnviando(true);
    try {
      await create({
        variables: {
          input: {
            name: form.nome.trim(),
            templateName: form.templateName.trim(),
            languageCode:
              form.languageCode.trim() === ''
                ? 'pt_BR'
                : form.languageCode.trim(),
            scheduledAt:
              form.tipo === 'agendado' && form.scheduledAt !== ''
                ? new Date(form.scheduledAt).toISOString()
                : undefined,
            recipients: numeros.map((n) => ({
              phoneNumber: n,
              contactId: undefined,
            })),
          },
        },
      });
      setForm(wizardVazio());
      setPasso(0);
      onCriada();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] max-w-[720px]">
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {PASSOS.map((rotulo, i) => (
          <div key={rotulo} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < passo
                    ? 'bg-success-500 text-white'
                    : i === passo
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                }`}
              >
                {i < passo ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === passo
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-400'
                }`}
              >
                {rotulo}
              </span>
            </div>
            {i < PASSOS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mb-5 rounded ${
                  i < passo ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Passo 1 — Dados */}
      {passo === 0 && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nome da campanha</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Promoção de julho"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Canal</label>
              <select value={form.canal} disabled className={inputClass}>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo de envio</label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tipo: e.target.value as WizardForm['tipo'],
                  }))
                }
                className={inputClass}
              >
                <option value="imediato">Imediato</option>
                <option value="agendado">Agendado</option>
              </select>
            </div>
          </div>
          {form.tipo === 'agendado' && (
            <div>
              <label className={labelClass}>Data e hora do envio</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduledAt: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Passo 2 — Audiência */}
      {passo === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Números de telefone (um por linha, ou separados por vírgula)
            </label>
            <textarea
              value={form.numeros}
              onChange={(e) =>
                setForm((f) => ({ ...f, numeros: e.target.value }))
              }
              placeholder={'+5511999999999\n+5511888888888'}
              rows={6}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 8l5-5 5 5M12 3v12"
                />
              </svg>
              Importar CSV
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file !== undefined) lerCsv(file);
                  e.target.value = '';
                }}
              />
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {numeros.length} destinatário(s) válido(s)
            </span>
          </div>
        </div>
      )}

      {/* Passo 3 — Conteúdo */}
      {passo === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Template WhatsApp aprovado</label>
              <input
                type="text"
                value={form.templateName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, templateName: e.target.value }))
                }
                placeholder="Ex.: promo_julho_v1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Idioma</label>
              <input
                type="text"
                value={form.languageCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, languageCode: e.target.value }))
                }
                placeholder="pt_BR"
                className={inputClass}
              />
            </div>
          </div>
          {/* Preview */}
          <div>
            <label className={labelClass}>Pré-visualização</label>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
              <div className="max-w-[280px] rounded-xl rounded-tl-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2 shadow-theme-xs">
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {form.templateName.trim() === ''
                    ? 'O conteúdo do template aprovado será enviado aos destinatários.'
                    : `Template "${form.templateName}" (${form.languageCode})`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passo 4 — Confirmação */}
      {passo === 3 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Confira antes de criar
          </h3>
          <dl className="space-y-2 text-sm">
            {[
              ['Nome', form.nome],
              ['Canal', 'WhatsApp'],
              [
                'Envio',
                form.tipo === 'imediato'
                  ? 'Imediato (após lançar)'
                  : `Agendado para ${new Date(form.scheduledAt).toLocaleString('pt-BR')}`,
              ],
              ['Destinatários', `${numeros.length} número(s)`],
              ['Template', `${form.templateName} (${form.languageCode})`],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="flex gap-3">
                <dt className="w-32 text-gray-400">{rotulo}</dt>
                <dd className="text-gray-800 dark:text-white/90 font-medium">
                  {valor}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-gray-400 pt-2">
            A campanha é criada como rascunho — o envio começa quando você
            clicar em "Lançar" na lista de campanhas.
          </p>
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setPasso((p) => Math.max(0, p - 1))}
          disabled={passo === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
        >
          ← Voltar
        </button>
        {passo < PASSOS.length - 1 ? (
          <button
            onClick={() => setPasso((p) => p + 1)}
            disabled={!podeAvancar}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            Avançar →
          </button>
        ) : (
          <button
            onClick={criar}
            disabled={enviando}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {enviando ? 'Criando…' : 'Criar campanha'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Relatórios ───────────────────────────────────────────────────────────────

function Relatorios({ campanhas }: { campanhas: BroadcastCampaign[] }) {
  const comEnvios = campanhas.filter((c) => c.sentCount > 0);

  const options: ApexOptions = {
    colors: [
      themeColor('brand-500'),
      themeColor('success-500'),
      themeColor('error-500'),
    ],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: comEnvios.map((c) => c.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit',
    },
    grid: { yaxis: { lines: { show: true } } },
  };

  if (comEnvios.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
        Nenhuma campanha com envios ainda — os relatórios aparecem depois do
        primeiro disparo.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Performance por campanha
      </h3>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[650px] xl:min-w-full">
          <Chart
            options={options}
            series={[
              {
                name: 'Entregues',
                data: comEnvios.map((c) => c.deliveredCount),
              },
              { name: 'Lidas', data: comEnvios.map((c) => c.readCount) },
              { name: 'Falhas', data: comEnvios.map((c) => c.failedCount) },
            ]}
            type="bar"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const BroadcastPage = () => {
  const [aba, setAba] = useState<Aba>('campanhas');

  const { campaigns, loading, refetch } = useBroadcastCampaigns();
  const { launch } = useLaunchBroadcastCampaign();
  const { cancel } = useCancelBroadcastCampaign();

  const lancar = async (id: string) => {
    await launch({ variables: { campaignId: id } });
    await refetch();
  };

  const cancelar = async (id: string) => {
    await cancel({ variables: { campaignId: id } });
    await refetch();
  };

  const colunas: DataTableColumn<BroadcastCampaign>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (c) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {c.name}
        </span>
      ),
    },
    {
      key: 'canal',
      header: 'Canal',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.channel === 'WHATSAPP' ? 'WhatsApp' : c.channel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge color={STATUS_BADGE[c.status] ?? 'light'} size="sm">
          {STATUS_LABELS[c.status] ?? c.status}
        </Badge>
      ),
    },
    {
      key: 'enviados',
      header: 'Enviados',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.sentCount}/{c.totalCount}
        </span>
      ),
    },
    {
      key: 'entregues',
      header: 'Entregues',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.deliveredCount}
        </span>
      ),
    },
    {
      key: 'leitura',
      header: 'Taxa leitura',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {taxaLeitura(c)}%
        </span>
      ),
    },
    {
      key: 'data',
      header: 'Data',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatData(c.startedAt ?? c.scheduledAt ?? c.createdAt)}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: '',
      render: (c) => (
        <div className="flex items-center gap-1 justify-end">
          {c.status === 'DRAFT' && (
            <button
              onClick={() => lancar(c.id)}
              className="px-3 py-1 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Lançar
            </button>
          )}
          {(c.status === 'RUNNING' || c.status === 'SCHEDULED') && (
            <button
              onClick={() => cancelar(c.id)}
              className="px-3 py-1 text-xs font-medium text-error-500 border border-error-500/30 rounded-lg hover:bg-error-50 dark:hover:bg-error-500/[0.12] transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      ),
    },
  ];

  const abas: { key: Aba; label: string }[] = [
    { key: 'campanhas', label: 'Campanhas' },
    { key: 'criar', label: 'Criar Nova' },
    { key: 'relatorios', label: 'Relatórios' },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Campanhas
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({campaigns.length})
              </span>
            )}
          </h1>

          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {abas.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAba(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  aba === key
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-4 md:p-6">
        {aba === 'campanhas' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <DataTable
              columns={colunas}
              data={campaigns}
              loading={loading}
              emptyMessage='Nenhuma campanha criada. Use a aba "Criar Nova" para começar.'
            />
          </div>
        )}
        {aba === 'criar' && (
          <CriarNovaWizard
            onCriada={() => {
              setAba('campanhas');
              refetch();
            }}
          />
        )}
        {aba === 'relatorios' && <Relatorios campanhas={campaigns} />}
      </div>
    </div>
  );
};
