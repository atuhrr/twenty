// FORK: Voka CRM — T-12: detalhe do Lead (2 colunas, TailAdmin)
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { InlineEditField } from '@/tailadmin/ui/InlineEditField';
import { RecordPicker } from '@/tailadmin/ui/RecordPicker';
import { RecordTimeline } from '@/tailadmin/ui/RecordTimeline';
import { ItensDoNegocio } from '~/pages/leads/ItensDoNegocio';

type EmpresaOpcao = ObjectRecord & { name?: string | null };
type PessoaOpcao = ObjectRecord & {
  name?: { firstName?: string; lastName?: string } | null;
};

const nomePessoa = (p: {
  name?: { firstName?: string; lastName?: string } | null;
}) => `${p.name?.firstName ?? ''} ${p.name?.lastName ?? ''}`.trim();

type Lead = ObjectRecord & {
  name?: string | null;
  amount?: {
    amountMicros?: number | string | null;
    currencyCode?: string;
  } | null;
  stage?: string | null;
  closeDate?: string | null;
  createdAt?: string | null;
  createdBy?: { name?: string | null } | null;
  company?: { id: string; name?: string | null; domainName?: unknown } | null;
  pointOfContact?: {
    id: string;
    name?: { firstName?: string; lastName?: string } | null;
    emails?: { primaryEmail?: string } | null;
    phones?: { primaryPhoneNumber?: string } | null;
  } | null;
};

type TaskTarget = ObjectRecord & {
  task?: {
    id: string;
    title?: string | null;
    status?: string | null;
    dueAt?: string | null;
  } | null;
};

