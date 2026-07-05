// FORK: Voka CRM — Fase 11: WhatsApp approved templates hook
import { useQuery, useMutation } from '@apollo/client/react';

import { GET_WHATSAPP_TEMPLATES } from '@/whatsapp/graphql/queries/getWhatsappTemplates';
import { SEND_WHATSAPP_TEMPLATE } from '@/whatsapp/graphql/mutations/sendWhatsappTemplate';
import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

export type WhatsappTemplate = {
  id: string;
  name: string;
  status: string;
  language: string;
  category: string | null;
  components: { type: string; text: string | null }[];
};

type SendTemplateData = { sendWhatsappTemplate: WhatsappMessage };

export const useWhatsappTemplates = (contactId: string, phoneNumber: string) => {
  const { data, loading } = useQuery<{ whatsappTemplates: WhatsappTemplate[] }>(
    GET_WHATSAPP_TEMPLATES,
    { fetchPolicy: 'cache-first' },
  );

  const [sendMutation, { loading: sending }] = useMutation<SendTemplateData>(
    SEND_WHATSAPP_TEMPLATE,
    {
      update(cache, { data: mutData }) {
        if (!mutData) return;
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
              mutData.sendWhatsappTemplate,
            ],
          },
        });
      },
    },
  );

  const sendTemplate = async (
    templateName: string,
    languageCode: string,
    components: object[] = [],
  ): Promise<{ errorMessage?: string }> => {
    try {
      await sendMutation({
        variables: {
          input: { contactId, phoneNumber, templateName, languageCode, components },
        },
      });
      return {};
    } catch (err: unknown) {
      return { errorMessage: (err as { message?: string })?.message ?? 'Erro ao enviar template.' };
    }
  };

  return {
    templates: data?.whatsappTemplates ?? [],
    loading,
    sending,
    sendTemplate,
  };
};
