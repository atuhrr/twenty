// FORK: Voka CRM — T-9: Web Forms (lista + builder, TailAdmin)
import { useState } from 'react';

import Switch from '@/tailadmin/form/Switch';
import { DataTable, type DataTableColumn } from '@/tailadmin/ui/DataTable';
import { Modal } from '@/tailadmin/ui/Modal';
import {
  newField,
  useCreateWebForm,
  useDeleteWebForm,
  useUpdateWebForm,
  useWebForms,
  type WebForm,
  type WebFormField,
  type WebFormFieldType,
} from '@/web-form/hooks/useWebForm';

const TIPOS_CAMPO: { type: WebFormFieldType; label: string }[] = [
  { type: 'text', label: 'Texto' },
  { type: 'email', label: 'E-mail' },
  { type: 'phone', label: 'Telefone' },
  { type: 'select', label: 'Seleção' },
  { type: 'textarea', label: 'Texto longo' },
];

const TIPO_LABEL: Record<WebFormFieldType, string> = {
  text: 'Texto',
  email: 'E-mail',
  phone: 'Telefone',
  select: 'Seleção',
  textarea: 'Texto longo',
};

const formatData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

// ─── Builder ──────────────────────────────────────────────────────────────────

interface FormBuilderProps {
  form: WebForm | null;
  onClose: () => void;
  onSave: (
    nome: string,
    fields: WebFormField[],
    id: string | null,
  ) => Promise<void>;
  salvando: boolean;
}

