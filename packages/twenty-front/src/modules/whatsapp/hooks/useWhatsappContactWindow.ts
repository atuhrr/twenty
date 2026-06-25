import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_CONTACT_WINDOW } from '@/whatsapp/graphql/queries/getWhatsappContactWindow';
import type { WhatsappContactWindow } from '@/whatsapp/types/WhatsappMessage.type';

export const useWhatsappContactWindow = (contactId: string) => {
  const { data, loading } = useQuery<{
    whatsappContactWindow: WhatsappContactWindow;
  }>(GET_WHATSAPP_CONTACT_WINDOW, {
    variables: { contactId },
    skip: !contactId,
    // Refresh every minute — the window can close while the drawer is open
    pollInterval: 60_000,
    fetchPolicy: 'cache-and-network',
  });

  return {
    window: data?.whatsappContactWindow ?? null,
    isWindowOpen: data?.whatsappContactWindow?.isWindowOpen ?? false,
    loading,
  };
};
