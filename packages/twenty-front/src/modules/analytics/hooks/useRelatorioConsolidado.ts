// FORK: Voka CRM — Fase 20.7: hook do relatório consolidado
import { useQuery } from '@apollo/client/react';

import { GET_RELATORIO_CONSOLIDADO } from '@/analytics/graphql/queries/relatorioConsolidado';
import { type PeriodFilter } from '@/analytics/hooks/useDashboardStats';

export type SerieLeads = { data: string; quantidade: number; valor: number };
export type EtapaResumo = { nome: string; quantidade: number; valor: number; percentual: number };
export type TipoContato = { tipo: string; quantidade: number; percentual: number };
export type StatusTarefa = { status: string; quantidade: number; percentual: number };

export type RelatorioConsolidado = {
  serieLeads:  SerieLeads[];
  porEtapa:    EtapaResumo[];
  totalLeads:  number;
  valorTotal:  number;
  contatos:    { total: number; porTipo: TipoContato[] };
  tarefas:     { total: number; porStatus: StatusTarefa[] };
};

export type GranularidadeType = 'DIA' | 'SEMANA' | 'MES';

export const useRelatorioConsolidado = (
  period: PeriodFilter,
  granularidade: GranularidadeType,
) => {
  const { data, loading, error } = useQuery<{
    relatorioConsolidado: RelatorioConsolidado;
  }>(GET_RELATORIO_CONSOLIDADO, {
    variables: { period, granularidade },
    fetchPolicy: 'cache-and-network',
  });

  return {
    relatorio: data?.relatorioConsolidado ?? null,
    loading,
    error,
  };
};
