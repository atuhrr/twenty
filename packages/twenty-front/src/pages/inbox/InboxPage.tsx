// T-5: Caixa de Entrada — Linaria styled → Tailwind CSS, lógica inalterada
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApolloClient, useMutation } from '@apollo/client/react';

import { useLeadTasks } from '@/funil/hooks/useLeadTasks';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';
import { useWhatsappThreads, type WhatsappThread } from '@/whatsapp/hooks/useWhatsappThreads';
import { useWhatsappSSE } from '@/whatsapp/hooks/useWhatsappSSE';
import { GET_WHATSAPP_MESSAGES } from '@/whatsapp/graphql/queries/getWhatsappMessages';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';
import { useWhatsappMessages } from '@/whatsapp/hooks/useWhatsappMessages';
import { useSendWhatsappMessage } from '@/whatsapp/hooks/useSendWhatsappMessage';
import { QuickReplyComposer } from '@/whatsapp/components/chat/QuickReplyComposer';
import { TeamChatPanel } from '@/team-chat/components/TeamChatPanel';
import { ASSIGN_WHATSAPP_THREAD } from '@/whatsapp/graphql/mutations/assignWhatsappThread';
import { MARK_WHATSAPP_THREAD_READ } from '@/whatsapp/graphql/mutations/markWhatsappThreadRead';
import { SET_WHATSAPP_BOT_PAUSED } from '@/whatsapp/graphql/mutations/setWhatsappBotPaused';
import { GET_WHATSAPP_THREADS } from '@/whatsapp/graphql/queries/getWhatsappThreads';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Kept as constants so mock-mode and real-mode share the same values.
const PALETTES = [
  { bg: '#EEEDFE', tx: '#534AB7' },
  { bg: '#FAEEDA', tx: '#854F0B' },
  { bg: '#E1F5EE', tx: '#0F6E56' },
  { bg: '#FCEBEB', tx: '#A32D2D' },
  { bg: '#FBEAF0', tx: '#993556' },
  { bg: '#E6F1FB', tx: '#185FA5' },
  { bg: '#F1EFE8', tx: '#444441' },
];

const CHANNELS: Record<string, { bg: string; abbr: string }> = {
  whatsapp:  { bg: '#25D366', abbr: 'W' },
  messenger: { bg: '#0084FF', abbr: 'M' },
  instagram: { bg: '#E1306C', abbr: 'I' },
  telegram:  { bg: '#229ED9', abbr: 'T' },
  google:    { bg: '#EA4335', abbr: 'G' },
};

// ─── Mock data (used when IS_WHATSAPP_MOCK === true) ─────────────────────────

type MockConv = {
  id: string; name: string; initials: string; palette: number;
  channel: string; preview: string; time: string; starred?: boolean;
  contact: { phone: string; email: string; role: string; value: string; responsible: string; stage: string };
};

const MOCK_CONVS: MockConv[] = [
  { id: '1', name: 'Mary Kim', initials: 'MK', palette: 2, channel: 'whatsapp', preview: 'Consigo um desconto na próxima…', time: '13:06', starred: true, contact: { phone: '+55 (81) 3345-6789', email: 'marykim@gmail.com', role: 'Compradora regional', value: 'R$ 1.200', responsible: 'Ariel', stage: 'Leads Recebidos' } },
  { id: '2', name: 'João Henrique', initials: 'JH', palette: 5, channel: 'messenger', preview: 'Oi, tenho uma dúvida', time: '17:45', contact: { phone: '+55 (11) 9 8765-4321', email: 'joao.h@email.com', role: 'Gerente comercial', value: 'R$ 3.500', responsible: 'Téo', stage: 'Tomada de Decisão' } },
  { id: '3', name: 'Sônia Esteves', initials: 'SE', palette: 1, channel: 'instagram', preview: 'Você acha que…', time: '12:45', contact: { phone: '+55 (21) 9 9876-5432', email: 'sonia.e@gmail.com', role: 'Diretora de marketing', value: 'R$ 5.000', responsible: 'Ariel', stage: 'Negociação' } },
  { id: '4', name: 'Melina Greco', initials: 'MG', palette: 3, channel: 'telegram', preview: 'Mal posso esperar!', time: '11:56', contact: { phone: '+55 (31) 9 7654-3210', email: 'melina.g@empresa.com', role: 'Analista sênior', value: 'R$ 900', responsible: 'Téo', stage: 'Decisão Final' } },
  { id: '5', name: 'Bruna Marini', initials: 'BM', palette: 4, channel: 'whatsapp', preview: 'Oi de novo :P', time: '11:45', contact: { phone: '+55 (41) 9 6543-2109', email: 'bruna.m@email.com', role: 'Coordenadora', value: 'R$ 450', responsible: 'Ariel', stage: 'Leads Recebidos' } },
  { id: '6', name: 'Eloá Blanco', initials: 'EB', palette: 0, channel: 'google', preview: 'Vocês gravam…', time: '09:49', contact: { phone: '+55 (51) 9 5432-1098', email: 'eloa.b@gmail.com', role: 'Empreendedora', value: 'R$ 2.000', responsible: 'Téo', stage: 'Negociação' } },
];

