// FORK: Voka CRM — Fase 11: multi-number phone number management hook
import { useMutation, useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_PHONE_NUMBERS } from '@/whatsapp/graphql/queries/getWhatsappPhoneNumbers';
import {
  DELETE_WHATSAPP_PHONE_NUMBER,
  SET_DEFAULT_WHATSAPP_PHONE_NUMBER,
  UPDATE_WHATSAPP_PHONE_NUMBER_LABEL,
} from '@/whatsapp/graphql/mutations/whatsappPhoneNumberMutations';

export type WhatsappPhoneNumber = {
  id: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  label: string | null;
  isDefault: boolean;
  connectionStatus: string;
  createdAt: string;
};

export const useWhatsappPhoneNumbers = () => {
  const { data, loading, refetch } = useQuery<{
    whatsappPhoneNumbers: WhatsappPhoneNumber[];
  }>(GET_WHATSAPP_PHONE_NUMBERS, { fetchPolicy: 'cache-and-network' });

  const [setDefaultMutation, { loading: settingDefault }] = useMutation(
    SET_DEFAULT_WHATSAPP_PHONE_NUMBER,
    { onCompleted: () => refetch() },
  );

  const [deleteMutation, { loading: deleting }] = useMutation(
    DELETE_WHATSAPP_PHONE_NUMBER,
    { onCompleted: () => refetch() },
  );

  const [updateLabelMutation] = useMutation(UPDATE_WHATSAPP_PHONE_NUMBER_LABEL, {
    onCompleted: () => refetch(),
  });

  const setDefault = (instanceId: string) =>
    setDefaultMutation({ variables: { instanceId } });

  const deleteNumber = (instanceId: string) =>
    deleteMutation({ variables: { instanceId } });

  const updateLabel = (instanceId: string, label: string) =>
    updateLabelMutation({ variables: { input: { instanceId, label } } });

  return {
    phoneNumbers: data?.whatsappPhoneNumbers ?? [],
    loading,
    settingDefault,
    deleting,
    setDefault,
    deleteNumber,
    updateLabel,
    refetch,
  };
};
