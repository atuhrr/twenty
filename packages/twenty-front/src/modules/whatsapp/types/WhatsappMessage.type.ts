export type WhatsappMessageDirection = 'INBOUND' | 'OUTBOUND';
export type WhatsappMessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE';
export type WhatsappMessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type WhatsappMessage = {
  id: string;
  contactId: string;
  direction: WhatsappMessageDirection;
  type: WhatsappMessageType;
  content: string | null;
  mediaUrl: string | null;
  externalMessageId: string;
  status: WhatsappMessageStatus;
  timestamp: string;
  createdAt: string;
};

export type WhatsappContactWindow = {
  contactId: string;
  lastInboundAt: string | null;
  isWindowOpen: boolean;
};