const formatBRL = (micros: number) =>
  (micros / 1_000_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

const cardClass =
  'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5';

export const LeadDetailPage = () => {
  const { id = '' } = useParams();

  const { record: lead, loading, refetch } = useFindOneRecord<Lead>({
    objectNameSingular: 'opportunity',
    objectRecordId: id,
    recordGqlFields: {
      id: true,
      name: true,
      amount: true,
      stage: true,
      closeDate: true,
      createdAt: true,
      createdBy: true,
      company: { id: true, name: true },
      pointOfContact: { id: true, name: true, emails: true, phones: true },
    },
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'opportunity',
  });
  const stageOptions = useMemo(() => {
    const field = objectMetadataItem.fields.find((f) => f.name === 'stage');
    return [...(field?.options ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((o) => ({ value: o.value, label: o.label }));
  }, [objectMetadataItem]);

  const { records: taskTargets } = useFindManyRecords<TaskTarget>({
    objectNameSingular: 'taskTarget',
    filter: { targetOpportunityId: { eq: id } },
    recordGqlFields: {
      id: true,
      task: { id: true, title: true, status: true, dueAt: true },
    },
    limit: 10,
  });
  const proximasTarefas = taskTargets
    .map((tt) => tt.task)
    .filter((t): t is NonNullable<TaskTarget['task']> => t != null)
    .filter((t) => t.status !== 'CONCLUIDO')
    .slice(0, 3);

  const atualizar = async (patch: Record<string, unknown>) => {
    await updateOneRecord({
      objectNameSingular: 'opportunity',
      idToUpdate: id,
      updateOneRecordInput: patch,
    });
  };

  // Associações do grafo: vincular/desvincular empresa e contato do lead
  const associar = async (patch: Record<string, unknown>) => {
    await atualizar(patch);
    await refetch();
  };

  // F2: mudar a etapa; ao GANHAR, a empresa vinculada vira CLIENTE
  const definirEtapa = async (stage: string) => {
    await atualizar({ stage });
    const companyId = lead?.company?.id;
    if (stage === 'GANHO' && companyId != null) {
      await updateOneRecord({
        objectNameSingular: 'company',
        idToUpdate: companyId,
        updateOneRecordInput: { lifecycleStage: 'CLIENTE' },
      });
    }
  };

  if (loading || lead == null) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-48 animate-pulse" />
      </div>
    );
  }

  const micros = Number(lead.amount?.amountMicros ?? 0);
  const contato = lead.pointOfContact;
  const nomeContato =
    contato != null
      ? `${contato.name?.firstName ?? ''} ${contato.name?.lastName ?? ''}`.trim()
      : '';
  const responsavel = lead.createdBy?.name ?? '—';

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      {/* Voltar */}
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4 transition-colors"
      >
        ← Voltar para Leads
      </Link>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Coluna esquerda */}
        <div className="col-span-12 xl:col-span-8 space-y-4 md:space-y-6">
          {/* Cabeçalho */}
          <div className={cardClass}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  {lead.name || '(Sem nome)'}
                </h1>
                {lead.company != null && (
                  <Link
                    to={`/empresas/${lead.company.id}`}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {lead.company.name}
                  </Link>
                )}
                {micros > 0 && (
                  <p className="text-3xl font-bold text-brand-500 mt-2">
                    {formatBRL(micros)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                  {iniciais(responsavel)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {responsavel}
                </span>
              </div>
            </div>

            {/* Etapa + ações */}
            <div className="flex items-center gap-3 flex-wrap mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <select
                value={lead.stage ?? ''}
                onChange={(e) => void definirEtapa(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                {stageOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="flex-1" />
              <button
                onClick={() => void definirEtapa('GANHO')}
                className="px-3 py-1.5 text-sm font-medium bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
              >
                Marcar como ganho
              </button>
            </div>
          </div>

          {/* F3: Itens do negócio (Catálogo → valor do negócio → fatura) */}
          <ItensDoNegocio
            leadId={id}
            leadNome={lead.name ?? 'Lead'}
            onValorMudou={() => void refetch()}
          />

          {/* Timeline */}
          <RecordTimeline
            targetField="targetOpportunityId"
            recordId={id}
            criadoEm={lead.createdAt}
            rotuloCriacao="Lead criado"
          />
        </div>

        {/* Coluna direita */}
        <div className="col-span-12 xl:col-span-4 space-y-4 md:space-y-6">
          {/* Informações */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Informações
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InlineEditField
                label="Nome"
                value={lead.name ?? ''}
                onSave={(v) => atualizar({ name: v })}
              />
              <InlineEditField
                label="Valor"
                value={String(micros / 1_000_000)}
                type="currency"
                onSave={(v) =>
                  atualizar({
                    amount: {
                      amountMicros: Math.round(Number(v) * 1_000_000),
                      currencyCode: 'BRL',
                    },
                  })
                }
              />
              <InlineEditField
                label="Etapa"
                value={lead.stage ?? ''}
                type="select"
                options={stageOptions}
                onSave={(v) => atualizar({ stage: v })}
              />
              <InlineEditField
                label="Data de fechamento"
                value={lead.closeDate ?? ''}
                type="date"
                onSave={(v) =>
                  atualizar({
                    closeDate: v === '' ? null : new Date(v).toISOString(),
                  })
                }
              />
            </div>
          </div>

          {/* Contato */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Contato
              </h3>
              <RecordPicker<PessoaOpcao>
                objectNameSingular="person"
                recordGqlFields={{ id: true, name: true }}
                labelOf={(p) => nomePessoa(p)}
                currentLabel={nomeContato}
                onSelect={(pid) => associar({ pointOfContactId: pid })}
                placeholder="Buscar contato…"
              />
            </div>
            {contato != null ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {iniciais(nomeContato === '' ? '?' : nomeContato)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {nomeContato === '' ? '(Sem nome)' : nomeContato}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contato.emails?.primaryEmail ??
                        contato.phones?.primaryPhoneNumber ??
                        ''}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/contatos/${contato.id}`}
                  className="block mt-3 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Ver perfil →
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-400">Nenhum contato vinculado.</p>
            )}
          </div>

          {/* Empresa */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Empresa
              </h3>
              <RecordPicker<EmpresaOpcao>
                objectNameSingular="company"
                recordGqlFields={{ id: true, name: true }}
                labelOf={(e) => e.name ?? ''}
                currentLabel={lead.company?.name ?? ''}
                onSelect={(cid) => associar({ companyId: cid })}
                placeholder="Buscar empresa…"
              />
            </div>
            {lead.company != null ? (
              <Link
                to={`/empresas/${lead.company.id}`}
                className="block text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                {lead.company.name} →
              </Link>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma empresa vinculada.</p>
            )}
          </div>

          {/* Tarefas */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Próximas tarefas
              </h3>
              <Link
                to="/tarefas"
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Tarefa
              </Link>
            </div>
            {proximasTarefas.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma tarefa pendente.</p>
            ) : (
              <ul className="space-y-2">
                {proximasTarefas.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning-500 flex-shrink-0" />
                    <span className="flex-1 text-gray-800 dark:text-white/90 truncate">
                      {t.title ?? '(sem título)'}
                    </span>
                    {typeof t.dueAt === 'string' && t.dueAt !== '' && (
                      <span className="text-xs text-gray-400">
                        {new Date(t.dueAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
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
