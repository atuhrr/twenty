// FORK: Voka CRM — Fase 20.7: query do relatório consolidado
import { gql } from '@apollo/client';

export const GET_RELATORIO_CONSOLIDADO = gql`
  query GetRelatorioConsolidado($period: PeriodFilter!, $granularidade: String) {
    relatorioConsolidado(period: $period, granularidade: $granularidade) {
      serieLeads {
        data
        quantidade
        valor
      }
      porEtapa {
        nome
        quantidade
        valor
        percentual
      }
      totalLeads
      valorTotal
      contatos {
        total
        porTipo {
          tipo
          quantidade
          percentual
        }
      }
      tarefas {
        total
        porStatus {
          status
          quantidade
          percentual
        }
      }
    }
  }
`;
