// FORK: Zellate — pausa/retoma o salesbot para uma conversa específica
import { gql } from '@apollo/client';

export const SET_WHATSAPP_BOT_PAUSED = gql`
  mutation SetWhatsappBotPaused($contactId: String!, $paused: Boolean!) {
    setWhatsappBotPaused(contactId: $contactId, paused: $paused)
  }
`;
