// FORK: Voka CRM — T-9: Catálogo de produtos (grid + modal CRUD, TailAdmin)
import { useMemo, useState } from 'react';

import Badge from '@/tailadmin/ui/Badge';
import { Modal } from '@/tailadmin/ui/Modal';
import { type Produto, useProdutos } from '@/voka-crm/hooks/useProdutos';

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

type Ordenacao = 'nome' | 'preco-asc' | 'preco-desc';

// ─── Modal criar/editar ───────────────────────────────────────────────────────

interface ProdutoModalProps {
  produto: Produto | null;
  onClose: () => void;
  onSave: (input: {
    nome: string;
    descricao: string | null;
    preco: number;
    unidade: string;
    sku: string | null;
    categoria: string | null;
  }) => Promise<void>;
  salvando: boolean;
}

function ProdutoModal({
  produto,
  onClose,
  onSave,
  salvando,
}: ProdutoModalProps) {
  const [nome, setNome] = useState(produto?.nome ?? '');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [preco, setPreco] = useState(
    produto !== null ? String(produto.preco) : '',
  );
  const [unidade, setUnidade] = useState(produto?.unidade ?? 'un');
  const [sku, setSku] = useState(produto?.sku ?? '');
  const [categoria, setCategoria] = useState(produto?.categoria ?? '');

  const precoNum = Number(preco.replace(',', '.'));
  const valido = nome.trim() !== '' && !Number.isNaN(precoNum) && precoNum >= 0;

  return (
    <Modal isOpen onClose={onClose} className="max-w-[480px] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {produto ? 'Editar Produto' : 'Novo Produto'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Plano Premium"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Preço (R$)</label>
            <input
              type="text"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Unidade</label>
            <input
              type="text"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              placeholder="un, h, mês…"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex.: Serviços"
              className={inputClass}
            />
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
              descricao: descricao.trim() === '' ? null : descricao.trim(),
              preco: precoNum,
              unidade: unidade.trim() === '' ? 'un' : unidade.trim(),
              sku: sku.trim() === '' ? null : sku.trim(),
              categoria: categoria.trim() === '' ? null : categoria.trim(),
            })
          }
          disabled={salvando || !valido}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const CatalogoPage = () => {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);

  const { produtos, loading, creating, updating, create, update, del } =
    useProdutos(false);

  const categorias = useMemo(
    () =>
      [
        ...new Set(
          produtos
            .map((p) => p.categoria)
            .filter((c): c is string => c !== null),
        ),
      ].sort(),
    [produtos],
  );

  const produtosVisiveis = useMemo(() => {
    let lista = produtos;
    if (categoriaAtiva !== null)
      lista = lista.filter((p) => p.categoria === categoriaAtiva);
    const q = busca.trim().toLowerCase();
    if (q !== '') lista = lista.filter((p) => p.nome.toLowerCase().includes(q));
    const copia = [...lista];
    if (ordenacao === 'nome')
      copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (ordenacao === 'preco-asc') copia.sort((a, b) => a.preco - b.preco);
    if (ordenacao === 'preco-desc') copia.sort((a, b) => b.preco - a.preco);
    return copia;
  }, [produtos, categoriaAtiva, busca, ordenacao]);

  const salvar = async (input: {
    nome: string;
    descricao: string | null;
    preco: number;
    unidade: string;
    sku: string | null;
    categoria: string | null;
  }) => {
    if (produtoEmEdicao === null) await create(input);
    else await update({ id: produtoEmEdicao.id, ...input });
    setModalAberto(false);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Catálogo
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({produtos.length})
              </span>
            )}
          </h1>

          {/* Tabs de categoria */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoriaAtiva(null)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                categoriaAtiva === null
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoriaAtiva(c)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  categoriaAtiva === c
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="nome">Ordenar por nome</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
          </select>

          <div className="flex-1" />

          <button
            onClick={() => {
              setProdutoEmEdicao(null);
              setModalAberto(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            + Novo Produto
          </button>
        </div>
      </div>

      {/* Grid de produtos */}
      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-64 animate-pulse"
              />
            ))}
          </div>
        ) : produtosVisiveis.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
            Nenhum produto encontrado. Clique em "+ Novo Produto" para
            cadastrar.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosVisiveis.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden flex flex-col"
              >
                {/* Imagem */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {p.imagens.length > 0 ? (
                    <img
                      src={p.imagens[0]}
                      alt={p.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-gray-300 dark:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {p.nome}
                    </h3>
                    {!p.ativo && (
                      <Badge color="light" size="sm">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  {p.categoria !== null && (
                    <span className="w-fit px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 mb-2">
                      {p.categoria}
                    </span>
                  )}
                  <p className="text-base font-bold text-brand-600 dark:text-brand-400">
                    {formatBRL(p.preco)}
                    <span className="text-xs font-normal text-gray-400">
                      {' '}
                      /{p.unidade}
                    </span>
                  </p>
                  {p.descricao !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {p.descricao}
                    </p>
                  )}

                  <div className="flex-1" />

                  {/* Ações */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setProdutoEmEdicao(p);
                        setModalAberto(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => del(p.id)}
                      className="px-2.5 py-1 text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <ProdutoModal
          key={produtoEmEdicao?.id ?? 'novo'}
          produto={produtoEmEdicao}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
          salvando={creating || updating}
        />
      )}
    </div>
  );
};
