// FORK: Voka CRM — Fase 9: thread list for the 3-panel Inbox
import { useQuery } from '@apollo/client/react';

import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';
import { GET_WHATSAPP_THREADS } from '@/whatsapp/graphql/queries/getWhatsappThreads';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

export type WhatsappThread = {
  contactId: string;
  phoneNumber: string | null;
  unreadCount: number;
  channelType: string;
  lastMessage: WhatsappMessage;
  assignedUserId: string | null;
  assignedUserName: string | null;
};

const MOCK_THREADS: WhatsappThread[] = []; // mock mode threads come from InboxPage hardcoded data

export const useWhatsappThreads = () => {
  const { data, loading, refetch } = useQuery<{
    whatsappThreads: WhatsappThread[];
  }>(GET_WHATSAPP_THREADS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 15_000, // poll every 15s until SSE is wired up
    skip: IS_WHATSAPP_MOCK,
  });

  if (IS_WHATSAPP_MOCK) {
    return { threads: MOCK_THREADS, loading: false, refetch: async () => {} };
  }

  return {
    threads: data?.whatsappThreads ?? [],
    loading,
    refetch,
  };
};
