// FORK: Zellate — zera o não-lido da conversa ao abri-la no Inbox
import { gql } from '@apollo/client';

export const MARK_WHATSAPP_THREAD_READ = gql`
  mutation MarkWhatsappThreadRead($contactId: String!) {
    markWhatsappThreadRead(contactId: $contactId)
  }
`;
