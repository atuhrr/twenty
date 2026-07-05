// FORK: Voka CRM — Fase 14.2: carrega e salva bot no editor visual
import { useEffect } from 'react';

import { useQuery } from '@apollo/client/react';
import { useAtom, useSetAtom } from 'jotai';

import { GET_SALESBOT } from '@/salesbot/graphql/salesbotQueries';
import { useUpdateSalesbot } from '@/salesbot/hooks/useSalesbot';
import type { BotGraph, Salesbot } from '@/salesbot/hooks/useSalesbot';
import {
  botEditorDirtyAtom,
  botEditorGraphAtom,
  botEditorNameAtom,
  botEditorTriggersAtom,
} from '@/salesbot/states/botEditorState';

export const useBotEditor = (botId: string) => {
  const { data, loading } = useQuery<{ salesbot: Salesbot | null }>(
    GET_SALESBOT,
    { variables: { id: botId }, fetchPolicy: 'network-only' },
  );

  const [graph, setGraph] = useAtom(botEditorGraphAtom);
  const setName = useSetAtom(botEditorNameAtom);
  const [triggers, setTriggers] = useAtom(botEditorTriggersAtom);
  const setDirty = useSetAtom(botEditorDirtyAtom);
  const { update, loading: saving } = useUpdateSalesbot();

  // Reset atoms quando botId muda (navegação entre bots)
  useEffect(() => {
    setGraph({ nodes: [], edges: [] });
    setName('');
    setTriggers([]);
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  // Popula atoms quando dados chegam do servidor
  useEffect(() => {
    if (data?.salesbot) {
      const bot = data.salesbot;

      setGraph(bot.graph ?? { nodes: [], edges: [] });
      setName(bot.name);
      setTriggers(bot.triggers);
      setDirty(false);
    }
  }, [data, setGraph, setName, setTriggers, setDirty]);

  const save = async (name: string, currentGraph: BotGraph) => {
    await update({
      variables: { input: { id: botId, name, graph: currentGraph, triggers } },
    });
    setDirty(false);
  };

  return {
    bot: data?.salesbot ?? null,
    loading,
    save,
    saving,
    graph,
  };
};
