import { useMutation } from '@apollo/client/react';

import { CONNECT_WHATSAPP } from '@/settings/whatsapp/graphql/mutations/connectWhatsapp';
import { GET_WHATSAPP_CONNECTION_STATUS } from '@/settings/whatsapp/graphql/queries/getWhatsappConnectionStatus';

type ConnectWhatsappInput = {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  displayPhoneNumber?: string;
};

type ConnectWhatsappResult = {
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  displayPhoneNumber: string | null;
};

export const useConnectWhatsapp = () => {
  const [mutate, { loading, error }] = useMutation<
    { connectWhatsapp: ConnectWhatsappResult },
    { input: ConnectWhatsappInput }
  >(CONNECT_WHATSAPP, {
    refetchQueries: [{ query: GET_WHATSAPP_CONNECTION_STATUS }],
    awaitRefetchQueries: true,
  });

  const connectWhatsapp = async (input: ConnectWhatsappInput) => {
    const result = await mutate({ variables: { input } });
    return result.data?.connectWhatsapp ?? null;
  };

  return { connectWhatsapp, loading, error };
};
