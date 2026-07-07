// FORK: Voka CRM — T-12: detalhe do Contato (2 colunas, TailAdmin)
import { Link, useParams } from 'react-router-dom';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { InlineEditField } from '@/tailadmin/ui/InlineEditField';
import { RecordTimeline } from '@/tailadmin/ui/RecordTimeline';

type Contato = ObjectRecord & {
  name?: { firstName?: string; lastName?: string } | null;
  emails?: { primaryEmail?: string } | null;
  phones?: { primaryPhoneNumber?: string } | null;
  jobTitle?: string | null;
  city?: string | null;
  createdAt?: string | null;
  company?: { id: string; name?: string | null } | null;
};

type LeadRelacionado = ObjectRecord & {
  name?: string | null;
  stage?: string | null;
  amount?: { amountMicros?: number | string | null } | null;
};

const formatBRL = (micros: number) =>
  (micros / 1_000_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const cardClass =
  'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5';

export const ContatoDetailPage = () => {
  const { id = '' } = useParams();

  const { record: contato, loading } = useFindOneRecord<Contato>({
    objectNameSingular: 'person',
    objectRecordId: id,
    recordGqlFields: {
      id: true,
      name: true,
      emails: true,
      phones: true,
      jobTitle: true,
      city: true,
      createdAt: true,
      company: { id: true, name: true },
    },
  });

  const { records: leads } = useFindManyRecords<LeadRelacionado>({
    objectNameSingular: 'opportunity',
    filter: { pointOfContactId: { eq: id } },
    recordGqlFields: { id: true, name: true, stage: true, amount: true },
    limit: 10,
  });

  const { updateOneRecord } = useUpdateOneRecord();
  const atualizar = async (patch: Record<string, unknown>) => {
    await updateOneRecord({
      objectNameSingular: 'person',
      idToUpdate: id,
      updateOneRecordInput: patch,
    });
  };

  if (loading || contato == null) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-48 animate-pulse" />
      </div>
    );
  }

  const nome =
    `${contato.name?.firstName ?? ''} ${contato.name?.lastName ?? ''}`.trim();
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <Link
        to="/contatos"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4 transition-colors"
      >
        ← Voltar para Contatos
      </Link>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Esquerda */}
        <div className="col-span-12 xl:col-span-8 space-y-4 md:space-y-6">
          {/* Cabeçalho */}
          <div className={cardClass}>
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold flex-shrink-0">
                {iniciais === '' ? '?' : iniciais}
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  {nome === '' ? '(Sem nome)' : nome}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {contato.jobTitle ?? ''}
                  {contato.company != null && (
                    <>
                      {typeof contato.jobTitle === 'string' &&
                      contato.jobTitle !== ''
                        ? ' · '
                        : ''}
                      <Link
                        to={`/empresas/${contato.company.id}`}
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {contato.company.name}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <RecordTimeline
            targetField="targetPersonId"
            recordId={id}
            criadoEm={contato.createdAt}
            rotuloCriacao="Contato criado"
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
                label="E-mail"
                value={contato.emails?.primaryEmail ?? ''}
                onSave={(v) => atualizar({ emails: { primaryEmail: v } })}
              />
              <InlineEditField
                label="Telefone"
                value={contato.phones?.primaryPhoneNumber ?? ''}
                onSave={(v) => atualizar({ phones: { primaryPhoneNumber: v } })}
              />
              <InlineEditField
                label="Cargo"
                value={contato.jobTitle ?? ''}
                onSave={(v) => atualizar({ jobTitle: v })}
              />
              <InlineEditField
                label="Cidade"
                value={contato.city ?? ''}
                onSave={(v) => atualizar({ city: v })}
              />
            </div>
          </div>

          {/* Leads relacionados */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Leads relacionados
            </h3>
            {leads.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum lead vinculado.</p>
            ) : (
              <ul className="space-y-2">
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
