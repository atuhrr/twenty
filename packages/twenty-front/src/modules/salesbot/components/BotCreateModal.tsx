// FORK: Voka CRM — Fase 14.4: modal "Criar bot" com templates
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';

import {
  IconCalendar,
  IconHelpCircle,
  IconPlus,
  IconRobot,
  IconSparkles,
  IconTarget,
  IconX,
} from 'twenty-ui/icon';

import {
  BOT_TEMPLATES,
  CHANNEL_TABS,
  type BotChannel,
  type BotTemplate,
} from '@/salesbot/constants/botTemplates';
import { useCreateSalesbot } from '@/salesbot/hooks/useSalesbot';

// ── Ícone por nome de template ────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Plus:       IconPlus,
  Target:     IconTarget,
  Calendar:   IconCalendar,
  HelpCircle: IconHelpCircle,
  Robot:      IconRobot,
  Sparkles:   IconSparkles,
};

const TemplateIcon = ({
  name,
  color,
}: {
  name: string;
  color: string;
}) => {
  const Icon = ICON_MAP[name] ?? IconPlus;

  return <Icon size={24} color={color} />;
};

// ── Paleta do modal (tema claro — settings) ───────────────────────────────────

const C = {
  overlay:  'var(--t-canvas-modal-overlay)',
  bg:       'var(--t-background-primary)',
  border:   'var(--t-border-color-light)',
  bgHover:  'var(--t-background-secondary)',
  txt:      'var(--t-font-color-primary)',
  muted:    'var(--t-font-color-tertiary)',
  brand:    'var(--t-color-purple)',
  brandBg:  'var(--t-color-purple2, #f5f0ff)',
};

// ── Estilos ──────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  align-items: center;
  background: ${C.overlay};
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: ${C.bg};
  border-radius: 16px;
  box-shadow: 0 24px 64px var(--t-canvas-modal-shadow);
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  overflow: hidden;
  width: 780px;
`;

const Head = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: 20px 24px;
`;

const HeadTitle = styled.h2`
  color: ${C.txt};
  font-size: 17px;
  font-weight: 700;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  border-radius: 8px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  padding: 4px;

  &:hover { background: ${C.bgHover}; color: ${C.txt}; }
`;

// ── Channel tabs ─────────────────────────────────────────────────────────────

const Tabs = styled.div`
  border-bottom: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  gap: 0;
  padding: 0 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? C.brand : 'transparent')};
  color: ${({ active }) => (active ? C.brand : C.muted)};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: -1px;
  padding: 12px 16px;
  transition: color 0.15s;

  &:hover { color: ${C.txt}; }
`;

// ── Template grid ─────────────────────────────────────────────────────────────

const GridScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
`;

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
`;

const TemplateCard = styled.button<{ selected: boolean; accentColor: string }>`
  align-items: flex-start;
  background: ${C.bg};
  border: 2px solid ${({ selected, accentColor }) =>
    selected ? accentColor : C.border};
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: ${({ accentColor }) => accentColor};
    box-shadow: 0 0 0 3px ${({ accentColor }) => accentColor}22;
  }
`;

const CardIconWrap = styled.div<{ color: string }>`
  align-items: center;
  background: ${({ color }) => color}18;
  border-radius: 10px;
  display: flex;
  height: 40px;
  justify-content: center;
  width: 40px;
`;

const CardName = styled.span`
  color: ${C.txt};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
`;

const CardDesc = styled.span`
  color: ${C.muted};
  font-size: 12px;
  line-height: 1.4;
`;

// ── Footer ────────────────────────────────────────────────────────────────────

const Footer = styled.div`
  align-items: center;
  border-top: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  padding: 16px 24px;
`;

const NameInput = styled.input`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  flex: 1;
  font-size: 13px;
  outline: none;
  padding: 9px 12px;

  &:focus { border-color: ${C.brand}; }
  &::placeholder { color: ${C.muted}; }
`;

const CreateBtn = styled.button`
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  color: var(--t-font-color-inverted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 20px;
  white-space: nowrap;

  &:hover { opacity: 0.9; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

// ── Filtro de templates por canal ─────────────────────────────────────────────

const filterTemplates = (
  templates: BotTemplate[],
  channel: BotChannel,
): BotTemplate[] => {
  if (channel === 'all') return templates;

  return templates.filter(
    (t) => t.channels.length === 0 || t.channels.includes(channel),
  );
};

// ── Componente ────────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
};

export const BotCreateModal = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const { create, loading } = useCreateSalesbot();

  const [channel, setChannel] = useState<BotChannel>('all');
  const [selected, setSelected] = useState<BotTemplate>(BOT_TEMPLATES[0]);
  const [name, setName] = useState('');

  const visibleTemplates = filterTemplates(BOT_TEMPLATES, channel);

  // Se o template selecionado não está visível, muda para o primeiro visível
  const effectiveSelected =
    visibleTemplates.find((t) => t.id === selected.id) ?? visibleTemplates[0];

  const handleTemplateSelect = (tpl: BotTemplate) => {
    setSelected(tpl);
    if (!name || name === selected.name) {
      setName(tpl.name);
    }
  };

  const handleCreate = async () => {
    const botName = name.trim() || effectiveSelected.name;

    const result = await create({
      variables: {
        input: {
          name: botName,
          triggers: [],
          graph: effectiveSelected.graph,
        },
      },
    });

    const newId = (
      result.data as { createSalesbot?: { id: string } } | null
    )?.createSalesbot?.id;

    onClose();

    if (newId) navigate(`/salesbot/${newId}`);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog>
        <Head>
          <HeadTitle>Novo Salesbot</HeadTitle>
          <CloseBtn onClick={onClose}>
            <IconX size={18} />
          </CloseBtn>
        </Head>

        <Tabs>
          {CHANNEL_TABS.map((tab) => (
            <Tab
              key={tab.id}
              active={channel === tab.id}
              onClick={() => setChannel(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </Tabs>

        <GridScroll>
          <Grid>
            {visibleTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                selected={effectiveSelected.id === tpl.id}
                accentColor={tpl.accentColor}
                onClick={() => handleTemplateSelect(tpl)}
              >
                <CardIconWrap color={tpl.accentColor}>
                  <TemplateIcon name={tpl.icon} color={tpl.accentColor} />
                </CardIconWrap>
                <CardName>{tpl.name}</CardName>
                <CardDesc>{tpl.description}</CardDesc>
              </TemplateCard>
            ))}
          </Grid>
        </GridScroll>

        <Footer>
          <NameInput
            placeholder={effectiveSelected.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
            autoFocus
          />
          <CreateBtn onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando…' : 'Criar e abrir'}
          </CreateBtn>
        </Footer>
      </Dialog>
    </Overlay>
  );
};
