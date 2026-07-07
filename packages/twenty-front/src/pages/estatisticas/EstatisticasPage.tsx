// FORK: Voka CRM — T-7: Estatísticas unificadas (5 abas, ApexCharts, TailAdmin)
import { useMemo, useState } from 'react';

import { useAnaliseGanhoPerda } from '@/analytics/hooks/useAnaliseGanhoPerda';
import type { PeriodFilter } from '@/analytics/hooks/useDashboardStats';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { AbaConversao } from '~/pages/estatisticas/components/AbaConversao';
import { AbaEquipe } from '~/pages/estatisticas/components/AbaEquipe';
import { AbaFunil } from '~/pages/estatisticas/components/AbaFunil';
import { AbaRoi } from '~/pages/estatisticas/components/AbaRoi';
import { AbaVisaoGeral } from '~/pages/estatisticas/components/AbaVisaoGeral';
import {
  baixarCsv,
  dentroDoPeriodo,
  leadValor,
  montarFunilFallback,
  PERIODOS,
  type LeadRecord,
} from '~/pages/estatisticas/estatisticasShared';

type Aba = 'visao-geral' | 'funil' | 'conversao' | 'equipe' | 'roi';

const ABAS: { key: Aba; label: string }[] = [
  { key: 'visao-geral', label: 'Visão Geral' },
  { key: 'funil', label: 'Funil' },
  { key: 'conversao', label: 'Conversão' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'roi', label: 'ROI' },
];

export function EstatisticasPage() {
  const [aba, setAba] = useState<Aba>('visao-geral');
  const [periodo, setPeriodo] = useState<PeriodFilter>('mes');

  const { records, loading: leadsLoading } = useFindManyRecords<LeadRecord>({
    objectNameSingular: 'opportunity',
    recordGqlFields: {
      id: true,
      name: true,
      stage: true,
      amount: true,
      closeDate: true,
      createdAt: true,
      createdBy: true,
    },
    limit: 500,
  });
  const leads = records;

  const { stats: ganhoPerdaApi, loading: ganhoPerdaLoading } =
    useAnaliseGanhoPerda(periodo);

  // Fallback client-side quando a API analiseGanhoPerda não está disponível:
  // monta o funil a partir dos próprios leads (filtrados pelo período).
  const ganhoPerda = useMemo(() => {
    if ((ganhoPerdaApi?.porEtapa?.length ?? 0) > 0) return ganhoPerdaApi;
    const leadsDoPeriodo =
      periodo === 'tudo'
        ? leads
        : leads.filter((l) => dentroDoPeriodo(l.createdAt, periodo));
    return montarFunilFallback(leadsDoPeriodo);
  }, [ganhoPerdaApi, leads, periodo]);

  const exportarCsv = () => {
    const linhas: string[][] = [
      ['Estatísticas Voka CRM'],
      ['Período', PERIODOS.find((p) => p.key === periodo)?.label ?? periodo],
      [],
      ['KPIs'],
      [
        'Leads criados',
        String(
          leads.filter((l) => dentroDoPeriodo(l.createdAt, periodo)).length,
        ),
      ],
      [
        'Leads ganhos',
        String(
          leads.filter(
            (l) =>
              l.stage === 'WON' &&
              dentroDoPeriodo(l.closeDate ?? l.createdAt, periodo),
          ).length,
        ),
      ],
      [
        'Receita total (R$)',
        leads
          .filter(
            (l) =>
              l.stage === 'WON' &&
              dentroDoPeriodo(l.closeDate ?? l.createdAt, periodo),
          )
          .reduce((s, l) => s + leadValor(l), 0)
          .toFixed(2)
          .replace('.', ','),
      ],
      [],
      ['Funil por etapa'],
      [
        'Etapa',
        'Entraram',
        'Na etapa',
        'Perdidos',
        'Taxa de conversão (%)',
        'Valor total (R$)',
      ],
      ...(ganhoPerda?.porEtapa ?? []).map((e) => [
        e.etapaNome,
        String(e.entrouNaEtapa.leads),
        String(e.dentroDaEtapa.leads),
        String(e.perdidoNaEtapa.leads),
        String(Math.round(e.taxaConversao)),
        e.dentroDaEtapa.valor.toFixed(2).replace('.', ','),
      ]),
    ];
    const hoje = new Date().toISOString().split('T')[0];
    baixarCsv(`estatisticas-${periodo}-${hoje}.csv`, linhas);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
            Estatísticas
          </h1>

          {/* Abas */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {ABAS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAba(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  aba === key
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Período (não se aplica à aba ROI) */}
          {aba !== 'roi' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {PERIODOS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriodo(key)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    periodo === key
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Exportar CSV */}
          <button
            onClick={exportarCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-4 md:p-6">
        {aba === 'visao-geral' && (
          <AbaVisaoGeral
            leads={leads}
            loading={leadsLoading}
            periodo={periodo}
          />
        )}
        {aba === 'funil' && (
          <AbaFunil stats={ganhoPerda} loading={ganhoPerdaLoading} />
        )}
        {aba === 'conversao' && (
          <AbaConversao
            leads={leads}
            stats={ganhoPerda}
            loading={leadsLoading || ganhoPerdaLoading}
          />
        )}
        {aba === 'equipe' && <AbaEquipe leads={leads} loading={leadsLoading} />}
        {aba === 'roi' && <AbaRoi />}
      </div>
    </div>
  );
}
