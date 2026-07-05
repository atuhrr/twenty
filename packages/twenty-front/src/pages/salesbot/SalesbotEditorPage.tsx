// FORK: Voka CRM — Fase 14.2: editor visual de bot (canvas ReactFlow)
import { useParams } from 'react-router-dom';

import { useAtomValue } from 'jotai';
import { styled } from '@linaria/react';

import { CANVAS_PALETTE as C } from '@/salesbot/constants/canvasPalette';
import { BotCanvas } from '@/salesbot/components/BotCanvas';
import { BotEditorTopbar } from '@/salesbot/components/BotEditorTopbar';
import { useBotEditor } from '@/salesbot/hooks/useBotEditor';
import {
  botEditorGraphAtom,
  botEditorNameAtom,
} from '@/salesbot/states/botEditorState';

const Page = styled.div`
  background: ${C.bg};
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Loader = styled.div`
  align-items: center;
  color: ${C.textMuted};
  display: flex;
  flex: 1;
  font-size: 14px;
  justify-content: center;
`;

export const SalesbotEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const botId = id ?? '';

  const { loading, save, saving } = useBotEditor(botId);
  const graph = useAtomValue(botEditorGraphAtom);
  const name = useAtomValue(botEditorNameAtom);

  const handleSave = () => save(name, graph);

  // Exibe loader enquanto os dados do bot não chegam
  const ready = !loading && (graph?.nodes?.length ?? 0) > 0;

  return (
    <Page>
      <BotEditorTopbar onSave={handleSave} saving={saving} />
      {ready ? (
        <BotCanvas />
      ) : (
        <Loader>
          {loading ? 'Carregando bot…' : 'Preparando editor…'}
        </Loader>
      )}
    </Page>
  );
};
