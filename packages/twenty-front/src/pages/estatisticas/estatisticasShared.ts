// FORK: Voka CRM — T-7: utilitários compartilhados da página de Estatísticas
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import type { PeriodFilter } from '@/analytics/hooks/useDashboardStats';
import type {
  EtapaStats,
  GanhoPerdaStats,
} from '@/analytics/hooks/useAnaliseGanhoPerda';

export type LeadRecord = ObjectRecord & {
  name?: string | null;
  stage?: string | null;
  amount?: { amountMicros?: number | string | null } | null;
  closeDate?: string | null;
  createdAt?: string | null;
  createdBy?: { name?: string | null } | null;
};

export const PERIODOS: { key: PeriodFilter; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mês' },
  { key: 'tudo', label: 'Tudo' },
];

export const STAGE_LABELS: Record<string, string> = {
  NEW: 'Leads Recebidos',
  SCREENING: 'Triagem',
  MEETING: 'Reunião',
  PROPOSAL: 'Proposta',
  CUSTOMER: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
};

/** Lê uma cor do tema TailAdmin (CSS var) em runtime — evita hex hardcoded. */
export const themeColor = (name: string): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();

export const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const leadValor = (lead: LeadRecord): number =>
  Number(lead.amount?.amountMicros ?? 0) / 1_000_000;

export const startOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

/** Intervalo [inicio, fim) do período; null = sem limite (tudo). */
export const periodoRange = (
  p: PeriodFilter,
): { inicio: Date | null; fim: Date | null } => {
  const hoje = startOfDay(new Date());
  if (p === 'hoje') return { inicio: hoje, fim: null };
  if (p === 'ontem') {
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    return { inicio: ontem, fim: hoje };
  }
  if (p === 'semana') {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 7);
    return { inicio, fim: null };
  }
  if (p === 'mes') {
    const inicio = new Date(hoje);
    inicio.setMonth(inicio.getMonth() - 1);
    return { inicio, fim: null };
  }
  return { inicio: null, fim: null };
};

export const dentroDoPeriodo = (
  iso: string | null | undefined,
  p: PeriodFilter,
): boolean => {
  if (typeof iso !== 'string' || iso === '') return false;
  const { inicio, fim } = periodoRange(p);
  const d = new Date(iso);
  if (inicio !== null && d < inicio) return false;
  if (fim !== null && d >= fim) return false;
  return true;
};

/** Ordem canônica das etapas ativas do funil (sem WON/LOST). */
const STAGE_ORDER = ['NEW', 'SCREENING', 'MEETING', 'PROPOSAL', 'CUSTOMER'];

/**
 * Fallback client-side para quando a API `analiseGanhoPerda` não está
 * disponível: monta o funil a partir dos próprios leads. `entrouNaEtapa` é
 * acumulado de trás para frente (quem está numa etapa passou pelas
 * anteriores); perdidos entram no topo do funil.
 */
export const montarFunilFallback = (leads: LeadRecord[]): GanhoPerdaStats => {
  const dentro: Record<string, { leads: number; valor: number }> = {};
  for (const s of STAGE_ORDER) dentro[s] = { leads: 0, valor: 0 };
  const ganhos = { leads: 0, valor: 0 };
  const perdidos = { leads: 0, valor: 0 };

  for (const l of leads) {
    const valor = leadValor(l);
    if (l.stage === 'WON') {
      ganhos.leads += 1;
      ganhos.valor += valor;
      continue;
    }
    if (l.stage === 'LOST') {
      perdidos.leads += 1;
      perdidos.valor += valor;
      continue;
    }
    const s = STAGE_ORDER.includes(l.stage ?? '') ? (l.stage as string) : 'NEW';
    dentro[s].leads += 1;
    dentro[s].valor += valor;
  }

  let acumulado = { leads: ganhos.leads, valor: ganhos.valor };
  const etapas: EtapaStats[] = [];
  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const s = STAGE_ORDER[i];
    acumulado = {
      leads: acumulado.leads + dentro[s].leads,
      valor: acumulado.valor + dentro[s].valor,
    };
    etapas.unshift({
      etapaNome: STAGE_LABELS[s] ?? s,
      dentroDaEtapa: { ...dentro[s] },
      entrouNaEtapa: { ...acumulado },
      perdidoNaEtapa: { leads: 0, valor: 0 },
      taxaConversao: 0,
    });
  }

  if (etapas.length > 0) {
    etapas[0].entrouNaEtapa.leads += perdidos.leads;
    etapas[0].entrouNaEtapa.valor += perdidos.valor;
    etapas[0].perdidoNaEtapa = { ...perdidos };
  }

  for (let i = 0; i < etapas.length; i++) {
    const atual = etapas[i].entrouNaEtapa.leads;
    const proximo =
      i < etapas.length - 1 ? etapas[i + 1].entrouNaEtapa.leads : ganhos.leads;
    etapas[i].taxaConversao = atual > 0 ? (proximo / atual) * 100 : 0;
  }

  return {
    porEtapa: etapas,
    totalGanho: ganhos,
    totalPerdido: perdidos,
    cicloVidaMedioEmDias: 0,
    vendasProspectivas: [],
  };
};

export const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** Gera o CSV e dispara o download no client. */
export const baixarCsv = (nomeArquivo: string, linhas: string[][]): void => {
  const csv = linhas
    .map((linha) => linha.map((c) => `"${c.replaceAll('"', '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
};
