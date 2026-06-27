// FORK: Voka CRM — Fase 12: broadcast campaigns settings page
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import {
  type BroadcastCampaign,
  useBroadcastCampaigns,
  useBroadcastCampaignRecipients,
  useCancelBroadcastCampaign,
  useCreateBroadcastCampaign,
  useLaunchBroadcastCampaign,
} from '@/broadcast/hooks/useBroadcast';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';

const C = {
  bg: '#F9FAFB',
  cardBg: '#FFFFFF',
  border: '#EAECF0',
  txt: '#101828',
  muted: '#667085',
  brand: '#7C3AED',
  success: '#12B76A',
  danger: '#F04438',
  warn: '#F79009',
};

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
`;

const StyledTh = styled.th`
  border-bottom: 1px solid ${C.border};
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
  text-transform: uppercase;
`;

const StyledTd = styled.td`
  border-bottom: 1px solid ${C.border};
  color: ${C.txt};
  padding: 8px 12px;
`;

const StyledStatusBadge = styled.span<{ status: string }>`
  background: ${({ status }) =>
    status === 'COMPLETED'
      ? '#ECFDF3'
      : status === 'RUNNING'
        ? '#EEF4FF'
        : status === 'CANCELLED' || status === 'FAILED'
          ? '#FEF3F2'
          : '#F9FAFB'};
  border-radius: 20px;
  color: ${({ status }) =>
    status === 'COMPLETED'
      ? C.success
      : status === 'RUNNING'
        ? C.brand
        : status === 'CANCELLED' || status === 'FAILED'
          ? C.danger
          : C.muted};
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
`;

const StyledBtn = styled.button<{ variant?: 'primary' | 'danger' | 'ghost' }>`
  background: ${({ variant }) =>
    variant === 'primary'
      ? C.brand
      : variant === 'danger'
        ? C.danger
        : 'transparent'};
  border: ${({ variant }) =>
    variant === 'ghost' ? `1px solid ${C.border}` : 'none'};
  border-radius: 8px;
  color: ${({ variant }) => (variant === 'ghost' ? C.txt : '#fff')};
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const StyledCard = styled.div`
  background: ${C.cardBg};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 24px;
`;

const StyledFormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StyledLabel = styled.label`
  color: ${C.muted};
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const StyledInput = styled.input`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 8px 12px;
  width: 100%;

  &:focus {
    border-color: ${C.brand};
  }
`;

const StyledTextarea = styled.textarea`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  min-height: 80px;
  outline: none;
  padding: 8px 12px;
  resize: vertical;
  width: 100%;

  &:focus {
    border-color: ${C.brand};
  }
`;

const StyledBtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
`;

const StyledProgressBar = styled.div<{ pct: number }>`
  background: #eaecf0;
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

const StyledMetrics = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 8px;
`;

const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledMetricValue = styled.span`
  color: ${C.txt};
  font-size: 20px;
  font-weight: 700;
`;

const StyledMetricLabel = styled.span`
  color: ${C.muted};
  font-size: 11px;
`;

type FormState = {
  name: string;
  templateName: string;
  languageCode: string;
  numbersRaw: string;
};

const CampaignReport = ({ campaign }: { campaign: BroadcastCampaign }) => {
  const { recipients, loading } = useBroadcastCampaignRecipients(campaign.id);
  const pct =
    campaign.totalCount > 0
      ? Math.round((campaign.sentCount / campaign.totalCount) * 100)
      : 0;

  return (
    <div style={{ marginTop: 12 }}>
      <StyledMetrics>
        <StyledMetric>
          <StyledMetricValue>{campaign.totalCount}</StyledMetricValue>
          <StyledMetricLabel>Total</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue style={{ color: C.brand }}>{campaign.sentCount}</StyledMetricValue>
          <StyledMetricLabel>Enviados</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue style={{ color: C.success }}>{campaign.deliveredCount}</StyledMetricValue>
          <StyledMetricLabel>Entregues</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue style={{ color: C.warn }}>{campaign.readCount}</StyledMetricValue>
          <StyledMetricLabel>Lidos</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue style={{ color: C.danger }}>{campaign.failedCount}</StyledMetricValue>
          <StyledMetricLabel>Falhas</StyledMetricLabel>
        </StyledMetric>
      </StyledMetrics>

      <StyledProgressBar pct={pct} style={{ marginTop: 10 }} />
      <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{pct}% enviado</div>

      {recipients.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Telefone</StyledTh>
                <StyledTh>Status</StyledTh>
                <StyledTh>Enviado em</StyledTh>
                <StyledTh>Erro</StyledTh>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id}>
                  <StyledTd>{r.phoneNumber}</StyledTd>
                  <StyledTd>
                    <StyledStatusBadge status={r.status}>{r.status}</StyledStatusBadge>
                  </StyledTd>
                  <StyledTd>
                    {r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '—'}
                  </StyledTd>
                  <StyledTd style={{ color: C.danger, fontSize: 11 }}>
                    {r.errorMessage ?? '—'}
                  </StyledTd>
                </tr>
              ))}
            </tbody>
          </StyledTable>
          {loading && <p style={{ color: C.muted, fontSize: 12 }}>Carregando…</p>}
        </div>
      )}
    </div>
  );
};

