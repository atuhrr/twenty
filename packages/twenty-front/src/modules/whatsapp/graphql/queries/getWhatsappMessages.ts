import { gql } from '@apollo/client';

export const GET_WHATSAPP_MESSAGES = gql`
  query WhatsappMessages($contactId: String!) {
    whatsappMessages(contactId: $contactId) {
      id
      contactId
      direction
      type
      content
      mediaUrl
      externalMessageId
      status
      timestamp
      createdAt
    }
  }
`;
