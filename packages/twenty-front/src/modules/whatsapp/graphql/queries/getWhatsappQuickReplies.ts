// FORK: Voka CRM — Fase 11
import { gql } from '@apollo/client';

export const GET_WHATSAPP_QUICK_REPLIES = gql`
  query GetWhatsappQuickReplies {
    whatsappQuickReplies {
      id
      shortcut
      title
      content
      createdAt
    }
  }
`;
