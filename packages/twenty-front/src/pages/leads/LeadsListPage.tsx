import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import Badge from '@/tailadmin/ui/Badge';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';

type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light';

const STAGE_MAP: Record<string, { label: string; color: BadgeColor }> = {
  NEW:       { label: 'Leads Recebidos',    color: 'info' },
  SCREENING: { label: 'Tomada de Decisão',  color: 'primary' },
  MEETING:   { label: 'Reunião',            color: 'light' },
  PROPOSAL:  { label: 'Proposta',           color: 'warning' },
  CUSTOMER:  { label: 'Negociação',         color: 'warning' },
  WON:       { label: 'Ganho',              color: 'success' },
  LOST:      { label: 'Perdido',            color: 'error' },
};

const ALL_STAGES = Object.keys(STAGE_MAP);

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

const PAGE_SIZE = 50;

export function LeadsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(0);

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {},
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    skip: false,
  } as any);

  const leads = records as any[];

  const filtered = useMemo(() => {
    let r = leads ?? [];
    if (search) r = r.filter((l) => (l.name ?? '').toLowerCase().includes(search.toLowerCase()));
    if (stageFilter) r = r.filter((l) => l.stage === stageFilter);
    return r;
  }, [leads, search, stageFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: DataTableColumn<any>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (l) => {
        const idx = (leads?.indexOf(l) ?? 0) % AVATAR_COLORS.length;
        return (
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
              {initials(l.name ?? 'L')}
            </span>
            <span className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[180px]">
              {l.name ?? '—'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (l) => (
        <span className="text-gray-500 dark:text-gray-400">
          {l.company?.name ?? l.pointOfContactId ?? '—'}
        </span>
      ),
    },
    {
      key: 'etapa',
      header: 'Etapa',
      render: (l) => {
        const s = STAGE_MAP[l.stage] ?? { label: l.stage ?? '—', color: 'light' as BadgeColor };
        return <Badge size="sm" color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'valor',
      header: 'Valor',
      className: 'text-right',
      render: (l) => {
        const v = (Number(l.amount?.amountMicros ?? 0) || 0) / 1_000_000;
        return (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {v > 0 ? formatBRL(v) : '—'}
          </span>
        );
      },
    },
    {
      key: 'fechamento',
      header: 'Fechamento',
      render: (l) => <span className="text-gray-400 text-theme-xs">{formatDate(l.closeDate)}</span>,
    },
    {
      key: 'criado',
      header: 'Criado em',
      render: (l) => <span className="text-gray-400 text-theme-xs">{formatDate(l.createdAt)}</span>,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Leads{!loading && ` (${filtered.length})`}
          </h1>
        </div>
        <button
          onClick={() => navigate('/objects/opportunities')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + Novo Lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">Todas as etapas</option>
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_MAP[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        loading={loading}
        emptyMessage="Nenhum lead encontrado."
        onRowClick={(l) => navigate(`/leads/${l.id}`)}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} leads
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
