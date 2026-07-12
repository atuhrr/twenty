// FORK: Zellate — F1 Financeiro: página de Faturas (referência: fatura.png).
// Overview com números reais, tabela com ações, criação em modal central com
// vínculo a lead, e abertura via URL (?nova=1&leadId=…) para o botão "Cobrar"
// do Inbox/lead.
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Copy,
  Download,
  FileText,
  Link2,
  Repeat,
  Undo2,
  Wallet,
  ExternalLink,
  MessageCircle,
  Plus,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  ASSINATURAS,
  CANCELAR_ASSINATURA,
  CANCELAR_FATURA,
  CRIAR_ASSINATURA,
  CRIAR_FATURA,
  CRIAR_LINK_PAGAMENTO,
  DESATIVAR_LINK_PAGAMENTO,
  EMITIR_NFSE,
  ENVIAR_FATURA_WHATSAPP,
  ENVIAR_NFSE_WHATSAPP,
  ESTORNAR_FATURA,
  FATURA_RESUMO,
  FATURAS,
  FINANCEIRO_CONFIG,
  FINANCEIRO_STATUS,
  LINKS_PAGAMENTO,
  PAUSAR_ASSINATURA,
  RETOMAR_ASSINATURA,
  SALDO_FINANCEIRO,
} from '@/financeiro/graphql/financeiroQueries';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type Fatura = {
  id: string;
  numero: string;
  leadId: string | null;
  clienteNome: string;
  clienteTelefone: string | null;
  descricao: string;
  valorCentavos: number;
  vencimento: string;
  meios: string;
  status: string;
  linkPagamento: string | null;
  pixPayload: string | null;
  valorPagoCentavos: number | null;
  pagaEm: string | null;
  formaPagamento: string | null;
  valorLiquidoCentavos: number | null;
  nfseStatus: string | null;
  nfsePdfUrl: string | null;
  nfseErro: string | null;
  createdAt: string;
};

type Resumo = {
  vencidasCentavos: number;
  aVencer30dCentavos: number;
  tempoMedioDias: number | null;
  recebidoMesCentavos: number;
};

type LeadOption = ObjectRecord & {
  name?: string | null;
  amount?: { amountMicros: number | null } | null;
  pointOfContactId?: string | null;
};

const brl = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const dataBR = (iso: string) => {
  const soData = iso.slice(0, 10);
  return soData.split('-').reverse().join('/');
};