export const SettingsBroadcast = () => {
  const { campaigns, loading, refetch } = useBroadcastCampaigns();
  const { create, loading: creating } = useCreateBroadcastCampaign();
  const { launch, loading: launching } = useLaunchBroadcastCampaign();
  const { cancel } = useCancelBroadcastCampaign();

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    templateName: '',
    languageCode: 'pt_BR',
    numbersRaw: '',
  });
  const [error, setError] = useState('');

  const selectedCampaign = campaigns.find((c) => c.id === selectedId) ?? null;

  const handleCreate = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Nome da campanha é obrigatório.');
      return;
    }
    const phones = form.numbersRaw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (phones.length === 0) {
      setError('Adicione ao menos um número de telefone.');
      return;
    }

    await create({
      variables: {
        input: {
          name: form.name.trim(),
          templateName: form.templateName.trim() || undefined,
          languageCode: form.languageCode.trim() || 'pt_BR',
          recipients: phones.map((p) => ({ phoneNumber: p })),
        },
      },
    });

    setShowForm(false);
    setForm({ name: '', templateName: '', languageCode: 'pt_BR', numbersRaw: '' });
    await refetch();
  };

  const handleLaunch = async (id: string) => {
    await launch({ variables: { campaignId: id } });
  };

  const handleCancel = async (id: string) => {
    await cancel({ variables: { campaignId: id } });
  };

  return (
    <SettingsPageLayout links={[{ children: 'Configurações', href: '/settings' }, { children: 'Campanhas' }]}>
      <SettingsPageContainer>
        <Section>
          <H2Title
            title="Broadcast — Campanhas de Mensagem"
            description="Disparos em massa via WhatsApp usando templates aprovados (HSM)."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <StyledBtn
              variant="primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? '✕ Cancelar' : '+ Nova campanha'}
            </StyledBtn>
          </div>

          {showForm && (
            <StyledCard style={{ marginBottom: 24 }}>
              <p style={{ color: C.txt, fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                Nova campanha de broadcast
              </p>
              <StyledFormGrid>
                <div>
                  <StyledLabel>Nome da campanha *</StyledLabel>
                  <StyledInput
                    placeholder="Ex.: Promoção de Junho"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <StyledLabel>Template (nome exato no WhatsApp Business)</StyledLabel>
                  <StyledInput
                    placeholder="Ex.: ola_cliente"
                    value={form.templateName}
                    onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                  />
                </div>
                <div>
                  <StyledLabel>Idioma do template</StyledLabel>
                  <StyledInput
                    placeholder="pt_BR"
                    value={form.languageCode}
                    onChange={(e) => setForm({ ...form, languageCode: e.target.value })}
                  />
                </div>
                <div>
                  <StyledLabel>Destinatários — números de telefone (um por linha, com DDI)</StyledLabel>
                  <StyledTextarea
                    placeholder={'+5511999990000\n+5521988880000'}
                    value={form.numbersRaw}
                    onChange={(e) => setForm({ ...form, numbersRaw: e.target.value })}
                  />
                </div>

                {error && (
                  <p style={{ color: C.danger, fontSize: 12 }}>{error}</p>
                )}

                <StyledBtnRow>
                  <StyledBtn
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </StyledBtn>
                  <StyledBtn
                    variant="primary"
                    onClick={() => void handleCreate()}
                    disabled={creating}
                  >
                    {creating ? 'Salvando…' : 'Criar campanha'}
                  </StyledBtn>
                </StyledBtnRow>
              </StyledFormGrid>
            </StyledCard>
          )}

          {loading && <p style={{ color: C.muted }}>Carregando campanhas…</p>}

          {!loading && campaigns.length === 0 && (
            <p style={{ color: C.muted, fontSize: 13 }}>
              Nenhuma campanha criada ainda. Crie a primeira acima.
            </p>
          )}

          {campaigns.length > 0 && (
            <StyledTable>
              <thead>
                <tr>
                  <StyledTh>Nome</StyledTh>
                  <StyledTh>Status</StyledTh>
                  <StyledTh>Template</StyledTh>
                  <StyledTh>Total</StyledTh>
                  <StyledTh>Enviados</StyledTh>
                  <StyledTh>Criado em</StyledTh>
                  <StyledTh>Ações</StyledTh>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setSelectedId((prev) => (prev === c.id ? null : c.id))
                      }
                    >
                      <StyledTd style={{ fontWeight: 600 }}>{c.name}</StyledTd>
                      <StyledTd>
                        <StyledStatusBadge status={c.status}>{c.status}</StyledStatusBadge>
                      </StyledTd>
                      <StyledTd>{c.templateName ?? '—'}</StyledTd>
                      <StyledTd>{c.totalCount}</StyledTd>
                      <StyledTd>{c.sentCount}</StyledTd>
                      <StyledTd>
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </StyledTd>
                      <StyledTd>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {c.status === 'DRAFT' && (
                            <StyledBtn
                              variant="primary"
                              disabled={launching}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleLaunch(c.id);
                              }}
                            >
                              Disparar
                            </StyledBtn>
                          )}
                          {(c.status === 'DRAFT' || c.status === 'RUNNING') && (
                            <StyledBtn
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleCancel(c.id);
                              }}
                            >
                              Cancelar
                            </StyledBtn>
                          )}
                        </div>
                      </StyledTd>
                    </tr>

                    {selectedId === c.id && (
                      <tr key={`${c.id}-report`}>
                        <StyledTd colSpan={7}>
                          <CampaignReport campaign={c} />
                        </StyledTd>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </StyledTable>
          )}
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
