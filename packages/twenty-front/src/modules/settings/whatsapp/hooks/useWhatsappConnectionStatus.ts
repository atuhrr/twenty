import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_CONNECTION_STATUS } from '@/settings/whatsapp/graphql/queries/getWhatsappConnectionStatus';
import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';

type WhatsappConnectionStatusResult = {
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  displayPhoneNumber: string | null;
};

export const useWhatsappConnectionStatus = () => {
  const { data, loading, refetch } = useQuery<{
    whatsappConnectionStatus: WhatsappConnectionStatusResult;
  }>(GET_WHATSAPP_CONNECTION_STATUS, {
    fetchPolicy: 'network-only',
    skip: IS_WHATSAPP_MOCK,
  });

  if (IS_WHATSAPP_MOCK) {
    return {
      status: 'CONNECTED' as const,
      displayPhoneNumber: '+55 11 99999-0001',
      loading: false,
      refetch: async () => {},
    };
  }

  return {
    status: data?.whatsappConnectionStatus?.status ?? 'DISCONNECTED',
    displayPhoneNumber:
      data?.whatsappConnectionStatus?.displayPhoneNumber ?? null,
    loading,
    refetch,
  };
};