const STATUS_CHIP: Record<string, { rotulo: string; classe: string }> = {
  PENDENTE: {
    rotulo: 'Pendente',
    classe:
      'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  },
  PAGA: {
    rotulo: 'Paga',
    classe:
      'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
  },
  VENCIDA: {
    rotulo: 'Vencida',
    classe:
      'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
  },
  CANCELADA: {
    rotulo: 'Cancelada',
    classe: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  ESTORNADA: {
    rotulo: 'Estornada',
    classe: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  RASCUNHO: {
    rotulo: 'Rascunho',
    classe: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
};

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type Assinatura = {
  id: string;
  leadId: string | null;
  clienteNome: string;
  descricao: string;
  valorCentavos: number;
  ciclo: string;
  proximoVencimento: string;
  meios: string;
  status: string;
  createdAt: string;
};

const ASSINATURA_CHIP: Record<string, { rotulo: string; classe: string }> = {
  ATIVA: {
    rotulo: 'Ativa',
    classe:
      'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
  },
  PAUSADA: {
    rotulo: 'Pausada',
    classe:
      'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  },
  CANCELADA: {
    rotulo: 'Cancelada',
    classe: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
};

// ─── F2: Modal de nova assinatura ────────────────────────────────────────────

function AssinaturaModal({
  onFechar,
  onCriada,
}: {
  onFechar: () => void;
  onCriada: () => void;
}) {
  const { enqueueErrorSnackBar } = useSnackBar();
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [primeiraCobranca, setPrimeiraCobranca] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [meios, setMeios] = useState('TODOS');
  const [leadId, setLeadId] = useState('');
  const [buscaLead, setBuscaLead] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [criarAssinatura] = useMutation(CRIAR_ASSINATURA);

  const { records: leads } = useFindManyRecords<LeadOption>({
    objectNameSingular: 'opportunity',
    filter: {},
    recordGqlFields: { id: true, name: true },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 200,
  });

  const leadsVisiveis = useMemo(() => {
    const q = buscaLead.trim().toLowerCase();
    const lista = q
      ? leads.filter((l) => (l.name ?? '').toLowerCase().includes(q))
      : leads;
    return lista.slice(0, 50);
  }, [leads, buscaLead]);

  const valorCentavos = Math.round(Number(valor.replace(',', '.')) * 100) || 0;
  const valido =
    clienteNome.trim() !== '' &&
    descricao.trim() !== '' &&
    valorCentavos >= 100;

  const handleCriar = async () => {
    setSalvando(true);
    try {
      await criarAssinatura({
        variables: {
          input: {
            leadId: leadId || null,
            clienteNome: clienteNome.trim(),
            clienteCpfCnpj: clienteCpfCnpj.trim() || null,
            clienteTelefone: clienteTelefone.trim() || null,
            descricao: descricao.trim(),
            valorCentavos,
            proximoVencimento: primeiraCobranca,
            meios,
          },
        },
      });
      onCriada();
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : 'Não foi possível criar a assinatura.',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Nova assinatura (mensal)
          </h2>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-xs text-gray-500">
          O provedor gera a cobrança todo mês sozinho — cada fatura aparece na
          lista e segue a régua de lembretes.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nome do cliente
              </label>
              <input
                className={inputClass}
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Telefone (WhatsApp)
              </label>
              <input
                className={inputClass}
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="Com DDD"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                CPF/CNPJ (opcional)
              </label>
              <input
                className={inputClass}
                value={clienteCpfCnpj}
                onChange={(e) => setClienteCpfCnpj(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Primeira cobrança
              </label>
              <input
                type="date"
                className={inputClass}
                value={primeiraCobranca}
                onChange={(e) => setPrimeiraCobranca(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <input
              className={inputClass}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Mensalidade — plano padrão"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Valor mensal (R$)
              </label>
              <input
                className={inputClass}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Meios de pagamento
              </label>
              <select
                className={inputClass}
                value={meios}
                onChange={(e) => setMeios(e.target.value)}
              >
                <option value="TODOS">Cliente escolhe</option>
                <option value="PIX">Somente Pix</option>
                <option value="CARTAO">Somente cartão</option>
                <option value="BOLETO">Somente boleto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Vincular a um lead (opcional)
            </label>
            <input
              className={`${inputClass} mb-1.5`}
              value={buscaLead}
              onChange={(e) => setBuscaLead(e.target.value)}
              placeholder="Buscar lead pelo nome…"
            />
            <select
              className={inputClass}
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">— Sem lead</option>
              {leadsVisiveis.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name ?? '(sem nome)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onFechar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            disabled={salvando || !valido}
            onClick={() => void handleCriar()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {salvando ? 'Criando…' : 'Criar assinatura'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── F2: Assinaturas ─────────────────────────────────────────────────────────

function AssinaturasView() {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [modalAberto, setModalAberto] = useState(false);
  const [retomandoId, setRetomandoId] = useState<string | null>(null);
  const [dataRetomada, setDataRetomada] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const { data, refetch } = useQuery<{ assinaturas: Assinatura[] }>(
    ASSINATURAS,
    { fetchPolicy: 'cache-and-network' },
  );
  const assinaturas = data?.assinaturas ?? [];

  const [pausar] = useMutation(PAUSAR_ASSINATURA);
  const [retomar] = useMutation(RETOMAR_ASSINATURA);
  const [cancelar] = useMutation(CANCELAR_ASSINATURA);

  const acao = async (fn: () => Promise<unknown>, sucesso: string) => {
    try {
      await fn();
      await refetch();
      enqueueSuccessSnackBar({ message: sucesso });
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : 'Não foi possível concluir a ação.',
      });
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Assinaturas (cobrança recorrente)
          </h3>
          <p className="text-xs text-gray-500">
            Mensalidades geradas sozinhas todo mês pelo provedor.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Plus size={15} />
          Nova assinatura
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {assinaturas.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Nenhuma assinatura ainda — ideal para mensalidades e planos.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium text-right">Valor/mês</th>
                <th className="px-4 py-3 font-medium">Próx. cobrança</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {assinaturas.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {a.leadId ? (
                      <Link to={`/leads/${a.leadId}`} className="hover:underline">
                        {a.clienteNome}
                      </Link>
                    ) : (
                      a.clienteNome
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.descricao}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    {brl(a.valorCentavos)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.status === 'ATIVA' ? dataBR(a.proximoVencimento) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSINATURA_CHIP[a.status]?.classe ?? ''}`}
                    >
                      {ASSINATURA_CHIP[a.status]?.rotulo ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {a.status === 'ATIVA' && (
                        <>
                          <button
                            className="text-xs font-medium text-warning-600 hover:underline"
                            onClick={() =>
                              void acao(
                                () => pausar({ variables: { assinaturaId: a.id } }),
                                'Assinatura pausada.',
                              )
                            }
                          >
                            Pausar
                          </button>
                          <button
                            className="text-xs font-medium text-error-500 hover:underline"
                            onClick={() =>
                              void acao(
                                () => cancelar({ variables: { assinaturaId: a.id } }),
                                'Assinatura cancelada.',
                              )
                            }
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {a.status === 'PAUSADA' &&
                        (retomandoId === a.id ? (
                          <span className="flex items-center gap-1.5">
                            <input
                              type="date"
                              className="rounded border border-gray-300 px-1.5 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              value={dataRetomada}
                              onChange={(e) => setDataRetomada(e.target.value)}
                            />
                            <button
                              className="text-xs font-medium text-success-600 hover:underline"
                              onClick={() =>
                                void acao(
                                  () =>
                                    retomar({
                                      variables: {
                                        assinaturaId: a.id,
                                        proximoVencimento: dataRetomada,
                                      },
                                    }).then(() => setRetomandoId(null)),
                                  'Assinatura retomada.',
                                )
                              }
                            >
                              OK
                            </button>
                          </span>
                        ) : (
                          <button
                            className="text-xs font-medium text-success-600 hover:underline"
                            onClick={() => setRetomandoId(a.id)}
                          >
                            Retomar
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <AssinaturaModal
          onFechar={() => setModalAberto(false)}
          onCriada={() => {
            setModalAberto(false);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

// ─── F4: Recebimentos (conciliação bruto × líquido) ─────────────────────────

const dataOFX = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

function gerarOFX(pagas: Fatura[]): string {
  const agora = new Date().toISOString();
  const transacoes = pagas
    .map((f) => {
      const valor = ((f.valorLiquidoCentavos ?? f.valorPagoCentavos ?? f.valorCentavos) / 100).toFixed(2);
      return [
        '<STMTTRN>',
        '<TRNTYPE>CREDIT',
        `<DTPOSTED>${dataOFX(f.pagaEm ?? f.createdAt)}`,
        `<TRNAMT>${valor}`,
        `<FITID>${f.numero}`,
        `<MEMO>${f.numero} ${f.clienteNome} - ${f.descricao}`.slice(0, 250),
        '</STMTTRN>',
      ].join('\n');
    })
    .join('\n');

  return [
    'OFXHEADER:100', 'DATA:OFXSGML', 'VERSION:102', 'SECURITY:NONE',
    'ENCODING:UTF-8', 'CHARSET:NONE', 'COMPRESSION:NONE',
    'OLDFILEUID:NONE', 'NEWFILEUID:NONE', '',
    '<OFX>', '<BANKMSGSRSV1>', '<STMTTRNRS>', '<TRNUID>1',
    '<STMTRS>', '<CURDEF>BRL',
    '<BANKACCTFROM><BANKID>0000<ACCTID>ZELLATE<ACCTTYPE>CHECKING</BANKACCTFROM>',
    '<BANKTRANLIST>',
    `<DTSTART>${dataOFX(agora)}`, `<DTEND>${dataOFX(agora)}`,
    transacoes,
    '</BANKTRANLIST>', '</STMTRS>', '</STMTTRNRS>',
    '</BANKMSGSRSV1>', '</OFX>',
  ].join('\n');
}

function baixarArquivo(conteudo: string, nome: string, mime: string) {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function RecebimentosView({ faturas }: { faturas: Fatura[] }) {
  const { data: saldoData } = useQuery<{ saldoFinanceiro: number }>(
    SALDO_FINANCEIRO,
    { fetchPolicy: 'cache-and-network' },
  );

  const pagas = useMemo(
    () =>
      faturas
        .filter((f) => f.status === 'PAGA')
        .sort((a, b) => (b.pagaEm ?? '').localeCompare(a.pagaEm ?? '')),
    [faturas],
  );

  const bruto = pagas.reduce(
    (acc, f) => acc + (f.valorPagoCentavos ?? f.valorCentavos),
    0,
  );
  const liquido = pagas.reduce(
    (acc, f) =>
      acc + (f.valorLiquidoCentavos ?? f.valorPagoCentavos ?? f.valorCentavos),
    0,
  );
  const taxas = bruto - liquido;

  const exportarCSV = () => {
    const linhas = [
      ['Número', 'Cliente', 'Pago em', 'Forma', 'Bruto', 'Taxas', 'Líquido'],
      ...pagas.map((f) => {
        const b = f.valorPagoCentavos ?? f.valorCentavos;
        const l = f.valorLiquidoCentavos ?? b;
        return [
          f.numero,
          f.clienteNome,
          f.pagaEm ? dataBR(f.pagaEm) : '',
          f.formaPagamento ?? '',
          (b / 100).toFixed(2).replace('.', ','),
          ((b - l) / 100).toFixed(2).replace('.', ','),
          (l / 100).toFixed(2).replace('.', ','),
        ];
      }),
    ];
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    baixarArquivo(`\ufeff${csv}`, 'recebimentos-zellate.csv', 'text/csv;charset=utf-8');
  };

  const cardStat = (rotulo: string, valor: string) => (
    <div className="flex-1 min-w-[150px] rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500">{rotulo}</div>
      <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{valor}</div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
        <div className="flex flex-1 flex-wrap gap-3">
          {cardStat('Saldo na conta (provedor)', brl(saldoData?.saldoFinanceiro ?? 0))}
          {cardStat('Recebido (bruto)', brl(bruto))}
          {cardStat('Taxas do provedor', `− ${brl(taxas)}`)}
          {cardStat('Recebido (líquido)', brl(liquido))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() =>
              baixarArquivo(gerarOFX(pagas), 'recebimentos-zellate.ofx', 'application/x-ofx')
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Download size={14} /> OFX (contador)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pagas.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Nenhum recebimento ainda — faturas pagas aparecem aqui com o
            detalhamento das taxas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Pago em</th>
                <th className="px-4 py-3 font-medium">Forma</th>
                <th className="px-4 py-3 font-medium text-right">Bruto</th>
                <th className="px-4 py-3 font-medium text-right">Taxas</th>
                <th className="px-4 py-3 font-medium text-right">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {pagas.map((f) => {
                const b = f.valorPagoCentavos ?? f.valorCentavos;
                const l = f.valorLiquidoCentavos ?? b;
                return (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{f.numero}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{f.clienteNome}</td>
                    <td className="px-4 py-3 text-gray-500">{f.pagaEm ? dataBR(f.pagaEm) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.formaPagamento ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{brl(b)}</td>
                    <td className="px-4 py-3 text-right text-error-500">
                      {b - l > 0 ? `− ${brl(b - l)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-success-600">{brl(l)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── F4: Links de pagamento avulsos (balcão) ─────────────────────────────────

function LinksPagamentoView() {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [meios, setMeios] = useState('TODOS');
  const [criando, setCriando] = useState(false);

  const { data, refetch } = useQuery<{
    linksPagamento: Array<{
      id: string;
      nome: string;
      url: string;
      valorCentavos: number | null;
      ativo: boolean;
    }>;
  }>(LINKS_PAGAMENTO, { fetchPolicy: 'cache-and-network' });
  const links = data?.linksPagamento ?? [];

  const [criarLink] = useMutation(CRIAR_LINK_PAGAMENTO);
  const [desativarLink] = useMutation(DESATIVAR_LINK_PAGAMENTO);

  const handleCriar = async () => {
    if (nome.trim() === '') return;
    setCriando(true);
    try {
      await criarLink({
        variables: {
          input: {
            nome: nome.trim(),
            valorCentavos: valor
              ? Math.round(Number(valor.replace(',', '.')) * 100)
              : null,
            meios,
          },
        },
      });
      setNome('');
      setValor('');
      await refetch();
      enqueueSuccessSnackBar({ message: 'Link de pagamento criado.' });
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : 'Não foi possível criar o link.',
      });
    } finally {
      setCriando(false);
    }
  };

  const copiar = async (url: string) => {
    await navigator.clipboard.writeText(url);
    enqueueSuccessSnackBar({ message: 'Link copiado.' });
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Links de pagamento avulsos
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Link/QR reutilizável para balcão ou bio — sem precisar criar fatura.
          Deixe o valor vazio para o cliente digitar quanto pagar.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Nome</label>
            <input
              className={inputClass}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Pagamento no balcão"
            />
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
            <input
              className={inputClass}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Aberto"
              inputMode="decimal"
            />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Meios</label>
            <select className={inputClass} value={meios} onChange={(e) => setMeios(e.target.value)}>
              <option value="TODOS">Cliente escolhe</option>
              <option value="PIX">Somente Pix</option>
              <option value="CARTAO">Somente cartão</option>
              <option value="BOLETO">Somente boleto</option>
            </select>
          </div>
          <button
            onClick={() => void handleCriar()}
            disabled={criando || nome.trim() === ''}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Plus size={15} /> Criar link
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {links.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Nenhum link ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.nome}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {l.valorCentavos != null ? brl(l.valorCentavos) : 'Valor aberto'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.ativo
                          ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {l.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Copiar link"
                        onClick={() => void copiar(l.url)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      >
                        <Copy size={15} />
                      </button>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir link"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      >
                        <ExternalLink size={15} />
                      </a>
                      {l.ativo && (
                        <button
                          title="Desativar link"
                          onClick={() =>
                            void desativarLink({ variables: { linkId: l.id } }).then(() => refetch())
                          }
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Modal de criação ─────────────────────────────────────────────────────────

function FaturaModal({
  leadPre,
  onFechar,
  onCriada,
}: {
  leadPre: {
    id: string;
    nome: string;
    valorCentavos: number | null;
    telefone: string | null;
    descricao?: string | null;
  } | null;
  onFechar: () => void;
  onCriada: (opcoes: { enviarWhatsapp: boolean; faturaId: string }) => void;
}) {
  const { enqueueErrorSnackBar } = useSnackBar();
  const [clienteNome, setClienteNome] = useState(leadPre?.nome ?? '');
  const [clienteTelefone, setClienteTelefone] = useState(
    leadPre?.telefone ?? '',
  );
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState('');
  const [descricao, setDescricao] = useState(leadPre?.descricao ?? '');
  const [valor, setValor] = useState(
    leadPre?.valorCentavos ? String(leadPre.valorCentavos / 100) : '',
  );
  const [vencimento, setVencimento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [meios, setMeios] = useState('TODOS');
  const [leadId, setLeadId] = useState(leadPre?.id ?? '');
  const [buscaLead, setBuscaLead] = useState('');
  const [enviarWhatsapp, setEnviarWhatsapp] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // F2: encargos (pré-preenchidos com o padrão da configuração) e régua
  const { data: configData } = useQuery<{
    financeiroConfig: {
      jurosPadraoPercent: number | null;
      multaPadraoPercent: number | null;
    };
  }>(FINANCEIRO_CONFIG, { fetchPolicy: 'cache-first' });
  const [mostrarEncargos, setMostrarEncargos] = useState(false);
  const [juros, setJuros] = useState('');
  const [multa, setMulta] = useState('');
  const [desconto, setDesconto] = useState('');
  const [lembretes, setLembretes] = useState(true);

  useEffect(() => {
    const cfg = configData?.financeiroConfig;
    if (cfg) {
      if (juros === '' && cfg.jurosPadraoPercent != null)
        setJuros(String(cfg.jurosPadraoPercent));
      if (multa === '' && cfg.multaPadraoPercent != null)
        setMulta(String(cfg.multaPadraoPercent));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configData]);

  const [criarFatura] = useMutation(CRIAR_FATURA);

  const { records: leads } = useFindManyRecords<LeadOption>({
    objectNameSingular: 'opportunity',
    filter: {},
    recordGqlFields: {
      id: true,
      name: true,
      amount: { amountMicros: true, currencyCode: true },
    },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 200,
    skip: leadPre != null,
  });

  const leadsVisiveis = useMemo(() => {
    const q = buscaLead.trim().toLowerCase();
    const lista = q
      ? leads.filter((l) => (l.name ?? '').toLowerCase().includes(q))
      : leads;
    return lista.slice(0, 50);
  }, [leads, buscaLead]);

  // Selecionar lead preenche nome/valor
  const handleSelecionarLead = (id: string) => {
    setLeadId(id);
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      if (clienteNome.trim() === '') setClienteNome(lead.name ?? '');
      const micros = Number(lead.amount?.amountMicros ?? 0);
      if (valor === '' && micros > 0) setValor(String(micros / 1_000_000));
    }
  };

  const valorCentavos = Math.round(Number(valor.replace(',', '.')) * 100) || 0;
  const valido =
    clienteNome.trim() !== '' &&
    descricao.trim() !== '' &&
    valorCentavos >= 100 &&
    vencimento !== '';

  const handleCriar = async () => {
    setSalvando(true);
    try {
      const { data } = await criarFatura({
        variables: {
          input: {
            leadId: leadId || null,
            clienteNome: clienteNome.trim(),
            clienteCpfCnpj: clienteCpfCnpj.trim() || null,
            clienteTelefone: clienteTelefone.trim() || null,
            descricao: descricao.trim(),
            valorCentavos,
            vencimento,
            meios,
            jurosPercent: juros ? Number(juros.replace(',', '.')) : null,
            multaPercent: multa ? Number(multa.replace(',', '.')) : null,
            descontoCentavos: desconto
              ? Math.round(Number(desconto.replace(',', '.')) * 100)
              : null,
            lembretesAtivos: lembretes,
          },
        },
      });
      const faturaId = (data as { criarFatura: { id: string } }).criarFatura
        .id;
      onCriada({ enviarWhatsapp, faturaId });
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : msg.includes('FINANCEIRO_NAO_CONECTADO')
              ? 'Conecte sua conta em Configurações → Financeiro antes de cobrar.'
              : 'Não foi possível criar a fatura.',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Criar fatura
          </h2>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-xs text-gray-500">
          O cliente recebe Pix copia-e-cola e um link onde pode pagar com
          cartão ou boleto. O pagamento confirma sozinho.
        </p>

        <div className="space-y-4">
          {leadPre ? (
            <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              Cobrança para o lead: {leadPre.nome}
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Vincular a um lead (opcional — preenche nome e valor)
              </label>
              <input
                className={`${inputClass} mb-1.5`}
                value={buscaLead}
                onChange={(e) => setBuscaLead(e.target.value)}
                placeholder="Buscar lead pelo nome…"
              />
              <select
                className={inputClass}
                value={leadId}
                onChange={(e) => handleSelecionarLead(e.target.value)}
              >
                <option value="">— Sem lead</option>
                {leadsVisiveis.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name ?? '(sem nome)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nome do cliente
              </label>
              <input
                className={inputClass}
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Quem vai pagar"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                CPF/CNPJ (opcional)
              </label>
              <input
                className={inputClass}
                value={clienteCpfCnpj}
                onChange={(e) => setClienteCpfCnpj(e.target.value)}
                placeholder="Só números"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Descrição da cobrança
            </label>
            <input
              className={inputClass}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Consultoria — pacote mensal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Valor (R$)
              </label>
              <input
                className={inputClass}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Vencimento
              </label>
              <input
                type="date"
                className={inputClass}
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Meios de pagamento
            </label>
            <select
              className={inputClass}
              value={meios}
              onChange={(e) => setMeios(e.target.value)}
            >
              <option value="TODOS">Cliente escolhe (Pix, cartão ou boleto)</option>
              <option value="PIX">Somente Pix</option>
              <option value="CARTAO">Somente cartão de crédito</option>
              <option value="BOLETO">Somente boleto</option>
            </select>
          </div>

          {/* F2: encargos e desconto */}
          <div>
            <button
              type="button"
              onClick={() => setMostrarEncargos(!mostrarEncargos)}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {mostrarEncargos ? '▾' : '▸'} Juros, multa e desconto
            </button>
            {mostrarEncargos && (
              <div className="mt-2 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    Juros/mês (%)
                  </label>
                  <input
                    className={inputClass}
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    Multa (%)
                  </label>
                  <input
                    className={inputClass}
                    value={multa}
                    onChange={(e) => setMulta(e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    Desconto (R$)
                  </label>
                  <input
                    className={inputClass}
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={lembretes}
              onChange={(e) => setLembretes(e.target.checked)}
            />
            Lembretes automáticos de cobrança (régua do WhatsApp)
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={enviarWhatsapp}
              onChange={(e) => setEnviarWhatsapp(e.target.checked)}
            />
            Enviar agora pela conversa do WhatsApp (se houver)
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onFechar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            disabled={salvando || !valido}
            onClick={() => void handleCriar()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {salvando ? 'Criando…' : 'Criar fatura'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type AbaFiltro = 'todas' | 'PENDENTE' | 'PAGA' | 'VENCIDA';
type Secao = 'faturas' | 'assinaturas' | 'recebimentos' | 'links';

export const FaturasPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [secao, setSecao] = useState<Secao>('faturas');
  const [aba, setAba] = useState<AbaFiltro>('todas');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [leadPre, setLeadPre] = useState<{
    id: string;
    nome: string;
    valorCentavos: number | null;
    telefone: string | null;
    descricao?: string | null;
  } | null>(null);

  const { data: statusData } = useQuery<{
    financeiroStatus: { conectado: boolean };
  }>(FINANCEIRO_STATUS, { fetchPolicy: 'cache-and-network' });
  const conectado = statusData?.financeiroStatus?.conectado === true;

  const { data, refetch } = useQuery<{ faturas: Fatura[] }>(FATURAS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });
  const faturas = useMemo(() => data?.faturas ?? [], [data]);

  const { data: resumoData, refetch: refetchResumo } = useQuery<{
    faturaResumo: Resumo;
  }>(FATURA_RESUMO, { fetchPolicy: 'cache-and-network', pollInterval: 60_000 });
  const resumo = resumoData?.faturaResumo;

  const [cancelarFatura] = useMutation(CANCELAR_FATURA);
  const [enviarWhatsapp] = useMutation(ENVIAR_FATURA_WHATSAPP);
  const [emitirNfse] = useMutation(EMITIR_NFSE);
  const [enviarNfse] = useMutation(ENVIAR_NFSE_WHATSAPP);
  const [estornarFatura] = useMutation(ESTORNAR_FATURA);
  const [estornandoId, setEstornandoId] = useState<string | null>(null);

  const handleEstornar = async (faturaId: string) => {
    if (estornandoId !== faturaId) {
      setEstornandoId(faturaId);
      return;
    }
    setEstornandoId(null);
    try {
      await estornarFatura({ variables: { faturaId } });
      await Promise.all([refetch(), refetchResumo()]);
      enqueueSuccessSnackBar({ message: 'Fatura estornada — valor devolvido ao pagador.' });
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : 'Não foi possível estornar.',
      });
    }
  };

  const { data: configNfseData } = useQuery<{
    financeiroConfig: { nfseAtiva: boolean };
  }>(FINANCEIRO_CONFIG, { fetchPolicy: 'cache-first' });
  const nfseAtiva = configNfseData?.financeiroConfig?.nfseAtiva === true;

  const handleEmitirNfse = async (faturaId: string) => {
    try {
      await emitirNfse({ variables: { faturaId } });
      await refetch();
      enqueueSuccessSnackBar({ message: 'NFS-e solicitada à prefeitura.' });
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      const idx = msg.indexOf('ASAAS_ERROR: ');
      enqueueErrorSnackBar({
        message:
          idx !== -1
            ? `Provedor recusou: ${msg.slice(idx + 'ASAAS_ERROR: '.length)}`
            : msg || 'Não foi possível emitir a NFS-e.',
      });
    }
  };

  const handleEnviarNfse = async (faturaId: string) => {
    try {
      await enviarNfse({ variables: { faturaId } });
      enqueueSuccessSnackBar({ message: 'NFS-e enviada pelo WhatsApp.' });
    } catch {
      enqueueErrorSnackBar({ message: 'Falha ao enviar a NFS-e.' });
    }
  };

  // Abertura via URL (botão "Cobrar" do Inbox/lead)
  useEffect(() => {
    if (searchParams.get('nova') === '1') {
      const leadId = searchParams.get('leadId');
      setLeadPre(
        leadId
          ? {
              id: leadId,
              nome: searchParams.get('leadNome') ?? 'Lead',
              valorCentavos: Number(searchParams.get('valorCentavos')) || null,
              telefone: searchParams.get('telefone'),
              descricao: searchParams.get('descricao'),
            }
          : null,
      );
      setModalAberto(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return faturas.filter((f) => {
      const abaOk = aba === 'todas' || f.status === aba;
      const buscaOk =
        !q ||
        f.clienteNome.toLowerCase().includes(q) ||
        f.numero.toLowerCase().includes(q) ||
        f.descricao.toLowerCase().includes(q);
      return abaOk && buscaOk;
    });
  }, [faturas, aba, busca]);

  const contagem = (s: AbaFiltro) =>
    s === 'todas'
      ? faturas.length
      : faturas.filter((f) => f.status === s).length;

  const handleEnviarWhatsapp = async (faturaId: string) => {
    try {
      await enviarWhatsapp({ variables: { faturaId } });
      enqueueSuccessSnackBar({ message: 'Cobrança enviada pelo WhatsApp.' });
    } catch (err) {
      enqueueErrorSnackBar({
        message: (err as Error)?.message?.includes('Sem conversa')
          ? 'Este cliente não tem conversa de WhatsApp vinculada.'
          : 'Falha ao enviar pelo WhatsApp.',
      });
    }
  };

  const handleCancelar = async (faturaId: string) => {
    try {
      await cancelarFatura({ variables: { faturaId } });
      await Promise.all([refetch(), refetchResumo()]);
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível cancelar.' });
    }
  };

  const copiarPix = async (payload: string) => {
    await navigator.clipboard.writeText(payload);
    enqueueSuccessSnackBar({ message: 'Pix copia-e-cola copiado.' });
  };

  const exportarCSV = () => {
    const linhas = [
      ['Número', 'Cliente', 'Descrição', 'Criada em', 'Vencimento', 'Valor', 'Status'],
      ...visiveis.map((f) => [
        f.numero,
        f.clienteNome,
        f.descricao,
        dataBR(f.createdAt),
        dataBR(f.vencimento),
        (f.valorCentavos / 100).toFixed(2).replace('.', ','),
        STATUS_CHIP[f.status]?.rotulo ?? f.status,
      ]),
    ];
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faturas-zellate.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardResumo = (rotulo: string, valor: string) => (
    <div className="flex-1 min-w-[160px] rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500">{rotulo}</div>
      <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {valor}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 p-4">
      {/* Overview (fatura.png) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Visão geral
            </h2>
            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              {(
                [
                  ['faturas', 'Faturas'],
                  ['assinaturas', 'Assinaturas'],
                  ['recebimentos', 'Recebimentos'],
                  ['links', 'Links'],
                ] as Array<[Secao, string]>
              ).map(([key, rotulo]) => (
                <button
                  key={key}
                  onClick={() => setSecao(key)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    secao === key
                      ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {key === 'assinaturas' && <Repeat size={12} />}
                  {key === 'recebimentos' && <Wallet size={12} />}
                  {key === 'links' && <Link2 size={12} />}
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setLeadPre(null);
              setModalAberto(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={15} />
            Criar fatura
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {cardResumo('Vencidas', brl(resumo?.vencidasCentavos ?? 0))}
          {cardResumo('A vencer em 30 dias', brl(resumo?.aVencer30dCentavos ?? 0))}
          {cardResumo(
            'Tempo médio para receber',
            resumo?.tempoMedioDias != null
              ? `${resumo.tempoMedioDias} dia(s)`
              : '—',
          )}
          {cardResumo('Recebido no mês', brl(resumo?.recebidoMesCentavos ?? 0))}
        </div>
        {!conectado && (
          <div className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
            Nenhuma conta de recebimento conectada —{' '}
            <Link
              to="/settings/financeiro"
              className="font-semibold underline"
            >
              conecte em Configurações → Financeiro
            </Link>{' '}
            para começar a cobrar.
          </div>
        )}
      </div>

      {/* Lista */}
      {secao === 'assinaturas' ? (
        <AssinaturasView />
      ) : secao === 'recebimentos' ? (
        <RecebimentosView faturas={faturas} />
      ) : secao === 'links' ? (
        <LinksPagamentoView />
      ) : (
      <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {(
              [
                ['todas', 'Todas'],
                ['PENDENTE', 'Pendentes'],
                ['PAGA', 'Pagas'],
                ['VENCIDA', 'Vencidas'],
              ] as Array<[AbaFiltro, string]>
            ).map(([key, rotulo]) => (
              <button
                key={key}
                onClick={() => setAba(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  aba === key
                    ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {rotulo}
                <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                  {contagem(key)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-56 rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Buscar…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button
              onClick={exportarCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visiveis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-500">
                Nenhuma fatura {aba !== 'todas' ? 'nesse filtro' : 'ainda'}.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Crie uma fatura ou use o botão "Cobrar" num lead.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">NFS-e</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {visiveis.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {f.numero}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {f.leadId ? (
                        <Link
                          to={`/leads/${f.leadId}`}
                          className="hover:underline"
                        >
                          {f.clienteNome}
                        </Link>
                      ) : (
                        f.clienteNome
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {dataBR(f.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {dataBR(f.vencimento)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {brl(f.valorCentavos)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_CHIP[f.status]?.classe ?? ''
                        }`}
                      >
                        {STATUS_CHIP[f.status]?.rotulo ?? f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.nfseStatus === 'EMITIDA' && f.nfsePdfUrl ? (
                        <a
                          href={f.nfsePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 hover:underline dark:bg-success-500/10 dark:text-success-400"
                        >
                          <FileText size={11} /> Emitida
                        </a>
                      ) : f.nfseStatus === 'AGENDADA' ? (
                        <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                          Processando
                        </span>
                      ) : f.nfseStatus === 'ERRO' ? (
                        <span
                          title={f.nfseErro ?? 'Erro na emissão'}
                          className="cursor-help rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
                        >
                          Erro
                        </span>
                      ) : nfseAtiva && f.status === 'PAGA' ? (
                        <button
                          onClick={() => void handleEmitirNfse(f.id)}
                          className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          Emitir nota
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {f.linkPagamento && (
                          <a
                            href={f.linkPagamento}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir link de pagamento"
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        {f.pixPayload && (
                          <button
                            title="Copiar Pix copia-e-cola"
                            onClick={() => void copiarPix(f.pixPayload as string)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                          >
                            <Copy size={15} />
                          </button>
                        )}
                        {(f.status === 'PENDENTE' || f.status === 'VENCIDA') && (
                          <button
                            title="Enviar cobrança pelo WhatsApp"
                            onClick={() => void handleEnviarWhatsapp(f.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-success-600 dark:hover:bg-gray-800"
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}
                        {f.status === 'PAGA' && (
                          <button
                            title={
                              estornandoId === f.id
                                ? 'Clique de novo para CONFIRMAR o estorno'
                                : 'Estornar (devolver o valor ao pagador)'
                            }
                            onClick={() => void handleEstornar(f.id)}
                            className={`rounded p-1.5 ${
                              estornandoId === f.id
                                ? 'bg-error-50 text-error-500 dark:bg-error-500/10'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Undo2 size={15} />
                          </button>
                        )}
                        {f.nfseStatus === 'EMITIDA' && f.nfsePdfUrl && (
                          <button
                            title="Enviar NFS-e pelo WhatsApp"
                            onClick={() => void handleEnviarNfse(f.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-success-600 dark:hover:bg-gray-800"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        {(f.status === 'PENDENTE' || f.status === 'VENCIDA') && (
                          <button
                            title="Cancelar fatura"
                            onClick={() => void handleCancelar(f.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      {modalAberto && (
        <FaturaModal
          key={leadPre?.id ?? 'nova'}
          leadPre={leadPre}
          onFechar={() => setModalAberto(false)}
          onCriada={({ enviarWhatsapp: enviar, faturaId }) => {
            setModalAberto(false);
            void Promise.all([refetch(), refetchResumo()]);
            if (enviar) void handleEnviarWhatsapp(faturaId);
          }}
        />
      )}
    </div>
  );
};
