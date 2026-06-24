import { useMutation } from '@apollo/client';

import { SEND_WHATSAPP_MESSAGE } from '@/whatsapp/graphql/mutations/sendWhatsappMessage';
import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import {
  WhatsappMessage,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from '@/whatsapp/types/WhatsappMessage.type';

export const useSendWhatsappMessage = (
  contactId: string,
  phoneNumber: string,
) => {
  const [sendMutation, { loading, error }] = useMutation<{
    sendWhatsappMessage: WhatsappMessage;
  }>(SEND_WHATSAPP_MESSAGE, {
    update(cache, { data }) {
      if (!data) return;
      const existing = cache.readQuery<{ whatsappMessages: WhatsappMessage[] }>({
        query: GET_WHATSAPP_MESSAGES,
        variables: { contactId },
      });

      if (!existing) return;
      cache.writeQuery({
        query: GET_WHATSAPP_MESSAGES,
        variables: { contactId },
        data: {
          whatsappMessages: [
            ...existing.whatsappMessages,
            data.sendWhatsappMessage,
          ],
        },
      });
    },
  });

  const send = async (text: string): Promise<void> => {
    const now = new Date().toISOString();

    await sendMutation({
      variables: { input: { contactId, phoneNumber, text } },
      optimisticResponse: {
        sendWhatsappMessage: {
          __typename: 'WhatsappMessage',
          id: `optimistic_${Date.now()}`,
          contactId,
          direction: 'OUTBOUND' as WhatsappMessageDirection,
          type: 'TEXT' as WhatsappMessageType,
          content: text,
          mediaUrl: null,
          externalMessageId: `optimistic_${Date.now()}`,
          status: 'SENT' as WhatsappMessageStatus,
          timestamp: now,
          createdAt: now,
        },
      },
    });
  };

  return { send, loading, error };
};
