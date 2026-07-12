// FORK: Zellate — F4: página PÚBLICA da proposta/orçamento. Sem autenticação —
// o cliente abre pelo link enviado no WhatsApp, vê os itens e salva como PDF
// pelo próprio navegador (botão Imprimir). Consome o endpoint público.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { REACT_APP_SERVER_BASE_URL } from '~/config';

type OrcamentoItem = {
  produtoNome: string;
  produtoUnidade: string;
  quantidade: number;
  preco: number;
  desconto: number;
  subtotal: number;
};

type OrcamentoDados = {
  negocioNome: string;
  empresaNome: string | null;
  workspaceNome: string;
  itens: OrcamentoItem[];
  total: number;
  geradoEm: string;
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const OrcamentoPage = () => {
  const { workspaceId = '', leadId = '', token = '' } = useParams();
  const [dados, setDados] = useState<OrcamentoDados | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>(
    'carregando',
  );

  useEffect(() => {
    let ativo = true;
    fetch(
      `${REACT_APP_SERVER_BASE_URL}/orcamento-dados/${workspaceId}/${leadId}/${token}`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('404'))))
      .then((d: OrcamentoDados) => {
        if (ativo) {
          setDados(d);
          setEstado('ok');
        }
      })
      .catch(() => ativo && setEstado('erro'));

    return () => {
      ativo = false;
    };
  }, [workspaceId, leadId, token]);

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        Carregando proposta…
      </div>
    );
  }

  if (estado === 'erro' || dados == null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500 p-6 text-center">
        Proposta não encontrada ou link expirado.
      </div>
    );
  }

  const dataFmt = new Date(dados.geradoEm).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl">
        {/* Ações (não impressas) */}
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-[#071689] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        {/* Folha da proposta */}
        <div className="rounded-2xl bg-white p-8 shadow-sm print:shadow-none print:rounded-none">
          <div className="flex items-start justify-between border-b border-gray-100 pb-5 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proposta</h1>
              <p className="text-sm text-gray-500 mt-0.5">{dados.negocioNome}</p>
              {dados.empresaNome && (
                <p className="text-sm text-gray-500">
                  Para: {dados.empresaNome}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#071689]">
                {dados.workspaceNome}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{dataFmt}</p>
            </div>
          </div>

          {/* Itens */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-100">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-right w-16">Qtd</th>
                <th className="py-2 font-medium text-right w-28">Preço</th>
                <th className="py-2 font-medium text-right w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((i, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">
                    {i.produtoNome}
                    {i.desconto > 0 && (
                      <span className="text-xs text-gray-400">
                        {' '}
                        (desc. {brl(i.desconto)})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {i.quantidade} {i.produtoUnidade}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {brl(i.preco)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-800">
                    {brl(i.subtotal)}
                  </td>
                </tr>
              ))}
              {dados.itens.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    Sem itens nesta proposta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
            <div className="text-right">
              <p className="text-xs uppercase text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {brl(dados.total)}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-8 text-center">
            Proposta gerada em {dataFmt} · {dados.workspaceNome}
          </p>
        </div>
      </div>
    </div>
  );
};