type MockMessage = { id: string; type: 'out' | 'in' | 'day'; text: string };
const MOCK_MESSAGES: MockMessage[] = [
  { id: 'd1', type: 'day', text: 'Hoje' },
  { id: 'm1', type: 'out', text: 'Ficamos felizes em saber! Volte sempre!' },
  { id: 'm2', type: 'in', text: 'Consigo um desconto na próxima compra? 😊' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type ChannelFilter = 'todos' | 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'email';
const CHANNEL_TABS: { key: ChannelFilter; label: string; live: boolean }[] = [
  { key: 'todos',     label: 'Todos',     live: true },
  { key: 'whatsapp',  label: 'WhatsApp',  live: true },
  { key: 'instagram', label: 'Instagram', live: false },
  { key: 'messenger', label: 'Messenger', live: false },
  { key: 'telegram',  label: 'Telegram',  live: false },
  { key: 'email',     label: 'E-mail',    live: false },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ConvAvatar({ initials, paletteIdx, channel }: { initials: string; paletteIdx: number; channel: string }) {
  const p = PALETTES[paletteIdx % PALETTES.length];
  const ch = CHANNELS[channel.toLowerCase()] ?? CHANNELS.whatsapp;
  return (
    <div className="relative flex-none w-9 h-9">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
        style={{ background: p.bg, color: p.tx }}
      >
        {initials}
      </div>
      <div
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold"
        style={{ background: ch.bg }}
      >
        {ch.abbr}
      </div>
    </div>
  );
}

// ─── Conversation List (shared structure) ────────────────────────────────────

function ConvListShell({
  count,
  channelFilter,
  setChannelFilter,
  search,
  setSearch,
  children,
}: {
  count: number;
  channelFilter: ChannelFilter;
  setChannelFilter: (f: ChannelFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Caixa de Entrada
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
            {count}
          </span>
        </span>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 pl-8 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 px-2 gap-0 flex-shrink-0">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setChannelFilter(tab.key)}
            className={`px-2.5 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              channelFilter === tab.key
                ? 'border-[#437EDD] text-[#437EDD]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Team chat pinned at bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Chat da Equipe
        </div>
        <TeamChatPanel relatedRecordId={null} placeholder="Mensagem para a equipe…" />
      </div>
    </div>
  );
}

// ─── Contact Dark Panel ───────────────────────────────────────────────────────
// FORK: Zellate — painel "card do lead" real (estilo Kommo): dados do lead e
// do contato vinculados, responsável de verdade, tarefas, estatísticas e
// pausa do bot. Nada decorativo.

const PANEL_MUTED = '#7C97A2';
const PANEL_LINE = '#2C4A56';
const PANEL_FIELD = '#19303A';

function formatBRLMicros(micros: number | null | undefined): string | null {
  const v = Number(micros ?? 0);
  if (!v) return null;
  return (v / 1_000_000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type PanelTab = 'principal' | 'tarefas' | 'estatisticas' | 'config';

type LeadRecordLite = ObjectRecord & {
  name?: string | null;
  stage?: string | null;
  isUnclassified?: boolean | null;
  amount?: { amountMicros: number | null } | null;
};

type PersonRecordLite = ObjectRecord & {
  emails?: { primaryEmail: string | null } | null;
};

type MemberRecordLite = ObjectRecord & {
  name?: { firstName: string | null; lastName: string | null } | null;
};

function ContactDarkPanel({
  thread,
  onThreadsChanged,
}: {
  thread: WhatsappThread;
  onThreadsChanged: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>('principal');

  // ── Lead e contato reais vinculados à conversa ──
  const { record: lead } = useFindOneRecord<LeadRecordLite>({
    objectNameSingular: 'opportunity',
    objectRecordId: thread.opportunityId ?? '',
    recordGqlFields: {
      id: true,
      name: true,
      stage: true,
      isUnclassified: true,
      amount: { amountMicros: true, currencyCode: true },
    },
    skip: !thread.opportunityId,
  });
  const { record: person } = useFindOneRecord<PersonRecordLite>({
    objectNameSingular: 'person',
    objectRecordId: thread.personId ?? '',
    recordGqlFields: { id: true, name: true, emails: true },
    skip: !thread.personId,
  });

  // Etapas do funil vindas do metadata (mesma fonte do kanban)
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'opportunity',
  });
  const stageOptions = useMemo(() => {
    const field = objectMetadataItem.fields.find((f) => f.name === 'stage');
    return [...(field?.options ?? [])].sort((a, b) => a.position - b.position);
  }, [objectMetadataItem]);
  const { updateOneRecord } = useUpdateOneRecord();

  // Membros reais do workspace para atribuição
  const { records: members } = useFindManyRecords<MemberRecordLite>({
    objectNameSingular: 'workspaceMember',
    recordGqlFields: { id: true, name: true },
    limit: 50,
  });

  const [assignThread] = useMutation(ASSIGN_WHATSAPP_THREAD);
  const [setBotPausedMutation, { loading: pausing }] = useMutation(
    SET_WHATSAPP_BOT_PAUSED,
  );

  // Tarefas do lead (criação acontece na tela de Tarefas, já vinculada)
  const { tasks, toggleTaskDone } = useLeadTasks(thread.opportunityId);

  // Estatísticas a partir das mensagens da conversa
  const { messages } = useWhatsappMessages(thread.contactId);
  const recebidas = messages.filter((m) => m.direction === 'INBOUND').length;
  const enviadas = messages.length - recebidas;
  const primeira = messages[0]?.timestamp ?? null;
  const ultima = messages[messages.length - 1]?.timestamp ?? null;

  const displayName =
    thread.contactName ?? lead?.name ?? thread.phoneNumber ?? 'WhatsApp';
  const memberName = (m: MemberRecordLite) =>
    [m.name?.firstName, m.name?.lastName].filter(Boolean).join(' ') || '(sem nome)';

  const handleAssign = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId) ?? null;
    await assignThread({
      variables: {
        input: {
          contactId: thread.contactId,
          assignedUserId: member?.id ?? null,
          assignedUserName: member ? memberName(member) : null,
        },
      },
    });
    onThreadsChanged();
  };

  const handleStageChange = async (stage: string) => {
    if (!lead) return;
    await updateOneRecord({
      objectNameSingular: 'opportunity',
      idToUpdate: lead.id,
      updateOneRecordInput: { stage, isUnclassified: false },
    });
  };

  const handleTogglePause = async () => {
    await setBotPausedMutation({
      variables: { contactId: thread.contactId, paused: !thread.botPaused },
    });
    onThreadsChanged();
  };

  const selectClass = 'w-full rounded px-2 py-1.5 text-white text-xs outline-none appearance-none cursor-pointer';
  const selectStyle = { background: PANEL_FIELD, border: `1px solid ${PANEL_LINE}` };

  const tabs: Array<{ key: PanelTab; label: string }> = [
    { key: 'principal', label: 'Principal' },
    { key: 'tarefas', label: 'Tarefas' },
    { key: 'estatisticas', label: 'Estatísticas' },
    { key: 'config', label: 'Configuração' },
  ];

  return (
    <div
      className="w-[270px] flex-shrink-0 flex flex-col overflow-y-auto p-4"
      style={{ background: '#203D49', color: '#E6EDF0' }}
    >
      {/* Nome + situação */}
      <div className="text-white text-base font-bold truncate">{displayName}</div>
      {lead?.isUnclassified === true && (
        <div className="mt-1 mb-1 inline-block self-start px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F79009', color: '#1a1a1a' }}>
          Lead não classificado
        </div>
      )}

      {/* Etapa real do funil (edita o lead) */}
      <div className="rounded-lg px-3 py-2 my-3 text-sm" style={{ background: PANEL_FIELD }}>
        <div className="text-[10px] mb-1" style={{ color: PANEL_MUTED }}>Funil de vendas — etapa</div>
        {lead ? (
          <select
            className={selectClass}
            style={selectStyle}
            value={lead.stage ?? ''}
            onChange={(e) => void handleStageChange(e.target.value)}
          >
            {stageOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div className="text-xs" style={{ color: PANEL_MUTED }}>Sem lead vinculado a esta conversa.</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-xs mb-3 pb-2 flex-wrap" style={{ borderBottom: `1px solid ${PANEL_LINE}` }}>
        {tabs.map((t) => (
          <span
            key={t.key}
            className={`cursor-pointer ${tab === t.key ? 'text-white font-semibold' : ''}`}
            style={tab === t.key ? { borderBottom: '2px solid #FFE247', paddingBottom: 6 } : { color: PANEL_MUTED }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </span>
        ))}
      </div>

      {tab === 'principal' && (
        <div className="space-y-3 text-xs">
          <div>
            <div className="mb-1" style={{ color: PANEL_MUTED }}>Responsável</div>
            <select
              className={selectClass}
              style={selectStyle}
              value={thread.assignedUserId ?? ''}
              onChange={(e) => void handleAssign(e.target.value)}
            >
              <option value="">— Atribuir</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{memberName(m)}</option>
              ))}
            </select>
          </div>

          {formatBRLMicros(lead?.amount?.amountMicros) && (
            <div>
              <div className="mb-0.5" style={{ color: PANEL_MUTED }}>Valor</div>
              <div className="text-white text-base font-bold">{formatBRLMicros(lead?.amount?.amountMicros)}</div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${PANEL_LINE}`, paddingTop: 10 }}>
            {thread.phoneNumber && (
              <div className="mb-2.5">
                <div className="mb-0.5" style={{ color: PANEL_MUTED }}>Telefone</div>
                <div className="text-white">+{thread.phoneNumber}</div>
              </div>
            )}
            {person?.emails?.primaryEmail && (
              <div className="mb-2.5">
                <div className="mb-0.5" style={{ color: PANEL_MUTED }}>E-mail</div>
                <div className="text-white truncate">{person.emails.primaryEmail}</div>
              </div>
            )}
          </div>

          {thread.opportunityId && (
            <Link
              to={`/faturas?nova=1&leadId=${thread.opportunityId}&leadNome=${encodeURIComponent(displayName)}&valorCentavos=${Math.round((Number(lead?.amount?.amountMicros ?? 0) || 0) / 10_000)}&telefone=${thread.phoneNumber ?? ''}`}
              className="block w-full rounded px-2 py-2 text-center text-white text-xs font-bold"
              style={{ background: '#12B76A' }}
            >
              💰 Cobrar este lead
            </Link>
          )}

          <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${PANEL_LINE}` }}>
            {thread.personId && (
              <Link
                to={`/contatos/${thread.personId}`}
                className="block w-full text-left text-[11px] font-medium hover:underline text-white"
              >
                Ver contato →
              </Link>
            )}
            {thread.opportunityId && (
              <Link
                to={`/leads/${thread.opportunityId}`}
                className="block w-full text-left text-[11px] font-medium hover:underline text-white"
              >
                Ver lead →
              </Link>
            )}
          </div>
        </div>
      )}

      {tab === 'tarefas' && (
        <div className="space-y-3 text-xs">
          {!thread.opportunityId ? (
            <div style={{ color: PANEL_MUTED }}>Sem lead vinculado — tarefas ficam no lead.</div>
          ) : (
            <>
              {tasks.length === 0 && (
                <div style={{ color: PANEL_MUTED }}>Nenhuma tarefa para este lead.</div>
              )}
              {tasks.map((tt) => {
                const task = tt.task;
                if (!task) return null;
                const done = task.status === 'CONCLUIDO';
                const overdue = !done && task.dueAt != null && new Date(task.dueAt) < new Date();
                return (
                  <label key={task.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => void toggleTaskDone(task.id, task.status)}
                      className="mt-0.5"
                    />
                    <span className={`flex-1 ${done ? 'line-through' : 'text-white'}`} style={done ? { color: PANEL_MUTED } : undefined}>
                      {task.title}
                      {task.dueAt && (
                        <span className="block text-[10px]" style={{ color: overdue ? '#F97066' : PANEL_MUTED }}>
                          {new Date(task.dueAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}

              <div className="pt-2" style={{ borderTop: `1px solid ${PANEL_LINE}` }}>
                <Link
                  to={`/tarefas?novaTarefa=1&leadId=${thread.opportunityId}&leadNome=${encodeURIComponent(displayName)}`}
                  className="block w-full rounded px-2 py-1.5 text-center text-white text-xs font-medium"
                  style={{ background: '#437EDD' }}
                >
                  Criar tarefa para este lead →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'estatisticas' && (
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between"><span style={{ color: PANEL_MUTED }}>Mensagens recebidas</span><span className="text-white font-semibold">{recebidas}</span></div>
          <div className="flex justify-between"><span style={{ color: PANEL_MUTED }}>Mensagens enviadas</span><span className="text-white font-semibold">{enviadas}</span></div>
          {primeira && (
            <div className="flex justify-between"><span style={{ color: PANEL_MUTED }}>Primeira interação</span><span className="text-white">{new Date(primeira).toLocaleDateString('pt-BR')}</span></div>
          )}
          {ultima && (
            <div className="flex justify-between"><span style={{ color: PANEL_MUTED }}>Última interação</span><span className="text-white">{new Date(ultima).toLocaleDateString('pt-BR')}</span></div>
          )}
          {formatBRLMicros(lead?.amount?.amountMicros) && (
            <div className="flex justify-between"><span style={{ color: PANEL_MUTED }}>Valor do lead</span><span className="text-white font-semibold">{formatBRLMicros(lead?.amount?.amountMicros)}</span></div>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-3 text-xs">
          <div>
            <div className="text-white font-semibold mb-1">Assistente virtual (bot)</div>
            <p style={{ color: PANEL_MUTED }}>
              Pause o bot quando um humano assumir esta conversa — as mensagens
              continuam chegando, mas o bot para de responder este cliente.
            </p>
          </div>
          <button
            className="w-full rounded px-2 py-2 text-white text-xs font-medium disabled:opacity-50"
            style={{ background: thread.botPaused ? '#12B76A' : '#F04438' }}
            disabled={pausing}
            onClick={() => void handleTogglePause()}
          >
            {thread.botPaused ? '▶ Retomar bot nesta conversa' : '⏸ Pausar bot nesta conversa'}
          </button>
          {thread.botPaused && (
            <div className="text-[11px]" style={{ color: '#F79009' }}>
              Bot pausado — este cliente não recebe respostas automáticas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  contactId,
  phoneNumber,
  name,
}: {
  contactId: string;
  phoneNumber: string | null;
  name: string;
}) {
  const { messages } = useWhatsappMessages(contactId);
  const { send, loading: sending } = useSendWhatsappMessage(contactId, phoneNumber ?? '');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-900">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
          {phoneNumber && (
            <div className="text-xs text-gray-400">{phoneNumber}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) =>
          msg.direction === 'OUTBOUND' ? (
            <div key={msg.id} className="flex justify-end">
              <div
                className="rounded-xl rounded-tr-sm px-3 py-2 text-[12.5px] leading-relaxed text-white max-w-[72%]"
                style={{ background: '#2E90FA' }}
              >
                {msg.content ?? '📎'}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div className="rounded-xl rounded-tl-sm px-3 py-2 text-[12.5px] leading-relaxed text-gray-800 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 max-w-[72%]">
                {msg.content ?? '📎'}
              </div>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          <strong>Chat</strong> via WhatsApp
        </div>
        <QuickReplyComposer
          placeholder={phoneNumber ? `Mensagem para ${phoneNumber}… (/ para respostas rápidas)` : 'Selecione um contato'}
          onSend={send}
          disabled={!phoneNumber}
          sending={sending}
        />
      </div>
    </div>
  );
}

function MockChatPanel({ conv }: { conv: MockConv }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{conv.name}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {MOCK_MESSAGES.map((msg) => {
          if (msg.type === 'day') return (
            <div key={msg.id} className="text-center text-[10.5px] text-gray-400">{msg.text}</div>
          );
          if (msg.type === 'out') return (
            <div key={msg.id} className="flex justify-end">
              <div className="rounded-xl rounded-tr-sm px-3 py-2 text-[12.5px] text-white max-w-[72%]" style={{ background: '#2E90FA' }}>{msg.text}</div>
            </div>
          );
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="rounded-xl rounded-tl-sm px-3 py-2 text-[12.5px] text-gray-800 bg-gray-100 max-w-[72%]">{msg.text}</div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 px-4 pt-3 pb-4">
        <div className="text-xs text-gray-500 mb-2"><strong>Chat</strong> com {conv.contact.responsible}</div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
          <span className="flex-1">Escreva uma mensagem para {conv.name}…</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </div>
        <div className="flex gap-2 mt-2.5">
          <button className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white" style={{ background: '#D0D5DD' }}>Enviar</button>
          <span className="text-xs text-gray-500 py-1.5 cursor-pointer">Cancelar</span>
        </div>
      </div>
    </div>
  );
}

// ─── Real-data mode ───────────────────────────────────────────────────────────

function RealInbox({
  threads,
  refetchThreads,
}: {
  threads: WhatsappThread[];
  refetchThreads: () => void;
}) {
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(
    () => searchParams.get('contactId') ?? '',
  );
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('todos');
  const [search, setSearch] = useState('');

  const effectiveId = selectedId || threads[0]?.contactId || '';
  const selectedThread = threads.find((t) => t.contactId === effectiveId) ?? threads[0];

  // FORK: Zellate — abrir a conversa zera o não-lido (banco + recibo à Meta)
  const [markThreadRead] = useMutation(MARK_WHATSAPP_THREAD_READ, {
    refetchQueries: [{ query: GET_WHATSAPP_THREADS }],
  });

  // FORK: Zellate — TEMPO REAL: uma conexão SSE por Inbox aberto. Mensagem
  // nova (recebida, do bot ou enviada em outra aba) atualiza a lista de
  // conversas e o chat aberto sem recarregar a página.
  const apolloClient = useApolloClient();

  useWhatsappSSE({
    onMessage: (msg: WhatsappMessage) => {
      refetchThreads();

      // Anexa ao chat aberto (dedupe por id) — mesma técnica do envio
      const existente = apolloClient.readQuery<{
        whatsappMessages: WhatsappMessage[];
      }>({
        query: GET_WHATSAPP_MESSAGES,
        variables: { contactId: msg.contactId },
      });

      if (
        existente &&
        !existente.whatsappMessages.some((m) => m.id === msg.id)
      ) {
        apolloClient.writeQuery({
          query: GET_WHATSAPP_MESSAGES,
          variables: { contactId: msg.contactId },
          data: {
            whatsappMessages: [...existente.whatsappMessages, msg],
          },
        });
      }
    },
  });

  useEffect(() => {
    const current = threads.find((t) => t.contactId === effectiveId);
    if (current && current.unreadCount > 0) {
      void markThreadRead({ variables: { contactId: current.contactId } });
    }
  }, [effectiveId, threads, markThreadRead]);

  const visibleThreads = threads.filter((t) => {
    const matchesChannel =
      channelFilter === 'todos' || (t.channelType ?? 'whatsapp').toLowerCase() === channelFilter;
    const matchesSearch =
      !search ||
      (t.phoneNumber ?? '').includes(search) ||
      (t.contactName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const activeTab = CHANNEL_TABS.find((t) => t.key === channelFilter);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Col 1 */}
      <ConvListShell
        count={visibleThreads.length}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        search={search}
        setSearch={setSearch}
      >
        {!activeTab?.live ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <span className="text-2xl mb-2">🚧</span>
            <span className="text-xs text-gray-500">Canal <strong>{activeTab?.label}</strong> em breve.</span>
          </div>
        ) : visibleThreads.length === 0 ? (
          <div className="px-4 py-3 text-xs text-gray-400">Nenhuma conversa ainda.</div>
        ) : (
          visibleThreads.map((t, idx) => {
            // Nome de perfil do WhatsApp quando disponivel (a Cloud API nao expoe a foto)
            const displayName = t.contactName ?? t.phoneNumber ?? `Contato #${idx + 1}`;
            const initials = t.contactName
              ? t.contactName
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : t.phoneNumber
                ? t.phoneNumber.replace(/\D/g, '').slice(-4, -2)
                : (t.channelType ?? 'WA').slice(0, 2);
            const isActive = t.contactId === effectiveId;
            return (
              <div
                key={t.contactId}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 border-t border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#EEF4FF] border-l-2 border-l-[#437EDD]' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-l-transparent'
                }`}
                onClick={() => setSelectedId(t.contactId)}
              >
                <ConvAvatar initials={initials} paletteIdx={idx} channel={t.channelType ?? 'whatsapp'} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">
                    {displayName}
                  </div>
                  <div className="text-[11.5px] text-gray-500 truncate">
                    {t.lastMessage?.content ?? '📎 Mídia'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10.5px] text-gray-400">{formatTime(t.lastMessage?.timestamp ?? new Date().toISOString())}</span>
                  {t.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </ConvListShell>

      {/* Col 2 */}
      {selectedThread ? (
        <ContactDarkPanel
          key={selectedThread.contactId}
          thread={selectedThread}
          onThreadsChanged={refetchThreads}
        />
      ) : (
        <div className="w-[270px] flex-shrink-0" style={{ background: '#203D49' }} />
      )}

      {/* Col 3 */}
      {selectedThread ? (
        <ChatPanel
          contactId={selectedThread.contactId}
          phoneNumber={selectedThread.phoneNumber}
          name={selectedThread.contactName ?? selectedThread.phoneNumber ?? 'WhatsApp'}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 bg-white dark:bg-gray-900">
          Selecione uma conversa
        </div>
      )}
    </div>
  );
}

// ─── Mock mode ────────────────────────────────────────────────────────────────

function MockInbox() {
  const [selectedId, setSelectedId] = useState('1');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('todos');
  const [search, setSearch] = useState('');

  const visibleConvs = MOCK_CONVS.filter((c) => {
    const matchesChannel = channelFilter === 'todos' || c.channel === channelFilter;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const selectedConv = MOCK_CONVS.find((c) => c.id === selectedId) ?? MOCK_CONVS[0];

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Col 1 */}
      <ConvListShell
        count={visibleConvs.length}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        search={search}
        setSearch={setSearch}
      >
        {visibleConvs.map((conv) => {
          const isActive = conv.id === selectedId;
          return (
            <div
              key={conv.id}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 border-t border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                isActive ? 'bg-[#EEF4FF] border-l-2 border-l-[#437EDD]' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-l-transparent'
              }`}
              onClick={() => setSelectedId(conv.id)}
            >
              <ConvAvatar initials={conv.initials} paletteIdx={conv.palette} channel={conv.channel} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">{conv.name}</div>
                <div className="text-[11.5px] text-gray-500 truncate">{conv.preview}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10.5px] text-gray-400">{conv.time}</span>
                {conv.starred && <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
              </div>
            </div>
          );
        })}
      </ConvListShell>

      {/* Col 2 — painel simplificado (mock não tem lead/contato reais) */}
      <div
        className="w-[270px] flex-shrink-0 flex flex-col overflow-y-auto p-4 text-xs"
        style={{ background: '#203D49', color: '#E6EDF0' }}
      >
        <div className="text-white text-base font-bold mb-3 truncate">{selectedConv.name}</div>
        {([
          ['Etapa', selectedConv.contact.stage],
          ['Responsável', selectedConv.contact.responsible],
          ['Valor', selectedConv.contact.value],
          ['Telefone', selectedConv.contact.phone],
          ['E-mail', selectedConv.contact.email],
          ['Cargo', selectedConv.contact.role],
        ] as const).map(([rotulo, valor]) => (
          <div key={rotulo} className="mb-2.5">
            <div className="mb-0.5" style={{ color: PANEL_MUTED }}>{rotulo}</div>
            <div className="text-white">{valor}</div>
          </div>
        ))}
      </div>

      {/* Col 3 */}
      <MockChatPanel conv={selectedConv} />
    </div>
  );
}

// ─── Page entry ───────────────────────────────────────────────────────────────

export const InboxPage = () => {
  const { threads, refetch } = useWhatsappThreads();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-4">
      {IS_WHATSAPP_MOCK ? (
        <MockInbox />
      ) : (
        <RealInbox threads={threads} refetchThreads={() => void refetch()} />
      )}
    </div>
  );
};
