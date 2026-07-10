// FORK: Zellate — Tarefas em kanban (referências: tarefa.png, add-task.png).
// Colunas por status com drag & drop, criação/edição em modal central com
// associação a lead, e abertura via URL (?novaTarefa=1&leadId=…) para o
// fluxo "criar tarefa a partir do Inbox/lead".
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { CalendarDays, Plus, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getCssCompatibleDraggableProps } from '@/ui/layout/draggable-list/utils/getCssCompatibleDraggableProps';

export type TaskStatus = 'TODO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export type TaskRecord = ObjectRecord & {
  title?: string | null;
  status?: TaskStatus | null;
  dueAt?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: { firstName: string | null; lastName: string | null };
  } | null;
};

type TargetRecord = ObjectRecord & {
  taskId?: string | null;
  targetOpportunity?: { id: string; name: string | null } | null;
};

type MemberRecord = ObjectRecord & {
  name?: { firstName: string | null; lastName: string | null } | null;
};

type LeadOption = ObjectRecord & { name?: string | null };

const COLUNAS: Array<{ status: TaskStatus; titulo: string; cor: string }> = [
  { status: 'TODO', titulo: 'A fazer', cor: 'bg-gray-400' },
  { status: 'EM_ANDAMENTO', titulo: 'Em andamento', cor: 'bg-warning-500' },
  { status: 'CONCLUIDO', titulo: 'Concluídas', cor: 'bg-success-500' },
];

