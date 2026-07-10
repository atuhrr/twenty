// FORK: Voka CRM — T-12: timeline de atividades (notas + tarefas) de um record
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';

type TargetField = 'targetOpportunityId' | 'targetPersonId' | 'targetCompanyId';

type NoteTarget = ObjectRecord & {
  note?: {
    id: string;
    title?: string | null;
    createdAt?: string | null;
  } | null;
};
type TaskTarget = ObjectRecord & {
  task?: {
    id: string;
    title?: string | null;
    status?: string | null;
    dueAt?: string | null;
    createdAt?: string | null;
  } | null;
};

type ItemTimeline = {
  id: string;
  tipo: 'nota' | 'tarefa' | 'evento';
  titulo: string;
  detalhe?: string;
  data: string;
};

type AbaTimeline = 'tudo' | 'notas' | 'tarefas' | 'atividade';

const ABAS: { key: AbaTimeline; label: string }[] = [
  { key: 'tudo', label: 'Tudo' },
  { key: 'notas', label: 'Notas' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'atividade', label: 'Atividade' },
];

const ICONE: Record<ItemTimeline['tipo'], string> = {
  nota: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  tarefa:
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  evento: 'M13 10V3L4 14h7v7l9-11h-7z',
};

const formatDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface RecordTimelineProps {
  targetField: TargetField;
  recordId: string;
  criadoEm?: string | null;
  rotuloCriacao: string;
}

export function RecordTimeline({
  targetField,
  recordId,
  criadoEm,
  rotuloCriacao,
}: RecordTimelineProps) {
  const [aba, setAba] = useState<AbaTimeline>('tudo');
  const [novaNota, setNovaNota] = useState('');
  const [modoComposer, setModoComposer] = useState<'nota' | 'tarefa'>('nota');
  const [novaTarefa, setNovaTarefa] = useState('');
  const [prazoTarefa, setPrazoTarefa] = useState('');
  const [salvando, setSalvando] = useState(false);

  const filtroTarget = { [targetField]: { eq: recordId } };

  const { records: noteTargets, refetch: refetchNotas } =
    useFindManyRecords<NoteTarget>({
      objectNameSingular: 'noteTarget',
      filter: filtroTarget,
      recordGqlFields: {
        id: true,
        note: { id: true, title: true, createdAt: true },
      },
      limit: 50,
    });

  const { records: taskTargets, refetch: refetchTarefas } =
    useFindManyRecords<TaskTarget>({
    objectNameSingular: 'taskTarget',
    filter: filtroTarget,
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
  });

  const { createOneRecord: criarNota } = useCreateOneRecord({
    objectNameSingular: 'note',
  });
  const { createOneRecord: criarNoteTarget } = useCreateOneRecord({
    objectNameSingular: 'noteTarget',
  });
  // FORK: Zellate — criação de tarefa vinculada direto na timeline do registro
  const { createOneRecord: criarTarefa } = useCreateOneRecord({
    objectNameSingular: 'task',
  });
  const { createOneRecord: criarTaskTarget } = useCreateOneRecord({
    objectNameSingular: 'taskTarget',
  });

  const salvarNota = async () => {
    const titulo = novaNota.trim();
    if (titulo === '') return;
    setSalvando(true);
    try {
      const noteId = uuidv4();
      await criarNota({ id: noteId, title: titulo });
      await criarNoteTarget({ noteId, [targetField]: recordId });
      setNovaNota('');
      await refetchNotas();
    } finally {
      setSalvando(false);
    }
  };

  const salvarTarefa = async () => {
    const titulo = novaTarefa.trim();
    if (titulo === '') return;
    setSalvando(true);
    try {
      const taskId = uuidv4();
      await criarTarefa({
        id: taskId,
        title: titulo,
        status: 'TODO',
        ...(prazoTarefa ? { dueAt: new Date(prazoTarefa).toISOString() } : {}),
      });
      await criarTaskTarget({ taskId, [targetField]: recordId });
      setNovaTarefa('');
      setPrazoTarefa('');
      await refetchTarefas();
    } finally {
      setSalvando(false);
    }
  };

  const itens = useMemo<ItemTimeline[]>(() => {
    const lista: ItemTimeline[] = [];
    for (const nt of noteTargets) {
      if (nt.note == null) continue;
      lista.push({
        id: `nota-${nt.note.id}`,
        tipo: 'nota',
        titulo: nt.note.title ?? '(sem título)',
        data: nt.note.createdAt ?? '',
      });
    }
    for (const tt of taskTargets) {
      if (tt.task == null) continue;
      lista.push({
        id: `tarefa-${tt.task.id}`,
        tipo: 'tarefa',
        titulo: tt.task.title ?? '(sem título)',
        detalhe:
          typeof tt.task.dueAt === 'string' && tt.task.dueAt !== ''
            ? `Prazo: ${new Date(tt.task.dueAt).toLocaleDateString('pt-BR')}`
            : undefined,
        data: tt.task.createdAt ?? '',
      });
    }
    if (typeof criadoEm === 'string' && criadoEm !== '') {
      lista.push({
        id: 'evento-criacao',
        tipo: 'evento',
        titulo: rotuloCriacao,
        data: criadoEm,
      });
    }
    return lista.sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [noteTargets, taskTargets, criadoEm, rotuloCriacao]);

  const visiveis = itens.filter((i) => {
    if (aba === 'notas') return i.tipo === 'nota';
    if (aba === 'tarefas') return i.tipo === 'tarefa';
    if (aba === 'atividade') return i.tipo === 'evento';
    return true;
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
      {/* Composer: nota ou tarefa vinculada ao registro */}
      <div className="mb-4">
        <div className="flex gap-1.5 mb-2">
          {(['nota', 'tarefa'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModoComposer(m)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                modoComposer === m
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {m === 'nota' ? '+ Nota' : '+ Tarefa'}
            </button>
          ))}
        </div>

        {modoComposer === 'nota' ? (
          <>
            <textarea
              value={novaNota}
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Escreva uma nota..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={salvarNota}
                disabled={salvando || novaNota.trim() === ''}
                className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando…' : 'Salvar nota'}
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              value={novaTarefa}
              onChange={(e) => setNovaTarefa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void salvarTarefa()}
              placeholder="Título da tarefa..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <input
                type="date"
                value={prazoTarefa}
                onChange={(e) => setPrazoTarefa(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
              <button
                onClick={() => void salvarTarefa()}
                disabled={salvando || novaTarefa.trim() === ''}
                className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Criando…' : 'Criar tarefa'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1.5 mb-4">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              aba === key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Itens */}
      {visiveis.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhuma atividade ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={ICONE[item.tipo]}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {item.titulo}
                </p>
                {item.detalhe !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.detalhe}
                  </p>
                )}
                {item.data !== '' && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDataHora(item.data)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
