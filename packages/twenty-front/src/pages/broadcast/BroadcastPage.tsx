// FORK: Voka CRM — Campanhas de Disparo em Massa (top-level page)
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  type BroadcastCampaign,
  useBroadcastCampaigns,
  useBroadcastCampaignRecipients,
  useCancelBroadcastCampaign,
  useCreateBroadcastCampaign,
  useLaunchBroadcastCampaign,
} from '@/broadcast/hooks/useBroadcast';
import { IconSend, IconPlus, IconX } from 'twenty-ui/icon';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#F2F4F7',
  cardBg: '#FFFFFF',
  border: '#EAECF0',
  txt: '#101828',
  muted: '#667085',
  brand: '#7C3AED',
  success: '#12B76A',
  danger: '#F04438',
  warn: '#F79009',
  running: '#2E90FA',
};

const STATUS_PT: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  RUNNING: 'Enviando',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  FAILED: 'Falhou',
};

type SourceMode = 'livre' | 'contatos' | 'clientes' | 'leads';

type ContactEntry = { id: string; name: string; phone: string };

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  background: ${C.bg};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const StyledTitle = styled.h1`
  align-items: center;
  color: ${C.txt};
  display: flex;
  font-size: 20px;
  font-weight: 700;
  gap: 10px;
  margin: 0;
`;

const StyledCard = styled.div`
  background: ${C.cardBg};
  border: 1px solid ${C.border};
  border-radius: 12px;
  overflow: hidden;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
`;

const StyledTh = styled.th`
  background: #FAFAFA;
  border-bottom: 1px solid ${C.border};
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  padding: 10px 16px;
  text-align: left;
  text-transform: uppercase;
`;

const StyledTd = styled.td`
  border-bottom: 1px solid ${C.border};
  color: ${C.txt};
  padding: 10px 16px;
  vertical-align: middle;
`;

const StyledStatusBadge = styled.span<{ status: string }>`
  background: ${({ status }) =>
    status === 'COMPLETED' ? '#ECFDF3'
    : status === 'RUNNING' ? '#EFF8FF'
    : status === 'CANCELLED' || status === 'FAILED' ? '#FEF3F2'
    : status === 'SCHEDULED' ? '#FFF6ED'
    : '#F4F4F5'};
  border-radius: 20px;
  color: ${({ status }) =>
    status === 'COMPLETED' ? C.success
    : status === 'RUNNING' ? C.running
    : status === 'CANCELLED' || status === 'FAILED' ? C.danger
    : status === 'SCHEDULED' ? C.warn
    : C.muted};
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
`;

const StyledBtn = styled.button<{ variant?: 'primary' | 'ghost' }>`
  align-items: center;
  background: ${({ variant }) => variant === 'primary' ? C.brand : 'transparent'};
  border: ${({ variant }) => variant === 'ghost' ? `1px solid ${C.border}` : 'none'};
  border-radius: 8px;
  color: ${({ variant }) => variant === 'ghost' ? C.txt : '#fff'};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;

  &:hover { opacity: 0.87; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const StyledSmallBtn = styled.button<{ variant?: 'danger' }>`
  background: ${({ variant }) => variant === 'danger' ? '#FEF3F2' : 'transparent'};
  border: 1px solid ${({ variant }) => variant === 'danger' ? '#FEE4E2' : C.border};
  border-radius: 6px;
  color: ${({ variant }) => variant === 'danger' ? C.danger : C.muted};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;

  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const StyledOverlay = styled.div`
  align-items: center;
  background: rgba(0,0,0,0.40);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
`;

const StyledModal = styled.div`
  background: ${C.cardBg};
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  width: 560px;
`;

const StyledModalHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
`;

const StyledModalTitle = styled.h2`
  color: ${C.txt};
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const StyledModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
`;

const StyledModalFooter = styled.div`
  border-top: 1px solid ${C.border};
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 24px;
`;

const StyledIconBtn = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  padding: 4px;

  &:hover { background: ${C.border}; }
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledLabel = styled.label`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const StyledInput = styled.input`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 9px 12px;
  width: 100%;

  &:focus { border-color: ${C.brand}; }
`;

