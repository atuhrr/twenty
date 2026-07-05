// FORK: Voka CRM — Fase 20.6: hook de análise ganho-perda
import { useQuery } from '@apollo/client/react';

import { GET_ANALISE_GANHO_PERDA } from '@/analytics/graphql/queries/analiseGanhoPerda';
import { type PeriodFilter } from '@/analytics/hooks/useDashboardStats';

export type LeadValor = { leads: number; valor: number };

export type EtapaStats = {
  etapaNome: string;
  dentroDaEtapa: LeadValor;
  entrouNaEtapa: LeadValor;
  perdidoNaEtapa: LeadValor;
  taxaConversao: number;
};

export type VendaProspectiva = {
  etapaNome: string;
  valorPonderado: number;
};

export type GanhoPerdaStats = {
  porEtapa: EtapaStats[];
  totalGanho: LeadValor;
  totalPerdido: LeadValor;
  cicloVidaMedioEmDias: number;
  vendasProspectivas: VendaProspectiva[];
};

export const useAnaliseGanhoPerda = (period: PeriodFilter) => {
  const { data, loading, error } = useQuery<{
    analiseGanhoPerda: GanhoPerdaStats;
  }>(GET_ANALISE_GANHO_PERDA, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
  });

  return {
    stats:   data?.analiseGanhoPerda ?? null,
    loading,
    error,
  };
};
