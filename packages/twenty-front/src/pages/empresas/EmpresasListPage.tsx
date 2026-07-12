import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import Badge from '@/tailadmin/ui/Badge';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';

type BadgeColor = 'primary' | 'success' | 'light' | 'error';

const CICLO: Record<string, { label: string; color: BadgeColor }> = {
  CLIENTE: { label: 'Cliente', color: 'success' },
  OPORTUNIDADE: { label: 'Oportunidade', color: 'primary' },
  LEAD: { label: 'Lead', color: 'light' },
  INATIVO: { label: 'Inativo', color: 'error' },
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export function EmpresasListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [cicloFiltro, setCicloFiltro] = useState('');

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'company',
    filter: {},
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    skip: false,
  } as any);

  // Negócios de todas as empresas — agrega por companyId para nº de negócios,
  // valor em negociação e o ciclo de vida (tem GANHO → Cliente).
  const { records: negocios } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: { isUnclassified: { eq: false } },
    recordGqlFields: {
      id: true,
      company: { id: true },
      stage: true,
      amount: true,
    },
    limit: 500,
    skip: false,
  } as any);

  const agregadoPorEmpresa = useMemo(() => {
    const mapa = new Map<
      string,
      { total: number; temGanho: boolean; valorAberto: number }
    >();
    for (const n of negocios as any[]) {
      const cid = n.company?.id;
      if (!cid) continue;
      const atual = mapa.get(cid) ?? {
        total: 0,
        temGanho: false,
        valorAberto: 0,
      };
      atual.total += 1;
      if (n.stage === 'GANHO') atual.temGanho = true;
      else atual.valorAberto += Number(n.amount?.amountMicros ?? 0);
      mapa.set(cid, atual);
    }
    return mapa;
  }, [negocios]);

  // Ciclo armazenado (F2) com fallback calculado dos negócios
  const cicloDe = (empresa: any): keyof typeof CICLO => {
    if (empresa?.lifecycleStage && CICLO[empresa.lifecycleStage])
      return empresa.lifecycleStage;
    const ag = agregadoPorEmpresa.get(empresa.id);
    if (ag?.temGanho) return 'CLIENTE';
    if (ag && ag.total > 0) return 'OPORTUNIDADE';
    return 'LEAD';
  };

  // FORK: Zellate — "Nova Empresa" cria o registro e abre o detalhe. Navegar
  // para /objects/companies não funcionava: o roteador redireciona /objects/*
  // de volta para /empresas, então nenhuma empresa era criada.
  const { createOneRecord: criarEmpresa } = useCreateOneRecord({
    objectNameSingular: 'company',
  });
  const [criando, setCriando] = useState(false);

  const novaEmpresa = async () => {
    if (criando) return;
    setCriando(true);
    try {
      const id = uuidv4();
      await criarEmpresa({ id, name: 'Nova empresa' });
      navigate(`/empresas/${id}`);
    } finally {
      setCriando(false);
    }
  };

  const empresas = records as any[];

  const filtered = useMemo(() => {
    let r = empresas ?? [];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((e) => (e.name ?? '').toLowerCase().includes(q));
    }
    if (cicloFiltro) r = r.filter((e) => cicloDe(e) === cicloFiltro);
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresas, search, cicloFiltro, agregadoPorEmpresa]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: DataTableColumn<any>[] = [
    {
      key: 'nome',
      header: 'Empresa',
      render: (e) => {
        const idx = (empresas?.indexOf(e) ?? 0) % AVATAR_COLORS.length;
        return (
          <div className="flex items-center gap-3">
            {e.domainName?.primaryLinkUrl ? (
              <img
                src={`https://logo.clearbit.com/${e.domainName.primaryLinkUrl.replace(/^https?:\/\//, '')}`}
                alt={e.name}
                className="w-8 h-8 rounded-full object-contain bg-white border border-gray-100 flex-shrink-0"
                onError={(ev) => {
                  (ev.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
                {initials(e.name ?? 'E')}
              </span>
            )}
            <span className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[200px]">
              {e.name ?? '—'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'site',
      header: 'Site',
      render: (e) => {
        const url = e.domainName?.primaryLinkUrl ?? e.domainName ?? '';
        if (!url) return <span className="text-gray-400">—</span>;
        const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400 text-theme-sm"
            onClick={(ev) => ev.stopPropagation()}
          >
            {display}
          </a>
        );
      },
    },
    {
      key: 'endereco',
      header: 'Endereço',
      render: (e) => {
        const city = e.address?.addressCity ?? '';
        const state = e.address?.addressState ?? '';
        const parts = [city, state].filter(Boolean).join(', ');
        return <span className="text-gray-500 dark:text-gray-400">{parts || '—'}</span>;
      },
    },
    {
      key: 'ciclo',
      header: 'Ciclo de vida',
      render: (e) => {
        const c = CICLO[cicloDe(e)];
        return (
          <Badge size="sm" color={c.color}>
            {c.label}
          </Badge>
        );
      },
    },
    {
      key: 'negocios',
      header: 'Negócios',
      className: 'text-right',
      render: (e) => {
        const ag = agregadoPorEmpresa.get(e.id);
        return (
          <span className="text-gray-500 dark:text-gray-400">
            {ag?.total ?? 0}
          </span>
        );
      },
    },
    {
      key: 'funcionarios',
      header: 'Funcionários',
      className: 'text-right',
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">
          {e.employees != null ? Number(e.employees).toLocaleString('pt-BR') : '—'}
        </span>
      ),
    },
    {
      key: 'receita',
      header: 'Receita Anual',
      className: 'text-right',
      render: (e) => {
        const v = Number(e.annualRevenue?.amountMicros ?? 0) / 1_000_000;
        return (
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {v > 0 ? formatBRL(v) : '—'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Empresas{!loading && ` (${filtered.length})`}
        </h1>
        <button
          onClick={novaEmpresa}
          disabled={criando}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {criando ? 'Criando…' : '+ Nova Empresa'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <select
          value={cicloFiltro}
          onChange={(e) => { setCicloFiltro(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">Todos os ciclos</option>
          <option value="CLIENTE">Clientes</option>
          <option value="OPORTUNIDADE">Oportunidades</option>
          <option value="LEAD">Leads</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        loading={loading}
        emptyMessage="Nenhuma empresa encontrada."
        onRowClick={(e) => navigate(`/empresas/${e.id}`)}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} empresas
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
