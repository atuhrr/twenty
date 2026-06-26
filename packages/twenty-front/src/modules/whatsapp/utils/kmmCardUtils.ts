/* oxlint-disable twenty/no-hardcoded-colors */

// Kommo-style card visual utilities

const AVATAR_COLORS = [
  '#6C5CE7',
  '#00B894',
  '#0984E3',
  '#E17055',
  '#FDCB6E',
  '#A29BFE',
  '#55EFC4',
  '#74B9FF',
  '#FAB1A0',
  '#81ECEC',
];

export const getAvatarColor = (seed: string): string => {
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const formatBRL = (amountMicros: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountMicros / 1_000_000);

export const formatRelativeTimePt = (isoDate: string | null): string => {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export const STAGE_LABELS_PT: Record<string, string> = {
  NEW: 'Novo Lead',
  SCREENING: 'Em Atendimento',
  MEETING: 'Qualificado',
  PROPOSAL: 'Proposta',
  CUSTOMER: 'Cliente',
};

// Deterministic mock tags for demo mode
const MOCK_TAG_PALETTE: Array<{ label: string; bg: string; color: string }> = [
  { label: 'Novo Cliente', bg: '#E8F5E9', color: '#2E7D32' },
  { label: 'WhatsApp', bg: '#E3F2FD', color: '#1565C0' },
  { label: 'Quente 🔥', bg: '#FFF3E0', color: '#E65100' },
  { label: 'Indicação', bg: '#F3E5F5', color: '#6A1B9A' },
  { label: 'Urgente', bg: '#FFEBEE', color: '#C62828' },
  { label: 'Remarketing', bg: '#E8EAF6', color: '#283593' },
  { label: 'Instagram', bg: '#FCE4EC', color: '#880E4F' },
  { label: 'Google Ads', bg: '#E0F7FA', color: '#006064' },
];

export const getMockTagForRecord = (
  recordId: string,
): (typeof MOCK_TAG_PALETTE)[0] => {
  const hash = recordId.charCodeAt(0) + (recordId.charCodeAt(4) ?? 0);
  return MOCK_TAG_PALETTE[hash % MOCK_TAG_PALETTE.length];
};
