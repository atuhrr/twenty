import { gql } from '@apollo/client';

export const GET_LAST_WHATSAPP_MESSAGE = gql`
  query LastWhatsappMessage($contactId: String!) {
    lastWhatsappMessage(contactId: $contactId) {
      id
      direction
      type
      content
      timestamp
    }
  }
`;
