import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';

// Returns number of contacts with an unread (INBOUND + needsReply) WhatsApp message.
// In mock mode returns a fixed number so the badge is always visible.
// In real mode this would query the backend; for now returns 0 until that endpoint exists.
export const useWhatsappUnreadCount = (): number => {
  if (IS_WHATSAPP_MOCK) {
    return 23;
  }

  return 0;
};
