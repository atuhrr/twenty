// FORK: Zellate — F1 Financeiro: GraphQL do front
import { gql } from '@apollo/client';

export const FINANCEIRO_STATUS = gql`
  query FinanceiroStatus {
    financeiroStatus {
      conectado
      nomeConta
      ambiente
      statusConta
    }
  }
`;

export const CONECTAR_FINANCEIRO = gql`
  mutation ConectarFinanceiro($input: ConectarFinanceiroInput!) {
    conectarFinanceiro(input: $input) {
      conectado
      nomeConta
      ambiente
      statusConta
    }
  }
`;

export const FATURAS = gql`
  query Faturas {
    faturas {
      id
      numero
      leadId
      clienteNome
      clienteTelefone
      descricao
      valorCentavos
      vencimento
      meios
      status
      linkPagamento
      pixPayload
      pagaEm
      formaPagamento
      createdAt
    }
  }
`;

export const FATURA_RESUMO = gql`
  query FaturaResumo {
    faturaResumo {
      vencidasCentavos
      aVencer30dCentavos
      tempoMedioDias
      recebidoMesCentavos
    }
  }
`;

export const CRIAR_FATURA = gql`
  mutation CriarFatura($input: CriarFaturaInput!) {
    criarFatura(input: $input) {
      id
      numero
      pixPayload
      linkPagamento
    }
  }
`;

export const CANCELAR_FATURA = gql`
  mutation CancelarFatura($faturaId: String!) {
    cancelarFatura(faturaId: $faturaId)
  }
`;

export const ENVIAR_FATURA_WHATSAPP = gql`
  mutation EnviarFaturaWhatsapp($faturaId: String!) {
    enviarFaturaWhatsapp(faturaId: $faturaId)
  }
`;