const nomeDoMembro = (m: {
  name?: { firstName: string | null; lastName: string | null } | null;
}) =>
  [m.name?.firstName, m.name?.lastName].filter(Boolean).join(' ') ||
  '(sem nome)';

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function estaAtrasada(t: TaskRecord): boolean {
  return (
    t.status !== 'CONCLUIDO' &&
    t.dueAt != null &&
    new Date(t.dueAt) < new Date()
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function TarefaCard({
  tarefa,
  lead,
  onEditar,
}: {
  tarefa: TaskRecord;
  lead: { id: string; name: string | null } | null;
  onEditar: () => void;
}) {
  const atrasada = estaAtrasada(tarefa);
  const concluida = tarefa.status === 'CONCLUIDO';

  return (
    <div
      onClick={onEditar}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer shadow-theme-xs hover:shadow-theme-sm transition-shadow"
    >
      <p
        className={`text-sm font-medium mb-2 ${
          concluida
            ? 'text-gray-400 line-through'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {tarefa.title || '(sem título)'}
      </p>

      {lead && (
        <Link
          to={`/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-block mb-2 max-w-full truncate rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600 hover:underline dark:bg-brand-900 dark:text-brand-300"
        >
          {lead.name ?? 'Lead'}
        </Link>
      )}

      <div className="flex items-center justify-between">
        {tarefa.dueAt ? (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              atrasada ? 'text-error-500 font-medium' : 'text-gray-400'
            }`}
          >
            <CalendarDays size={13} />
            {new Date(tarefa.dueAt).toLocaleDateString('pt-BR')}
          </span>
        ) : (
          <span />
        )}

        {tarefa.assignee ? (
          <span
            title={nomeDoMembro(tarefa.assignee)}
            className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold"
          >
            {iniciais(nomeDoMembro(tarefa.assignee))}
          </span>
        ) : (
          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center dark:bg-gray-700">
            <User size={12} />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Modal (add-task.png) ─────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function TarefaModal({
  tarefa,
  leadInicial,
  leadAtual,
  members,
  onFechar,
  onSalvar,
  onExcluir,
  salvando,
}: {
  tarefa: TaskRecord | null;
  leadInicial: { id: string; nome: string } | null;
  leadAtual: { id: string; name: string | null } | null;
  members: MemberRecord[];
  onFechar: () => void;
  onSalvar: (dados: {
    titulo: string;
    prazo: string;
    status: TaskStatus;
    assigneeId: string;
    leadId: string;
  }) => Promise<void>;
  onExcluir: (() => Promise<void>) | null;
  salvando: boolean;
}) {
  const editando = tarefa != null;
  const [titulo, setTitulo] = useState(tarefa?.title ?? '');
  const [prazo, setPrazo] = useState(
    tarefa?.dueAt ? tarefa.dueAt.slice(0, 10) : '',
  );
  const [status, setStatus] = useState<TaskStatus>(tarefa?.status ?? 'TODO');
  const [assigneeId, setAssigneeId] = useState(tarefa?.assigneeId ?? '');
  const [leadId, setLeadId] = useState(leadInicial?.id ?? leadAtual?.id ?? '');
  const [buscaLead, setBuscaLead] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  // Leads para associação (o modal é montado sob demanda)
  const { records: leads } = useFindManyRecords<LeadOption>({
    objectNameSingular: 'opportunity',
    filter: {},
    recordGqlFields: { id: true, name: true },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 200,
  });

  const leadsVisiveis = useMemo(() => {
    const q = buscaLead.trim().toLowerCase();
    const lista = q
      ? leads.filter((l) => (l.name ?? '').toLowerCase().includes(q))
      : leads;
    return lista.slice(0, 50);
  }, [leads, buscaLead]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {editando ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Tarefas vinculadas a um lead aparecem no card e no painel da conversa.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Título
            </label>
            <input
              autoFocus
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Ligar para o cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Prazo
              </label>
              <input
                type="date"
                className={inputClass}
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="TODO">A fazer</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDO">Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Responsável
            </label>
            <select
              className={inputClass}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">— Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {nomeDoMembro(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Associar ao lead
            </label>
            {leadInicial ? (
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {leadInicial.nome}
              </div>
            ) : (
              <>
                <input
                  className={`${inputClass} mb-1.5`}
                  value={buscaLead}
                  onChange={(e) => setBuscaLead(e.target.value)}
                  placeholder="Buscar lead pelo nome…"
                />
                <select
                  className={inputClass}
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                >
                  <option value="">— Sem lead</option>
                  {leadsVisiveis.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name ?? '(sem nome)'}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {onExcluir ? (
            confirmandoExclusao ? (
              <button
                onClick={() => void onExcluir()}
                className="rounded-lg bg-error-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Confirmar exclusão
              </button>
            ) : (
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-gray-800"
              >
                Excluir
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              disabled={salvando || titulo.trim() === ''}
              onClick={() =>
                void onSalvar({ titulo, prazo, status, assigneeId, leadId })
              }
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {salvando
                ? 'Salvando…'
                : editando
                  ? 'Salvar alterações'
                  : 'Criar tarefa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const TarefasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [abaFiltro, setAbaFiltro] = useState<'todas' | TaskStatus>('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<TaskRecord | null>(null);
  const [leadPre, setLeadPre] = useState<{ id: string; nome: string } | null>(
    null,
  );
  const [salvando, setSalvando] = useState(false);

  const { records: tasks, refetch: refetchTasks } =
    useFindManyRecords<TaskRecord>({
      objectNameSingular: 'task',
      recordGqlFields: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        assigneeId: true,
        assignee: { id: true, name: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueAt: 'AscNullsLast' }],
      limit: 300,
    });

  const { records: targets, refetch: refetchTargets } =
    useFindManyRecords<TargetRecord>({
      objectNameSingular: 'taskTarget',
      filter: {},
      recordGqlFields: {
        id: true,
        taskId: true,
        targetOpportunity: { id: true, name: true },
      },
      limit: 500,
    });

  // Tarefas criadas em outras telas (Inbox, detalhe do lead) chegam aqui —
  // o cache do Apollo pode estar frio; força uma leitura fresca ao montar.
  useEffect(() => {
    void refetchTasks();
    void refetchTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: 'workspaceMember',
    recordGqlFields: { id: true, name: true },
    limit: 50,
  });

  const { createOneRecord: criarTask } = useCreateOneRecord({
    objectNameSingular: 'task',
  });
  const { createOneRecord: criarTarget } = useCreateOneRecord({
    objectNameSingular: 'taskTarget',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord: excluirTask } = useDeleteOneRecord({
    objectNameSingular: 'task',
  });
  const { deleteOneRecord: excluirTarget } = useDeleteOneRecord({
    objectNameSingular: 'taskTarget',
  });

  // Lead vinculado por tarefa (primeiro alvo com opportunity)
  const leadPorTarefa = useMemo(() => {
    const map = new Map<
      string,
      { targetId: string; lead: { id: string; name: string | null } }
    >();
    for (const t of targets) {
      if (t.taskId && t.targetOpportunity && !map.has(t.taskId)) {
        map.set(t.taskId, { targetId: t.id, lead: t.targetOpportunity });
      }
    }
    return map;
  }, [targets]);

  // Abertura via URL (Inbox / detalhe do lead)
  useEffect(() => {
    if (searchParams.get('novaTarefa') === '1') {
      const leadId = searchParams.get('leadId');
      const leadNome = searchParams.get('leadNome');
      setLeadPre(leadId ? { id: leadId, nome: leadNome ?? 'Lead' } : null);
      setTarefaEditando(null);
      setModalAberto(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const porStatus = useMemo(() => {
    const grupos: Record<TaskStatus, TaskRecord[]> = {
      TODO: [],
      EM_ANDAMENTO: [],
      CONCLUIDO: [],
    };
    for (const t of tasks) {
      grupos[(t.status as TaskStatus) ?? 'TODO']?.push(t);
    }
    return grupos;
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    const destino = result.destination?.droppableId as TaskStatus | undefined;
    if (!destino || destino === result.source.droppableId) return;
    await updateOneRecord({
      objectNameSingular: 'task',
      idToUpdate: result.draggableId,
      updateOneRecordInput: { status: destino },
    });
    await refetchTasks();
  };

  const abrirNova = () => {
    setTarefaEditando(null);
    setLeadPre(null);
    setModalAberto(true);
  };

  const salvar = async (dados: {
    titulo: string;
    prazo: string;
    status: TaskStatus;
    assigneeId: string;
    leadId: string;
  }) => {
    setSalvando(true);
    try {
      const input = {
        title: dados.titulo.trim(),
        status: dados.status,
        dueAt: dados.prazo ? new Date(dados.prazo).toISOString() : null,
        assigneeId: dados.assigneeId || null,
      };

      if (tarefaEditando) {
        await updateOneRecord({
          objectNameSingular: 'task',
          idToUpdate: tarefaEditando.id,
          updateOneRecordInput: input,
        });
        // Associação alterada: substitui o vínculo
        const vinculoAtual = leadPorTarefa.get(tarefaEditando.id) ?? null;
        if ((vinculoAtual?.lead.id ?? '') !== dados.leadId) {
          if (vinculoAtual) await excluirTarget(vinculoAtual.targetId);
          if (dados.leadId) {
            await criarTarget({
              taskId: tarefaEditando.id,
              targetOpportunityId: dados.leadId,
            });
          }
        }
      } else {
        const taskId = uuidv4();
        await criarTask({ id: taskId, ...input });
        if (dados.leadId) {
          await criarTarget({ taskId, targetOpportunityId: dados.leadId });
        }
      }

      await Promise.all([refetchTasks(), refetchTargets()]);
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!tarefaEditando) return;
    await excluirTask(tarefaEditando.id);
    await refetchTasks();
    setModalAberto(false);
  };

  const colunasVisiveis =
    abaFiltro === 'todas'
      ? COLUNAS
      : COLUNAS.filter((c) => c.status === abaFiltro);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4 gap-4">
      {/* Header: abas de contagem + ações (task-list.png) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(
            [
              { key: 'todas', rotulo: 'Todas', n: tasks.length },
              { key: 'TODO', rotulo: 'A fazer', n: porStatus.TODO.length },
              {
                key: 'EM_ANDAMENTO',
                rotulo: 'Em andamento',
                n: porStatus.EM_ANDAMENTO.length,
              },
              {
                key: 'CONCLUIDO',
                rotulo: 'Concluídas',
                n: porStatus.CONCLUIDO.length,
              },
            ] as const
          ).map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaFiltro(aba.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                abaFiltro === aba.key
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {aba.rotulo}
              <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {aba.n}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/calendario"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <CalendarDays size={15} />
            Calendário
          </Link>
          <button
            onClick={abrirNova}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Nova tarefa
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Kanban (tarefa.png) */}
      <DragDropContext onDragEnd={(r) => void handleDragEnd(r)}>
        <div className="flex flex-1 min-h-0 gap-4 overflow-x-auto">
          {colunasVisiveis.map((col) => (
            <div
              key={col.status}
              className="flex w-80 flex-shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <span className={`h-2 w-2 rounded-full ${col.cor}`} />
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {col.titulo}
                </span>
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {porStatus[col.status].length}
                </span>
              </div>

              <Droppable droppableId={col.status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...provided.droppableProps}
                    className="flex-1 space-y-3 overflow-y-auto px-3 pb-3"
                  >
                    {porStatus[col.status].length === 0 && (
                      <p className="px-1 py-2 text-xs text-gray-400">
                        Nenhuma tarefa aqui.
                      </p>
                    )}
                    {porStatus[col.status].map((tarefa, idx) => (
                      <Draggable
                        key={tarefa.id}
                        draggableId={tarefa.id}
                        index={idx}
                      >
                        {(dragProvided) => (
                          <div
                            ref={(el) => dragProvided.innerRef(el)}
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...getCssCompatibleDraggableProps(
                              dragProvided.draggableProps,
                            )}
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...dragProvided.dragHandleProps}
                          >
                            <TarefaCard
                              tarefa={tarefa}
                              lead={leadPorTarefa.get(tarefa.id)?.lead ?? null}
                              onEditar={() => {
                                setTarefaEditando(tarefa);
                                setLeadPre(null);
                                setModalAberto(true);
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {modalAberto && (
        <TarefaModal
          key={tarefaEditando?.id ?? 'nova'}
          tarefa={tarefaEditando}
          leadInicial={leadPre}
          leadAtual={
            tarefaEditando
              ? (leadPorTarefa.get(tarefaEditando.id)?.lead ?? null)
              : null
          }
          members={members}
          onFechar={() => setModalAberto(false)}
          onSalvar={salvar}
          onExcluir={tarefaEditando ? excluir : null}
          salvando={salvando}
        />
      )}
    </div>
  );
};
