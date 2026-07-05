// FORK: Voka CRM — Fase 20.3: query do painel de estatísticas
import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($period: PeriodFilter!) {
    dashboardStats(period: $period) {
      mensagensRecebidas
      conversasEmAndamento
      conversasSemResposta
      tempoMedioResposta
      maiorTempoAguardando
      leadsGanhos
      valorLeadsGanhos
      leadsAtivos
      valorLeadsAtivos
      tarefas
      fontesDeLead {
        nome
        quantidade
      }
      porCanal {
        canal
        quantidade
      }
    }
  }
`;
