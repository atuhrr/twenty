// FORK: Voka CRM — Fase 10
import { gql } from '@apollo/client';

export const GET_TEAM_CHAT_MESSAGES = gql`
  query GetTeamChatMessages($relatedRecordId: String) {
    teamChatMessages(relatedRecordId: $relatedRecordId) {
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
