// FORK: Voka CRM — Fase 14.4: templates de bot por objetivo
import type { BotGraph, BotNode, BotEdge } from '@/salesbot/hooks/useSalesbot';

// Helpers para ergonomia de definição
const node = (
  id: string,
  type: BotNode['type'],
  config: Record<string, unknown>,
  x: number,
  y: number,
): BotNode => ({ id, type, config, position: { x, y } });

const edge = (
  source: string,
  target: string,
  sourceHandle = 'output',
): BotEdge => ({
  id: `${source}__${target}`,
  source,
  target,
  sourceHandle,
  targetHandle: 'input',
});

// ── Tipo de template ─────────────────────────────────────────────────────────

export type BotChannel = 'all' | 'WHATSAPP' | 'INSTAGRAM' | 'WIDGET';

export type BotTemplate = {
  id: string;
  name: string;
  description: string;
  // Lucide icon name via twenty-ui/icon (sem prefixo "Icon")
  icon: string;
  accentColor: string;
  // Canais onde este template é mais relevante; vazio = todos
  channels: BotChannel[];
  graph: BotGraph;
};

// ── Templates ────────────────────────────────────────────────────────────────

const BLANK: BotTemplate = {
  id: 'blank',
  name: 'Em branco',
  description: 'Comece do zero e monte seu fluxo livremente.',
  icon: 'Plus',
  accentColor: '#94a3b8',
  channels: [],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
    ],
    edges: [],
  },
};

const QUALIFICATION: BotTemplate = {
  id: 'qualification',
  name: 'Qualificação de leads',
  description: 'Coleta nome, telefone e interesse antes de passar para o time.',
  icon: 'Target',
  accentColor: '#2563eb',
  channels: ['WHATSAPP', 'WIDGET'],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
      node('greet', 'MESSAGE', {
        text: 'Olá! 👋 Sou o assistente virtual. Como posso te ajudar hoje?',
      }, 200, 230),
      node('pause1', 'PAUSE', {}, 200, 410),
      node('ask-name', 'ACTION', {
        question: 'Qual é o seu nome?',
        fieldToSave: 'name',
      }, 200, 590),
      node('ask-phone', 'ACTION', {
        question: 'Qual é o seu telefone ou WhatsApp?',
        fieldToSave: 'phone',
      }, 200, 770),
      node('thanks', 'MESSAGE', {
        text: 'Perfeito! Nossa equipe entrará em contato em breve. 🚀',
      }, 200, 950),
      node('stop', 'STOP', {}, 200, 1130),
    ],
    edges: [
      edge('start', 'greet'),
      edge('greet', 'pause1'),
      edge('pause1', 'ask-name'),
      edge('ask-name', 'ask-phone'),
      edge('ask-phone', 'thanks'),
      edge('thanks', 'stop'),
    ],
  },
};

const SCHEDULING: BotTemplate = {
  id: 'scheduling',
  name: 'Agendamento',
  description: 'Captura data e horário desejado e confirma o agendamento.',
  icon: 'Calendar',
  accentColor: '#16a34a',
  channels: ['WHATSAPP'],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
      node('intro', 'MESSAGE', {
        text: 'Olá! Vou te ajudar a agendar um horário. 📅',
      }, 200, 230),
      node('ask-name', 'ACTION', {
        question: 'Qual é o seu nome?',
        fieldToSave: 'name',
      }, 200, 410),
      node('ask-date', 'ACTION', {
        question: 'Qual data você prefere? (DD/MM/AAAA)',
        fieldToSave: 'scheduledDate',
      }, 200, 590),
      node('ask-time', 'ACTION', {
        question: 'Qual horário prefere? (ex: 14:00)',
        fieldToSave: 'scheduledTime',
      }, 200, 770),
      node('confirm', 'MESSAGE', {
        text: 'Ótimo! Seu agendamento foi registrado. Em breve enviaremos a confirmação. ✅',
      }, 200, 950),
      node('stop', 'STOP', {}, 200, 1130),
    ],
    edges: [
      edge('start', 'intro'),
      edge('intro', 'ask-name'),
      edge('ask-name', 'ask-date'),
      edge('ask-date', 'ask-time'),
      edge('ask-time', 'confirm'),
      edge('confirm', 'stop'),
    ],
  },
};

