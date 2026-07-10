// FORK: Voka CRM — Fase 9: fetch conversation thread list for Inbox
import { gql } from '@apollo/client';

export const GET_WHATSAPP_THREADS = gql`
  query GetWhatsappThreads {
    whatsappThreads {
      contactId
      phoneNumber
      contactName
      personId
      opportunityId
      botPaused
      unreadCount
      channelType
      assignedUserId
      assignedUserName
      lastMessage {
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
        channelType
      }
    }
  }
`;
