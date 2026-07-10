import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { LeadKanbanCard } from '@/funil/LeadKanbanCard';
import { useWhatsappThreads } from '@/whatsapp/hooks/useWhatsappThreads';

// FORK: Voka CRM — T-13: a faixa de 4px lê a cor da opção da etapa via CSS var
// do tema (--t-color-{nome}), sem hex hardcodado (CLAUDE.md § 3.2).
const themeColorVar = (colorName: string | undefined): string =>
  `var(--t-color-${colorName ?? 'gray'}, var(--t-color-gray))`;

function formatBRL(micros: number) {
  return (micros / 1_000_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function FunilKanbanPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Get stage options from metadata
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'opportunity',
  });

  const stageField = objectMetadataItem.fields.find((f) => f.name === 'stage');
  const stageOptions = useMemo(
    () =>
      [...(stageField?.options ?? [])].sort((a, b) => a.position - b.position),
    [stageField],
  );

  // Fetch all leads
  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    // Leads de entrada (nao classificados) ficam fora do funil ate o aceite
    filter: { isUnclassified: { eq: false } },
    orderBy: [{ position: 'AscNullsLast' }],
    limit: 500,
    skip: false,
  } as any);

  const { updateOneRecord } = useUpdateOneRecord();

  // FORK: Zellate — conversas do WhatsApp por lead (badge de não lidas)
  const { threads } = useWhatsappThreads();
  const threadByOpportunity = useMemo(() => {
    const map = new Map<string, { contactId: string; unreadCount: number }>();
    for (const t of threads) {
      if (t.opportunityId) {
        map.set(t.opportunityId, {
          contactId: t.contactId,
          unreadCount: t.unreadCount,
        });
      }
    }
    return map;
  }, [threads]);

  const leads = records as any[];

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) => (l.name ?? '').toLowerCase().includes(q));
  }, [leads, search]);

  // Group by stage
  const byStage = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const opt of stageOptions) {
      map[opt.value] = [];
    }
    for (const lead of filtered) {
      const stage = lead.stage ?? stageOptions[0]?.value ?? '';
      if (!map[stage]) map[stage] = [];
      map[stage].push(lead);
    }
    return map;
  }, [filtered, stageOptions]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      const newStage = destination.droppableId;
      await updateOneRecord({
        objectNameSingular: 'opportunity',
        idToUpdate: draggableId,
        updateOneRecordInput: { stage: newStage },
      });
    },
    [updateOneRecord],
  );

  const totalLeads = filtered.length;
  const totalValue = filtered.reduce(
    (sum, l) => sum + (Number(l.amount?.amountMicros ?? 0) || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: title + stats */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
              Funil de Vendas
            </h1>
            {!loading && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalLeads} leads · {formatBRL(totalValue)}
              </span>
            )}
          </div>

          {/* Right: tabs + search + button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View tabs */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button className="px-3 py-1.5 text-sm font-medium bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400">
                Kanban
              </button>
              <button
                onClick={() => navigate('/leads')}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Lista
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar lead..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-1.5 pl-8 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
              <svg
                className="absolute left-2.5 top-2 h-4 w-4 text-gray-400"
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

            {/* New Lead */}
            <button
              onClick={() => navigate('/objects/opportunities')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
            >
              + Novo Lead
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[280px] flex-shrink-0 bg-gray-100 rounded-2xl h-64 animate-pulse dark:bg-gray-800"
              />
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 items-start">
              {stageOptions.map((opt) => {
                const columnLeads = byStage[opt.value] ?? [];
                const colTotal = columnLeads.reduce(
                  (sum, l) => sum + (Number(l.amount?.amountMicros ?? 0) || 0),
                  0,
                );
                const stripeColor = themeColorVar(opt.color);

                return (
                  <div
                    key={opt.value}
                    className="flex-shrink-0 w-[280px] flex flex-col"
                  >
                    {/* Column header */}
                    <div className="rounded-t-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-b-0">
                      {/* 4px color stripe */}
                      <div
                        className="h-1 w-full"
                        style={{ backgroundColor: stripeColor }}
                      />
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {columnLeads.length}
                          </span>
                          {colTotal > 0 && (
                            <span className="text-xs text-gray-400">
                              · {formatBRL(colTotal)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={opt.value}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[120px] rounded-b-xl border border-gray-200 dark:border-gray-700 border-t-0 p-2 space-y-2 transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-brand-50 dark:bg-brand-500/[0.08]'
                              : 'bg-gray-50 dark:bg-gray-900/50'
                          }`}
                        >
                          {columnLeads.length === 0 &&
                          !snapshot.isDraggingOver ? (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                              <span className="text-xs text-gray-400">
                                Arraste leads aqui
                              </span>
                            </div>
                          ) : (
                            columnLeads.map((lead, idx) => (
                              <Draggable
                                key={lead.id}
                                draggableId={lead.id}
                                index={idx}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <LeadKanbanCard
                                    lead={lead}
                                    index={idx}
                                    provided={dragProvided}
                                    snapshot={dragSnapshot}
                                    unreadCount={threadByOpportunity.get(lead.id)?.unreadCount ?? 0}
                                    onOpenChat={() => {
                                      const chat = threadByOpportunity.get(lead.id);
                                      if (chat) navigate(`/inbox?contactId=${chat.contactId}`);
                                    }}
                                  />
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
