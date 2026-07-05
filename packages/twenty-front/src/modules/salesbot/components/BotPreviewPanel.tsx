// FORK: Voka CRM — Fase 14.5B: preview de bot (simulação frontend)
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';
import { styled } from '@linaria/react';

import { IconRefresh, IconX } from 'twenty-ui/icon';

import { PREVIEW_PALETTE as P } from '@/salesbot/constants/canvasPalette';
import {
  botEditorGraphAtom,
  botPreviewOpenAtom,
} from '@/salesbot/states/botEditorState';
import {
  createSimState,
  simulateStep,
  type SimMessage,
  type SimState,
} from '@/salesbot/utils/BotSimulator';

// ── Estilos ──────────────────────────────────────────────────────────────────

const Panel = styled.div`
  background: ${P.bg};
  border-left: 1px solid ${P.border};
  border-radius: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  top: 0;
  width: 340px;
  z-index: 30;
`;

const PanelHead = styled.div`
  align-items: center;
  background: ${P.topbarBg};
  border-bottom: 1px solid ${P.border};
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  height: 52px;
  justify-content: space-between;
  padding: 0 14px;
`;

const PanelTitle = styled.span`
  color: ${P.text};
  font-size: 14px;
  font-weight: 700;
`;

const IconRow = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
`;

const IconAction = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${P.textMuted};
  cursor: pointer;
  display: flex;
  padding: 5px;

  &:hover { background: ${P.overlayHover}; color: ${P.text}; }
`;

const Messages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 12px 10px;

  /* WhatsApp wallpaper */
  background-color: ${P.bg};
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E");
`;

// justify-content com valor dinâmico causa bug de autoprefixing no wyw-in-js
// (-mjustify gerado como prefixo IE inválido). Usamos margin-left:auto no Bubble.
const BubbleRow = styled.div`
  display: flex;
  margin: 2px 0;
`;

const Bubble = styled.div<{ isUser: boolean }>`
  background: ${({ isUser }) => (isUser ? P.bubbleUser : P.bubbleBot)};
  border-radius: ${({ isUser }) =>
    isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};
  color: ${P.text};
  font-size: 13px;
  line-height: 1.5;
  margin-left: ${({ isUser }) => (isUser ? 'auto' : '0')};
  max-width: 78%;
  padding: 7px 12px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const DoneNotice = styled.div`
  color: ${P.textMuted};
  font-size: 11px;
  margin-top: 8px;
  text-align: center;
`;

const InputBar = styled.div`
  align-items: center;
  background: ${P.topbarBg};
  border-top: 1px solid ${P.border};
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  padding: 8px 10px;
`;

const ChatInput = styled.input`
  background: ${P.inputBg};
  border: none;
  border-radius: 20px;
  color: ${P.text};
  flex: 1;
  font-size: 13px;
  outline: none;
  padding: 9px 14px;

  &::placeholder { color: ${P.placeholder}; }
`;

const SendBtn = styled.button`
  align-items: center;
  background: ${P.btnBg};
  border: none;
  border-radius: 50%;
  color: ${P.textInverted};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-size: 16px;
  height: 36px;
  justify-content: center;
  width: 36px;

  &:hover { background: ${P.btnHover}; }
  &:disabled { background: ${P.btnDisabled}; color: ${P.placeholder}; cursor: default; }
`;

// ── Componente ────────────────────────────────────────────────────────────────

export const BotPreviewPanel = () => {
  const graph = useAtomValue(botEditorGraphAtom);
  const setOpen = useSetAtom(botPreviewOpenAtom);

  const [history, setHistory] = useState<SimMessage[]>([]);
  const [simState, setSimState] = useState<SimState>(() => createSimState(graph));
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const startSim = useCallback(() => {
    const initial = createSimState(graph);
    const { state, newMessages } = simulateStep(graph, initial, null);

    setSimState(state);
    setHistory(newMessages);
    setInputText('');
  }, [graph]);

  // Inicia simulação ao montar
  useEffect(() => {
    startSim();
  }, [startSim]);

  // Scroll automático para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = () => {
    const text = inputText.trim();

    if (!text || simState.status !== 'paused') return;

    const { state, newMessages } = simulateStep(graph, simState, text);

    setHistory((prev) => [...prev, ...newMessages]);
    setSimState(state);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>Preview</PanelTitle>
        <IconRow>
          <IconAction title="Reiniciar simulação" onClick={startSim}>
            <IconRefresh size={16} />
          </IconAction>
          <IconAction title="Fechar preview" onClick={() => setOpen(false)}>
            <IconX size={16} />
          </IconAction>
        </IconRow>
      </PanelHead>

      <Messages>
        {history.map((msg, i) => (
          <BubbleRow key={i}>
            <Bubble isUser={msg.from === 'user'}>{msg.text}</Bubble>
          </BubbleRow>
        ))}
        {simState.status === 'done' && (
          <DoneNotice>— fim da conversa —</DoneNotice>
        )}
        <div ref={bottomRef} />
      </Messages>

      <InputBar>
        <ChatInput
          placeholder={
            simState.status === 'paused'
              ? 'Digite sua resposta…'
              : 'Conversa encerrada'
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={simState.status !== 'paused'}
        />
        <SendBtn
          onClick={handleSend}
          disabled={!inputText.trim() || simState.status !== 'paused'}
        >
          ➤
        </SendBtn>
      </InputBar>
    </Panel>
  );
};
