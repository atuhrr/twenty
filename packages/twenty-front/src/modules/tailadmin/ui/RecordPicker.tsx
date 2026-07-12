// FORK: Zellate — F1 Empresa 360: seletor de registro reutilizável para
// ASSOCIAR entidades do grafo (empresa↔contato↔negócio). Busca client-side
// sobre um lote (padrão já usado no calendário), sem depender de search server.
import { useMemo, useRef, useState } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';

type RecordPickerProps<T extends ObjectRecord> = {
  objectNameSingular: string;
  recordGqlFields: Record<string, unknown>;
  labelOf: (record: T) => string;
  onSelect: (id: string | null) => void | Promise<void>;
  filter?: Record<string, unknown>;
  currentLabel?: string | null;
  placeholder?: string;
  allowClear?: boolean;
  buttonLabel?: string;
};

export function RecordPicker<T extends ObjectRecord>({
  objectNameSingular,
  recordGqlFields,
  labelOf,
  onSelect,
  filter = {},
  currentLabel,
  placeholder = 'Buscar…',
  allowClear = true,
  buttonLabel = '+ Associar',
}: RecordPickerProps<T>) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { records, loading } = useFindManyRecords<T>({
    objectNameSingular,
    filter,
    recordGqlFields,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    skip: !aberto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = q
      ? records.filter((r) => labelOf(r).toLowerCase().includes(q))
      : records;

    return lista.slice(0, 50);
  }, [records, busca, labelOf]);

  const escolher = async (id: string | null) => {
    await onSelect(id);
    setAberto(false);
    setBusca('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAberto((v) => !v)}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          {currentLabel != null && currentLabel !== ''
            ? 'Alterar'
            : buttonLabel}
        </button>
        {allowClear && currentLabel != null && currentLabel !== '' && (
          <button
            onClick={() => void escolher(null)}
            className="text-xs font-medium text-gray-400 hover:text-error-500"
          >
            Remover
          </button>
        )}
      </div>

      {aberto && (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-t-xl border-b border-gray-100 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:border-gray-800 dark:text-white"
          />
          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-2 text-sm text-gray-400">Carregando…</p>
            ) : visiveis.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">
                Nenhum registro encontrado.
              </p>
            ) : (
              visiveis.map((r) => (
                <button
                  key={r.id}
                  onClick={() => void escolher(r.id)}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:text-white/90 dark:hover:bg-gray-800"
                >
                  {labelOf(r) || '(sem nome)'}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
