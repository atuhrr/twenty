// FORK: Zellate — GraphQL do calendário (agenda de eventos)
import { gql } from '@apollo/client';

export const AGENDA_EVENTOS = gql`
  query AgendaEventos {
    agendaEventos {
      id
      titulo
      cor
      inicio
      fim
      leadId
    }
  }
`;

export const CRIAR_AGENDA_EVENTO = gql`
  mutation CriarAgendaEvento($input: CriarAgendaEventoInput!) {
    criarAgendaEvento(input: $input) {
      id
    }
  }
`;

export const ATUALIZAR_AGENDA_EVENTO = gql`
  mutation AtualizarAgendaEvento($input: AtualizarAgendaEventoInput!) {
    atualizarAgendaEvento(input: $input) {
      id
    }
  }
`;

export const EXCLUIR_AGENDA_EVENTO = gql`
  mutation ExcluirAgendaEvento($id: String!) {
    excluirAgendaEvento(id: $id)
  }
`;
