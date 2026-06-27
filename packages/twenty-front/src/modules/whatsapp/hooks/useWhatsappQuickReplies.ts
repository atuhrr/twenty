// FORK: Voka CRM — Fase 11: quick replies list + "/" picker integration
import { useQuery } from '@apollo/client/react';

import { GET_WHATSAPP_QUICK_REPLIES } from '@/whatsapp/graphql/queries/getWhatsappQuickReplies';

export type WhatsappQuickReply = {
  id: string;
  shortcut: string;
  title: string;
  content: string;
};

export const useWhatsappQuickReplies = () => {
  const { data, loading } = useQuery<{
    whatsappQuickReplies: WhatsappQuickReply[];
  }>(GET_WHATSAPP_QUICK_REPLIES, {
    fetchPolicy: 'cache-first',
  });

  return {
    quickReplies: data?.whatsappQuickReplies ?? [],
    loading,
  };
};
