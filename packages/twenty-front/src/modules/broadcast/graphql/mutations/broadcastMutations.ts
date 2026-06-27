// FORK: Voka CRM — Fase 12
import { gql } from '@apollo/client';

export const CREATE_BROADCAST_CAMPAIGN = gql`
  mutation CreateBroadcastCampaign($input: CreateBroadcastCampaignInput!) {
    createBroadcastCampaign(input: $input) {
      id
      name
      status
      totalCount
      createdAt
    }
  }
`;

export const LAUNCH_BROADCAST_CAMPAIGN = gql`
  mutation LaunchBroadcastCampaign($campaignId: String!) {
    launchBroadcastCampaign(campaignId: $campaignId) {
      id
      status
      startedAt
    }
  }
`;

export const CANCEL_BROADCAST_CAMPAIGN = gql`
  mutation CancelBroadcastCampaign($campaignId: String!) {
    cancelBroadcastCampaign(campaignId: $campaignId)
  }
`;
