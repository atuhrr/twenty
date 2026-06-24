import { useQuery } from '@apollo/client';

import { GET_LAST_WHATSAPP_MESSAGE } from '@/whatsapp/graphql/queries/getLastWhatsappMessage';
import { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

type LastMessage = Pick<
  WhatsappMessage,
  'id' | 'direction' | 'type' | 'content' | 'timestamp'
>;

export const useLastWhatsappMessage = (contactId: string) => {
  const { data, loading } = useQuery<{
    lastWhatsappMessage: LastMessage | null;
  }>(GET_LAST_WHATSAPP_MESSAGE, {
    variables: { contactId },
    skip: !contactId,
    fetchPolicy: 'cache-first',
  });

  return {
    message: data?.lastWhatsappMessage ?? null,
    loading,
  };
};
