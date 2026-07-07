// FORK: Voka CRM — T-6: Tarefas (lista + FullCalendar)
import { useState, useMemo, useCallback } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TaskDrawer } from '~/modules/tailadmin/ui/TaskDrawer';

export type TaskStatus = 'TODO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
type FilterTab = 'todas' | 'hoje' | 'esta-semana' | 'atrasadas';

export type TaskRecord = ObjectRecord & {
  title?: string | null;
  status?: TaskStatus | null;
  dueAt?: string | null;
  assignee?: {
    id: string;
    name: { firstName: string; lastName: string };
  } | null;
};

// ─── Utils ────────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

function eventColor(status: TaskStatus | null | undefined): string {
  if (status === 'CONCLUIDO') return 'var(--color-success-500)';
  if (status === 'EM_ANDAMENTO') return 'var(--color-warning-500)';
  return 'var(--color-brand-500)';
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: TaskRecord;
  onToggle: (task: TaskRecord) => void;
  onEdit: (task: TaskRecord) => void;
}

const TaskItem = ({ task, onToggle, onEdit }: TaskItemProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const now = new Date();
  const todayStart = startOfDay(now);
  const isDone = task.status === 'CONCLUIDO';
  const dueDate = task.dueAt ? new Date(task.dueAt) : null;
  const isOverdue =
    dueDate !== null && dueDate < todayStart && !isSameDay(dueDate, todayStart);
  const isToday = dueDate !== null && isSameDay(dueDate, todayStart);

  const datePillClass = isOverdue
    ? 'bg-red-50 text-red-600'
    : isToday
      ? 'bg-orange-50 text-orange-600'
      : 'bg-gray-100 text-gray-500';

  const initials = task.assignee
    ? `${task.assignee.name.firstName[0] ?? ''}${task.assignee.name.lastName[0] ?? ''}`.toUpperCase()
    : null;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        aria-label={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isDone
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {isDone && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        onClick={() => onEdit(task)}
        className={`flex-1 text-sm cursor-pointer min-w-0 truncate transition-colors ${
          isDone
            ? 'line-through text-gray-400'
            : 'text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400'
        }`}
      >
        {task.title || 'Sem título'}
      </span>

      {/* Date pill */}
      {dueDate && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${datePillClass}`}
        >
          {formatDate(task.dueAt!)}
        </span>
      )}

      {/* Assignee avatar */}
      {initials && (
        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
          {initials}
        </span>
      )}

      {/* 3-dot menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-7 z-20 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(task);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Editar
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onToggle(task);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {isDone ? 'Reabrir' : 'Concluir'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ListView ─────────────────────────────────────────────────────────────────

interface ListViewProps {
  tasks: TaskRecord[];
  filter: FilterTab;
  onToggleDone: (task: TaskRecord) => void;
  onEditTask: (task: TaskRecord) => void;
}

const ListView = ({
  tasks,
  filter,
  onToggleDone,
  onEditTask,
}: ListViewProps) => {
  const [doneOpen, setDoneOpen] = useState(false);

  const todayStart = startOfDay(new Date());
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const filteredTasks = useMemo(() => {
    if (filter === 'hoje')
      return tasks.filter(
        (t) =>
          isNonEmptyString(t.dueAt) && isSameDay(new Date(t.dueAt), todayStart),
      );
    if (filter === 'atrasadas')
      return tasks.filter(
        (t) =>
          t.status !== 'CONCLUIDO' &&
          isNonEmptyString(t.dueAt) &&
          new Date(t.dueAt) < todayStart &&
          !isSameDay(new Date(t.dueAt), todayStart),
      );
    if (filter === 'esta-semana')
      return tasks.filter((t) => {
        if (!isNonEmptyString(t.dueAt)) return false;
        const d = new Date(t.dueAt);
        return d >= todayStart && d < weekEnd;
      });
    return tasks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filter]);

  const pending = filteredTasks.filter((t) => t.status !== 'CONCLUIDO');
  const overdue = pending.filter(
    (t) =>
      isNonEmptyString(t.dueAt) &&
      new Date(t.dueAt) < todayStart &&
      !isSameDay(new Date(t.dueAt), todayStart),
  );
  const today = pending.filter(
    (t) =>
      isNonEmptyString(t.dueAt) && isSameDay(new Date(t.dueAt), todayStart),
  );
  const thisWeek = pending.filter((t) => {
    if (!isNonEmptyString(t.dueAt)) return false;
    const d = new Date(t.dueAt);
    return d > todayStart && d < weekEnd && !isSameDay(d, todayStart);
  });
  const future = pending.filter(
    (t) => isNonEmptyString(t.dueAt) && new Date(t.dueAt) >= weekEnd,
  );
  const noDue = pending.filter((t) => !t.dueAt);
  const done = filteredTasks
    .filter((t) => t.status === 'CONCLUIDO')
    .slice(0, 30);

  const renderGroup = (
    label: string,
    labelClass: string,
    items: TaskRecord[],
  ) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-6">
        <div
          className={`text-xs font-semibold uppercase tracking-wider mb-2 ${labelClass}`}
        >
          {label} ({items.length})
        </div>
        <div className="space-y-1">
          {items.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleDone}
              onEdit={onEditTask}
            />
          ))}
        </div>
      </div>
    );
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <span className="text-sm">Nenhuma tarefa encontrada</span>
      </div>
    );
  }

  return (
    <div>
      {renderGroup('Atrasadas', 'text-red-500', overdue)}
      {renderGroup('Hoje', 'text-orange-500', today)}
      {renderGroup('Esta semana', 'text-brand-500', thisWeek)}
      {renderGroup('Futuras', 'text-gray-500', future)}
      {renderGroup('Sem prazo', 'text-gray-400', noDue)}

      {/* Concluídas — collapsible */}
      {done.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setDoneOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-2 hover:opacity-80 transition-opacity"
          >
            <svg
              className={`w-3 h-3 transition-transform ${doneOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Concluídas ({done.length})
          </button>
          {doneOpen && (
            <div className="space-y-1">
              {done.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleDone}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const TarefasPage = () => {
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [filter, setFilter] = useState<FilterTab>('todas');
  const [drawerTask, setDrawerTask] = useState<TaskRecord | null>(null);

  const openCreateTask = useOpenCreateActivityDrawer({
    activityObjectNameSingular: CoreObjectNameSingular.Task,
  });

  const { records: tasks, loading } = useFindManyRecords<TaskRecord>({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      assignee: { id: true, name: { firstName: true, lastName: true } },
    },
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: 200,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const handleToggleDone = useCallback(
    async (task: TaskRecord) => {
      const newStatus: TaskStatus =
        task.status === 'CONCLUIDO' ? 'TODO' : 'CONCLUIDO';
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Task,
        idToUpdate: task.id,
        updateOneRecordInput: { status: newStatus },
      });
    },
    [updateOneRecord],
  );

  const calendarEvents = useMemo(
    () =>
      tasks
        .filter((t) => t.dueAt)
        .map((t) => ({
          id: t.id,
          title: t.title || 'Tarefa',
          date: t.dueAt!,
          backgroundColor: eventColor(t.status),
          borderColor: eventColor(t.status),
        })),
    [tasks],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const task = tasks.find((t) => t.id === arg.event.id);
      if (task) setDrawerTask(task);
    },
    [tasks],
  );

  const filterLabels: Array<{ key: FilterTab; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'hoje', label: 'Hoje' },
    { key: 'esta-semana', label: 'Esta semana' },
    { key: 'atrasadas', label: 'Atrasadas' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Title + count */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Tarefas
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({tasks.length})
              </span>
            )}
          </h1>

          {/* View tabs */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setView('lista')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'lista'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setView('calendario')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'calendario'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              Calendário
            </button>
          </div>

          {/* Filter chips — list view only */}
          {view === 'lista' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterLabels.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filter === key
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Nova Tarefa */}
          <button
            onClick={() => openCreateTask({ targetableObjects: [] })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Carregando…
          </div>
        ) : view === 'lista' ? (
          <ListView
            tasks={tasks}
            filter={filter}
            onToggleDone={handleToggleDone}
            onEditTask={setDrawerTask}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              events={calendarEvents}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek',
              }}
              height="auto"
              aspectRatio={1.8}
            />
          </div>
        )}
      </div>

      {/* Task Drawer */}
      <TaskDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />
    </div>
  );
};
