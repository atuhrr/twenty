// FORK: Zellate — F3 Catálogo: itens do negócio. Conecta o Catálogo ao Funil —
// adicionar produtos (qtd × preço − desconto) recalcula o valor do negócio no
// servidor. É a base da cobrança: a fatura nasce desses itens.
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useProdutos } from '@/voka-crm/hooks/useProdutos';
import {
  ADD_LEAD_PRODUTO,
  GET_LEAD_PRODUTOS,
  REMOVE_LEAD_PRODUTO,
  UPDATE_LEAD_PRODUTO,
} from '@/voka-crm/graphql/queries';

type LeadProduto = {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoUnidade: string;
  quantidade: number;
  preco: number;
  desconto: number;
  subtotal: number;
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const numInput =
  'w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none';

export function ItensDoNegocio({
  leadId,
  leadNome,
  onValorMudou,
}: {
  leadId: string;
  leadNome: string;
  onValorMudou: () => void;
}) {
  const navigate = useNavigate();
  const { data, loading } = useQuery<{ leadProdutos: LeadProduto[] }>(
    GET_LEAD_PRODUTOS,
    { variables: { leadId }, fetchPolicy: 'cache-and-network' },
  );
  const itens = data?.leadProdutos ?? [];

  const { produtos } = useProdutos(true);

  const [produtoSel, setProdutoSel] = useState('');
  const opcoesMut = {
    refetchQueries: [{ query: GET_LEAD_PRODUTOS, variables: { leadId } }],
    onCompleted: onValorMudou,
  };
  const [addItem, { loading: adicionando }] = useMutation(
    ADD_LEAD_PRODUTO,
    opcoesMut,
  );
  const [updateItem] = useMutation(UPDATE_LEAD_PRODUTO, opcoesMut);
  const [removeItem] = useMutation(REMOVE_LEAD_PRODUTO, opcoesMut);

  const adicionar = async () => {
    if (produtoSel === '') return;
    await addItem({ variables: { input: { leadId, produtoId: produtoSel } } });
    setProdutoSel('');
  };

  const alterar = (
    id: string,
    campo: 'quantidade' | 'preco' | 'desconto',
    valor: string,
  ) => {
    const n = Number(valor.replace(',', '.'));
    if (Number.isNaN(n)) return;
    void updateItem({ variables: { input: { id, [campo]: n } } });
  };

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  const cobrar = () => {
    const descricao = itens
      .map((i) => `${i.quantidade}x ${i.produtoNome}`)
      .join(', ');
    const params = new URLSearchParams({
      nova: '1',
      leadId,
      leadNome,
      valorCentavos: String(Math.round(total * 100)),
      descricao,
    });
    navigate(`/faturas?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Itens do negócio
        </h3>
        {total > 0 && (
          <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            {brl(total)}
          </span>
        )}
      </div>

      {loading && itens.length === 0 ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">
          Nenhum item. Adicione produtos do catálogo — o valor do negócio é a
          soma dos itens.
        </p>
      ) : (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="py-1.5 font-medium">Produto</th>
                <th className="py-1.5 font-medium w-16">Qtd</th>
                <th className="py-1.5 font-medium w-24">Preço</th>
                <th className="py-1.5 font-medium w-24">Desc.</th>
                <th className="py-1.5 font-medium w-24 text-right">Subtotal</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {itens.map((i) => (
                <tr key={i.id}>
                  <td className="py-1.5 pr-2 text-gray-800 dark:text-white/90">
                    {i.produtoNome}
                    <span className="text-xs text-gray-400"> /{i.produtoUnidade}</span>
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={i.quantidade}
                      onBlur={(e) => alterar(i.id, 'quantidade', e.target.value)}
                      className={numInput}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={i.preco}
                      onBlur={(e) => alterar(i.id, 'preco', e.target.value)}
                      className={numInput}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={i.desconto}
                      onBlur={(e) => alterar(i.id, 'desconto', e.target.value)}
                      className={numInput}
                    />
                  </td>
                  <td className="py-1.5 text-right font-medium text-gray-800 dark:text-white/90">
                    {brl(i.subtotal)}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() =>
                        void removeItem({ variables: { id: i.id } })
                      }
                      className="text-gray-300 hover:text-error-500"
                      title="Remover item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adicionar do catálogo */}
      <div className="flex items-center gap-2">
        <select
          value={produtoSel}
          onChange={(e) => setProdutoSel(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="">Adicionar produto do catálogo…</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — {brl(p.preco)}
            </option>
          ))}
        </select>
        <button
          onClick={() => void adicionar()}
          disabled={produtoSel === '' || adicionando}
          className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          Adicionar
        </button>
      </div>

      {total > 0 && (
        <button
          onClick={cobrar}
          className="mt-3 w-full rounded-lg border border-brand-500/30 px-3 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/[0.12] transition-colors"
        >
          Gerar cobrança — {brl(total)}
        </button>
      )}
    </div>
  );
}
