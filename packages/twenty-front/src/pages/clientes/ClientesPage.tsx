// FORK: Zellate — F2 Cliente: "Clientes" deixa de ser um silo (clientesRecorrentes)
// e passa a ser a VISÃO de ciclo de vida — empresas com lifecycleStage=CLIENTE,
// com LTV (soma dos negócios ganhos) vindo do grafo nativo, não de tabela paralela.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
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

type Cliente = {
  id: string;
  name?: string | null;
  domainName?: { primaryLinkUrl?: string } | null;
  address?: { addressCity?: string } | null;
  employees?: number | null;
};

export function ClientesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Clientes = empresas no ciclo de vida CLIENTE
  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'company',
    filter: { lifecycleStage: { eq: 'CLIENTE' } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    skip: false,
  } as any);

  // Negócios ganhos → LTV e nº de negócios por empresa
  const { records: ganhos } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: { stage: { eq: 'GANHO' } },
    recordGqlFields: { id: true, company: { id: true }, amount: true },
    limit: 500,
    skip: false,
  } as any);

  const ltvPorEmpresa = useMemo(() => {
    const mapa = new Map<string, { total: number; ltv: number }>();
    for (const g of ganhos as any[]) {
      const cid = g.company?.id;
      if (!cid) continue;
      const atual = mapa.get(cid) ?? { total: 0, ltv: 0 };
      atual.total += 1;
      atual.ltv += Number(g.amount?.amountMicros ?? 0);
      mapa.set(cid, atual);
    }
    return mapa;
  }, [ganhos]);

  const clientes = records as Cliente[];

  const filtered = useMemo(() => {
    let r = clientes ?? [];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => (c.name ?? '').toLowerCase().includes(q));
    }
    return r;
  }, [clientes, search]);

  const ltvTotal = useMemo(
    () =>
      (clientes ?? []).reduce(
        (s, c) => s + (ltvPorEmpresa.get(c.id)?.ltv ?? 0),
        0,
      ),
    [clientes, ltvPorEmpresa],
  );
  const ticketMedio =
    clientes && clientes.length > 0 ? ltvTotal / clientes.length : 0;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (c) => {
        const idx = (clientes?.indexOf(c) ?? 0) % AVATAR_COLORS.length;
        return (
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[idx]}`}
            >
              {initials(c.name ?? 'C')}
            </span>
            <span className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[200px]">
              {c.name ?? '—'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'cidade',
      header: 'Cidade',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.address?.addressCity ?? '—'}
        </span>
      ),
    },
    {
      key: 'negocios',
      header: 'Negócios ganhos',
      className: 'text-right',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {ltvPorEmpresa.get(c.id)?.total ?? 0}
        </span>
      ),
    },
    {
      key: 'ltv',
      header: 'LTV',
      className: 'text-right',
      render: (c) => {
        const ltv = (ltvPorEmpresa.get(c.id)?.ltv ?? 0) / 1_000_000;
        return (
          <span className="font-medium text-success-600 dark:text-success-400">
            {ltv > 0 ? formatBRL(ltv) : '—'}
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
          Clientes{!loading && ` (${filtered.length})`}
        </h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Clientes ativos
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {clientes?.length ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Receita total (LTV)
          </p>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">
            {formatBRL(ltvTotal / 1_000_000)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ticket médio
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBRL(ticketMedio / 1_000_000)}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
        <svg
          className="absolute left-3 top-3 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paged}
        loading={loading}
        emptyMessage="Nenhum cliente ainda. Uma empresa vira cliente quando um negócio é ganho ou uma fatura é paga."
        onRowClick={(c) => navigate(`/empresas/${c.id}`)}
      />

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de{' '}
            {filtered.length} clientes
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
