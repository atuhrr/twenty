// FORK: Voka CRM — Fase 20.6: query de análise ganho-perda
import { gql } from '@apollo/client';

export const GET_ANALISE_GANHO_PERDA = gql`
  query GetAnaliseGanhoPerda($period: PeriodFilter!) {
    analiseGanhoPerda(period: $period) {
      porEtapa {
        etapaNome
        dentroDaEtapa {
          leads
          valor
        }
        entrouNaEtapa {
          leads
          valor
        }
        perdidoNaEtapa {
          leads
          valor
        }
        taxaConversao
      }
      totalGanho {
        leads
        valor
      }
      totalPerdido {
        leads
        valor
      }
      cicloVidaMedioEmDias
      vendasProspectivas {
        etapaNome
        valorPonderado
      }
    }
  }
`;
