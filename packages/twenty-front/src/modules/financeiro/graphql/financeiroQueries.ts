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
      nfseStatus
      nfsePdfUrl
      nfseErro
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

// ── F2: configuração de cobrança automática ──

export const FINANCEIRO_CONFIG = gql`
  query FinanceiroConfig {
    financeiroConfig {
      jurosPadraoPercent
      multaPadraoPercent
      reguaAtiva
      reguaDiasAntes
      reguaDiasDepois
      templateLembrete
      nfseAtiva
      nfseMomento
      nfseCodigoServico
      nfseNomeServico
      nfseAliquotaIss
      nfseDescricaoPadrao
    }
  }
`;

export const ATUALIZAR_FINANCEIRO_CONFIG = gql`
  mutation AtualizarFinanceiroConfig($input: AtualizarFinanceiroConfigInput!) {
    atualizarFinanceiroConfig(input: $input)
  }
`;

// ── F2: assinaturas (recorrência) ──

export const ASSINATURAS = gql`
  query Assinaturas {
    assinaturas {
      id
      leadId
      clienteNome
      descricao
      valorCentavos
      ciclo
      proximoVencimento
      meios
      status
      createdAt
    }
  }
`;

export const CRIAR_ASSINATURA = gql`
  mutation CriarAssinatura($input: CriarAssinaturaInput!) {
    criarAssinatura(input: $input) {
      id
    }
  }
`;

export const PAUSAR_ASSINATURA = gql`
  mutation PausarAssinatura($assinaturaId: String!) {
    pausarAssinatura(assinaturaId: $assinaturaId)
  }
`;

export const RETOMAR_ASSINATURA = gql`
  mutation RetomarAssinatura($assinaturaId: String!, $proximoVencimento: String!) {
    retomarAssinatura(assinaturaId: $assinaturaId, proximoVencimento: $proximoVencimento)
  }
`;

export const CANCELAR_ASSINATURA = gql`
  mutation CancelarAssinatura($assinaturaId: String!) {
    cancelarAssinatura(assinaturaId: $assinaturaId)
  }
`;

// ── F2: estatísticas de receita ──

export const RECEITA_STATS = gql`
  query ReceitaStats {
    receitaStats {
      recebidoPorMes {
        mes
        centavos
      }
      inadimplenciaPercent
      ticketMedioCentavos
      previsaoMesCentavos
      topClientes {
        nome
        centavos
      }
    }
  }
`;

// ── F3: NFS-e ──

export const SERVICOS_MUNICIPAIS = gql`
  query ServicosMunicipais($busca: String!) {
    servicosMunicipais(busca: $busca) {
      id
      descricao
      issPadrao
    }
  }
`;

export const EMITIR_NFSE = gql`
  mutation EmitirNfse($faturaId: String!) {
    emitirNfse(faturaId: $faturaId)
  }
`;

export const ATUALIZAR_STATUS_NFSE = gql`
  mutation AtualizarStatusNfse($faturaId: String!) {
    atualizarStatusNfse(faturaId: $faturaId)
  }
`;

export const ENVIAR_NFSE_WHATSAPP = gql`
  mutation EnviarNfseWhatsapp($faturaId: String!) {
    enviarNfseWhatsapp(faturaId: $faturaId)
  }
`;
