// FORK: Voka CRM — T-10: Motivos de perda (lista TailAdmin)
import { useCallback, useEffect, useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type LossReason = {
  id: string;
  label: string;
  position: number;
  isDefault: boolean;
};

const useApi = () => {
  const getHeaders = () => {
    const raw = localStorage.getItem('tokenPair');
    const token =
      raw !== null
        ? ((JSON.parse(raw) as { accessToken?: { token?: string } })
            ?.accessToken?.token ?? '')
        : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };
  const base = '/metadata/loss-reasons';

  return {
    fetchAll: async (): Promise<LossReason[]> => {
      const res = await fetch(base, { headers: getHeaders() });
      if (!res.ok) return [];
      return res.json() as Promise<LossReason[]>;
    },
    create: (label: string) =>
      fetch(base, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ label }),
      }),
    remove: (id: string) =>
      fetch(`${base}/${id}`, { method: 'DELETE', headers: getHeaders() }),
  };
};

export const SettingsMotivosDePerdaPage = () => {
  const [reasons, setReasons] = useState<LossReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const api = useApi();

  const load = useCallback(async () => {
    setLoading(true);
    setReasons(await api.fetchAll());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const criar = async () => {
    if (newLabel.trim() === '') return;
    await api.create(newLabel.trim());
    setNewLabel('');
    setShowForm(false);
    void load();
  };

  const excluir = async (id: string) => {
    await api.remove(id);
    void load();
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Motivos de Perda
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure os motivos disponíveis ao marcar um lead como perdido.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + Novo motivo
        </button>
      </div>

      {/* Form inline */}
      {showForm && (
        <div className="flex items-center gap-2 mb-5 max-w-[480px]">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') criar();
            }}
            placeholder="Ex.: Preço alto"
            autoFocus
            className={inputClass}
          />
          <button
            onClick={criar}
            disabled={newLabel.trim() === ''}
            className="px-3 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            Adicionar
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] max-w-[560px] overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : reasons.length === 0 ? (
          <p className="p-8 text-sm text-gray-400 text-center">
            Nenhum motivo cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...reasons]
              .sort((a, b) => a.position - b.position)
              .map((reason) => (
                <li
                  key={reason.id}
                  className="flex items-center gap-3 px-4 py-3 group"
                >
                  <svg
                    className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                  <span className="flex-1 text-sm text-gray-800 dark:text-white/90">
                    {reason.label}
                  </span>
                  {reason.isDefault && (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Padrão
                    </span>
                  )}
                  {!reason.isDefault && (
                    <button
                      onClick={() => excluir(reason.id)}
                      className="text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Excluir
                    </button>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};
