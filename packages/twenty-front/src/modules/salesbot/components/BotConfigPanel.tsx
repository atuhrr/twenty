// FORK: Voka CRM — Fase 14.3A: painel de configuração do nó selecionado
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { styled } from '@linaria/react';

import { IconX } from 'twenty-ui/icon';

import {
  CANVAS_OVERLAY as O,
  CANVAS_PALETTE as C,
  NODE_PALETTE as N,
} from '@/salesbot/constants/canvasPalette';
import {
  botEditorDirtyAtom,
  botEditorGraphAtom,
  botEditorSelectedNodeIdAtom,
} from '@/salesbot/states/botEditorState';
import type { BotNode } from '@/salesbot/hooks/useSalesbot';

// ── Estilos do painel ────────────────────────────────────────────────────────

const Panel = styled.div`
  background: ${C.cardBg};
  border-left: 1px solid ${C.cardBorder};
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 300px;
  overflow-y: auto;
  width: 300px;
`;

const PanelHead = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.cardBorder};
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
`;

const PanelTitle = styled.h3`
  color: ${C.textPrimary};
  font-size: 14px;
  font-weight: 700;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${C.textMuted};
  cursor: pointer;
  display: flex;
  padding: 2px;

  &:hover { color: ${C.textPrimary}; }
`;

const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  color: ${C.textMuted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const FieldInput = styled.input`
  background: ${O.xs};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  color: ${C.textPrimary};
  font-size: 13px;
  outline: none;
  padding: 8px 10px;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: ${C.startBorder}; }
`;

const FieldTextarea = styled.textarea`
  background: ${O.xs};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  box-sizing: border-box;
  color: ${C.textPrimary};
  font-size: 13px;
  line-height: 1.5;
  min-height: 80px;
  outline: none;
  padding: 8px 10px;
  resize: vertical;
  width: 100%;

  &:focus { border-color: ${C.startBorder}; }
`;

const FieldSelect = styled.select`
  background: ${O.xs};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  box-sizing: border-box;
  color: ${C.textPrimary};
  font-size: 13px;
  outline: none;
  padding: 8px 10px;
  width: 100%;

  option { background: ${C.cardBg}; }
  &:focus { border-color: ${C.startBorder}; }