// Montado apenas enquanto aberto (key no pai) — estado inicial deriva das props.
function FormBuilder({ form, onClose, onSave, salvando }: FormBuilderProps) {
  const [nome, setNome] = useState(form?.name ?? '');
  const [fields, setFields] = useState<WebFormField[]>(form?.fields ?? []);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const campo = fields.find((f) => f.id === selecionado) ?? null;

  const addCampo = (type: WebFormFieldType) => {
    const f = { ...newField(type), label: TIPO_LABEL[type] };
    setFields((arr) => [...arr, f]);
    setSelecionado(f.id);
  };

  const patchCampo = (id: string, patch: Partial<WebFormField>) =>
    setFields((arr) => arr.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const mover = (id: string, delta: number) =>
    setFields((arr) => {
      const i = arr.findIndex((f) => f.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= arr.length) return arr;
      const copia = [...arr];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  const copiarLink = async () => {
    if (form === null) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/forms/${form.publicToken}`,
    );
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-[1080px] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pr-10">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do formulário"
          className={`${inputClass} max-w-[320px] font-semibold`}
        />
        {form !== null && (
          <button
            onClick={copiarLink}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {linkCopiado ? 'Link copiado ✓' : 'Copiar link'}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(nome, fields, form?.id ?? null)}
          disabled={salvando || nome.trim() === '' || fields.length === 0}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Salvando…' : 'Publicar'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 min-h-[420px]">
        {/* Painel esquerdo — campos disponíveis */}
        <div className="col-span-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className={labelClass}>Adicionar campo</p>
          <div className="space-y-1.5">
            {TIPOS_CAMPO.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addCampo(type)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                + {label}
              </button>
            ))}
          </div>
        </div>

        {/* Centro — preview */}
        <div className="col-span-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 overflow-y-auto">
          <p className={labelClass}>Pré-visualização</p>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">
              Adicione campos pelo painel à esquerda
            </p>
          ) : (
            <div className="space-y-3 max-w-[380px] mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              {fields.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelecionado(f.id)}
                  className={`rounded-lg p-2 -m-2 cursor-pointer transition-colors ${
                    selecionado === f.id
                      ? 'ring-2 ring-brand-500 bg-brand-50/50 dark:bg-brand-500/[0.08]'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {f.label === '' ? '(sem rótulo)' : f.label}
                    {f.required === true && (
                      <span className="text-error-500"> *</span>
                    )}
                  </span>
                  {f.type === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={f.placeholder}
                      rows={2}
                      className={`${inputClass} pointer-events-none`}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      disabled
                      className={`${inputClass} pointer-events-none`}
                    >
                      {(f.options ?? ['Opção 1']).map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      disabled
                      type="text"
                      placeholder={f.placeholder}
                      className={`${inputClass} pointer-events-none`}
                    />
                  )}
                </div>
              ))}
              <button
                disabled
                className="w-full px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg opacity-80"
              >
                Enviar
              </button>
            </div>
          )}
        </div>

        {/* Painel direito — propriedades */}
        <div className="col-span-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className={labelClass}>Propriedades</p>
          {campo === null ? (
            <p className="text-sm text-gray-400">
              Selecione um campo no preview
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Tipo:{' '}
                <span className="font-medium">{TIPO_LABEL[campo.type]}</span>
              </p>
              <div>
                <label className={labelClass}>Rótulo</label>
                <input
                  type="text"
                  value={campo.label}
                  onChange={(e) =>
                    patchCampo(campo.id, { label: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Placeholder</label>
                <input
                  type="text"
                  value={campo.placeholder ?? ''}
                  onChange={(e) =>
                    patchCampo(campo.id, { placeholder: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              {campo.type === 'select' && (
                <div>
                  <label className={labelClass}>Opções (uma por linha)</label>
                  <textarea
                    value={(campo.options ?? []).join('\n')}
                    onChange={(e) =>
                      patchCampo(campo.id, {
                        options: e.target.value
                          .split('\n')
                          .filter((o) => o.trim() !== ''),
                      })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </div>
              )}
              <Switch
                checked={campo.required === true}
                onChange={(v) => patchCampo(campo.id, { required: v })}
                label="Obrigatório"
                id={`req-${campo.id}`}
              />
              <div className="flex items-center gap-1.5 pt-2">
                <button
                  onClick={() => mover(campo.id, -1)}
                  className="px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ↑
                </button>
                <button
                  onClick={() => mover(campo.id, 1)}
                  className="px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ↓
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setFields((arr) => arr.filter((f) => f.id !== campo.id));
                    setSelecionado(null);
                  }}
                  className="px-2.5 py-1 text-sm text-error-500 rounded-lg hover:bg-error-50 dark:hover:bg-error-500/[0.12]"
                >
                  Remover
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const WebFormsPage = () => {
  const [builderAberto, setBuilderAberto] = useState(false);
  const [formEmEdicao, setFormEmEdicao] = useState<WebForm | null>(null);

  const { forms, loading, refetch } = useWebForms();
  const { create, loading: criando } = useCreateWebForm();
  const { update, loading: atualizando } = useUpdateWebForm();
  const { remove } = useDeleteWebForm();

  const salvar = async (
    nome: string,
    fields: WebFormField[],
    id: string | null,
  ) => {
    const input = { name: nome.trim(), fields };
    if (id === null) await create({ variables: { input } });
    else await update({ variables: { input: { id, ...input } } });
    setBuilderAberto(false);
    await refetch();
  };

  const alternar = async (f: WebForm, enabled: boolean) => {
    await update({ variables: { input: { id: f.id, enabled } } });
    await refetch();
  };

  const excluir = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  const colunas: DataTableColumn<WebForm>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (f) => (
        <button
          onClick={() => {
            setFormEmEdicao(f);
            setBuilderAberto(true);
          }}
          className="font-medium text-gray-800 dark:text-white/90 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          {f.name}
        </button>
      ),
    },
    {
      key: 'campos',
      header: 'Campos',
      render: (f) => (
        <span className="text-gray-500 dark:text-gray-400">
          {f.fields.length}
        </span>
      ),
    },
    {
      key: 'link',
      header: 'Link público',
      render: (f) => (
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              `${window.location.origin}/forms/${f.publicToken}`,
            )
          }
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
        >
          Copiar link
        </button>
      ),
    },
    {
      key: 'ativo',
      header: 'Ativo',
      render: (f) => (
        <Switch
          checked={f.enabled}
          onChange={(v) => alternar(f, v)}
          id={`wf-${f.id}`}
        />
      ),
    },
    {
      key: 'criado',
      header: 'Criado em',
      render: (f) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatData(f.createdAt)}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: '',
      render: (f) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => {
              setFormEmEdicao(f);
              setBuilderAberto(true);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => excluir(f.id)}
            className="px-3 py-1 text-xs font-medium text-error-500 border border-error-500/30 rounded-lg hover:bg-error-50 dark:hover:bg-error-500/[0.12] transition-colors"
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Formulários
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({forms.length})
              </span>
            )}
          </h1>
          <div className="flex-1" />
          <button
            onClick={() => {
              setFormEmEdicao(null);
              setBuilderAberto(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            + Novo Formulário
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <DataTable
            columns={colunas}
            data={forms}
            loading={loading}
            emptyMessage='Nenhum formulário criado. Clique em "+ Novo Formulário" para começar.'
          />
        </div>
      </div>

      {builderAberto && (
        <FormBuilder
          key={formEmEdicao?.id ?? 'novo'}
          form={formEmEdicao}
          onClose={() => setBuilderAberto(false)}
          onSave={salvar}
          salvando={criando || atualizando}
        />
      )}
    </div>
  );
};
