import { gql } from '@apollo/client';

export const CONNECT_WHATSAPP = gql`
  mutation ConnectWhatsapp($input: ConnectWhatsappInput!) {
    connectWhatsapp(input: $input) {
      status
      displayPhoneNumber
    }
  }
`;
