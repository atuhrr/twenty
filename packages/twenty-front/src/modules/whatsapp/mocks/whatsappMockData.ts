/* oxlint-disable twenty/no-hardcoded-colors */
import type {
  WhatsappContactWindow,
  WhatsappMessage,
} from '@/whatsapp/types/WhatsappMessage.type';

const now = Date.now();
const t = (offsetMinutes: number) =>
  new Date(now - offsetMinutes * 60_000).toISOString();

export const MOCK_MESSAGES: WhatsappMessage[] = [
  {
    id: 'mock-1',
    contactId: 'mock',
    direction: 'INBOUND',
    type: 'TEXT',
    content: 'Olá! Tenho interesse no produto.',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-1',
    status: 'READ',
    timestamp: t(90),
    createdAt: t(90),
  },
  {
    id: 'mock-2',
    contactId: 'mock',
    direction: 'OUTBOUND',
    type: 'TEXT',
    content: 'Olá! Tudo bem?\nVou te enviar mais informações.',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-2',
    status: 'READ',
    timestamp: t(89),
    createdAt: t(89),
  },
  {
    id: 'mock-3',
    contactId: 'mock',
    direction: 'INBOUND',
    type: 'TEXT',
    content: 'Ótimo! Aguardo.',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-3',
    status: 'READ',
    timestamp: t(89),
    createdAt: t(89),
  },
  {
    id: 'mock-4',
    contactId: 'mock',
    direction: 'OUTBOUND',
    type: 'TEXT',
    content: 'Segue o catálogo com todos os detalhes e valores.',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-4',
    status: 'READ',
    timestamp: t(88),
    createdAt: t(88),
  },
  {
    id: 'mock-5',
    contactId: 'mock',
    direction: 'OUTBOUND',
    type: 'DOCUMENT',
    content: 'Catalogo_Produtos.pdf',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-5',
    status: 'READ',
    timestamp: t(88),
    createdAt: t(88),
  },
  {
    id: 'mock-6',
    contactId: 'mock',
    direction: 'INBOUND',
    type: 'TEXT',
    content: 'Perfeito! Tenho interesse, vamos fechar!',
    mediaUrl: null,
    externalMessageId: 'wamid.mock-6',
    status: 'READ',
    timestamp: t(85),
    createdAt: t(85),
  },
];

export const MOCK_CONTACT_WINDOW: WhatsappContactWindow = {
  contactId: 'mock',
  lastInboundAt: t(85),
  isWindowOpen: true,
};

export const MOCK_LAST_MESSAGE = MOCK_MESSAGES[MOCK_MESSAGES.length - 1];

export const IS_WHATSAPP_MOCK =
  import.meta.env.VITE_WHATSAPP_MOCK_MODE === 'true';
