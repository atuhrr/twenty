// FORK: Voka CRM — Fase 17: Tarefas — lista + calendário
import { useState, useMemo } from 'react';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconListCheck, IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type TaskRecord = ObjectRecord & {
  title?: string | null;
  status?: TaskStatus | null;
  dueAt?: string | null;
  assignee?: { id: string; name: { firstName: string; lastName: string } } | null;
};

// ─── Layout ─────────────────────────────────────────────────────────────────

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const StyledHeader = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[6]};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: 16px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
  flex: 1;
`;

const StyledViewToggle = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTabBtn = styled.button<{ active: boolean }>`
  align-items: center;
  background: ${({ active }) => (active ? themeCssVariables.background.transparent.medium : 'transparent')};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ active }) => (active ? themeCssVariables.font.color.primary : themeCssVariables.font.color.tertiary)};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  font-size: 13px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${themeCssVariables.spacing[6]};
`;

// ─── Lista view ────────────��──────────────────────��──────────────────────────

const StyledGroup = styled.div`
  margin-bottom: ${themeCssVariables.spacing[6]};
`;

const StyledGroupTitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.06em;
  margin-bottom: ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledTask = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  margin-bottom: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledDot = styled.span<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
`;

const StyledTaskTitle = styled.span<{ done: boolean }>`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: 13px;
  text-decoration: ${({ done }) => (done ? 'line-through' : 'none')};
`;

const StyledDueDate = styled.span<{ isPast: boolean }>`
  color: ${({ isPast }) => (isPast ? themeCssVariables.font.color.danger : themeCssVariables.font.color.tertiary)};
  font-size: 12px;
  white-space: nowrap;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[12]} 0;
`;

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0,0,0,0);
  return c;
};

// ─── Calendar view ───────────────────────────────────────────────────────────

const StyledCalendar = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow: hidden;
`;

const StyledCalHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledCalMonth = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCalNav = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  padding: ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const StyledDayLabel = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
  text-transform: uppercase;
`;

const StyledCell = styled.div<{ isToday: boolean; isCurrentMonth: boolean }>`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  min-height: 72px;
  opacity: ${({ isCurrentMonth }) => (isCurrentMonth ? 1 : 0.4)};
  padding: ${themeCssVariables.spacing[1]};
  position: relative;
`;

const StyledCellDay = styled.div<{ isToday: boolean }>`
  align-items: center;
  background: ${({ isToday }) => (isToday ? '#7C3AED' : 'transparent')};
  border-radius: 50%;
  color: ${({ isToday }) => (isToday ? '#fff' : themeCssVariables.font.color.secondary)};
  display: inline-flex;
  font-size: 12px;
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 22px;
  justify-content: center;
  width: 22px;
`;

