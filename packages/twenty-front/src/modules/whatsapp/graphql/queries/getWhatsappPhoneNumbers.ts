import { gql } from '@apollo/client';

export const GET_WHATSAPP_PHONE_NUMBERS = gql`
  query GetWhatsappPhoneNumbers {
    whatsappPhoneNumbers {
      id
      wabaId
      phoneNumberId
      displayPhoneNumber
      label
      isDefault
      connectionStatus
      createdAt
    }
  }
`;
