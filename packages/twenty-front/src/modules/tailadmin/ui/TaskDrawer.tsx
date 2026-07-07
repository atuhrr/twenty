// FORK: Voka CRM — T-6: TaskDrawer (slide-in para editar tarefa)
import { useState, useEffect } from 'react';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import type { TaskRecord } from '~/pages/tarefas/TarefasPage';

interface TaskDrawerProps {
  task: TaskRecord | null;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'A fazer' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluída' },
] as const;

export const TaskDrawer = ({ task, onClose }: TaskDrawerProps) => {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState('TODO');
  const [saving, setSaving] = useState(false);

  const { updateOneRecord } = useUpdateOneRecord();

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? '');
      setDueAt(task.dueAt ? task.dueAt.split('T')[0] : '');
      setStatus(task.status ?? 'TODO');
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Task,
        idToUpdate: task.id,
        updateOneRecordInput: {
          title: title.trim() || task.title,
          dueAt: dueAt ? new Date(dueAt + 'T12:00:00').toISOString() : null,
          status,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isOpen = task !== null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Editar Tarefa"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Editar Tarefa
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Nome da tarefa"
              autoFocus
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Prazo
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Responsável — somente leitura */}
          {task?.assignee && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Responsável
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {`${task.assignee.name.firstName[0] ?? ''}${task.assignee.name.lastName[0] ?? ''}`.toUpperCase()}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {task.assignee.name.firstName} {task.assignee.name.lastName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
};