`;

const InfoText = styled.p`
  color: ${C.textMuted};
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
`;

// ── Subpainéis por tipo de nó ───────────────────────────────────────────────

const MessagePanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Texto da mensagem</FieldLabel>
      <FieldTextarea
        placeholder="Ex: Olá! Como posso te ajudar hoje?"
        value={(config.text as string) ?? ''}
        onChange={(e) => onConfigChange('text', e.target.value)}
      />
    </FieldGroup>
  </>
);

const ConditionPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Campo</FieldLabel>
      <FieldInput
        placeholder="Ex: nome, telefone, interesse"
        value={(config.field as string) ?? ''}
        onChange={(e) => onConfigChange('field', e.target.value)}
      />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Operador</FieldLabel>
      <FieldSelect
        value={(config.operator as string) ?? 'exists'}
        onChange={(e) => onConfigChange('operator', e.target.value)}
      >
        <option value="exists">Existe (foi preenchido)</option>
        <option value="eq">É igual a</option>
        <option value="contains">Contém</option>
      </FieldSelect>
    </FieldGroup>
    {(config.operator === 'eq' || config.operator === 'contains') && (
      <FieldGroup>
        <FieldLabel>Valor</FieldLabel>
        <FieldInput
          placeholder="Valor para comparar"
          value={(config.value as string) ?? ''}
          onChange={(e) => onConfigChange('value', e.target.value)}
        />
      </FieldGroup>
    )}
  </>
);

const PausePanel = () => (
  <InfoText>
    O bot aguarda a próxima mensagem do contato antes de avançar para o próximo passo.
  </InfoText>
);

const ActionPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Pergunta ao contato</FieldLabel>
      <FieldTextarea
        placeholder="Ex: Qual é o seu nome?"
        value={(config.question as string) ?? ''}
        onChange={(e) => onConfigChange('question', e.target.value)}
      />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Salvar resposta em</FieldLabel>
      <FieldInput
        placeholder="Ex: nome, telefone, interesse"
        value={(config.fieldToSave as string) ?? ''}
        onChange={(e) => onConfigChange('fieldToSave', e.target.value)}
      />
    </FieldGroup>
  </>
);

// ── Sub-painéis 14.3B ────────────────────────────────────────────────────────

const ReactionPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <FieldGroup>
    <FieldLabel>Emoji de reação</FieldLabel>
    <FieldInput
      placeholder="Ex: 👍 ❤️ 🔥"
      value={(config.emoji as string) ?? ''}
      onChange={(e) => onConfigChange('emoji', e.target.value)}
    />
  </FieldGroup>
);

const CommentPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <FieldGroup>
    <FieldLabel>Texto do comentário</FieldLabel>
    <FieldTextarea
      placeholder="Comentário interno visível apenas para o time…"
      value={(config.text as string) ?? ''}
      onChange={(e) => onConfigChange('text', e.target.value)}
    />
  </FieldGroup>
);

const InternalMessagePanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Mensagem para o time</FieldLabel>
      <FieldTextarea
        placeholder="Mensagem interna que será enviada para a equipe…"
        value={(config.text as string) ?? ''}
        onChange={(e) => onConfigChange('text', e.target.value)}
      />
    </FieldGroup>
  </>
);

type ListItem = { id: string; title: string };

const ListMessagePanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => {
  const items = (config.items as ListItem[]) ?? [];

  const updateItem = (idx: number, title: string) => {
    const next = items.map((it, i) => (i === idx ? { ...it, title } : it));

    onConfigChange('items', next);
  };

  const addItem = () => {
    onConfigChange('items', [
      ...items,
      { id: crypto.randomUUID(), title: '' },
    ]);
  };

  const removeItem = (idx: number) => {
    onConfigChange(
      'items',
      items.filter((_, i) => i !== idx),
    );
  };

  return (
    <>
      <FieldGroup>
        <FieldLabel>Título da lista</FieldLabel>
        <FieldInput
          placeholder="Ex: Escolha uma opção:"
          value={(config.headerText as string) ?? ''}
          onChange={(e) => onConfigChange('headerText', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>Opções</FieldLabel>
        {items.map((item, idx) => (
          <div key={item.id} style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
            <FieldInput
              placeholder={`Opção ${idx + 1}`}
              value={item.title}
              onChange={(e) => updateItem(idx, e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => removeItem(idx)}
              style={{ background: 'none', border: 'none', color: N.stop, cursor: 'pointer', fontSize: 16 }}
            >
              ×
            </button>
          </div>
        ))}
        {items.length < 10 && (
          <button
            onClick={addItem}
            style={{
              background: O.xs,
              border: `1px dashed ${C.cardBorder}`,
              borderRadius: 6,
              color: C.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              padding: '6px 10px',
            }}
          >
            + Adicionar opção
          </button>
        )}
      </FieldGroup>
    </>
  );
};

const SubscribePanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <FieldGroup>
    <FieldLabel>Tipo de inscrição</FieldLabel>
    <FieldSelect
      value={(config.subscribeType as string) ?? 'pipeline'}
      onChange={(e) => onConfigChange('subscribeType', e.target.value)}
    >
      <option value="pipeline">Mover para funil</option>
      <option value="meta_list">Lista Meta</option>
    </FieldSelect>
  </FieldGroup>
);

const AiAgentPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Prompt do sistema</FieldLabel>
      <FieldTextarea
        placeholder="Você é um assistente de vendas. Responda em português de forma amigável e concisa."
        value={(config.systemPrompt as string) ?? ''}
        onChange={(e) => onConfigChange('systemPrompt', e.target.value)}
        style={{ minHeight: 120 }}
      />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Máximo de turnos de IA</FieldLabel>
      <FieldInput
        type="number"
        min={1}
        max={50}
        value={(config.maxAiTurns as number) ?? 10}
        onChange={(e) => onConfigChange('maxAiTurns', Number(e.target.value))}
      />
    </FieldGroup>
  </>
);

const HandoffPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <FieldGroup>
    <FieldLabel>Mensagem de transferência (opcional)</FieldLabel>
    <FieldTextarea
      placeholder="Ex: Vou transferir você para um de nossos atendentes!"
      value={(config.message as string) ?? ''}
      onChange={(e) => onConfigChange('message', e.target.value)}
    />
  </FieldGroup>
);

const ValidationPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Campo a validar</FieldLabel>
      <FieldInput
        placeholder="Ex: email, telefone"
        value={(config.field as string) ?? ''}
        onChange={(e) => onConfigChange('field', e.target.value)}
      />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Tipo de validação</FieldLabel>
      <FieldSelect
        value={(config.validationType as string) ?? 'text'}
        onChange={(e) => onConfigChange('validationType', e.target.value)}
      >
        <option value="email">E-mail</option>
        <option value="phone">Telefone</option>
        <option value="number">Número</option>
        <option value="text">Texto livre</option>
      </FieldSelect>
    </FieldGroup>
  </>
);

const StopPanel = () => (
  <InfoText>O bot encerra a conversa neste ponto. Nenhuma configuração necessária.</InfoText>
);

const CustomStepPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Código JavaScript</FieldLabel>
      <FieldTextarea
        placeholder={'// Ex: context.data.score = parseInt(context.data.points) * 2;'}
        value={(config.code as string) ?? ''}
        onChange={(e) => onConfigChange('code', e.target.value)}
        style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 120 }}
      />
    </FieldGroup>
    <InfoText>
      O código tem acesso a <code>context.data</code> (dados coletados) e <code>context.channel</code> (canal atual).
    </InfoText>
  </>
);

const WidgetPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <FieldGroup>
    <FieldLabel>Tipo de widget</FieldLabel>
    <FieldSelect
      value={(config.widgetType as string) ?? ''}
      onChange={(e) => onConfigChange('widgetType', e.target.value)}
    >
      <option value="">Selecione…</option>
      <option value="rating">⭐ Avaliação (1–5)</option>
      <option value="calendar">📅 Agendamento (calendário)</option>
      <option value="file_upload">📎 Envio de arquivo</option>
    </FieldSelect>
  </FieldGroup>
);

const DistributionPanel = ({
  config,
  onConfigChange,
}: {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) => (
  <>
    <FieldGroup>
      <FieldLabel>Modo de distribuição</FieldLabel>
      <FieldSelect
        value={(config.mode as string) ?? 'round_robin'}
        onChange={(e) => onConfigChange('mode', e.target.value)}
      >
        <option value="round_robin">↻ Round Robin</option>
        <option value="random">🎲 Aleatório</option>
      </FieldSelect>
    </FieldGroup>
    <InfoText>
      Distribui a conversa entre os membros da equipe no modo escolhido.
    </InfoText>
  </>
);

// ── Mapa de tipos → metadados ────────────────────────────────────────────────

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  MESSAGE:          { label: 'Mensagem',       color: N.message },
  CONDITION:        { label: 'Condição',        color: N.condition },
  PAUSE:            { label: 'Pausa',           color: N.pause },
  ACTION:           { label: 'Ação',            color: N.action },
  REACTION:         { label: 'Reação',          color: N.reaction },
  COMMENT:          { label: 'Comentário',      color: N.comment },
  INTERNAL_MESSAGE: { label: 'Msg. Interna',    color: N.internal_message },
  LIST_MESSAGE:     { label: 'Lista WhatsApp',  color: N.list_message },
  SUBSCRIBE:        { label: 'Inscrever',       color: N.subscribe },
  AI_AGENT:         { label: 'Agente de IA',    color: N.ai_agent },
  HANDOFF:          { label: 'Transferir',      color: N.handoff },
  VALIDATION:       { label: 'Validação',       color: N.validation },
  STOP:             { label: 'Parar bot',       color: N.stop },
  CUSTOM_STEP:      { label: 'Passo custom',    color: N.custom_step },
  WIDGET:           { label: 'Widget',          color: N.widget },
  DISTRIBUTION:     { label: 'Distribuição',    color: N.distribution },
};

// ── Componente principal ─────────────────────────────────────────────────────

export const BotConfigPanel = () => {
  const [selectedNodeId, setSelectedNodeId] = useAtom(botEditorSelectedNodeIdAtom);
  const [graph, setGraph] = useAtom(botEditorGraphAtom);
  const setDirty = useSetAtom(botEditorDirtyAtom);

  if (!selectedNodeId) return null;

  const node = graph.nodes.find((n) => n.id === selectedNodeId);

  if (!node || node.type === 'TRIGGER' || node.type === 'START') return null;

  const meta = TYPE_LABELS[node.type];

  if (!meta) return null;

  const handleConfigChange = (key: string, value: unknown) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n): BotNode =>
        n.id === selectedNodeId
          ? { ...n, config: { ...n.config, [key]: value } }
          : n,
      ),
    }));
    setDirty(true);
  };

  const renderSubPanel = () => {
    const config = node.config;

    switch (node.type) {
      case 'MESSAGE':
        return <MessagePanel config={config} onConfigChange={handleConfigChange} />;
      case 'CONDITION':
        return <ConditionPanel config={config} onConfigChange={handleConfigChange} />;
      case 'PAUSE':
        return <PausePanel />;
      case 'ACTION':
        return <ActionPanel config={config} onConfigChange={handleConfigChange} />;
      case 'REACTION':
        return <ReactionPanel config={config} onConfigChange={handleConfigChange} />;
      case 'COMMENT':
        return <CommentPanel config={config} onConfigChange={handleConfigChange} />;
      case 'INTERNAL_MESSAGE':
        return <InternalMessagePanel config={config} onConfigChange={handleConfigChange} />;
      case 'LIST_MESSAGE':
        return <ListMessagePanel config={config} onConfigChange={handleConfigChange} />;
      case 'SUBSCRIBE':
        return <SubscribePanel config={config} onConfigChange={handleConfigChange} />;
      case 'AI_AGENT':
        return <AiAgentPanel config={config} onConfigChange={handleConfigChange} />;
      case 'HANDOFF':
        return <HandoffPanel config={config} onConfigChange={handleConfigChange} />;
      case 'VALIDATION':
        return <ValidationPanel config={config} onConfigChange={handleConfigChange} />;
      case 'STOP':
        return <StopPanel />;
      case 'CUSTOM_STEP':
        return <CustomStepPanel config={config} onConfigChange={handleConfigChange} />;
      case 'WIDGET':
        return <WidgetPanel config={config} onConfigChange={handleConfigChange} />;
      case 'DISTRIBUTION':
        return <DistributionPanel config={config} onConfigChange={handleConfigChange} />;
      default:
        return <InfoText>Configuração não disponível para este tipo de nó.</InfoText>;
    }
  };

  return (
    <Panel>
      <PanelHead>
        <PanelTitle style={{ color: meta.color }}>{meta.label}</PanelTitle>
        <CloseBtn onClick={() => setSelectedNodeId(null)}>
          <IconX size={16} />
        </CloseBtn>
      </PanelHead>
      <PanelBody>{renderSubPanel()}</PanelBody>
    </Panel>
  );
};
