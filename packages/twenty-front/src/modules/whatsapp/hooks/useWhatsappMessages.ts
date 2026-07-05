// FORK: Voka CRM — Fase 9: messages for open chat — SSE real-time append
import { useCallback } from 'react';
import { useApolloClient, useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import {
  IS_WHATSAPP_MOCK,
  MOCK_MESSAGES,
} from '@/whatsapp/mocks/whatsappMockData';
import { useWhatsappSSE } from '@/whatsapp/hooks/useWhatsappSSE';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

export const useWhatsappMessages = (contactId: string) => {
  const apolloClient = useApolloClient();

  const { data, loading, error, refetch } = useQuery<{
    whatsappMessages: WhatsappMessage[];
  }>(GET_WHATSAPP_MESSAGES, {
    variables: { contactId },
    skip: IS_WHATSAPP_MOCK || !contactId,
    fetchPolicy: 'cache-and-network',
  });

  const handleSSEMessage = useCallback(
    (msg: WhatsappMessage) => {
      if (msg.contactId !== contactId) return;

      const existing = apolloClient.readQuery<{ whatsappMessages: WhatsappMessage[] }>({
        query: GET_WHATSAPP_MESSAGES,
        variables: { contactId },
      });

      if (!existing) return;

      const alreadyIn = existing.whatsappMessages.some((m) => m.id === msg.id);

      if (alreadyIn) return;

      apolloClient.writeQuery({
        query: GET_WHATSAPP_MESSAGES,
        variables: { contactId },
        data: {
          whatsappMessages: [...existing.whatsappMessages, msg],
        },
      });
    },
    [apolloClient, contactId],
  );

  useWhatsappSSE({
    onMessage: handleSSEMessage,
    skip: IS_WHATSAPP_MOCK || !contactId,
  });

  if (IS_WHATSAPP_MOCK) {
    return {
      messages: MOCK_MESSAGES.map((m) => ({ ...m, contactId })),
      loading: false,
      error: undefined,
      refetch: async () => {},
    };
  }

  return {
    messages: data?.whatsappMessages ?? [],
    loading,
    error,
    refetch,
  };
};
