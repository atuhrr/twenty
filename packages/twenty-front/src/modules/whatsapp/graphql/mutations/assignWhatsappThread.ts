// FORK: Voka CRM — Fase 11
import { gql } from '@apollo/client';

export const ASSIGN_WHATSAPP_THREAD = gql`
  mutation AssignWhatsappThread($input: AssignWhatsappThreadInput!) {
    assignWhatsappThread(input: $input)
  }
`;
