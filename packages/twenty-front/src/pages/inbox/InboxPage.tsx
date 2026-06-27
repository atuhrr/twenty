// FORK: Voka CRM — Fase 8/9: Inbox 3-panel UI, pixel-equivalent to alvo-visual-voka.html TELA 3
// Fase 9: real-data mode via useWhatsappThreads + useWhatsappMessages
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useState } from 'react';
import {
  IconChevronDown,
  IconDotsVertical,
  IconFilter,
  IconPaperclip,
  IconSearch,
  IconSettings,
  IconMoodSmile,
  IconStar,
  IconCheck,
  IconFile,
} from 'twenty-ui/icon';

import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';
import { useWhatsappThreads } from '@/whatsapp/hooks/useWhatsappThreads';
import { useWhatsappMessages } from '@/whatsapp/hooks/useWhatsappMessages';
import { useSendWhatsappMessage } from '@/whatsapp/hooks/useSendWhatsappMessage';
import { QuickReplyComposer } from '@/whatsapp/components/chat/QuickReplyComposer';
import { TeamChatPanel } from '@/team-chat/components/TeamChatPanel';
import { useMutation } from '@apollo/client/react';
import { ASSIGN_WHATSAPP_THREAD } from '@/whatsapp/graphql/mutations/assignWhatsappThread';
import { GET_WHATSAPP_THREADS } from '@/whatsapp/graphql/queries/getWhatsappThreads';

// ─── Design tokens (extracted from alvo-visual-voka.html) ─────────────────────

const C = {
  inboxDark: '#203D49',
  inboxDarkDeep: '#19303A',
  inboxBorder: '#2C4A56',
  inboxMuted: '#7C97A2',
  inboxText: '#E6EDF0',
  active: '#437EDD',
  activeBg: '#EEF4FF',
  bubble: '#2E90FA',
  inBg: '#F2F4F7',
  inTx: '#344054',
  appBg: '#F2F4F7',
  borda: '#EAECF0',
  txt: '#101828',
  muted: '#667085',
  gray: '#98A2B3',
  cntBg: '#E6F1FB',
  cntTx: '#185FA5',
  taskGreen: '#12B76A',
  tagBg: '#F2F4F7',
  tagTx: '#475467',
  vokaRoxo: '#7C3AED',
  sendBg: '#D0D5DD',
};

// Avatar palettes from alvo-visual-voka.html
const PALETTES = [
  { bg: '#EEEDFE', tx: '#534AB7' },
  { bg: '#FAEEDA', tx: '#854F0B' },
  { bg: '#E1F5EE', tx: '#0F6E56' },
  { bg: '#FCEBEB', tx: '#A32D2D' },
  { bg: '#FBEAF0', tx: '#993556' },
  { bg: '#E6F1FB', tx: '#185FA5' },
  { bg: '#F1EFE8', tx: '#444441' },
];

