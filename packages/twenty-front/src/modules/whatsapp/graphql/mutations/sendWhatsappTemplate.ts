import { gql } from '@apollo/client';

export const SEND_WHATSAPP_TEMPLATE = gql`
  mutation SendWhatsappTemplate($input: SendWhatsappTemplateInput!) {
    sendWhatsappTemplate(input: $input) {
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