const FAQ: BotTemplate = {
  id: 'faq',
  name: 'FAQ Interativo',
  description: 'Menu de lista com perguntas frequentes; encaminha para o time se necessário.',
  icon: 'HelpCircle',
  accentColor: '#0891b2',
  channels: ['WHATSAPP'],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
      node('welcome', 'MESSAGE', {
        text: 'Olá! 👋 Selecione uma das opções abaixo para te ajudar melhor.',
      }, 200, 230),
      node('menu', 'LIST_MESSAGE', {
        headerText: 'Como posso ajudar?',
        items: [
          { id: 'opt1', title: '💰 Preços e planos' },
          { id: 'opt2', title: '🕐 Horário de atendimento' },
          { id: 'opt3', title: '📍 Localização' },
          { id: 'opt4', title: '🎧 Falar com atendente' },
        ],
      }, 200, 410),
      node('pause1', 'PAUSE', {}, 200, 630),
      node('answer', 'MESSAGE', {
        text: 'Obrigado pela sua escolha! Vou te passar as informações agora.',
      }, 200, 810),
      node('check', 'CONDITION', {
        field: 'resposta',
        operator: 'contains',
        value: 'atendente',
      }, 200, 990),
      node('handoff', 'HANDOFF', {
        message: 'Transferindo para um de nossos atendentes. Aguarde! 🎧',
      }, 400, 1170),
      node('stop', 'STOP', {}, 0, 1170),
    ],
    edges: [
      edge('start', 'welcome'),
      edge('welcome', 'menu'),
      edge('menu', 'pause1'),
      edge('pause1', 'answer'),
      edge('answer', 'check'),
      edge('check', 'handoff', 'true'),
      edge('check', 'stop', 'false'),
    ],
  },
};

const SUPPORT_AI: BotTemplate = {
  id: 'support-ai',
  name: 'Suporte com IA',
  description: 'Agente de IA responde dúvidas automaticamente e escalona para humano quando necessário.',
  icon: 'Robot',
  accentColor: '#071689',
  channels: ['WHATSAPP', 'WIDGET'],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
      node('greeting', 'MESSAGE', {
        text: 'Olá! Sou um assistente virtual com IA. Descreva seu problema e farei o melhor para ajudar! 🤖',
      }, 200, 230),
      node('pause1', 'PAUSE', {}, 200, 410),
      node('ai', 'AI_AGENT', {
        systemPrompt:
          'Você é um assistente de suporte ao cliente amigável e objetivo. Responda em português de forma clara e concisa. Se não souber a resposta, diga que vai transferir para um especialista.',
        maxAiTurns: 5,
      }, 200, 590),
      node('handoff', 'HANDOFF', {
        message: 'Vou conectar você com um especialista. Aguarde um momento! 👨‍💼',
      }, 200, 820),
    ],
    edges: [
      edge('start', 'greeting'),
      edge('greeting', 'pause1'),
      edge('pause1', 'ai'),
      edge('ai', 'handoff'),
    ],
  },
};

const WELCOME: BotTemplate = {
  id: 'welcome',
  name: 'Boas-vindas',
  description: 'Mensagem de boas-vindas com coleta de informações básicas do contato.',
  icon: 'Sparkles',
  accentColor: '#d97706',
  channels: [],
  graph: {
    nodes: [
      node('start', 'START', {}, 200, 50),
      node('msg1', 'MESSAGE', {
        text: 'Seja bem-vindo(a)! 🎉 Estamos felizes em ter você aqui.',
      }, 200, 230),
      node('ask-name', 'ACTION', {
        question: 'Para começar, qual é o seu nome?',
        fieldToSave: 'name',
      }, 200, 410),
      node('msg2', 'MESSAGE', {
        text: 'Prazer, {name}! Nosso time está pronto para te atender. Em breve entraremos em contato. 😊',
      }, 200, 590),
      node('stop', 'STOP', {}, 200, 770),
    ],
    edges: [
      edge('start', 'msg1'),
      edge('msg1', 'ask-name'),
      edge('ask-name', 'msg2'),
      edge('msg2', 'stop'),
    ],
  },
};

// ── Catálogo exportado ───────────────────────────────────────────────────────

export const BOT_TEMPLATES: BotTemplate[] = [
  BLANK,
  QUALIFICATION,
  SCHEDULING,
  FAQ,
  SUPPORT_AI,
  WELCOME,
];

export const CHANNEL_TABS: { id: BotChannel; label: string }[] = [
  { id: 'all',       label: 'Todos' },
  { id: 'WHATSAPP',  label: 'WhatsApp' },
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'WIDGET',    label: 'Site / Widget' },
];
