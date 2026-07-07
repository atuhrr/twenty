import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import Badge from '@/tailadmin/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/tailadmin/ui/Table';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

const STATUS_MAP: Record<TaskStatus, { label: string; color: 'light' | 'primary' | 'success' | 'error' }> = {
  TODO:        { label: 'A fazer',       color: 'light' },
  IN_PROGRESS: { label: 'Em andamento',  color: 'primary' },
  DONE:        { label: 'Concluída',     color: 'success' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function isOverdue(iso: string) {
  return new Date(iso) < new Date();
}

export function VokaTarefasHoje() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { records: tasks, loading } = useFindManyRecords({
    objectNameSingular: 'task',
    filter: {
      and: [
        { dueAt: { gte: startOfDay } },
        { dueAt: { lt: endOfDay } },
        { status: { neq: 'DONE' } },
      ],
    },
    limit: 10,
    skip: false,
  } as any);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Tarefas de Hoje
        </h3>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 items-center py-2">
              <div className="flex-1 h-3 bg-gray-200 rounded dark:bg-gray-700" />
              <div className="h-5 w-20 bg-gray-200 rounded-full dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : (tasks as any[])?.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">Nenhuma tarefa para hoje. 🎉</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tarefa</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prazo</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(tasks as any[]).map((task: any) => {
                const status = STATUS_MAP[task.status as TaskStatus] ?? STATUS_MAP.TODO;
                const overdue = task.dueAt && isOverdue(task.dueAt) && task.status !== 'DONE';
                return (
                  <TableRow key={task.id}>
                    <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90 max-w-[220px] truncate">
                      {task.title ?? '—'}
                    </TableCell>
                    <TableCell className={`py-3 text-theme-xs ${overdue ? 'text-error-500 font-medium' : 'text-gray-400'}`}>
                      {task.dueAt ? formatDate(task.dueAt) : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={overdue ? 'error' : status.color}>
                        {overdue ? 'Atrasada' : status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
