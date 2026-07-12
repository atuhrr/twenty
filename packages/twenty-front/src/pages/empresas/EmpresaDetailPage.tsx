// FORK: Zellate — F1 Empresa 360: registro-âncora que consome as relações
// nativas (contatos, negócios) + campos reais (funcionários, CNPJ, receita) +
// métricas de negócio + associação de contatos e criação de negócios.
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { InlineEditField } from '@/tailadmin/ui/InlineEditField';
import { RecordPicker } from '@/tailadmin/ui/RecordPicker';
import { RecordTimeline } from '@/tailadmin/ui/RecordTimeline';

type Empresa = ObjectRecord & {
  name?: string | null;
  domainName?: { primaryLinkUrl?: string } | null;
  annualRevenue?: { amountMicros?: number | string | null } | null;
  employees?: number | null;
  cnpj?: string | null;
  createdAt?: string | null;
  address?: { addressCity?: string } | null;
  accountOwner?: { id: string; name?: { firstName?: string; lastName?: string } | null } | null;
};

type ContatoDaEmpresa = ObjectRecord & {
  name?: { firstName?: string; lastName?: string } | null;
  jobTitle?: string | null;
};

type PessoaOpcao = ObjectRecord & {
  name?: { firstName?: string; lastName?: string } | null;
};

type LeadDaEmpresa = ObjectRecord & {
  name?: string | null;
  stage?: string | null;
  amount?: { amountMicros?: number | string | null } | null;
};

const nomePessoa = (p: { name?: { firstName?: string; lastName?: string } | null }) =>
  `${p.name?.firstName ?? ''} ${p.name?.lastName ?? ''}`.trim();

