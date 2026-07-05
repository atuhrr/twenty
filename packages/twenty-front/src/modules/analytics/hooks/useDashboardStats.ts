// FORK: Voka CRM — Fase 20.3: hook do painel de estatísticas
import { useQuery } from '@apollo/client/react';

import { GET_DASHBOARD_STATS } from '@/analytics/graphql/queries/dashboardStats';

export type PeriodFilter =
  | 'hoje'
  | 'ontem'
  | 'semana'
  | 'mes'
  | 'tudo';

export type CanalCount = { canal: string; quantidade: number };
export type FonteCount = { nome: string; quantidade: number };

export type DashboardStats = {
  mensagensRecebidas: number;
  conversasEmAndamento: number;
  conversasSemResposta: number;
  tempoMedioResposta: number;
  maiorTempoAguardando: number;
  leadsGanhos: number;
  valorLeadsGanhos: number;
  leadsAtivos: number;
  valorLeadsAtivos: number;
  tarefas: number;
  fontesDeLead: FonteCount[];
  porCanal: CanalCount[];
};

export const useDashboardStats = (period: PeriodFilter) => {
  const { data, loading, error, refetch } = useQuery<{
    dashboardStats: DashboardStats;
  }>(GET_DASHBOARD_STATS, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
  });

  return {
    stats:   data?.dashboardStats ?? null,
    loading,
    error,
    refetch,
  };
};
