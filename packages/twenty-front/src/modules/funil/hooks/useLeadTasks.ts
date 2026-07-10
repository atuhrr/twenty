// FORK: Zellate — tarefas vinculadas a um lead (opportunity), com criação
// inline. Usado no painel do Inbox e reaproveitável nas páginas de detalhe.
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

export type LeadTask = {
  id: string;
  task: {
    id: string;
    title: string;
    status: string | null;
    dueAt: string | null;
    createdAt: string;
  } | null;
};

export const useLeadTasks = (opportunityId: string | null) => {
  const [creating, setCreating] = useState(false);

  const { records: taskTargets, refetch } = useFindManyRecords<LeadTask>({
    objectNameSingular: 'taskTarget',
    filter: { targetOpportunityId: { eq: opportunityId ?? '' } },
    recordGqlFields: {
      id: true,
      task: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        createdAt: true,
      },
    },
    limit: 50,
    skip: !opportunityId,
  });

  const { createOneRecord: createTaskRecord } = useCreateOneRecord({
    objectNameSingular: 'task',
  });
  const { createOneRecord: createTaskTarget } = useCreateOneRecord({
    objectNameSingular: 'taskTarget',
  });
  const { updateOneRecord } = useUpdateOneRecord();

  const createTask = useCallback(
    async (title: string, dueAt: string | null) => {
      if (!opportunityId || title.trim() === '') return;
      setCreating(true);
      try {
        const taskId = uuidv4();
        await createTaskRecord({
          id: taskId,
          title: title.trim(),
          status: 'TODO',
          ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
        });
        await createTaskTarget({
          taskId,
          targetOpportunityId: opportunityId,
        });
        await refetch();
      } finally {
        setCreating(false);
      }
    },
    [opportunityId, createTaskRecord, createTaskTarget, refetch],
  );

  const toggleTaskDone = useCallback(
    async (taskId: string, currentStatus: string | null) => {
      await updateOneRecord({
        objectNameSingular: 'task',
        idToUpdate: taskId,
        updateOneRecordInput: {
          status: currentStatus === 'CONCLUIDO' ? 'TODO' : 'CONCLUIDO',
        },
      });
      await refetch();
    },
    [updateOneRecord, refetch],
  );

  const tasks = taskTargets
    .filter((tt) => tt.task != null)
    .sort((a, b) =>
      (a.task?.dueAt ?? '9999').localeCompare(b.task?.dueAt ?? '9999'),
    );

  return { tasks, createTask, toggleTaskDone, creating };
};
