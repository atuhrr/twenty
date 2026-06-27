// FORK: Voka CRM — Fase 10
import { gql } from '@apollo/client';

export const SEND_TEAM_CHAT_MESSAGE = gql`
  mutation SendTeamChatMessage($input: SendTeamChatMessageInput!) {
    sendTeamChatMessage(input: $input) {
      id
      senderId
      senderName
      relatedRecordId
      relatedRecordType
      content
      createdAt
    }
  }
`;
