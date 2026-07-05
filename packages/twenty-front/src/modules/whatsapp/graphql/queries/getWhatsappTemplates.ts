import { gql } from '@apollo/client';

export const GET_WHATSAPP_TEMPLATES = gql`
  query GetWhatsappTemplates {
    whatsappTemplates {
      id
      name
      status
      language
      category
      components {
        type
        text
      }
    }
  }
`;
