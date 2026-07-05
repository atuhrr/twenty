// FORK: Voka CRM — Fase 14.3B: nós de conteúdo estendido
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
  NodePlaceholder,
} from '@/salesbot/components/BotNodeBase';

// ── Reação ───────────────────────────────────────────────────────────────────

export const BotReactionNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const emoji = config.emoji as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Reação"
      typeColor={N.reaction}
      selected={selectedId === id}
    >
      <NodeBody>
        {emoji ? (
          <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
        ) : (
          <NodePlaceholder>Clique para escolher reação…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Comentário ────────────────────────────────────────────────────────────────

export const BotCommentNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const text = config.text as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Comentário"
      typeColor={N.comment}
      selected={selectedId === id}
    >
      <NodeBody>
        {text ? (
          <NodeBodyText>📝 {text}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para adicionar comentário…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Mensagem Interna ──────────────────────────────────────────────────────────

export const BotInternalMessageNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const text = config.text as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Msg. Interna"
      typeColor={N.internal_message}
      selected={selectedId === id}
    >
      <NodeBody>
        {text ? (
          <NodeBodyText>@time: {text}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para adicionar mensagem…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Inscrever ────────────────────────────────────────────────────────────────

export const BotSubscribeNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const subscribeType = config.subscribeType as string | undefined;

  const label =
    subscribeType === 'pipeline'
      ? 'Mover para funil'
      : subscribeType === 'meta_list'
        ? 'Lista Meta'
        : undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Inscrever"
      typeColor={N.subscribe}
      selected={selectedId === id}
    >
      <NodeBody>
        {label ? (
          <NodeBodyText>{label}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para configurar…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Passo Customizado ─────────────────────────────────────────────────────────

export const BotCustomStepNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const code = config.code as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Passo custom"
      typeColor={N.custom_step}
      selected={selectedId === id}
    >
      <NodeBody>
        {code ? (
          <NodeBodyText style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {code.slice(0, 60)}{code.length > 60 ? '…' : ''}
          </NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para adicionar código…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Widget ───────────────────────────────────────────────────────────────────

export const BotWidgetNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const widgetType = config.widgetType as string | undefined;

  const label =
    widgetType === 'rating' ? '⭐ Avaliação'
    : widgetType === 'calendar' ? '📅 Calendário'
    : widgetType === 'file_upload' ? '📎 Envio de arquivo'
    : undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Widget"
      typeColor={N.widget}
      selected={selectedId === id}
    >
      <NodeBody>
        {label ? (
          <NodeBodyText>{label}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para escolher widget…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};

// ── Distribuição (Round Robin) ───────────────────────────────────────────────

export const BotDistributionNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const mode = config.mode as string | undefined;

  const label =
    mode === 'round_robin' ? '↻ Round Robin'
    : mode === 'random' ? '🎲 Aleatório'
    : undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Distribuição"
      typeColor={N.distribution}
      selected={selectedId === id}
    >
      <NodeBody>
        {label ? (
          <NodeBodyText>{label}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para configurar…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};