const StyledTextarea = styled.textarea`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  min-height: 90px;
  outline: none;
  padding: 9px 12px;
  resize: vertical;
  width: 100%;

  &:focus { border-color: ${C.brand}; }
`;

const StyledSourceGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
`;

const StyledSourceCard = styled.button<{ active: boolean }>`
  background: ${({ active }) => active ? '#F5F0FF' : '#FAFAFA'};
  border: 2px solid ${({ active }) => active ? C.brand : C.border};
  border-radius: 10px;
  cursor: pointer;
  padding: 12px 14px;
  text-align: left;
  transition: border-color 0.15s;

  &:hover { border-color: ${C.brand}; }
`;

const StyledSourceLabel = styled.div<{ active: boolean }>`
  color: ${({ active }) => active ? C.brand : C.txt};
  font-size: 13px;
  font-weight: 600;
`;

const StyledSourceSub = styled.div`
  color: ${C.muted};
  font-size: 11px;
  margin-top: 2px;
`;

const StyledContactList = styled.div`
  border: 1px solid ${C.border};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const StyledContactItem = styled.label`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 8px 12px;

  &:last-child { border-bottom: none; }
  &:hover { background: #FAFAFA; }
`;

const StyledProgressBar = styled.div<{ pct: number }>`
  background: #EAECF0;
  border-radius: 99px;
  height: 6px;
  overflow: hidden;
  width: 100%;

  &::after {
    background: ${C.brand};
    border-radius: 99px;
    content: '';
    display: block;
    height: 100%;
    width: ${({ pct }) => pct}%;
  }
`;

const StyledDetail = styled.div`
  background: #FAFAFA;
  border-top: 1px solid ${C.border};
  padding: 16px;
`;

const StyledMetricsRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
`;

const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledMetricValue = styled.span`
  color: ${C.txt};
  font-size: 18px;
  font-weight: 700;
