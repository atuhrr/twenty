// FORK: Voka CRM — Fase 3: pontinho de tarefa no card Kanban
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';

export type TaskDotStatus = 'overdue' | 'today' | 'none';

type TaskRecord = ObjectRecord & {
  status?: string | null;
  dueAt?: string | null;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const useNextTaskStatus = (opportunityId: string): TaskDotStatus => {
  const { records } = useFindManyRecords<TaskRecord>({
    objectNameSingular: 'task',
    filter: {
      taskTargets: {
        some: {
          opportunityId: { eq: opportunityId },
        },
      },
      status: { neq: 'DONE' },
    } as Record<string, unknown>,
    recordGqlFields: { id: true, status: true, dueAt: true },
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: 1,
    fetchPolicy: 'cache-first',
    skip: !opportunityId,
  });

  if (records.length === 0) return 'none';

  const task = records[0];
  const rawDueAt = task.dueAt;

  if (!rawDueAt) return 'none';

  const dueDate = new Date(rawDueAt);
  const today = new Date();

  if (dueDate < today && !isSameDay(dueDate, today)) return 'overdue';
  if (isSameDay(dueDate, today)) return 'today';
  return 'none';
};
