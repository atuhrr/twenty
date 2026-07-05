// FORK: Voka CRM — Fase 14.2: estado do editor visual do bot
import { atom } from 'jotai';

import type { BotGraph, BotTrigger } from '@/salesbot/hooks/useSalesbot';

export type AddStepMenuState = {
  screenX: number;
  screenY: number;
  sourceNodeId: string;
  sourceHandle: string;
  newNodeFlowPos: { x: number; y: number };
} | null;

export const botEditorGraphAtom = atom<BotGraph>({ nodes: [], edges: [] });
export const botEditorNameAtom = atom<string>('');
export const botEditorTriggersAtom = atom<BotTrigger[]>([]);
export const botEditorDirtyAtom = atom<boolean>(false);
export const botEditorSelectedNodeIdAtom = atom<string | null>(null);
export const botEditorAddStepMenuAtom = atom<AddStepMenuState>(null);

// Painel de preview (14.5B)
export const botPreviewOpenAtom = atom<boolean>(false);
