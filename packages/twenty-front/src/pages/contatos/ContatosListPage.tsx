import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';

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

export function ContatosListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'person',
    filter: {},
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    skip: false,
  } as any);

  const contatos = records as any[];

  const filtered = useMemo(() => {
    let r = contatos ?? [];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => {
        const name = `${c.name?.firstName ?? ''} ${c.name?.lastName ?? ''}`.toLowerCase();
        const email = (c.emails?.primaryEmail ?? c.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    return r;
  }, [contatos, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: DataTableColumn<any>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (c) => {
        const fullName = `${c.name?.firstName ?? ''} ${c.name?.lastName ?? ''}`.trim() || '—';
        const idx = (contatos?.indexOf(c) ?? 0) % AVATAR_COLORS.length;
        return (
          <div className="flex items-center gap-3">
            {c.avatarUrl ? (
              <img
                src={c.avatarUrl}
                alt={fullName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
                {initials(fullName)}
              </span>
            )}
            <span className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[180px]">
              {fullName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (c) => (
        <a
          href={`mailto:${c.emails?.primaryEmail ?? c.email ?? ''}`}
          className="text-blue-600 hover:underline dark:text-blue-400 text-theme-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {c.emails?.primaryEmail ?? c.email ?? '—'}
        </a>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.phones?.primaryPhoneNumber ?? c.phone ?? '—'}
        </span>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.company?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">
          {c.jobTitle ?? c.position ?? '—'}
        </span>
      ),
    },
    {
      key: 'criado',
      header: 'Criado em',
      render: (c) => <span className="text-gray-400 text-theme-xs">{formatDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Contatos{!loading && ` (${filtered.length})`}
        </h1>
        <button
          onClick={() => navigate('/objects/people')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + Novo Contato
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
        <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        loading={loading}
        emptyMessage="Nenhum contato encontrado."
        onRowClick={(c) => navigate(`/contatos/${c.id}`)}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} contatos
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
