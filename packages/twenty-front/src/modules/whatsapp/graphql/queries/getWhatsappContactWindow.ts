import { gql } from '@apollo/client';

export const GET_WHATSAPP_CONTACT_WINDOW = gql`
  query WhatsappContactWindow($contactId: String!) {
    whatsappContactWindow(contactId: $contactId) {
      contactId
      lastInboundAt
      isWindowOpen
    }
  }
`;
