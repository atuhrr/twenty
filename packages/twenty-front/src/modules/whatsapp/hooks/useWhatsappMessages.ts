import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import {
  IS_WHATSAPP_MOCK,
  MOCK_MESSAGES,
} from '@/whatsapp/mocks/whatsappMockData';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

const POLLING_INTERVAL_MS = parseInt(
  process.env.REACT_APP_WHATSAPP_POLL_MS ?? '5000',
  10,
);

export const useWhatsappMessages = (contactId: string) => {
  const { data, loading, error, refetch } = useQuery<{
    whatsappMessages: WhatsappMessage[];
  }>(GET_WHATSAPP_MESSAGES, {
    variables: { contactId },
    pollInterval: IS_WHATSAPP_MOCK ? 0 : POLLING_INTERVAL_MS,
    skip: IS_WHATSAPP_MOCK || !contactId,
    fetchPolicy: 'cache-and-network',
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
