// FORK: Voka CRM — Fase 2: queries e mutations
import { gql } from '@apollo/client';

// ── Motivo de Perda ───────────────────────────────────────────────────────────

export const GET_MOTIVOS_PERDA = gql`
  query GetMotivosPerda {
    motivosPerda { id nome ativo }
  }
`;

export const CREATE_MOTIVO_PERDA = gql`
  mutation CreateMotivoPerda($input: CreateMotivoPerdaInput!) {
    createMotivoPerda(input: $input) { id nome ativo }
  }
`;

export const DELETE_MOTIVO_PERDA = gql`
  mutation DeleteMotivoPerda($id: String!) {
    deleteMotivoPerda(id: $id)
  }
`;

// ── Produto / Catálogo ────────────────────────────────────────────────────────

export const GET_PRODUTOS = gql`
  query GetProdutos($apenasAtivos: Boolean) {
    produtos(apenasAtivos: $apenasAtivos) {
      id nome descricao preco unidade sku ativo categoria imagens createdAt
    }
  }
`;

export const CREATE_PRODUTO = gql`
  mutation CreateProduto($input: CreateProdutoInput!) {
    createProduto(input: $input) {
      id nome descricao preco unidade sku ativo categoria createdAt
    }
  }
`;

export const UPDATE_PRODUTO = gql`
  mutation UpdateProduto($input: UpdateProdutoInput!) {
    updateProduto(input: $input) {
      id nome descricao preco unidade sku ativo categoria updatedAt
    }
  }
`;

export const DELETE_PRODUTO = gql`
  mutation DeleteProduto($id: String!) {
    deleteProduto(id: $id)
  }
`;

// ── F3: Itens de negócio (produto vinculado ao lead) ─────────────────────────

const LEAD_PRODUTO_FIELDS = `
  id leadId produtoId produtoNome produtoUnidade quantidade preco desconto subtotal
`;

export const GET_LEAD_PRODUTOS = gql`
  query LeadProdutos($leadId: String!) {
    leadProdutos(leadId: $leadId) { ${LEAD_PRODUTO_FIELDS} }
  }
`;

export const ADD_LEAD_PRODUTO = gql`
  mutation AddLeadProduto($input: AddLeadProdutoInput!) {
    addLeadProduto(input: $input) { ${LEAD_PRODUTO_FIELDS} }
  }
`;

export const UPDATE_LEAD_PRODUTO = gql`
  mutation UpdateLeadProduto($input: UpdateLeadProdutoInput!) {
    updateLeadProduto(input: $input) { ${LEAD_PRODUTO_FIELDS} }
  }
`;

export const REMOVE_LEAD_PRODUTO = gql`
  mutation RemoveLeadProduto($id: String!) {
    removeLeadProduto(id: $id) { ${LEAD_PRODUTO_FIELDS} }
  }
`;

// ── Clientes Recorrentes ─────────────────────────────────────────────────────

export const GET_CLIENTES_RECORRENTES = gql`
  query GetClientesRecorrentes {
    clientesRecorrentes {
      id nome email telefone empresa periodicidade valorRecorrente
      proximoContato responsavelId tags observacoes createdAt updatedAt
    }
  }
`;

export const CREATE_CLIENTE_RECORRENTE = gql`
  mutation CreateClienteRecorrente($input: CreateClienteRecorrenteInput!) {
    createClienteRecorrente(input: $input) {
      id nome email telefone empresa periodicidade valorRecorrente
      proximoContato tags createdAt
    }
  }
`;

export const UPDATE_CLIENTE_RECORRENTE = gql`
  mutation UpdateClienteRecorrente($input: UpdateClienteRecorrenteInput!) {
    updateClienteRecorrente(input: $input) {
      id nome email telefone empresa periodicidade valorRecorrente
      proximoContato tags updatedAt
    }
  }
`;

export const DELETE_CLIENTE_RECORRENTE = gql`
  mutation DeleteClienteRecorrente($id: String!) {
    deleteClienteRecorrente(id: $id)
  }
`;

// ── Notificações ──────────────────────────────────────────────────────────────

export const GET_VOKA_NOTIFICATIONS = gql`
  query GetVokaNotifications($apenasNaoLidas: Boolean, $limit: Int) {
    vokaNotifications(apenasNaoLidas: $apenasNaoLidas, limit: $limit) {
      id tipo titulo corpo link lida createdAt
    }
  }
`;

export const GET_VOKA_NOTIFICATIONS_COUNT = gql`
  query GetVokaNotificationsUnreadCount {
    vokaNotificationsUnreadCount
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllVokaNotificationsAsRead {
    markAllVokaNotificationsAsRead
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkVokaNotificationAsRead($id: String!) {
    markVokaNotificationAsRead(id: $id)
  }
`;
