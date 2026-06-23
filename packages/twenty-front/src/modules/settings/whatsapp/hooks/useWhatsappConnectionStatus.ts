import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_CONNECTION_STATUS } from '@/settings/whatsapp/graphql/queries/getWhatsappConnectionStatus';

type WhatsappConnectionStatusResult = {
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  displayPhoneNumber: string | null;
};

export const useWhatsappConnectionStatus = () => {
  const { data, loading, refetch } = useQuery<{
    whatsappConnectionStatus: WhatsappConnectionStatusResult;
  }>(GET_WHATSAPP_CONNECTION_STATUS, {
    fetchPolicy: 'network-only',
  });

  return {
    status: data?.whatsappConnectionStatus?.status ?? 'DISCONNECTED',
    displayPhoneNumber: data?.whatsappConnectionStatus?.displayPhoneNumber ?? null,
    loading,
    refetch,
  };
};
