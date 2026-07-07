// FORK: Voka CRM — T-9: Templates de mensagem (grid + modal com preview, TailAdmin)
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Badge from '@/tailadmin/ui/Badge';
import { Modal } from '@/tailadmin/ui/Modal';
import {
  CANAL_LABELS,
  TIPO_LABELS,
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
  VARIAVEIS_DISPONIVEIS,
  type CRMTemplate,
  type TemplateTipo,
} from '@/templates/hooks/useTemplates';

const TIPO_BADGE: Record<TemplateTipo, 'success' | 'primary' | 'info'> = {
  whatsapp_hsm: 'success',
  geral: 'primary',
  email: 'info',
};

const extrairVariaveis = (corpo: string): string[] => [
  ...new Set(corpo.match(/\{\{[^}]+\}\}/g) ?? []),
];

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

// ─── Modal criar/editar ───────────────────────────────────────────────────────

interface TemplateModalProps {
  template: CRMTemplate | null;
  onClose: () => void;
  onSave: (input: {
    nome: string;
    tipo: TemplateTipo;
    canal: string;
    assunto: string | null;
    corpo: string;
  }) => Promise<void>;
  salvando: boolean;
}

function TemplateModal({
  template,
  onClose,
  onSave,
  salvando,
}: TemplateModalProps) {
  const [nome, setNome] = useState(template?.nome ?? '');
  const [tipo, setTipo] = useState<TemplateTipo>(
    template?.tipo ?? 'whatsapp_hsm',
  );
  const [canal, setCanal] = useState(template?.canal ?? 'WHATSAPP');
  const [assunto, setAssunto] = useState(template?.assunto ?? '');
  const [corpo, setCorpo] = useState(template?.corpo ?? '');

  const inserirVariavel = (token: string) => setCorpo((c) => `${c}${token}`);

  const previewCorpo = useMemo(() => {
    let texto = corpo;
    for (const v of VARIAVEIS_DISPONIVEIS) {
      texto = texto.replaceAll(v.token, `〈${v.label}〉`);
    }
    return texto;
  }, [corpo]);

  return (
    <Modal isOpen onClose={onClose} className="max-w-[860px] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {template ? 'Editar Template' : 'Novo Template'}
      </h2>

      <div className="grid grid-cols-12 gap-5">
        {/* Formulário */}
        <div className="col-span-7 space-y-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Boas-vindas"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TemplateTipo)}
                className={inputClass}
              >
                {Object.entries(TIPO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Canal</label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className={inputClass}
              >
                {Object.entries(CANAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {tipo === 'email' && (
            <div>
              <label className={labelClass}>Assunto</label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Corpo da mensagem</label>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={6}
              placeholder="Olá {{contact.name}}, tudo bem?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Inserir variável</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {VARIAVEIS_DISPONIVEIS.map((v) => (
                <button
                  key={v.token}
                  onClick={() => inserirVariavel(v.token)}
                  title={v.token}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/[0.12] dark:text-brand-400 transition-colors"
                >
                  + {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="col-span-5">
          <label className={labelClass}>Pré-visualização</label>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 min-h-[280px]">
            {tipo === 'email' && assunto !== '' && (
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                {assunto}
              </p>
            )}
            <div className="max-w-[260px] rounded-xl rounded-tl-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2 shadow-theme-xs">
              <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                {previewCorpo === ''
                  ? 'Digite o corpo da mensagem…'
                  : previewCorpo}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onSave({
              nome: nome.trim(),
              tipo,
              canal,
              assunto: assunto.trim() === '' ? null : assunto.trim(),
              corpo,
            })
          }
          disabled={salvando || nome.trim() === '' || corpo.trim() === ''}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const TemplatesPage = () => {
  const [busca, setBusca] = useState('');
  const [tipoAtivo, setTipoAtivo] = useState<TemplateTipo | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [templateEmEdicao, setTemplateEmEdicao] = useState<CRMTemplate | null>(
    null,
  );

  const { templates, loading, refetch } = useTemplates();
  const { create, loading: criando } = useCreateTemplate();
  const { update, loading: atualizando } = useUpdateTemplate();
  const { remove } = useDeleteTemplate();

  const visiveis = useMemo(() => {
    let lista = templates;
    if (tipoAtivo !== null) lista = lista.filter((t) => t.tipo === tipoAtivo);
    const q = busca.trim().toLowerCase();
    if (q !== '') lista = lista.filter((t) => t.nome.toLowerCase().includes(q));
    return lista;
  }, [templates, tipoAtivo, busca]);

  const salvar = async (input: {
    nome: string;
    tipo: TemplateTipo;
    canal: string;
    assunto: string | null;
    corpo: string;
  }) => {
    if (templateEmEdicao === null) await create({ variables: { input } });
    else
      await update({
        variables: { input: { id: templateEmEdicao.id, ...input } },
      });
    setModalAberto(false);
    await refetch();
  };

  const excluir = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  const tiposFiltro: { key: TemplateTipo | null; label: string }[] = [
    { key: null, label: 'Todos' },
    { key: 'whatsapp_hsm', label: 'WhatsApp HSM' },
    { key: 'geral', label: 'Geral' },
    { key: 'email', label: 'E-mail' },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Templates
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({templates.length})
              </span>
            )}
          </h1>

          <div className="flex items-center gap-1.5">
            {tiposFiltro.map(({ key, label }) => (
              <button
                key={label}
                onClick={() => setTipoAtivo(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  tipoAtivo === key
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
            placeholder="Buscar template..."
            className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <div className="flex-1" />

          <button
            onClick={() => {
              setTemplateEmEdicao(null);
              setModalAberto(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            + Novo Template
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-52 animate-pulse"
              />
            ))}
          </div>
        ) : visiveis.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
            Nenhum template encontrado. Clique em "+ Novo Template" para criar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visiveis.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {t.nome}
                  </h3>
                  <Badge color={TIPO_BADGE[t.tipo]} size="sm">
                    {TIPO_LABELS[t.tipo]}
                  </Badge>
                </div>

                {t.canal !== null && (
                  <span className="w-fit px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 mb-2">
                    {CANAL_LABELS[t.canal] ?? t.canal}
                  </span>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                  {t.corpo}
                </p>

                {/* Variáveis usadas */}
                {extrairVariaveis(t.corpo).length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    {extrairVariaveis(t.corpo).map((v) => (
                      <code
                        key={v}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                )}

                <div className="flex-1" />

                {/* Ações */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800 flex-wrap">
                  <Link
                    to="/campanhas"
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Usar em Campanha
                  </Link>
                  <Link
                    to="/salesbot"
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Usar no Salesbot
                  </Link>
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      setTemplateEmEdicao(t);
                      setModalAberto(true);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluir(t.id)}
                    className="px-2.5 py-1 text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg transition-colors"
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
        <TemplateModal
          key={templateEmEdicao?.id ?? 'novo'}
          template={templateEmEdicao}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
          salvando={criando || atualizando}
        />
      )}
    </div>
  );
};
