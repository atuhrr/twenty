// FORK: Voka CRM — T-8: Automações (grid de cards + modal, TailAdmin)
import { useMemo, useState } from 'react';

import {
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useUpdateAutomationRule,
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
} from '@/automation/hooks/useAutomation';
import Switch from '@/tailadmin/form/Switch';
import { Modal } from '@/tailadmin/ui/Modal';

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead criado',
  STAGE_CHANGED: 'Etapa alterada',
  MESSAGE_RECEIVED: 'Mensagem recebida (WhatsApp)',
  LEAD_UNCLASSIFIED: 'Lead não classificado',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_TASK: 'Criar tarefa',
  SEND_TEMPLATE: 'Enviar template WhatsApp',
  MOVE_STAGE: 'Mover etapa',
  ASSIGN_USER: 'Atribuir usuário',
  WEBHOOK: 'Chamar webhook',
};

const OPERATOR_LABELS: Record<AutomationCondition['operator'], string> = {
  eq: 'é igual a',
  neq: 'é diferente de',
  contains: 'contém',
  notContains: 'não contém',
  exists: 'existe',
};

const formatData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

// ─── Modal de edição ──────────────────────────────────────────────────────────

type AbaModal = 'trigger' | 'condicoes' | 'acoes';

type FormState = {
  name: string;
  triggerType: string;
  toStage: string;
  fromStage: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

const formVazio = (): FormState => ({
  name: '',
  triggerType: 'LEAD_CREATED',
  toStage: '',
  fromStage: '',
  conditions: [],
  actions: [{ type: 'CREATE_TASK', config: {} }],
});

const formDaRegra = (regra: AutomationRule): FormState => ({
  name: regra.name,
  triggerType: regra.triggerType,
  toStage: String(regra.triggerConfig?.['toStage'] ?? ''),
  fromStage: String(regra.triggerConfig?.['fromStage'] ?? ''),
  conditions: regra.conditions ?? [],
  actions:
    regra.actions?.length > 0
      ? regra.actions
      : [{ type: 'CREATE_TASK', config: {} }],
});

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

interface EditorModalProps {
  regra: AutomationRule | null;
  onClose: () => void;
  onSave: (form: FormState, id: string | null) => Promise<void>;
  salvando: boolean;
}

// Montado apenas enquanto aberto (key/conditional no pai), então o estado
// inicial do form pode derivar direto das props.
function EditorModal({ regra, onClose, onSave, salvando }: EditorModalProps) {
  const [aba, setAba] = useState<AbaModal>('trigger');
  const [form, setForm] = useState<FormState>(() =>
    regra ? formDaRegra(regra) : formVazio(),
  );

  const setCondicao = (i: number, patch: Partial<AutomationCondition>) =>
    setForm((f) => ({
      ...f,
      conditions: f.conditions.map((c, j) =>
        j === i ? { ...c, ...patch } : c,
      ),
    }));

  const setAcao = (i: number, patch: Partial<AutomationAction>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)),
    }));

  const setAcaoConfig = (i: number, chave: string, valor: string) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, j) =>
        j === i ? { ...a, config: { ...a.config, [chave]: valor } } : a,
      ),
    }));

  const configCampo: Record<string, { chave: string; rotulo: string }> = {
    CREATE_TASK: { chave: 'title', rotulo: 'Título da tarefa' },
    SEND_TEMPLATE: { chave: 'templateName', rotulo: 'Nome do template' },
    MOVE_STAGE: { chave: 'stage', rotulo: 'Etapa de destino' },
    ASSIGN_USER: { chave: 'userId', rotulo: 'ID do usuário' },
    WEBHOOK: { chave: 'url', rotulo: 'URL do webhook' },
  };

  const abas: { key: AbaModal; label: string }[] = [
    { key: 'trigger', label: 'Trigger' },
    { key: 'condicoes', label: 'Condições' },
    { key: 'acoes', label: 'Ações' },
  ];

  return (
    <Modal isOpen onClose={onClose} className="max-w-[560px] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {regra ? 'Editar Automação' : 'Nova Automação'}
      </h2>

      {/* Nome */}
      <div className="mb-4">
        <label className={labelClass}>Nome</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex.: Boas-vindas para novo lead"
          className={inputClass}
        />
      </div>

      {/* Abas */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 w-fit">
        {abas.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              aba === key
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-[220px]">
        {/* Aba Trigger */}
        {aba === 'trigger' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Quando isto acontecer</label>
              <select
                value={form.triggerType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, triggerType: e.target.value }))
                }
                className={inputClass}
              >
                {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {form.triggerType === 'STAGE_CHANGED' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Da etapa (opcional)</label>
                  <input
                    type="text"
                    value={form.fromStage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fromStage: e.target.value }))
                    }
                    placeholder="Ex.: NEW"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Para a etapa (opcional)</label>
                  <input
                    type="text"
                    value={form.toStage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, toStage: e.target.value }))
                    }
                    placeholder="Ex.: PROPOSAL"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba Condições */}
        {aba === 'condicoes' && (
          <div className="space-y-3">
            {form.conditions.length === 0 && (
              <p className="text-sm text-gray-400">
                Sem condições — a automação executa para todos os registros do
                trigger.
              </p>
            )}
            {form.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c.field}
                  onChange={(e) => setCondicao(i, { field: e.target.value })}
                  placeholder="Campo"
                  className={`${inputClass} flex-1`}
                />
                <select
                  value={c.operator}
                  onChange={(e) =>
                    setCondicao(i, {
                      operator: e.target
                        .value as AutomationCondition['operator'],
                    })
                  }
                  className={`${inputClass} w-40`}
                >
                  {Object.entries(OPERATOR_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {c.operator !== 'exists' && (
                  <input
                    type="text"
                    value={String(c.value ?? '')}
                    onChange={(e) => setCondicao(i, { value: e.target.value })}
                    placeholder="Valor"
                    className={`${inputClass} flex-1`}
                  />
                )}
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      conditions: f.conditions.filter((_, j) => j !== i),
                    }))
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 transition-colors flex-shrink-0"
                  aria-label="Remover condição"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  conditions: [
                    ...f.conditions,
                    { field: '', operator: 'eq', value: '' },
                  ],
                }))
              }
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              + Adicionar condição
            </button>
          </div>
        )}

        {/* Aba Ações */}
        {aba === 'acoes' && (
          <div className="space-y-3">
            {form.actions.map((a, i) => {
              const cfg = configCampo[a.type];
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={a.type}
                    onChange={(e) =>
                      setAcao(i, {
                        type: e.target.value as AutomationAction['type'],
                        config: {},
                      })
                    }
                    className={`${inputClass} w-56`}
                  >
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={String(a.config?.[cfg.chave] ?? '')}
                    onChange={(e) =>
                      setAcaoConfig(i, cfg.chave, e.target.value)
                    }
                    placeholder={cfg.rotulo}
                    className={`${inputClass} flex-1`}
                  />
                  {form.actions.length > 1 && (
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          actions: f.actions.filter((_, j) => j !== i),
                        }))
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 transition-colors flex-shrink-0"
                      aria-label="Remover ação"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  actions: [...f.actions, { type: 'CREATE_TASK', config: {} }],
                }))
              }
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              + Adicionar ação
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(form, regra?.id ?? null)}
          disabled={salvando || form.name.trim() === ''}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type FiltroStatus = 'todas' | 'ativas' | 'inativas';