// Channel badge colors
const CHANNELS: Record<string, { bg: string; abbr: string }> = {
  whatsapp: { bg: '#25D366', abbr: 'W' },
  messenger: { bg: '#0084FF', abbr: 'M' },
  instagram: { bg: '#E1306C', abbr: 'I' },
  telegram: { bg: '#229ED9', abbr: 'T' },
  google: { bg: '#EA4335', abbr: 'G' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

type Conv = {
  id: string;
  name: string;
  initials: string;
  palette: number;
  channel: keyof typeof CHANNELS;
  preview: string;
  time: string;
  starred?: boolean;
  contact: {
    phone: string;
    email: string;
    role: string;
    value: string;
    responsible: string;
    stage: string;
  };
};

const CONVS: Conv[] = [
  {
    id: '1',
    name: 'Mary Kim',
    initials: 'MK',
    palette: 2,
    channel: 'whatsapp',
    preview: 'Consigo um desconto na próxima…',
    time: '13:06',
    starred: true,
    contact: {
      phone: '+55 (81) 3345-6789',
      email: 'marykim@gmail.com',
      role: 'Compradora regional',
      value: 'R$ 1.200',
      responsible: 'Ariel',
      stage: 'Leads Recebidos',
    },
  },
  {
    id: '2',
    name: 'João Henrique',
    initials: 'JH',
    palette: 5,
    channel: 'messenger',
    preview: 'Oi, tenho uma dúvida',
    time: '17:45',
    contact: {
      phone: '+55 (11) 9 8765-4321',
      email: 'joao.h@email.com',
      role: 'Gerente comercial',
      value: 'R$ 3.500',
      responsible: 'Téo',
      stage: 'Tomada de Decisão',
    },
  },
  {
    id: '3',
    name: 'Sônia Esteves',
    initials: 'SE',
    palette: 1,
    channel: 'instagram',
    preview: 'Você acha que…',
    time: '12:45',
    contact: {
      phone: '+55 (21) 9 9876-5432',
      email: 'sonia.e@gmail.com',
      role: 'Diretora de marketing',
      value: 'R$ 5.000',
      responsible: 'Ariel',
      stage: 'Negociação',
    },
  },
  {
    id: '4',
    name: 'Melina Greco',
    initials: 'MG',
    palette: 3,
    channel: 'telegram',
    preview: 'Mal posso esperar!',
    time: '11:56',
    contact: {
      phone: '+55 (31) 9 7654-3210',
      email: 'melina.g@empresa.com',
      role: 'Analista sênior',
      value: 'R$ 900',
      responsible: 'Téo',
      stage: 'Decisão Final',
    },
  },
  {
    id: '5',
    name: 'Bruna Marini',
    initials: 'BM',
    palette: 4,
    channel: 'whatsapp',
    preview: 'Oi de novo :P',
    time: '11:45',
    contact: {
      phone: '+55 (41) 9 6543-2109',
      email: 'bruna.m@email.com',
      role: 'Coordenadora',
      value: 'R$ 450',
      responsible: 'Ariel',
      stage: 'Leads Recebidos',
    },
  },
  {
    id: '6',
    name: 'Eloá Blanco',
    initials: 'EB',
    palette: 0,
    channel: 'google',
    preview: 'Vocês gravam…',
    time: '09:49',
    contact: {
      phone: '+55 (51) 9 5432-1098',
      email: 'eloa.b@gmail.com',
      role: 'Empreendedora',
      value: 'R$ 2.000',
      responsible: 'Téo',
      stage: 'Negociação',
    },
  },
];

type Message = { id: string; type: 'out' | 'in' | 'day' | 'task' | 'note'; text: string };

const MESSAGES: Message[] = [
  { id: 'd1', type: 'day', text: 'Hoje' },
  { id: 'm1', type: 'out', text: 'Ficamos felizes em saber! Volte sempre!' },
  { id: 'm2', type: 'in', text: 'Consigo um desconto na próxima compra? 😊' },
  { id: 'd2', type: 'day', text: 'Hoje' },
  { id: 't1', type: 'task', text: 'Acompanhar: verificar satisfação do cliente' },
  { id: 'n1', type: 'note', text: 'Cliente fez uma grande compra e quer desconto na próxima' },
];

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: ${() => '16px'};
`;

const StyledInbox = styled.div`
  background: #fff;
  border: 1px solid ${C.borda};
  border-radius: 12px;
  display: grid;
  flex: 1;
  grid-template-columns: 260px 270px 1fr;
  min-height: 0;
  overflow: hidden;
`;

// ── Panel 1: conversation list ─────────────────────────────────────────────

const StyledConvList = styled.div`
  border-right: 1px solid ${C.borda};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StyledConvHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 12px 14px;
`;

const StyledSearchBar = styled.div`
  align-items: center;
  color: ${C.gray};
  display: flex;
  font-size: 13px;
  gap: 6px;
`;

const StyledInboxLabel = styled.div<{ hasBorderTop?: boolean }>`
  align-items: center;
  border-top: ${({ hasBorderTop }) => (hasBorderTop ? `1px solid ${C.borda}` : 'none')};
  color: ${C.muted};
  display: flex;
  font-size: 11px;
  font-weight: 700;
  justify-content: space-between;
  letter-spacing: 0.5px;
  margin-top: ${({ hasBorderTop }) => (hasBorderTop ? '6px' : '0')};
  padding: 6px 14px;
`;

const StyledCntBadge = styled.span`
  background: ${C.cntBg};
  border-radius: 8px;
  color: ${C.cntTx};
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
`;

const StyledFilterRow = styled.div`
  align-items: center;
  color: ${C.gray};
  display: flex;
  font-size: 11px;
  font-weight: 500;
  gap: 4px;
  justify-content: space-between;
  padding: 4px 14px 6px;
`;

const StyledConvScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const StyledConvItem = styled.div<{ selected: boolean }>`
  align-items: center;
  background: ${({ selected }) => (selected ? C.activeBg : 'transparent')};
  border-left: ${({ selected }) => (selected ? `3px solid ${C.active}` : '3px solid transparent')};
  border-top: 1px solid ${C.borda};
  cursor: pointer;
  display: flex;
  gap: 9px;
  padding: 10px 14px;

  &:hover {
    background: ${C.activeBg};
  }
`;

const StyledAvWrapper = styled.div`
  flex: none;
  height: 34px;
  position: relative;
  width: 34px;
`;

const StyledAvInitials = styled.div`
  align-items: center;
  border-radius: 50%;
  display: flex;
  font-size: 11px;
  font-weight: 600;
  height: 34px;
  justify-content: center;
  width: 34px;
`;

const StyledChannelBadge = styled.div`
  align-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  bottom: -3px;
  color: #fff;
  display: flex;
  font-size: 8px;
  font-weight: 700;
  height: 17px;
  justify-content: center;
  position: absolute;
  right: -3px;
  width: 17px;
`;

const StyledConvBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledConvName = styled.div`
  color: ${C.txt};
  font-size: 12.5px;
  font-weight: 600;
`;

const StyledConvPreview = styled.div`
  color: ${C.muted};
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledConvMeta = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 2px;
`;

const StyledConvTime = styled.div`
  color: ${C.gray};
  font-size: 10.5px;
`;

const StyledTeamSection = styled.div`
  border-top: 1px solid ${C.borda};
  color: ${C.muted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-top: 6px;
  padding: 8px 14px;
`;

// ── Panel 2: contact dark panel ───────────────────────────────────────────

const StyledContactPanel = styled.div`
  background: ${C.inboxDark};
  color: ${C.inboxText};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
`;

const StyledContactName = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const StyledAddTag = styled.span`
  border: 1px dashed #4A6470;
  border-radius: 6px;
  color: #9FB6C0;
  display: inline-block;
  font-size: 10px;
  margin-bottom: 12px;
  padding: 2px 8px;
`;

const StyledFunnelSel = styled.div`
  align-items: center;
  background: ${C.inboxDarkDeep};
  border-radius: 8px;
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 11px;
`;

const StyledFunnelLabel = styled.small`
  color: ${C.inboxMuted};
  display: block;
  font-size: 10px;
`;

const StyledTabs = styled.div`
  border-bottom: 1px solid ${C.inboxBorder};
  display: flex;
  font-size: 12px;
  gap: 14px;
  margin-bottom: 12px;
  padding-bottom: 8px;
`;

const StyledTabOn = styled.span`
  border-bottom: 2px solid #FFE247;
  color: #fff;
  font-weight: 600;
  padding-bottom: 8px;
`;

const StyledTabOff = styled.span`
  color: ${C.inboxMuted};
  cursor: pointer;
`;

const StyledKV = styled.div`
  font-size: 12px;
  margin-bottom: 9px;
`;

const StyledKVKey = styled.span`
  color: ${C.inboxMuted};
  display: block;
`;

const StyledKVVal = styled.span`
  color: #fff;
`;

const StyledKVValBig = styled.span`
  color: #fff;
  font-size: 15px;
  font-weight: 700;
`;

const StyledContactDivider = styled.div`
  border-top: 1px solid ${C.inboxBorder};
  margin: 12px 0;
  padding-top: 12px;
`;

const StyledAddContact = styled.div`
  color: ${C.inboxMuted};
  font-size: 12px;
`;

// ── Panel 3: chat ─────────────────────────────────────────────────────────

const StyledChatPanel = styled.div`
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const StyledChatMessages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 14px;
`;

const StyledDayDivider = styled.div`
  color: ${C.gray};
  font-size: 10.5px;
  text-align: center;
`;

const StyledMsgOut = styled.div`
  align-self: flex-end;
  background: ${C.bubble};
  border-bottom-right-radius: 4px;
  border-radius: 12px;
  color: #fff;
  font-size: 12.5px;
  line-height: 1.4;
  max-width: 72%;
  padding: 8px 11px;
`;

const StyledMsgIn = styled.div`
  align-self: flex-start;
  background: ${C.inBg};
  border-bottom-left-radius: 4px;
  border-radius: 12px;
  color: ${C.inTx};
  font-size: 12.5px;
  line-height: 1.4;
  max-width: 72%;
  padding: 8px 11px;
`;

const StyledTaskCard = styled.div`
  align-items: flex-start;
  border: 1px solid ${C.borda};
  border-radius: 8px;
  color: ${C.inTx};
  display: flex;
  font-size: 12px;
  gap: 8px;
  padding: 9px 11px;
`;

const StyledNoteCard = styled.div`
  align-items: flex-start;
  border: 1px solid ${C.borda};
  border-radius: 8px;
  color: ${C.inTx};
  display: flex;
  font-size: 12px;
  gap: 8px;
  padding: 9px 11px;
`;

const StyledComposer = styled.div`
  border-top: 1px solid ${C.borda};
  margin-top: auto;
  padding: 10px 14px 14px;
`;

const StyledComposerTabs = styled.div`
  color: #475467;
  font-size: 12px;
  margin-bottom: 8px;
`;

const StyledComposerInput = styled.div`
  align-items: center;
  border: 1px solid ${C.borda};
  border-radius: 10px;
  color: ${C.gray};
  display: flex;
  font-size: 12.5px;
  gap: 8px;
  padding: 8px 11px;
`;

const StyledComposerInputText = styled.span`
  flex: 1;
`;

const StyledComposerActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const StyledSendBtn = styled.button`
  background: ${C.sendBg};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 16px;
`;

const StyledCancelLink = styled.span`
  color: ${C.muted};
  cursor: pointer;
  font-size: 12px;
  padding: 6px 4px;
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ conv }: { conv: Conv }) => {
  const p = PALETTES[conv.palette % PALETTES.length];
  const ch = CHANNELS[conv.channel];
  return (
    <StyledAvWrapper>
      <StyledAvInitials style={{ background: p.bg, color: p.tx }}>
        {conv.initials}
      </StyledAvInitials>
      <StyledChannelBadge style={{ background: ch.bg }}>
        {ch.abbr}
      </StyledChannelBadge>
    </StyledAvWrapper>
  );
};

const ConversationList = ({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <StyledConvList>
    <StyledConvHeader>
      <StyledSearchBar>
        <IconSearch size={14} />
        Buscar
      </StyledSearchBar>
      <IconSettings size={16} color={C.gray} />
    </StyledConvHeader>

    <StyledInboxLabel>
      CAIXA DE ENTRADA <StyledCntBadge>180</StyledCntBadge>
    </StyledInboxLabel>

    <StyledFilterRow>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconFilter size={13} />
        Filtrar
      </span>
      <IconDotsVertical size={16} />
    </StyledFilterRow>

    <StyledConvScroll>
      {CONVS.map((conv) => (
        <StyledConvItem
          key={conv.id}
          selected={conv.id === selectedId}
          onClick={() => onSelect(conv.id)}
        >
          <Avatar conv={conv} />
          <StyledConvBody>
            <StyledConvName>{conv.name}</StyledConvName>
            <StyledConvPreview>{conv.preview}</StyledConvPreview>
          </StyledConvBody>
          <StyledConvMeta>
            <StyledConvTime>{conv.time}</StyledConvTime>
            {conv.starred && (
              <IconStar size={13} color="#FBBF24" />
            )}
          </StyledConvMeta>
        </StyledConvItem>
      ))}
    </StyledConvScroll>

    {/* FORK: Voka CRM — Fase 10: real team chat in mock sidebar */}
    <TeamChatPanel relatedRecordId={null} placeholder="Mensagem para a equipe…" />
  </StyledConvList>
);

const ContactPanel = ({ conv }: { conv: Conv }) => (
  <StyledContactPanel>
    <StyledContactName>{conv.name}</StyledContactName>
    <StyledAddTag>+ ADICIONAR TAGS</StyledAddTag>

    <StyledFunnelSel>
      <div>
        <StyledFunnelLabel>Funil de vendas</StyledFunnelLabel>
        {conv.contact.stage}
      </div>
      <IconChevronDown size={14} color={C.inboxMuted} />
    </StyledFunnelSel>

    <StyledTabs>
      <StyledTabOn>Principal</StyledTabOn>
      <StyledTabOff>Estatísticas</StyledTabOff>
      <StyledTabOff>Configuração</StyledTabOff>
    </StyledTabs>

    <StyledKV>
      <StyledKVKey>Responsável</StyledKVKey>
      <StyledKVVal>{conv.contact.responsible}</StyledKVVal>
    </StyledKV>

    <StyledKV>
      <StyledKVKey>Valor</StyledKVKey>
      <StyledKVValBig>{conv.contact.value}</StyledKVValBig>
    </StyledKV>

    <StyledContactDivider>
      <StyledKV>
        <StyledKVKey>Telefone</StyledKVKey>
        <StyledKVVal>{conv.contact.phone}</StyledKVVal>
      </StyledKV>
      <StyledKV>
        <StyledKVKey>E-mail</StyledKVKey>
        <StyledKVVal>{conv.contact.email}</StyledKVVal>
      </StyledKV>
      <StyledKV>
        <StyledKVKey>Cargo</StyledKVKey>
        <StyledKVVal>{conv.contact.role}</StyledKVVal>
      </StyledKV>
    </StyledContactDivider>

    <StyledAddContact>+ Adicionar contato</StyledAddContact>
  </StyledContactPanel>
);

const ChatPanel = ({ conv }: { conv: Conv }) => (
  <StyledChatPanel>
    <StyledChatMessages>
      {MESSAGES.map((msg) => {
        if (msg.type === 'day') {
          return <StyledDayDivider key={msg.id}>{msg.text}</StyledDayDivider>;
        }
        if (msg.type === 'out') {
          return <StyledMsgOut key={msg.id}>{msg.text}</StyledMsgOut>;
        }
        if (msg.type === 'in') {
          return <StyledMsgIn key={msg.id}>{msg.text}</StyledMsgIn>;
        }
        if (msg.type === 'task') {
          return (
            <StyledTaskCard key={msg.id}>
              <IconCheck size={15} color={C.taskGreen} />
              <div>
                <strong>Acompanhar:</strong>{' '}
                {msg.text.replace('Acompanhar: ', '')}
              </div>
            </StyledTaskCard>
          );
        }
        if (msg.type === 'note') {
          return (
            <StyledNoteCard key={msg.id}>
              <IconFile size={15} color={C.gray} />
              <div>{msg.text}</div>
            </StyledNoteCard>
          );
        }
        return null;
      })}
    </StyledChatMessages>

    <StyledComposer>
      <StyledComposerTabs>
        <strong>Chat</strong> com <u>Téo</u>
      </StyledComposerTabs>
      <StyledComposerInput>
        <IconMoodSmile size={15} />
        <StyledComposerInputText>
          Escreva uma mensagem para {conv.name}…
        </StyledComposerInputText>
        <IconPaperclip size={15} />
      </StyledComposerInput>
      <StyledComposerActions>
        <StyledSendBtn>Enviar</StyledSendBtn>
        <StyledCancelLink>Cancelar</StyledCancelLink>
      </StyledComposerActions>
    </StyledComposer>
  </StyledChatPanel>
);

// ─── Real-data components (Fase 9 — used when IS_WHATSAPP_MOCK === false) ────

type RealThread = {
  contactId: string;
  phoneNumber: string | null;
  unreadCount: number;
  channelType: string;
  lastMessage: { content: string | null; timestamp: string; direction: string };
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const RealConversationList = ({
  threads,
  selectedId,
  onSelect,
}: {
  threads: RealThread[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <StyledConvList>
    <StyledConvHeader>
      <StyledSearchBar>
        <IconSearch size={14} />
        Buscar
      </StyledSearchBar>
      <IconSettings size={16} color={C.gray} />
    </StyledConvHeader>

    <StyledInboxLabel>
      CAIXA DE ENTRADA{' '}
      <StyledCntBadge>{threads.length}</StyledCntBadge>
    </StyledInboxLabel>

    <StyledFilterRow>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconFilter size={13} />
        Filtrar
      </span>
      <IconDotsVertical size={16} />
    </StyledFilterRow>

    <StyledConvScroll>
      {threads.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 12, padding: '14px 14px' }}>
          Nenhuma conversa ainda.
        </div>
      ) : (
        threads.map((t, idx) => {
          const initials = t.phoneNumber
            ? t.phoneNumber.replace(/\D/g, '').slice(-4, -2)
            : (t.channelType ?? 'WA').slice(0, 2);
          const palette = PALETTES[idx % PALETTES.length];
          const ch = CHANNELS[(t.channelType ?? 'whatsapp').toLowerCase()] ?? CHANNELS.whatsapp;
          return (
            <StyledConvItem
              key={t.contactId}
              selected={t.contactId === selectedId}
              onClick={() => onSelect(t.contactId)}
            >
              <StyledAvWrapper>
                <StyledAvInitials style={{ background: palette.bg, color: palette.tx }}>
                  {initials}
                </StyledAvInitials>
                <StyledChannelBadge style={{ background: ch.bg }}>
                  {ch.abbr}
                </StyledChannelBadge>
              </StyledAvWrapper>
              <StyledConvBody>
                <StyledConvName>
                  {t.phoneNumber ?? `Contato #${idx + 1}`}
                </StyledConvName>
                <StyledConvPreview>
                  {t.lastMessage.content ?? '📎 Mídia'}
                </StyledConvPreview>
              </StyledConvBody>
              <StyledConvMeta>
                <StyledConvTime>{formatTime(t.lastMessage.timestamp)}</StyledConvTime>
                {t.unreadCount > 0 && (
                  <StyledCntBadge>{t.unreadCount}</StyledCntBadge>
                )}
              </StyledConvMeta>
            </StyledConvItem>
          );
        })
      )}
    </StyledConvScroll>

    {/* FORK: Voka CRM — Fase 10: real team chat in sidebar */}
    <TeamChatPanel relatedRecordId={null} placeholder="Mensagem para a equipe…" />
  </StyledConvList>
);

const RealContactPanel = ({
  contactId,
  phoneNumber,
  assignedUserName,
}: {
  contactId: string;
  phoneNumber: string | null;
  assignedUserName: string | null;
}) => {
  const [assignName, setAssignName] = useState(assignedUserName ?? '');
  const [editing, setEditing] = useState(false);
  const [assignThread] = useMutation(ASSIGN_WHATSAPP_THREAD, {
    refetchQueries: [{ query: GET_WHATSAPP_THREADS }],
  });

  const handleAssign = async () => {
    await assignThread({
      variables: {
        input: {
          contactId,
          assignedUserName: assignName.trim() || null,
        },
      },
    });
    setEditing(false);
  };

  return (
    <StyledContactPanel>
      <StyledContactName>
        {phoneNumber ?? 'WhatsApp'}
      </StyledContactName>
      <StyledAddTag>+ ADICIONAR TAGS</StyledAddTag>

      <StyledFunnelSel>
        <div>
          <StyledFunnelLabel>Funil de vendas</StyledFunnelLabel>
          Leads Recebidos
        </div>
        <IconChevronDown size={14} color={C.inboxMuted} />
      </StyledFunnelSel>

      <StyledTabs>
        <StyledTabOn>Principal</StyledTabOn>
        <StyledTabOff>Estatísticas</StyledTabOff>
        <StyledTabOff>Configuração</StyledTabOff>
      </StyledTabs>

      {/* FORK: Voka CRM — Fase 11: thread assignment */}
      <StyledKV>
        <StyledKVKey>Responsável</StyledKVKey>
        {editing ? (
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <input
              style={{
                background: C.inboxDarkDeep,
                border: `1px solid ${C.inboxBorder}`,
                borderRadius: 6,
                color: '#fff',
                flex: 1,
                fontSize: 12,
                outline: 'none',
                padding: '3px 7px',
              }}
              value={assignName}
              onChange={(e) => setAssignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAssign()}
              autoFocus
            />
            <button
              style={{ background: C.active, border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
              onClick={() => void handleAssign()}
            >
              OK
            </button>
          </div>
        ) : (
          <StyledKVVal
            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
            onClick={() => setEditing(true)}
          >
            {assignedUserName ?? '— Atribuir'}
          </StyledKVVal>
        )}
      </StyledKV>

      <StyledKV>
        <StyledKVKey>Telefone</StyledKVKey>
        <StyledKVVal>{phoneNumber ?? '—'}</StyledKVVal>
      </StyledKV>

      <StyledAddContact>+ Adicionar contato</StyledAddContact>
    </StyledContactPanel>
  );
};

const RealChatPanel = ({
  contactId,
  phoneNumber,
}: {
  contactId: string;
  phoneNumber: string | null;
}) => {
  const { messages } = useWhatsappMessages(contactId);
  const { send, loading: sending } = useSendWhatsappMessage(contactId, phoneNumber ?? '');

  return (
    <StyledChatPanel>
      <StyledChatMessages>
        {messages.map((msg) =>
          msg.direction === 'OUTBOUND' ? (
            <StyledMsgOut key={msg.id}>{msg.content ?? '📎'}</StyledMsgOut>
          ) : (
            <StyledMsgIn key={msg.id}>{msg.content ?? '📎'}</StyledMsgIn>
          ),
        )}
      </StyledChatMessages>

      <StyledComposer>
        <StyledComposerTabs>
          <strong>Chat</strong> via WhatsApp
        </StyledComposerTabs>
        {/* FORK: Voka CRM — Fase 11: "/" activates quick reply picker */}
        <QuickReplyComposer
          placeholder={phoneNumber ? `Mensagem para ${phoneNumber}… (/ para respostas rápidas)` : 'Selecione um contato'}
          onSend={send}
          disabled={!phoneNumber}
          sending={sending}
        />
      </StyledComposer>
    </StyledChatPanel>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export const InboxPage = () => {
  const { threads } = useWhatsappThreads();

  // Mock mode: use hardcoded CONVS; real mode: use contactId as key
  const [selectedMockId, setSelectedMockId] = useState('1');
  const [selectedContactId, setSelectedContactId] = useState('');

  if (!IS_WHATSAPP_MOCK) {
    // Auto-select the first thread when data loads
    const effectiveId = selectedContactId || threads[0]?.contactId || '';
    const selectedThread = threads.find((t) => t.contactId === effectiveId) ?? threads[0];

    return (
      <StyledPage>
        <StyledInbox>
          <RealConversationList
            threads={threads}
            selectedId={effectiveId}
            onSelect={setSelectedContactId}
          />
          {selectedThread ? (
            <>
              <RealContactPanel
                contactId={selectedThread.contactId}
                phoneNumber={selectedThread.phoneNumber}
                assignedUserName={selectedThread.assignedUserName}
              />
              <RealChatPanel
                contactId={selectedThread.contactId}
                phoneNumber={selectedThread.phoneNumber}
              />
            </>
          ) : (
            <>
              <StyledContactPanel>
                <StyledContactName style={{ color: C.inboxMuted }}>—</StyledContactName>
              </StyledContactPanel>
              <StyledChatPanel>
                <div style={{ color: C.muted, fontSize: 13, margin: 'auto', padding: 24, textAlign: 'center' }}>
                  Selecione uma conversa
                </div>
              </StyledChatPanel>
            </>
          )}
        </StyledInbox>
      </StyledPage>
    );
  }

  // Mock mode (VITE_WHATSAPP_MOCK_MODE=true)
  const selectedConv = CONVS.find((c) => c.id === selectedMockId) ?? CONVS[0];

  return (
    <StyledPage>
      <StyledInbox>
        <ConversationList selectedId={selectedMockId} onSelect={setSelectedMockId} />
        <ContactPanel conv={selectedConv} />
        <ChatPanel conv={selectedConv} />
      </StyledInbox>
    </StyledPage>
  );
};
