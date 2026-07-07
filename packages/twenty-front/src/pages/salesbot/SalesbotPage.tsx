// FORK: Voka CRM — T-8: Salesbot (lista TailAdmin; canvas ReactFlow preservado no editor)
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { BotCreateModal } from '@/salesbot/components/BotCreateModal';
import {
  countFlowNodes,
  TRIGGER_TYPE_LABELS,
  useDeleteSalesbot,
  useSalesbots,
  useUpdateSalesbot,
  type BotTrigger,
  type Salesbot,
} from '@/salesbot/hooks/useSalesbot';
import Switch from '@/tailadmin/form/Switch';

const formatTrigger = (t: BotTrigger): string => {
  const label = TRIGGER_TYPE_LABELS[t.type] ?? t.type;
  return typeof t.keyword === 'string' && t.keyword !== ''
    ? `${label}: "${t.keyword}"`
    : label;
};

export const SalesbotPage = () => {
  const { bots, loading, refetch } = useSalesbots();
  const { update } = useUpdateSalesbot();
  const { remove } = useDeleteSalesbot();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const botsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q === '') return bots;
    return bots.filter((b) => b.name.toLowerCase().includes(q));
  }, [bots, busca]);

  const alternar = async (bot: Salesbot, enabled: boolean) => {
    await update({ variables: { input: { id: bot.id, enabled } } });
    await refetch();
  };

  const excluir = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Salesbot
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({bots.length})
              </span>
            )}
          </h1>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar bot..."
            className="w-52 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <div className="flex-1" />

          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            + Novo Salesbot
          </button>
        </div>
      </div>

      {/* Grid de bots */}
      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-44 animate-pulse"
              />
            ))}
          </div>
        ) : botsFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
            Nenhum bot criado. Clique em "+ Novo Salesbot" para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {botsFiltrados.map((bot) => (
              <div
                key={bot.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col"
              >
                {/* Header: ícone + nome + toggle */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/[0.12] rounded-xl flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-brand-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="5"
                          y="7"
                          width="14"
                          height="12"
                          rx="2"
                          strokeWidth={2}
                        />
                        <path
                          strokeLinecap="round"
                          strokeWidth={2}
                          d="M12 7V4M9 12h.01M15 12h.01M9 16h6"
                        />
                      </svg>
                    </div>
                    <Link
                      to={`/salesbot/${bot.id}`}
                      className="font-semibold text-gray-900 dark:text-white truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                    >
                      {bot.name}
                    </Link>
                  </div>
                  <Switch
                    checked={bot.enabled}
                    onChange={(v) => alternar(bot, v)}
                    id={`bot-toggle-${bot.id}`}
                  />
                </div>

                {/* Gatilhos */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {bot.triggers.length === 0 ? (
                    <span className="text-xs text-gray-400">Sem gatilhos</span>
                  ) : (
                    bot.triggers.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400"
                      >
                        {formatTrigger(t)}
                      </span>
                    ))
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  {countFlowNodes(bot.graph)} nó(s) no fluxo
                </p>

                <div className="flex-1" />

                {/* Footer */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    to={`/salesbot/${bot.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Editar fluxo
                  </Link>
                  <div className="flex-1" />
                  <button
                    onClick={() => excluir(bot.id)}
                    className="px-3 py-1.5 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && <BotCreateModal onClose={() => setModalAberto(false)} />}
    </div>
  );
};
