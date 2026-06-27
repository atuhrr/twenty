// FORK: Voka CRM — Fase 12
import { useMutation, useQuery } from '@apollo/client/react';

import {
  GET_BROADCAST_CAMPAIGN_RECIPIENTS,
  GET_BROADCAST_CAMPAIGNS,
} from '@/broadcast/graphql/queries/getBroadcastCampaigns';
import {
  CANCEL_BROADCAST_CAMPAIGN,
  CREATE_BROADCAST_CAMPAIGN,
  LAUNCH_BROADCAST_CAMPAIGN,
} from '@/broadcast/graphql/mutations/broadcastMutations';

export type BroadcastCampaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  templateName: string | null;
  languageCode: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BroadcastRecipient = {
  id: string;
  campaignId: string;
  contactId: string | null;
  phoneNumber: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  errorMessage: string | null;
};

export const useBroadcastCampaigns = () => {
  const { data, loading, refetch } = useQuery<{
    broadcastCampaigns: BroadcastCampaign[];
  }>(GET_BROADCAST_CAMPAIGNS, { fetchPolicy: 'cache-and-network' });

  return { campaigns: data?.broadcastCampaigns ?? [], loading, refetch };
};

export const useBroadcastCampaignRecipients = (campaignId: string | null) => {
  const { data, loading } = useQuery<{
    broadcastCampaignRecipients: BroadcastRecipient[];
  }>(GET_BROADCAST_CAMPAIGN_RECIPIENTS, {
    variables: { campaignId },
    skip: !campaignId,
    fetchPolicy: 'cache-and-network',
  });

  return { recipients: data?.broadcastCampaignRecipients ?? [], loading };
};

export const useCreateBroadcastCampaign = () => {
  const [create, { loading }] = useMutation(CREATE_BROADCAST_CAMPAIGN, {
    refetchQueries: [{ query: GET_BROADCAST_CAMPAIGNS }],
  });

  return { create, loading };
};

export const useLaunchBroadcastCampaign = () => {
  const [launch, { loading }] = useMutation(LAUNCH_BROADCAST_CAMPAIGN, {
    refetchQueries: [{ query: GET_BROADCAST_CAMPAIGNS }],
  });

  return { launch, loading };
};

export const useCancelBroadcastCampaign = () => {
  const [cancel] = useMutation(CANCEL_BROADCAST_CAMPAIGN, {
    refetchQueries: [{ query: GET_BROADCAST_CAMPAIGNS }],
  });

  return { cancel };
};