const formatBRL = (micros: number) =>
  (micros / 1_000_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const cardClass =
  'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5';

// Ciclo de vida calculado (o campo armazenado chega na F2 com a automação)
const cicloDeVida = (
  leads: LeadDaEmpresa[],
): { label: string; classe: string } => {
  const temGanho = leads.some((l) => l.stage === 'GANHO');
  if (temGanho)
    return {
      label: 'Cliente',
      classe: 'bg-success-100 text-success-700 dark:bg-success-500/[0.15] dark:text-success-400',
    };
  if (leads.length > 0)
    return {
      label: 'Oportunidade',
      classe: 'bg-brand-100 text-brand-700 dark:bg-brand-500/[0.15] dark:text-brand-400',
    };
  return {
    label: 'Lead',
    classe: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };
};

export const EmpresaDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { record: empresa, loading } = useFindOneRecord<Empresa>({
    objectNameSingular: 'company',
    objectRecordId: id,
    recordGqlFields: {
      id: true,
      name: true,
      domainName: true,
      annualRevenue: true,
      employees: true,
      cnpj: true,
      createdAt: true,
      address: true,
      accountOwner: { id: true, name: true },
    },
  });

  const { records: contatos, refetch: refetchContatos } =
    useFindManyRecords<ContatoDaEmpresa>({
      objectNameSingular: 'person',
      filter: { companyId: { eq: id } },
      recordGqlFields: { id: true, name: true, jobTitle: true },
      limit: 50,
    });

  const { records: leads } = useFindManyRecords<LeadDaEmpresa>({
    objectNameSingular: 'opportunity',
    filter: { companyId: { eq: id } },
    recordGqlFields: { id: true, name: true, stage: true, amount: true },
    limit: 100,
  });

  const { updateOneRecord } = useUpdateOneRecord();
  const { createOneRecord: criarLead } = useCreateOneRecord({
    objectNameSingular: 'opportunity',
  });

  const atualizar = async (patch: Record<string, unknown>) => {
    await updateOneRecord({
      objectNameSingular: 'company',
      idToUpdate: id,
      updateOneRecordInput: patch,
    });
  };

  const associarContato = async (pessoaId: string | null) => {
    if (pessoaId == null) return;
    await updateOneRecord({
      objectNameSingular: 'person',
      idToUpdate: pessoaId,
      updateOneRecordInput: { companyId: id },
    });
    await refetchContatos();
  };

  const desassociarContato = async (pessoaId: string) => {
    await updateOneRecord({
      objectNameSingular: 'person',
      idToUpdate: pessoaId,
      updateOneRecordInput: { companyId: null },
    });
    await refetchContatos();
  };

  const novoNegocio = async () => {
    const novoId = uuidv4();
    await criarLead({ id: novoId, name: 'Novo negócio', companyId: id });
    navigate(`/leads/${novoId}`);
  };

  if (loading || empresa == null) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-48 animate-pulse" />
      </div>
    );
  }

  const site = empresa.domainName?.primaryLinkUrl ?? '';
  const receitaMicros = Number(empresa.annualRevenue?.amountMicros ?? 0);
  const ciclo = cicloDeVida(leads);

  const negociosAbertos = leads.filter((l) => l.stage !== 'GANHO');
  const valorEmNegociacao = negociosAbertos.reduce(
    (s, l) => s + Number(l.amount?.amountMicros ?? 0),
    0,
  );
  const totalGanho = leads
    .filter((l) => l.stage === 'GANHO')
    .reduce((s, l) => s + Number(l.amount?.amountMicros ?? 0), 0);

  const donoNome = empresa.accountOwner ? nomePessoa(empresa.accountOwner) : '';

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <Link
        to="/empresas"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4 transition-colors"
      >
        ← Voltar para Empresas
      </Link>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Esquerda */}
        <div className="col-span-12 xl:col-span-8 space-y-4 md:space-y-6">
          {/* Cabeçalho */}
          <div className={cardClass}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                    {empresa.name ?? '(Sem nome)'}
                  </h1>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ciclo.classe}`}
                  >
                    {ciclo.label}
                  </span>
                </div>
                {site !== '' && (
                  <a
                    href={site.startsWith('http') ? site : `https://${site}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {site}
                  </a>
                )}
                {donoNome !== '' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Responsável: {donoNome}
                  </p>
                )}
              </div>
            </div>

            {/* Métricas de negócio */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Em negociação
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatBRL(valorEmNegociacao)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total ganho
                </p>
                <p className="text-lg font-bold text-success-600 dark:text-success-400">
                  {formatBRL(totalGanho)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Negócios
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {leads.length}
                </p>
              </div>
            </div>
          </div>

          <RecordTimeline
            targetField="targetCompanyId"
            recordId={id}
            criadoEm={empresa.createdAt}
            rotuloCriacao="Empresa criada"
          />
        </div>

        {/* Direita */}
        <div className="col-span-12 xl:col-span-4 space-y-4 md:space-y-6">
          {/* Informações */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Informações
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InlineEditField
                label="Nome"
                value={empresa.name ?? ''}
                onSave={(v) => atualizar({ name: v })}
              />
              <InlineEditField
                label="Funcionários"
                value={empresa.employees != null ? String(empresa.employees) : ''}
                onSave={(v) =>
                  atualizar({ employees: v === '' ? null : Math.round(Number(v)) })
                }
              />
              <InlineEditField
                label="CNPJ"
                value={empresa.cnpj ?? ''}
                onSave={(v) => atualizar({ cnpj: v === '' ? null : v })}
              />
              <InlineEditField
                label="Receita anual (R$)"
                value={receitaMicros > 0 ? String(receitaMicros / 1_000_000) : ''}
                onSave={(v) =>
                  atualizar({
                    annualRevenue: {
                      amountMicros: Math.round(Number(v) * 1_000_000),
                      currencyCode: 'BRL',
                    },
                  })
                }
              />
              <InlineEditField
                label="Cidade"
                value={empresa.address?.addressCity ?? ''}
                onSave={(v) => atualizar({ address: { addressCity: v } })}
              />
            </div>
          </div>

          {/* Contatos */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Contatos ({contatos.length})
              </h3>
              <RecordPicker<PessoaOpcao>
                objectNameSingular="person"
                recordGqlFields={{ id: true, name: true }}
                labelOf={(p) => nomePessoa(p)}
                onSelect={associarContato}
                placeholder="Buscar contato…"
                buttonLabel="+ Associar"
                allowClear={false}
              />
            </div>
            {contatos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum contato vinculado.</p>
            ) : (
              <ul className="space-y-1">
                {contatos.map((c) => {
                  const nome = nomePessoa(c);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 group"
                    >
                      <Link
                        to={`/contatos/${c.id}`}
                        className="flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1 min-w-0"
                      >
                        <span className="text-gray-800 dark:text-white/90 truncate">
                          {nome === '' ? '(Sem nome)' : nome}
                        </span>
                        {typeof c.jobTitle === 'string' && c.jobTitle !== '' && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {c.jobTitle}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={() => void desassociarContato(c.id)}
                        className="text-xs text-gray-300 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        title="Desvincular"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Negócios */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Negócios ({leads.length})
              </h3>
              <button
                onClick={() => void novoNegocio()}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Novo negócio
              </button>
            </div>
            {leads.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum negócio vinculado.</p>
            ) : (
              <ul className="space-y-1">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/leads/${l.id}`}
                      className="flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-gray-800 dark:text-white/90 truncate">
                        {l.name ?? '(Sem nome)'}
                      </span>
                      <span className="text-xs text-brand-600 dark:text-brand-400 flex-shrink-0">
                        {formatBRL(Number(l.amount?.amountMicros ?? 0))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
