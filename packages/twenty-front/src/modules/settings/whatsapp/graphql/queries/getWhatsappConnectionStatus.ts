import { gql } from '@apollo/client';

export const GET_WHATSAPP_CONNECTION_STATUS = gql`
  query WhatsappConnectionStatus {
    whatsappConnectionStatus {
      status
      displayPhoneNumber
    }
  }
`;
