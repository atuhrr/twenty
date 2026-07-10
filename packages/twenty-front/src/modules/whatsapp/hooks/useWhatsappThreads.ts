// FORK: Voka CRM — Fase 9: thread list — SSE real-time (no polling)
import { useCallback } from 'react';
import { useQuery } from '@apollo/client/react';

import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';
import { GET_WHATSAPP_THREADS } from '@/whatsapp/graphql/queries/getWhatsappThreads';
import { useWhatsappSSE } from '@/whatsapp/hooks/useWhatsappSSE';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

export type WhatsappThread = {
  contactId: string;
  phoneNumber: string | null;
  contactName: string | null;
  personId: string | null;
  opportunityId: string | null;
  botPaused: boolean;
  unreadCount: number;
  channelType: string;
  lastMessage: WhatsappMessage;
  assignedUserId: string | null;
  assignedUserName: string | null;
};

const MOCK_THREADS: WhatsappThread[] = [];

export const useWhatsappThreads = () => {
  const { data, loading, refetch } = useQuery<{
    whatsappThreads: WhatsappThread[];
  }>(GET_WHATSAPP_THREADS, {
    fetchPolicy: 'cache-and-network',
    skip: IS_WHATSAPP_MOCK,
  });

  const handleSSEMessage = useCallback(() => {
    // A new message arrived — refresh the thread list so unread counts and previews update
    void refetch();
  }, [refetch]);

  useWhatsappSSE({
    onMessage: handleSSEMessage,
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
