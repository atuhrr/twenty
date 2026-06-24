import { useQuery } from '@apollo/client';

import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

// 5-second polling keeps the chat live without SSE; interval is configurable per env
const POLLING_INTERVAL_MS = parseInt(
  process.env.REACT_APP_WHATSAPP_POLL_MS ?? '5000',
  10,
);

export const useWhatsappMessages = (contactId: string) => {
  const { data, loading, error, refetch } = useQuery<{
    whatsappMessages: WhatsappMessage[];
  }>(GET_WHATSAPP_MESSAGES, {
    variables: { contactId },
    pollInterval: POLLING_INTERVAL_MS,
    skip: !contactId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    messages: data?.whatsappMessages ?? [],
    loading,
    error,
    refetch,
  };
};
