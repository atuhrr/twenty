// FORK: Voka CRM — Fase 12
import { gql } from '@apollo/client';

export const GET_BROADCAST_CAMPAIGNS = gql`
  query GetBroadcastCampaigns {
    broadcastCampaigns {
      id
      name
      channel
      status
      templateName
      languageCode
      scheduledAt
      startedAt
      completedAt
      totalCount
      sentCount
      deliveredCount
      readCount
      failedCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_BROADCAST_CAMPAIGN_RECIPIENTS = gql`
  query GetBroadcastCampaignRecipients($campaignId: String!) {
    broadcastCampaignRecipients(campaignId: $campaignId) {
      id
      campaignId
      contactId
      phoneNumber
      status
      sentAt
      deliveredAt
      readAt
      errorMessage
    }
  }
`;
