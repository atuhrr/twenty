// FORK: Voka CRM — Fase 13: Automações por Etapa
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useState } from 'react';

import {
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
  useAutomationExecutions,
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useUpdateAutomationRule,
} from '@/automation/hooks/useAutomation';
import {
  IconBolt,
  IconCirclePlus,
  IconPlus,
  IconTrash,
  IconX,
} from 'twenty-ui/icon';

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
};

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead criado',
  STAGE_CHANGED: 'Etapa alterada',
  MESSAGE_RECEIVED: 'Mensagem recebida (WhatsApp)',
  LEAD_UNCLASSIFIED: 'Lead não classificado',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_TASK: 'Criar tarefa',
  SEND_TEMPLATE: 'Enviar template WhatsApp',
  MOVE_STAGE: 'Mover etapa',
  ASSIGN_USER: 'Atribuir usuário',
  WEBHOOK: 'Chamar webhook',
};

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }));
const ACTION_TYPES = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

// ─── Styled ───────────────────────────────────────────────────────────────────

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

const StyledToggle = styled.button<{ enabled: boolean }>`
  background: ${({ enabled }) => enabled ? C.brand : C.border};
  border: none;
  border-radius: 99px;
  cursor: pointer;
  height: 20px;
  position: relative;
  transition: background 0.2s;
  width: 36px;

  &::after {
    background: #fff;
    border-radius: 50%;
    content: '';
    height: 14px;
    left: ${({ enabled }) => enabled ? '18px' : '3px'};
    position: absolute;
    top: 3px;
    transition: left 0.2s;
    width: 14px;
  }
`;

const StyledBtn = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' }>`
  align-items: center;
  background: ${({ variant }) =>
    variant === 'primary' ? C.brand
    : variant === 'danger' ? '#FEF3F2'
    : 'transparent'};
  border: ${({ variant }) =>
    variant === 'ghost' ? `1px solid ${C.border}`
    : variant === 'danger' ? `1px solid #FEE4E2`
    : 'none'};
  border-radius: 8px;
  color: ${({ variant }) =>
    variant === 'primary' ? '#fff'
    : variant === 'danger' ? C.danger
    : C.txt};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;

  &:hover { opacity: 0.85; }
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
  width: 620px;
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
  gap: 20px;
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

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StyledSectionTitle = styled.div`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

const StyledSelect = styled.select`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 9px 12px;
  width: 100%;

  &:focus { border-color: ${C.brand}; }
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

const StyledActionCard = styled.div`
  background: #FAFAFA;
  border: 1px solid ${C.border};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
`;

const StyledAddBtn = styled.button`
  align-items: center;
  background: none;
  border: 1px dashed ${C.border};
  border-radius: 8px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 6px;
  padding: 9px 12px;
  width: 100%;

  &:hover { border-color: ${C.brand}; color: ${C.brand}; }
`;

const StyledBadge = styled.span<{ type: 'trigger' | 'action' }>`
  background: ${({ type }) => type === 'trigger' ? '#F5F0FF' : '#FFF8ED'};
  border-radius: 6px;
  color: ${({ type }) => type === 'trigger' ? C.brand : C.warn};
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
`;

const StyledDetail = styled.div`
  background: #FAFAFA;
  border-top: 1px solid ${C.border};
  padding: 16px;
`;

// ─── Execution detail row ─────────────────────────────────────────────────────

