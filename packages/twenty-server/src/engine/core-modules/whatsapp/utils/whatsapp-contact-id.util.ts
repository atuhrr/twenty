import { v5 as uuidv5 } from 'uuid';

// FORK: Zellate — contactId determinístico por (workspace + telefone).
// Compartilhado entre o webhook (inbound) e o salesbot (outbound) para
// que as mensagens dos dois sentidos caiam na MESMA conversa.
const WHATSAPP_CONTACT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function getWhatsappContactId(
  workspaceId: string,
  normalizedPhone: string,
): string {
  return uuidv5(
    `${workspaceId}:${normalizedPhone}`,
    WHATSAPP_CONTACT_NAMESPACE,
  );
}
