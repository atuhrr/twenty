import { gql } from '@apollo/client';

export const SEND_WHATSAPP_MESSAGE = gql`
  mutation SendWhatsappMessage($input: SendWhatsappMessageInput!) {
    sendWhatsappMessage(input: $input) {
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