`;

const StyledMetricLabel = styled.span`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
`;

// ─── Contact-fetch hooks ──────────────────────────────────────────────────────

const PHONE_GQL = { primaryPhoneNumber: true, primaryPhoneCountryCode: true };

function useContatosRecords(active: boolean) {
  const { records } = useFindManyRecords({
    objectNameSingular: 'person',
    recordGqlFields: { id: true, name: { firstName: true, lastName: true }, phones: PHONE_GQL },
    skip: !active,
  });

  return useMemo<ContactEntry[]>(() => {
    type Row = { id: string; name?: { firstName?: string; lastName?: string }; phones?: { primaryPhoneNumber: string } };
    return (records as unknown as Row[])
      .filter(r => r.phones?.primaryPhoneNumber)
      .map(r => ({
        id: r.id,
        name: `${r.name?.firstName ?? ''} ${r.name?.lastName ?? ''}`.trim() || '(sem nome)',
        phone: r.phones!.primaryPhoneNumber,
      }));
  }, [records]);
}

function useClientesRecords(active: boolean) {
  const { records } = useFindManyRecords({
    objectNameSingular: 'cliente',
    recordGqlFields: { id: true, name: true, telefone: PHONE_GQL },
    skip: !active,
  });

  return useMemo<ContactEntry[]>(() => {
    type Row = { id: string; name?: string; telefone?: { primaryPhoneNumber: string } };
    return (records as unknown as Row[])
      .filter(r => r.telefone?.primaryPhoneNumber)
      .map(r => ({
        id: r.id,
        name: r.name ?? '(sem nome)',
        phone: r.telefone!.primaryPhoneNumber,
      }));
  }, [records]);
}

function useLeadsRecords(active: boolean) {
  const { records } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    recordGqlFields: {
      id: true,
      name: true,
      pointOfContact: {
        id: true,
        name: { firstName: true, lastName: true },
        phones: PHONE_GQL,
      },
    },
    skip: !active,
  });

  return useMemo<ContactEntry[]>(() => {
    type Contact = { id: string; name?: { firstName?: string; lastName?: string }; phones?: { primaryPhoneNumber: string } };
    type Row = { id: string; name?: string; pointOfContact?: Contact | null };
    return (records as unknown as Row[])
      .filter(r => r.pointOfContact?.phones?.primaryPhoneNumber)
      .map(r => {
        const poc = r.pointOfContact!;
        const pocName = `${poc.name?.firstName ?? ''} ${poc.name?.lastName ?? ''}`.trim();
        return {
          id: r.id,
          name: pocName || r.name || '(sem nome)',
          phone: poc.phones!.primaryPhoneNumber,
        };
      });
  }, [records]);
}

function parsePhoneLines(raw: string): ContactEntry[] {
  return raw
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 8)
    .map((phone, i) => ({ id: `livre-${i}`, name: phone, phone }));
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

const CampaignRow = ({
  campaign,
  onLaunch,
  onCancel,
  launching,
  cancelling,
}: {
  campaign: BroadcastCampaign;
  onLaunch: (id: string) => void;
  onCancel: (id: string) => void;
  launching: boolean;
  cancelling: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { recipients } = useBroadcastCampaignRecipients(expanded ? campaign.id : null);

  const pct =
    campaign.totalCount > 0
      ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100)
      : 0;

  return (
    <>
      <tr>
        <StyledTd>
          <span
            style={{ color: C.brand, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setExpanded(e => !e)}
          >
            {campaign.name}
          </span>
        </StyledTd>
        <StyledTd>
          <StyledStatusBadge status={campaign.status}>
            {STATUS_PT[campaign.status] ?? campaign.status}
          </StyledStatusBadge>
        </StyledTd>
        <StyledTd>{campaign.totalCount}</StyledTd>
        <StyledTd>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{campaign.sentCount}/{campaign.totalCount}</span>
            {campaign.status === 'RUNNING' && <StyledProgressBar pct={pct} />}
          </div>
        </StyledTd>
        <StyledTd>{campaign.templateName ?? '—'}</StyledTd>
        <StyledTd>
          <div style={{ display: 'flex', gap: 6 }}>
            {campaign.status === 'DRAFT' && (
              <StyledSmallBtn onClick={() => onLaunch(campaign.id)} disabled={launching}>
                {launching ? 'Disparando…' : 'Disparar'}
              </StyledSmallBtn>
            )}
            {['DRAFT', 'RUNNING', 'SCHEDULED'].includes(campaign.status) && (
              <StyledSmallBtn variant="danger" onClick={() => onCancel(campaign.id)} disabled={cancelling}>
                Cancelar
              </StyledSmallBtn>
            )}
          </div>
        </StyledTd>
      </tr>
      {expanded && (
        <tr>
          <StyledTd colSpan={6} style={{ padding: 0 }}>
            <StyledDetail>
              <StyledMetricsRow>
                {([
                  { label: 'Entregues', value: campaign.deliveredCount, color: C.success },
                  { label: 'Lidas', value: campaign.readCount, color: C.running },
                  { label: 'Enviadas', value: campaign.sentCount, color: C.warn },
                  { label: 'Falhas', value: campaign.failedCount, color: C.danger },
                ] as { label: string; value: number; color: string }[]).map(m => (
                  <StyledMetric key={m.label}>
                    <StyledMetricValue style={{ color: m.color }}>{m.value}</StyledMetricValue>
                    <StyledMetricLabel>{m.label}</StyledMetricLabel>
                  </StyledMetric>
                ))}
              </StyledMetricsRow>
              {recipients.length > 0 && (
                <StyledTable>
                  <thead>
                    <tr>
                      <StyledTh>Número</StyledTh>
                      <StyledTh>Status</StyledTh>
                      <StyledTh>Enviado às</StyledTh>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.slice(0, 30).map(r => (
                      <tr key={r.id}>
                        <StyledTd>{r.phoneNumber}</StyledTd>
                        <StyledTd>
                          <StyledStatusBadge status={r.status}>{r.status}</StyledStatusBadge>
                        </StyledTd>
                        <StyledTd>
                          {r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '—'}
                        </StyledTd>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              )}
            </StyledDetail>
          </StyledTd>
        </tr>
      )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const BroadcastPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>('livre');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [livreText, setLivreText] = useState('');
  const [form, setForm] = useState({
    nome: '',
    templateName: '',
    languageCode: 'pt_BR',
    scheduledAt: '',
  });
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { campaigns, refetch } = useBroadcastCampaigns();
  const { create: createCampaign } = useCreateBroadcastCampaign();
  const { launch: launchCampaign } = useLaunchBroadcastCampaign();
  const { cancel: cancelCampaign } = useCancelBroadcastCampaign();

  const contatosEntries = useContatosRecords(sourceMode === 'contatos');
  const clientesEntries = useClientesRecords(sourceMode === 'clientes');
  const leadsEntries = useLeadsRecords(sourceMode === 'leads');

  const currentEntries = useMemo<ContactEntry[]>(() => {
    if (sourceMode === 'contatos') return contatosEntries;
    if (sourceMode === 'clientes') return clientesEntries;
    if (sourceMode === 'leads') return leadsEntries;
    return [];
  }, [sourceMode, contatosEntries, clientesEntries, leadsEntries]);

  useEffect(() => { setSelectedIds(new Set()); }, [sourceMode]);

  const toggleId = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds(
      selectedIds.size === currentEntries.length
        ? new Set()
        : new Set(currentEntries.map(e => e.id)),
    );

  const livreCount = parsePhoneLines(livreText).length;
  const resolvedRecipients = useMemo<ContactEntry[]>(() => {
    if (sourceMode === 'livre') return parsePhoneLines(livreText);
    return currentEntries.filter(e => selectedIds.has(e.id));
  }, [sourceMode, livreText, currentEntries, selectedIds]);

  const canCreate =
    form.nome.trim().length > 0 &&
    (sourceMode === 'livre' ? livreCount > 0 : selectedIds.size > 0);

  const closeModal = () => {
    setShowModal(false);
    setForm({ nome: '', templateName: '', languageCode: 'pt_BR', scheduledAt: '' });
    setSourceMode('livre');
    setSelectedIds(new Set());
    setLivreText('');
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    await createCampaign({
      variables: {
        input: {
          name: form.nome.trim(),
          templateName: form.templateName.trim() || undefined,
          languageCode: form.languageCode.trim() || 'pt_BR',
          scheduledAt: form.scheduledAt || undefined,
          recipients: resolvedRecipients.map(r => ({
            phoneNumber: r.phone,
            contactId: undefined,
          })),
        },
      },
    });
    closeModal();
    await refetch();
  };

  const handleLaunch = async (id: string) => {
    setLaunchingId(id);
    await launchCampaign({ variables: { campaignId: id } });
    await refetch();
    setLaunchingId(null);
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await cancelCampaign({ variables: { campaignId: id } });
    await refetch();
    setCancellingId(null);
  };

  const sources: [SourceMode, string, string][] = [
    ['livre', 'Lista livre', 'Cole os números manualmente'],
    ['contatos', 'Contatos', 'Pessoas cadastradas no CRM'],
    ['clientes', 'Clientes', 'Base de clientes recorrentes'],
    ['leads', 'Leads', 'Oportunidades e prospects'],
  ];

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitle>
          <IconSend size={22} color={C.brand} />
          Campanhas de Disparo
        </StyledTitle>
        <StyledBtn variant="primary" onClick={() => setShowModal(true)}>
          <IconPlus size={16} />
          Nova Campanha
        </StyledBtn>
      </StyledHeader>

      <StyledCard>
        <StyledTable>
          <thead>
            <tr>
              <StyledTh>Nome</StyledTh>
              <StyledTh>Status</StyledTh>
              <StyledTh>Destinatários</StyledTh>
              <StyledTh>Progresso</StyledTh>
              <StyledTh>Template</StyledTh>
              <StyledTh>Ações</StyledTh>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    padding: '32px 16px',
                    textAlign: 'center',
                  }}
                >
                  Nenhuma campanha criada ainda
                </td>
              </tr>
            ) : (
              campaigns.map(c => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  onLaunch={handleLaunch}
                  onCancel={handleCancel}
                  launching={launchingId === c.id}
                  cancelling={cancellingId === c.id}
                />
              ))
            )}
          </tbody>
        </StyledTable>
      </StyledCard>

      {showModal && (
        <StyledOverlay onClick={e => e.target === e.currentTarget && closeModal()}>
          <StyledModal>
            <StyledModalHeader>
              <StyledModalTitle>Nova Campanha de Disparo</StyledModalTitle>
              <StyledIconBtn onClick={closeModal}><IconX size={18} /></StyledIconBtn>
            </StyledModalHeader>

            <StyledModalBody>
              <StyledField>
                <StyledLabel>Nome da campanha *</StyledLabel>
                <StyledInput
                  placeholder="Ex: Promoção Julho 2026"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>Template WhatsApp</StyledLabel>
                <StyledInput
                  placeholder="Nome do template aprovado na Meta"
                  value={form.templateName}
                  onChange={e => setForm(f => ({ ...f, templateName: e.target.value }))}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>Idioma</StyledLabel>
                <StyledInput
                  placeholder="pt_BR"
                  value={form.languageCode}
                  onChange={e => setForm(f => ({ ...f, languageCode: e.target.value }))}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>Agendar para (opcional)</StyledLabel>
                <StyledInput
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>Destinatários</StyledLabel>
                <StyledSourceGrid>
                  {sources.map(([mode, label, sub]) => (
                    <StyledSourceCard
                      key={mode}
                      active={sourceMode === mode}
                      onClick={() => setSourceMode(mode)}
                      type="button"
                    >
                      <StyledSourceLabel active={sourceMode === mode}>{label}</StyledSourceLabel>
                      <StyledSourceSub>{sub}</StyledSourceSub>
                    </StyledSourceCard>
                  ))}
                </StyledSourceGrid>
              </StyledField>

              {sourceMode === 'livre' ? (
                <StyledField>
                  <StyledLabel>Números (um por linha ou separados por vírgula)</StyledLabel>
                  <StyledTextarea
                    placeholder={'+5511999990001\n+5521999990002\n+5541999990003'}
                    value={livreText}
                    onChange={e => setLivreText(e.target.value)}
                  />
                  {livreCount > 0 && (
                    <span style={{ color: C.muted, fontSize: 12 }}>
                      {livreCount} número(s) detectado(s)
                    </span>
                  )}
                </StyledField>
              ) : (
                <StyledField>
                  <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                    <StyledLabel style={{ margin: 0 }}>
                      {currentEntries.length} registro(s) com telefone
                    </StyledLabel>
                    {currentEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAll}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: C.brand,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        {selectedIds.size === currentEntries.length
                          ? 'Desmarcar todos'
                          : 'Selecionar todos'}
                      </button>
                    )}
                  </div>

                  {currentEntries.length === 0 ? (
                    <span style={{ color: C.muted, fontSize: 13 }}>
                      Nenhum registro com telefone cadastrado.
                    </span>
                  ) : (
                    <StyledContactList>
                      {currentEntries.map(entry => (
                        <StyledContactItem key={entry.id}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => toggleId(entry.id)}
                          />
                          <span style={{ color: C.txt, fontSize: 13 }}>{entry.name}</span>
                          <span style={{ color: C.muted, fontSize: 12, marginLeft: 'auto' }}>
                            {entry.phone}
                          </span>
                        </StyledContactItem>
                      ))}
                    </StyledContactList>
                  )}

                  {selectedIds.size > 0 && (
                    <span style={{ color: C.brand, fontSize: 12, fontWeight: 600 }}>
                      {selectedIds.size} selecionado(s)
                    </span>
                  )}
                </StyledField>
              )}
            </StyledModalBody>

            <StyledModalFooter>
              <StyledBtn variant="ghost" onClick={closeModal}>Cancelar</StyledBtn>
              <StyledBtn variant="primary" onClick={handleCreate} disabled={!canCreate}>
                <IconSend size={14} />
                {form.scheduledAt ? 'Agendar' : 'Criar Campanha'}
              </StyledBtn>
            </StyledModalFooter>
          </StyledModal>
        </StyledOverlay>
      )}
    </StyledPage>
  );
};
