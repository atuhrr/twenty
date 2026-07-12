// FORK: Voka CRM — T-12: detalhe da Empresa (2 colunas, TailAdmin)
import { Link, useParams } from 'react-router-dom';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { InlineEditField } from '@/tailadmin/ui/InlineEditField';
import { RecordTimeline } from '@/tailadmin/ui/RecordTimeline';

type Empresa = ObjectRecord & {
  name?: string | null;
  domainName?: { primaryLinkUrl?: string } | null;
  annualRevenue?: { amountMicros?: number | string | null } | null;
  createdAt?: string | null;
  address?: { addressCity?: string } | null;
};

type ContatoDaEmpresa = ObjectRecord & {
  name?: { firstName?: string; lastName?: string } | null;
  jobTitle?: string | null;
};

type LeadDaEmpresa = ObjectRecord & {
  name?: string | null;
  amount?: { amountMicros?: number | string | null } | null;
};

const formatBRL = (micros: number) =>
  (micros / 1_000_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const cardClass =
  'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5';

export const EmpresaDetailPage = () => {
  const { id = '' } = useParams();

  const { record: empresa, loading } = useFindOneRecord<Empresa>({
    objectNameSingular: 'company',
    objectRecordId: id,
    recordGqlFields: {
      id: true,
      name: true,
      domainName: true,
      annualRevenue: true,
      createdAt: true,
      address: true,
    },
  });

  const { records: contatos } = useFindManyRecords<ContatoDaEmpresa>({
    objectNameSingular: 'person',
    filter: { companyId: { eq: id } },
    recordGqlFields: { id: true, name: true, jobTitle: true },
    limit: 10,
  });

  const { records: leads } = useFindManyRecords<LeadDaEmpresa>({
    objectNameSingular: 'opportunity',
    filter: { companyId: { eq: id } },
    recordGqlFields: { id: true, name: true, amount: true },
    limit: 10,
  });

  const { updateOneRecord } = useUpdateOneRecord();
  const atualizar = async (patch: Record<string, unknown>) => {
    await updateOneRecord({
      objectNameSingular: 'company',
      idToUpdate: id,
      updateOneRecordInput: patch,
    });
  };

  if (loading || empresa == null) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-48 animate-pulse" />
      </div>
    );
  }

  const site = empresa.domainName?.primaryLinkUrl ?? '';

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
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  {empresa.name ?? '(Sem nome)'}
                </h1>
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
                {Number(empresa.annualRevenue?.amountMicros ?? 0) > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatBRL(Number(empresa.annualRevenue?.amountMicros ?? 0))}{' '}
                    / ano
                  </p>
                )}
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
                label="Receita anual (R$)"
                value={
                  Number(empresa.annualRevenue?.amountMicros ?? 0) > 0
                    ? String(
                        Number(empresa.annualRevenue?.amountMicros ?? 0) /
                          1_000_000,
                      )
                    : ''
                }
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

          {/* Contatos da empresa */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Contatos ({contatos.length})
            </h3>
            {contatos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum contato vinculado.</p>
            ) : (
              <ul className="space-y-1">
                {contatos.map((c) => {
                  const nome =
                    `${c.name?.firstName ?? ''} ${c.name?.lastName ?? ''}`.trim();
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/contatos/${c.id}`}
                        className="flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-gray-800 dark:text-white/90 truncate">
                          {nome === '' ? '(Sem nome)' : nome}
                        </span>
                        {typeof c.jobTitle === 'string' &&
                          c.jobTitle !== '' && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {c.jobTitle}
                            </span>
                          )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Leads da empresa */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Leads ({leads.length})
            </h3>
            {leads.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum lead vinculado.</p>
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