const ExecDetail = ({ ruleId }: { ruleId: string }) => {
  const { executions } = useAutomationExecutions(ruleId);

  if (executions.length === 0) {
    return <div style={{ color: C.muted, fontSize: 13 }}>Nenhuma execução ainda</div>;
  }

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTh>Record</StyledTh>
          <StyledTh>Status</StyledTh>
          <StyledTh>Executado em</StyledTh>
          <StyledTh>Erro</StyledTh>
        </tr>
      </thead>
      <tbody>
        {executions.slice(0, 20).map(e => (
          <tr key={e.id}>
            <StyledTd style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {e.recordId.slice(0, 8)}…
            </StyledTd>
            <StyledTd>
              <span style={{
                color: e.status === 'SUCCESS' ? C.success : e.status === 'FAILED' ? C.danger : C.muted,
                fontWeight: 600,
              }}>
                {e.status === 'SUCCESS' ? 'Sucesso' : e.status === 'FAILED' ? 'Falhou' : 'Ignorado'}
              </span>
            </StyledTd>
            <StyledTd>{new Date(e.executedAt).toLocaleString('pt-BR')}</StyledTd>
            <StyledTd style={{ color: C.danger, fontSize: 12 }}>{e.error ?? '—'}</StyledTd>
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};

// ─── Rule row ─────────────────────────────────────────────────────────────────

const RuleRow = ({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr>
        <StyledTd>
          <span
            style={{ color: C.brand, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setExpanded(e => !e)}
          >
            {rule.name}
          </span>
        </StyledTd>
        <StyledTd>
          <StyledBadge type="trigger">
            {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}
          </StyledBadge>
        </StyledTd>
        <StyledTd>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {rule.actions.map((a, i) => (
              <StyledBadge key={i} type="action">
                {ACTION_LABELS[a.type] ?? a.type}
              </StyledBadge>
            ))}
          </div>
        </StyledTd>
        <StyledTd>
          <StyledToggle
            enabled={rule.enabled}
            onClick={() => onToggle(rule.id, !rule.enabled)}
            title={rule.enabled ? 'Desativar' : 'Ativar'}
          />
        </StyledTd>
        <StyledTd>
          <StyledIconBtn onClick={() => onDelete(rule.id)} title="Excluir">
            <IconTrash size={16} color={C.danger} />
          </StyledIconBtn>
        </StyledTd>
      </tr>
      {expanded && (
        <tr>
          <StyledTd colSpan={5} style={{ padding: 0 }}>
            <StyledDetail>
              <ExecDetail ruleId={rule.id} />
            </StyledDetail>
          </StyledTd>
        </tr>
      )}
    </>
  );
};

// ─── Action config editor ─────────────────────────────────────────────────────

const ActionEditor = ({
  action,
  onChange,
  onRemove,
}: {
  action: AutomationAction;
  onChange: (a: AutomationAction) => void;
  onRemove: () => void;
}) => {
  const setConfig = (key: string, value: string) =>
    onChange({ ...action, config: { ...action.config, [key]: value } });

  return (
    <StyledActionCard>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <StyledSelect
          value={action.type}
          onChange={e => onChange({ type: e.target.value as AutomationAction['type'], config: {} })}
          style={{ width: 'auto' }}
        >
          {ACTION_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </StyledSelect>
        <StyledIconBtn onClick={onRemove}><IconX size={14} /></StyledIconBtn>
      </div>

      {action.type === 'CREATE_TASK' && (
        <>
          <StyledField>
            <StyledLabel>Título da tarefa</StyledLabel>
            <StyledInput
              placeholder="Ex: Ligar para o lead"
              value={String(action.config['title'] ?? '')}
              onChange={e => setConfig('title', e.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel>Vence em (minutos)</StyledLabel>
            <StyledInput
              type="number"
              placeholder="60"
              value={String(action.config['dueInMinutes'] ?? '')}
              onChange={e => setConfig('dueInMinutes', e.target.value)}
            />
          </StyledField>
        </>
      )}

      {action.type === 'SEND_TEMPLATE' && (
        <>
          <StyledField>
            <StyledLabel>Nome do template</StyledLabel>
            <StyledInput
              placeholder="Nome aprovado na Meta"
              value={String(action.config['templateName'] ?? '')}
              onChange={e => setConfig('templateName', e.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel>Idioma</StyledLabel>
            <StyledInput
              placeholder="pt_BR"
              value={String(action.config['languageCode'] ?? 'pt_BR')}
              onChange={e => setConfig('languageCode', e.target.value)}
            />
          </StyledField>
        </>
      )}

      {action.type === 'MOVE_STAGE' && (
        <StyledField>
          <StyledLabel>Mover para etapa</StyledLabel>
          <StyledInput
            placeholder="Ex: MEETING"
            value={String(action.config['toStage'] ?? '')}
            onChange={e => setConfig('toStage', e.target.value)}
          />
        </StyledField>
      )}

      {action.type === 'ASSIGN_USER' && (
        <StyledField>
          <StyledLabel>ID do usuário responsável</StyledLabel>
          <StyledInput
            placeholder="UUID do usuário"
            value={String(action.config['userId'] ?? '')}
            onChange={e => setConfig('userId', e.target.value)}
          />
        </StyledField>
      )}

      {action.type === 'WEBHOOK' && (
        <>
          <StyledField>
            <StyledLabel>URL do webhook</StyledLabel>
            <StyledInput
              placeholder="https://..."
              value={String(action.config['url'] ?? '')}
              onChange={e => setConfig('url', e.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel>Método</StyledLabel>
            <StyledSelect
              value={String(action.config['method'] ?? 'POST')}
              onChange={e => setConfig('method', e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </StyledSelect>
          </StyledField>
        </>
      )}
    </StyledActionCard>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const emptyAction = (): AutomationAction => ({
  type: 'CREATE_TASK',
  config: { title: '', dueInMinutes: '60' },
});

export const AutomacoesPage = () => {
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    triggerType: 'LEAD_CREATED',
    toStage: '',
    fromStage: '',
  });
  const [actions, setActions] = useState<AutomationAction[]>([emptyAction()]);

  const { rules, refetch } = useAutomationRules();
  const { create: createRule } = useCreateAutomationRule();
  const { update: updateRule } = useUpdateAutomationRule();
  const { remove: deleteRule } = useDeleteAutomationRule();

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', triggerType: 'LEAD_CREATED', toStage: '', fromStage: '' });
    setActions([emptyAction()]);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || actions.length === 0) return;

    const triggerConfig: Record<string, unknown> = {};
    if (form.triggerType === 'STAGE_CHANGED') {
      if (form.toStage) triggerConfig['toStage'] = form.toStage;
      if (form.fromStage) triggerConfig['fromStage'] = form.fromStage;
    }

    await createRule({
      variables: {
        input: {
          name: form.name.trim(),
          triggerType: form.triggerType,
          triggerConfig,
          conditions: [],
          actions,
        },
      },
    });
    closeModal();
    await refetch();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateRule({ variables: { input: { id, enabled } } });
    await refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteRule({ variables: { id } });
    await refetch();
  };

  const addAction = () => setActions(prev => [...prev, emptyAction()]);
  const removeAction = (i: number) => setActions(prev => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, a: AutomationAction) =>
    setActions(prev => prev.map((x, idx) => (idx === i ? a : x)));

  const canCreate = form.name.trim().length > 0 && actions.length > 0;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitle>
          <IconBolt size={22} color={C.brand} />
          Automações
        </StyledTitle>
        <StyledBtn variant="primary" onClick={() => setShowModal(true)}>
          <IconPlus size={16} />
          Nova Automação
        </StyledBtn>
      </StyledHeader>

      <StyledCard>
        <StyledTable>
          <thead>
            <tr>
              <StyledTh>Nome</StyledTh>
              <StyledTh>Gatilho</StyledTh>
              <StyledTh>Ações</StyledTh>
              <StyledTh>Ativa</StyledTh>
              <StyledTh></StyledTh>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    padding: '32px 16px',
                    textAlign: 'center',
                  }}
                >
                  Nenhuma automação criada. Clique em "Nova Automação" para começar.
                </td>
              </tr>
            ) : (
              rules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </StyledTable>
      </StyledCard>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <StyledOverlay onClick={e => e.target === e.currentTarget && closeModal()}>
          <StyledModal>
            <StyledModalHeader>
              <StyledModalTitle>Nova Automação</StyledModalTitle>
              <StyledIconBtn onClick={closeModal}><IconX size={18} /></StyledIconBtn>
            </StyledModalHeader>

            <StyledModalBody>
              {/* Nome */}
              <StyledField>
                <StyledLabel>Nome *</StyledLabel>
                <StyledInput
                  placeholder="Ex: Lead novo → tarefa + template"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </StyledField>

              {/* Gatilho */}
              <StyledSection>
                <StyledSectionTitle>Gatilho</StyledSectionTitle>
                <StyledSelect
                  value={form.triggerType}
                  onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}
                >
                  {TRIGGER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </StyledSelect>

                {form.triggerType === 'STAGE_CHANGED' && (
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                    <StyledField>
                      <StyledLabel>De etapa (opcional)</StyledLabel>
                      <StyledInput
                        placeholder="Ex: NEW"
                        value={form.fromStage}
                        onChange={e => setForm(f => ({ ...f, fromStage: e.target.value }))}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>Para etapa (opcional)</StyledLabel>
                      <StyledInput
                        placeholder="Ex: MEETING"
                        value={form.toStage}
                        onChange={e => setForm(f => ({ ...f, toStage: e.target.value }))}
                      />
                    </StyledField>
                  </div>
                )}
              </StyledSection>

              {/* Ações */}
              <StyledSection>
                <StyledSectionTitle>Ações</StyledSectionTitle>
                {actions.map((action, i) => (
                  <ActionEditor
                    key={i}
                    action={action}
                    onChange={a => updateAction(i, a)}
                    onRemove={() => removeAction(i)}
                  />
                ))}
                <StyledAddBtn type="button" onClick={addAction}>
                  <IconCirclePlus size={16} />
                  Adicionar ação
                </StyledAddBtn>
              </StyledSection>
            </StyledModalBody>

            <StyledModalFooter>
              <StyledBtn variant="ghost" onClick={closeModal}>Cancelar</StyledBtn>
              <StyledBtn variant="primary" onClick={handleCreate} disabled={!canCreate}>
                <IconBolt size={14} />
                Criar Automação
              </StyledBtn>
            </StyledModalFooter>
          </StyledModal>
        </StyledOverlay>
      )}
    </StyledPage>
  );
};
