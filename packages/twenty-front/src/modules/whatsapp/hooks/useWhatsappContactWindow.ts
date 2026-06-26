import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_CONTACT_WINDOW } from '@/whatsapp/graphql/queries/getWhatsappContactWindow';
import {
  IS_WHATSAPP_MOCK,
  MOCK_CONTACT_WINDOW,
} from '@/whatsapp/mocks/whatsappMockData';
import type { WhatsappContactWindow } from '@/whatsapp/types/WhatsappMessage.type';

export const useWhatsappContactWindow = (contactId: string) => {
  const { data, loading } = useQuery<{
    whatsappContactWindow: WhatsappContactWindow;
  }>(GET_WHATSAPP_CONTACT_WINDOW, {
    variables: { contactId },
    skip: IS_WHATSAPP_MOCK || !contactId,
    pollInterval: IS_WHATSAPP_MOCK ? 0 : 60_000,
    fetchPolicy: 'cache-and-network',
  });

  if (IS_WHATSAPP_MOCK) {
    return {
      window: { ...MOCK_CONTACT_WINDOW, contactId },
      isWindowOpen: true,
      loading: false,
    };
  }

  return {
    window: data?.whatsappContactWindow ?? null,
    isWindowOpen: data?.whatsappContactWindow?.isWindowOpen ?? false,
    loading,
  };
};
