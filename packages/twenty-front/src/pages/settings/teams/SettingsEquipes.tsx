// FORK: Voka CRM — T-10: Equipes (grid TailAdmin)
import { useCallback, useEffect, useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type Team = {
  id: string;
  name: string;
  description: string | null;
  memberIds: string[];
};

const useTeamsApi = () => {
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
  const base = '/metadata/teams';

  return {
    fetchAll: async (): Promise<Team[]> => {
      const res = await fetch(base, { headers: getHeaders() });
      if (!res.ok) return [];
      return res.json() as Promise<Team[]>;
    },
    create: (name: string, description: string) =>
      fetch(base, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, description, memberIds: [] }),
      }),
    remove: (id: string) =>
      fetch(`${base}/${id}`, { method: 'DELETE', headers: getHeaders() }),
  };
};

export const SettingsEquipes = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const api = useTeamsApi();

  const load = useCallback(async () => {
    setLoading(true);
    setTeams(await api.fetchAll());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const criar = async () => {
    if (name.trim() === '') return;
    await api.create(name.trim(), description.trim());
    setName('');
    setDescription('');
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
            Equipes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize os membros do workspace em equipes de venda.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + Nova equipe
        </button>
      </div>

      {/* Form inline */}
      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6 max-w-[480px] space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da equipe"
            className={inputClass}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className={inputClass}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={criar}
              disabled={name.trim() === ''}
              className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-28 animate-pulse"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
          Nenhuma equipe criada. Clique em "+ Nova equipe" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 bg-brand-50 dark:bg-brand-500/[0.12] rounded-xl flex-shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-brand-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {team.name}
                  </h3>
                </div>
                <button
                  onClick={() => excluir(team.id)}
                  className="text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg px-2 py-1 transition-colors flex-shrink-0"
                >
                  Excluir
                </button>
              </div>
              {team.description !== null && team.description !== '' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {team.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {team.memberIds.length} membro(s)
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
