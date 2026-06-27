// FORK: Voka CRM — Fase 10: team chat hook — messages per related record
import { useMutation, useQuery } from '@apollo/client/react';

import { GET_TEAM_CHAT_MESSAGES } from '@/team-chat/graphql/getTeamChatMessages';
import { SEND_TEAM_CHAT_MESSAGE } from '@/team-chat/graphql/sendTeamChatMessage';

export type TeamChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  relatedRecordId: string | null;
  relatedRecordType: string | null;
  content: string;
  createdAt: string;
};

export const useTeamChat = (relatedRecordId: string | null) => {
  const { data, loading, refetch } = useQuery<{
    teamChatMessages: TeamChatMessage[];
  }>(GET_TEAM_CHAT_MESSAGES, {
    variables: { relatedRecordId },
    fetchPolicy: 'cache-and-network',
    pollInterval: 10_000,
    skip: !relatedRecordId,
  });

  const [sendMutation, { loading: sending }] = useMutation(
    SEND_TEAM_CHAT_MESSAGE,
    {
      refetchQueries: [
        {
          query: GET_TEAM_CHAT_MESSAGES,
          variables: { relatedRecordId },
        },
      ],
    },
  );

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    await sendMutation({
      variables: {
        input: {
          relatedRecordId,
          relatedRecordType: 'opportunity',
          content: content.trim(),
        },
      },
    });
  };

  return {
    messages: data?.teamChatMessages ?? [],
    loading,
    sending,
    sendMessage,
    refetch,
  };
};
