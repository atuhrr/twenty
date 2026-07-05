// FORK: Voka CRM — Fase 14.1/14.4: lista de bots + modal com templates
/* oxlint-disable twenty/no-hardcoded-colors */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';

import {
  type BotTrigger,
  type Salesbot,
  TRIGGER_TYPE_LABELS,
  countFlowNodes,
  useDeleteSalesbot,
  useSalesbots,
  useUpdateSalesbot,
} from '@/salesbot/hooks/useSalesbot';
import { BotCreateModal } from '@/salesbot/components/BotCreateModal';
import { IconPlus, IconRobot, IconTrash } from 'twenty-ui/icon';

// ─── Design tokens (Kommo palette) ──────────────────────────────────────────
// Todas as cores vêm dos CSS vars do tema; apenas as "de marca" são referenciadas
// como constantes locais até a Fase 14.2 onde migrarão para themeCssVariables.
const C = {
  bg: 'var(--t-background-secondary)',
  card: 'var(--t-background-primary)',
  border: 'var(--t-border-color-light)',
  txt: 'var(--t-font-color-primary)',
  muted: 'var(--t-font-color-tertiary)',
  brand: 'var(--t-color-purple)',
  danger: 'var(--t-color-red)',
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: ${C.bg};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
`;

const Header = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  align-items: center;
  color: ${C.txt};
  display: flex;
  font-size: 20px;
  font-weight: 700;
  gap: 10px;
  margin: 0;
`;

const Card = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  overflow: hidden;
`;

const Table = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
`;

const Th = styled.th`
  background: var(--t-background-tertiary, #fafafa);
  border-bottom: 1px solid ${C.border};
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 10px 16px;
  text-align: left;
  text-transform: uppercase;
`;

const Td = styled.td`
  border-bottom: 1px solid ${C.border};
  color: ${C.txt};
  padding: 12px 16px;
  vertical-align: middle;
`;

const Toggle = styled.button<{ enabled: boolean }>`
  background: ${({ enabled }) => (enabled ? C.brand : C.border)};
  border: none;
  border-radius: 99px;
  cursor: pointer;
  height: 20px;
  position: relative;
  transition: background 0.2s;
  width: 36px;

  &::after {
    background: var(--t-font-color-inverted);
    border-radius: 50%;
    content: '';
    height: 14px;
    left: ${({ enabled }) => (enabled ? '18px' : '3px')};
    position: absolute;
    top: 3px;
    transition: left 0.2s;
    width: 14px;
  }
`;

const Btn = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' }>`
  align-items: center;
  background: ${({ variant }) =>
    variant === 'primary' ? C.brand : 'transparent'};
  border: ${({ variant }) =>
    variant === 'ghost' ? `1px solid ${C.border}` : 'none'};
  border-radius: 8px;
  color: ${({ variant }) =>
    variant === 'primary' ? 'var(--t-font-color-inverted)' : variant === 'danger' ? C.danger : C.txt};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;

  &:hover { opacity: 0.85; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  padding: 4px;

  &:hover { background: ${C.border}; }
`;

const TriggerBadge = styled.span`
  background: var(--t-color-purple2, #f5f0ff);
  border-radius: 6px;
  color: ${C.brand};
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
`;

const BotLink = styled.span`
  color: ${C.brand};
  cursor: pointer;
  font-weight: 600;

  &:hover { text-decoration: underline; }
`;


// ─── Componente principal ─────────────────────────────────────────────────────

const formatTriggers = (triggers: BotTrigger[]): string => {
  if (!triggers.length) return '—';

  return triggers
    .map((t) => {
      const label = TRIGGER_TYPE_LABELS[t.type] ?? t.type;

      return t.keyword ? `${label}: "${t.keyword}"` : label;
    })
    .join(', ');
};

export const SalesbotPage = () => {
  const navigate = useNavigate();
  const { bots, refetch } = useSalesbots();
  const { update } = useUpdateSalesbot();
  const { remove } = useDeleteSalesbot();

  const [showModal, setShowModal] = useState(false);

  const openEditor = (botId: string) => navigate(`/salesbot/${botId}`);

  const handleToggle = async (bot: Salesbot) => {
    await update({ variables: { input: { id: bot.id, enabled: !bot.enabled } } });
    await refetch();
  };

  const handleDelete = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  return (
    <Page>
      <Header>
        <Title>
          <IconRobot size={22} />
          Salesbot
        </Title>
        <Btn variant="primary" onClick={() => setShowModal(true)}>
          <IconPlus size={16} />
          Novo Bot
        </Btn>
      </Header>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Gatilhos</Th>
              <Th>Nós</Th>
              <Th>Ativo</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {bots.length === 0 ? (
              <tr>
                <Td
                  colSpan={5}
                  style={{ color: C.muted, fontSize: 13, padding: '32px 16px', textAlign: 'center' }}
                >
                  Nenhum bot criado. Clique em "Novo Bot" para começar.
                </Td>
              </tr>
            ) : (
              bots.map((bot) => (
                <tr key={bot.id}>
                  <Td>
                    <BotLink onClick={() => openEditor(bot.id)}>
                      {bot.name}
                    </BotLink>
                  </Td>
                  <Td>
                    <TriggerBadge>{formatTriggers(bot.triggers)}</TriggerBadge>
                  </Td>
                  <Td style={{ color: C.muted }}>
                    {countFlowNodes(bot.graph)} nó(s)
                  </Td>
                  <Td>
                    <Toggle
                      enabled={bot.enabled}
                      onClick={() => handleToggle(bot)}
                    />
                  </Td>
                  <Td>
                    <IconBtn onClick={() => handleDelete(bot.id)}>
                      <IconTrash size={16} />
                    </IconBtn>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {showModal && (
        <BotCreateModal onClose={() => setShowModal(false)} />
      )}
    </Page>
  );
};
