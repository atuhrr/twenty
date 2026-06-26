import { useQuery } from '@apollo/client/react';

import { GET_LAST_WHATSAPP_MESSAGE } from '@/whatsapp/graphql/queries/getLastWhatsappMessage';
import {
  IS_WHATSAPP_MOCK,
  MOCK_LAST_MESSAGE,
} from '@/whatsapp/mocks/whatsappMockData';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

type LastMessage = Pick<
  WhatsappMessage,
  'id' | 'direction' | 'type' | 'content' | 'timestamp'
>;

export const useLastWhatsappMessage = (contactId: string) => {
  const { data, loading } = useQuery<{
    lastWhatsappMessage: LastMessage | null;
  }>(GET_LAST_WHATSAPP_MESSAGE, {
    variables: { contactId },
    skip: IS_WHATSAPP_MOCK || !contactId,
    fetchPolicy: 'cache-first',
  });

  if (IS_WHATSAPP_MOCK) {
    return { message: MOCK_LAST_MESSAGE, loading: false };
  }

  return {
    message: data?.lastWhatsappMessage ?? null,
    loading,
  };
};