const StyledCalTask = styled.div<{ status: TaskStatus | null | undefined }>`
  background: ${({ status }) =>
    status === 'DONE' ? '#D1FAE5' :
    status === 'IN_PROGRESS' ? '#FEF3C7' :
    '#EEF2FF'};
  border-left: 2px solid ${({ status }) =>
    status === 'DONE' ? '#10B981' :
    status === 'IN_PROGRESS' ? '#F59E0B' :
    '#7C3AED'};
  border-radius: 2px;
  color: ${themeCssVariables.font.color.primary};
  font-size: 11px;
  margin-bottom: 2px;
  overflow: hidden;
  padding: 1px 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ─── Components ──────────────���───────────────────────────────────────────────

const ListView = ({ tasks }: { tasks: TaskRecord[] }) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const pending = tasks.filter(t => t.status !== 'DONE');

  const overdue = pending.filter(t => t.dueAt && new Date(t.dueAt) < todayStart && !isSameDay(new Date(t.dueAt), todayStart));
  const today = pending.filter(t => t.dueAt && isSameDay(new Date(t.dueAt), todayStart));
  const thisWeek = pending.filter(t => {
    if (!t.dueAt) return false;
    const d = new Date(t.dueAt);
    return d >= todayStart && d < weekEnd && !isSameDay(d, todayStart);
  });
  const future = pending.filter(t => {
    if (!t.dueAt) return true;
    const d = new Date(t.dueAt);
    return d >= weekEnd;
  });
  const done = tasks.filter(t => t.status === 'DONE').slice(0, 20);

  const renderGroup = (label: string, items: TaskRecord[], dotColor: string) => {
    if (items.length === 0) return null;
    return (
      <StyledGroup key={label}>
        <StyledGroupTitle>{label} ({items.length})</StyledGroupTitle>
        {items.map(task => (
          <StyledTask key={task.id}>
            <StyledDot color={dotColor} />
            <StyledTaskTitle done={task.status === 'DONE'}>
              {task.title ?? t`Sem título`}
            </StyledTaskTitle>
            {task.dueAt && (
              <StyledDueDate isPast={new Date(task.dueAt) < now && !isSameDay(new Date(task.dueAt), now)}>
                {formatDate(task.dueAt)}
              </StyledDueDate>
            )}
          </StyledTask>
        ))}
      </StyledGroup>
    );
  };

  if (tasks.length === 0) {
    return (
      <StyledEmpty>
        <IconListCheck size={40} />
        Nenhuma tarefa encontrada
      </StyledEmpty>
    );
  }

  return (
    <>
      {renderGroup('Atrasadas', overdue, '#F04438')}
      {renderGroup('Hoje', today, '#12B76A')}
      {renderGroup('Esta semana', thisWeek, '#F79009')}
      {renderGroup('Futuras / Sem prazo', future, '#7C3AED')}
      {renderGroup('Concluídas', done, '#9E9E9E')}
    </>
  );
};

const CalendarView = ({ tasks }: { tasks: TaskRecord[] }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today = new Date();

  const prevMonth = () => setViewDate(v => {
    if (v.month === 0) return { year: v.year - 1, month: 11 };
    return { year: v.year, month: v.month - 1 };
  });
  const nextMonth = () => setViewDate(v => {
    if (v.month === 11) return { year: v.year + 1, month: 0 };
    return { year: v.year, month: v.month + 1 };
  });

  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskRecord[]> = {};
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const d = new Date(task.dueAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const cells = useMemo(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1);
    const lastDay = new Date(viewDate.year, viewDate.month + 1, 0);
    const startOffset = firstDay.getDay();
    const result: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(-i);
      result.push({ date: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push({ date: new Date(viewDate.year, viewDate.month, d), isCurrentMonth: true });
    }
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      result.push({ date: new Date(viewDate.year, viewDate.month + 1, d), isCurrentMonth: false });
    }
    return result;
  }, [viewDate]);

  return (
    <StyledCalendar>
      <StyledCalHeader>
        <StyledCalNav onClick={prevMonth}>
          <IconChevronLeft size={16} />
        </StyledCalNav>
        <StyledCalMonth>
          {MONTHS_PT[viewDate.month]} {viewDate.year}
        </StyledCalMonth>
        <StyledCalNav onClick={nextMonth}>
          <IconChevronRight size={16} />
        </StyledCalNav>
      </StyledCalHeader>
      <StyledGrid>
        {DAYS_PT.map(d => <StyledDayLabel key={d}>{d}</StyledDayLabel>)}
        {cells.map(({ date, isCurrentMonth }, i) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const dayTasks = tasksByDay[key] ?? [];
          const isToday = isSameDay(date, today);
          return (
            <StyledCell key={i} isToday={isToday} isCurrentMonth={isCurrentMonth}>
              <StyledCellDay isToday={isToday}>{date.getDate()}</StyledCellDay>
              {dayTasks.slice(0, 3).map(task => (
                <StyledCalTask key={task.id} status={task.status}>
                  {task.title ?? 'Tarefa'}
                </StyledCalTask>
              ))}
              {dayTasks.length > 3 && (
                <div style={{ fontSize: 10, color: '#999', paddingLeft: 4 }}>
                  +{dayTasks.length - 3} mais
                </div>
              )}
            </StyledCell>
          );
        })}
      </StyledGrid>
    </StyledCalendar>
  );
};

// ─── Page ─────────────���─────────────────────────────────���────────────────────

export const TarefasPage = () => {
  const [view, setView] = useState<'lista' | 'calendario'>('lista');

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

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitle>{t`Tarefas`}</StyledTitle>
        <StyledViewToggle>
          <StyledTabBtn active={view === 'lista'} onClick={() => setView('lista')}>
            <IconListCheck size={14} />
            Lista
          </StyledTabBtn>
          <StyledTabBtn active={view === 'calendario'} onClick={() => setView('calendario')}>
            <IconCalendar size={14} />
            Calendário
          </StyledTabBtn>
        </StyledViewToggle>
        <Button
          title={t`Nova tarefa`}
          Icon={IconPlus}
          size="small"
          variant="primary"
          onClick={() => openCreateTask({ targetableObjects: [] })}
        />
      </StyledHeader>
      <StyledBody>
        {loading ? (
          <StyledEmpty>Carregando…</StyledEmpty>
        ) : view === 'lista' ? (
          <ListView tasks={tasks} />
        ) : (
          <CalendarView tasks={tasks} />
        )}
      </StyledBody>
    </StyledPage>
  );
};
