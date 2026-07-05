import { gql } from '@apollo/client';

export const SET_DEFAULT_WHATSAPP_PHONE_NUMBER = gql`
  mutation SetDefaultWhatsappPhoneNumber($instanceId: String!) {
    setDefaultWhatsappPhoneNumber(instanceId: $instanceId)
  }
`;

export const DELETE_WHATSAPP_PHONE_NUMBER = gql`
  mutation DeleteWhatsappPhoneNumber($instanceId: String!) {
    deleteWhatsappPhoneNumber(instanceId: $instanceId)
  }
`;

export const UPDATE_WHATSAPP_PHONE_NUMBER_LABEL = gql`
  mutation UpdateWhatsappPhoneNumberLabel($input: UpdateWhatsappPhoneNumberInput!) {
    updateWhatsappPhoneNumberLabel(input: $input)
  }
`;