export function AutomacoesPage() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [regraEmEdicao, setRegraEmEdicao] = useState<AutomationRule | null>(
    null,
  );

  const { rules, loading, refetch } = useAutomationRules();
  const { create, loading: criando } = useCreateAutomationRule();
  const { update, loading: atualizando } = useUpdateAutomationRule();
  const { remove } = useDeleteAutomationRule();

  const regrasFiltradas = useMemo(() => {
    let resultado = rules;
    if (filtro === 'ativas') resultado = resultado.filter((r) => r.enabled);
    if (filtro === 'inativas') resultado = resultado.filter((r) => !r.enabled);
    const q = busca.trim().toLowerCase();
    if (q !== '')
      resultado = resultado.filter((r) => r.name.toLowerCase().includes(q));
    return resultado;
  }, [rules, filtro, busca]);

  const abrirNova = () => {
    setRegraEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (regra: AutomationRule) => {
    setRegraEmEdicao(regra);
    setModalAberto(true);
  };

  const salvar = async (form: FormState, id: string | null) => {
    const triggerConfig: Record<string, unknown> = {};
    if (form.triggerType === 'STAGE_CHANGED') {
      if (form.toStage !== '') triggerConfig['toStage'] = form.toStage;
      if (form.fromStage !== '') triggerConfig['fromStage'] = form.fromStage;
    }
    const input = {
      name: form.name.trim(),
      triggerType: form.triggerType,
      triggerConfig,
      conditions: form.conditions.filter((c) => c.field !== ''),
      actions: form.actions,
    };
    if (id === null) {
      await create({ variables: { input } });
    } else {
      await update({ variables: { input: { id, ...input } } });
    }
    setModalAberto(false);
    await refetch();
  };

  const alternar = async (regra: AutomationRule, enabled: boolean) => {
    await update({ variables: { input: { id: regra.id, enabled } } });
  };

  const duplicar = async (regra: AutomationRule) => {
    await create({
      variables: {
        input: {
          name: `${regra.name} (cópia)`,
          triggerType: regra.triggerType,
          triggerConfig: regra.triggerConfig ?? {},
          conditions: regra.conditions ?? [],
          actions: regra.actions ?? [],
        },
      },
    });
    await refetch();
  };

  const excluir = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  const filtros: { key: FiltroStatus; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'ativas', label: 'Ativas' },
    { key: 'inativas', label: 'Inativas' },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Automações
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({rules.length})
              </span>
            )}
          </h1>

          <div className="flex items-center gap-1.5">
            {filtros.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filtro === key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar automação..."
            className="w-52 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <div className="flex-1" />

          <button
            onClick={abrirNova}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            + Nova Automação
          </button>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-48 animate-pulse"
              />
            ))}
          </div>
        ) : regrasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
            Nenhuma automação encontrada. Clique em "+ Nova Automação" para
            criar a primeira.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {regrasFiltradas.map((regra) => (
              <div
                key={regra.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col"
              >
                {/* Header: nome + toggle */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-brand-50 dark:bg-brand-500/[0.12] rounded-xl flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-brand-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {regra.name}
                    </h3>
                  </div>
                  <Switch
                    checked={regra.enabled}
                    onChange={(v) => alternar(regra, v)}
                    id={`toggle-${regra.id}`}
                  />
                </div>

                {/* Chips trigger → ações */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400">
                    {TRIGGER_LABELS[regra.triggerType] ?? regra.triggerType}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  {(regra.actions ?? []).map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {ACTION_LABELS[a.type] ?? a.type}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <p className="text-xs text-gray-400 mb-4">
                  Criada em {formatData(regra.createdAt)} · Atualizada em{' '}
                  {formatData(regra.updatedAt)}
                </p>

                <div className="flex-1" />

                {/* Footer */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => abrirEdicao(regra)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => duplicar(regra)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Duplicar
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => excluir(regra.id)}
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

      {modalAberto && (
        <EditorModal
          key={regraEmEdicao?.id ?? 'nova'}
          regra={regraEmEdicao}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
          salvando={criando || atualizando}
        />
      )}
    </div>
  );
}
