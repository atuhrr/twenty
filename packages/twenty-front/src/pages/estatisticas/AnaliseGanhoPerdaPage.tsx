// FORK: Voka CRM — Fase 20.6: Análise Ganho-Perda (funil horizontal animado)
import { useState } from 'react';

import { styled } from '@linaria/react';

import { useCountUp } from '@/analytics/hooks/useCountUp';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import {
  type EtapaStats,
  useAnaliseGanhoPerda,
} from '@/analytics/hooks/useAnaliseGanhoPerda';
import { type PeriodFilter } from '@/analytics/hooks/useDashboardStats';

void fadeSlideUpKeyframes;

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'hoje',   label: 'Hoje' },
  { key: 'ontem',  label: 'Ontem' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes',    label: 'Este mês' },
  { key: 'tudo',   label: 'Tudo' },
];

// Cor por taxa de conversão (0–100)
function conversionColor(pct: number): string {
  if (pct >= 60) return 'var(--stats-metric-primary)';
  if (pct >= 30) return 'var(--stats-metric-warning)';
  return 'var(--stats-chart-lost)';
}

// Tradução das etapas padrão
const STAGE_PT: Record<string, string> = {
  NEW:       'Novo',
  SCREENING: 'Triagem',
  MEETING:   'Reunião',
  PROPOSAL:  'Proposta',
  CUSTOMER:  'Cliente',
  WON:       'Ganho',
  LOST:      'Perdido',
};

function stageName(key: string): string {
  return STAGE_PT[key] ?? key;
}

// ─── Formatação ───────────────────────────────────────────────────────────────

function fBrl(v: number): string {
  if (v === 0) return 'R$ 0';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ─── Chevron SVG ──────────────────────────────────────────────────────────────
// Funil horizontal: cada etapa é um trapézio com ponta à direita
const CHEVRON_W = 140;
const CHEVRON_H = 64;
const ARROW_D   = 16;

type ChevronProps = {
  etapa: EtapaStats;
  index: number;
  total: number;
};

const FunnelChevron = ({ etapa, index, total }: ChevronProps) => {
  const color  = conversionColor(etapa.taxaConversao);
  const pct    = etapa.taxaConversao;
  const filled = Math.round((pct / 100) * CHEVRON_H);
  const isLast = index === total - 1;
  const delay  = index * 80;

  // Polígono: ponta à direita, exceto no último onde fecha reto
  const points = isLast
    ? `0,0 ${CHEVRON_W},0 ${CHEVRON_W},${CHEVRON_H} 0,${CHEVRON_H}`
    : `0,0 ${CHEVRON_W},0 ${CHEVRON_W + ARROW_D},${CHEVRON_H / 2} ${CHEVRON_W},${CHEVRON_H} 0,${CHEVRON_H}`;

  return (
    <StyledChevronWrap style={{ animationDelay: `${delay}ms` }}>
      <svg
        width={isLast ? CHEVRON_W : CHEVRON_W + ARROW_D}
        height={CHEVRON_H}
        overflow="visible"
      >
        {/* Fundo */}
        <polygon
          points={points}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        {/* Preenchimento animado de baixo para cima por taxa de conversão */}
        <clipPath id={`clip-${index}`}>
          <rect
            x={0}
            y={CHEVRON_H - filled}
            width={isLast ? CHEVRON_W : CHEVRON_W + ARROW_D}
            height={filled}
            style={{
              animation: `grow-bar var(--anim-duration-slow) var(--anim-ease-out) ${delay}ms both`,
            }}
          />
        </clipPath>
        <polygon
          points={points}
          fill={color}
          opacity={0.55}
          clipPath={`url(#clip-${index})`}
        />
        {/* Texto */}
        <text
          x={(isLast ? CHEVRON_W : CHEVRON_W + ARROW_D) / 2}
          y={CHEVRON_H / 2 - 8}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={11}
          fontWeight={600}
        >
          {stageName(etapa.etapaNome)}
        </text>
        <text
          x={(isLast ? CHEVRON_W : CHEVRON_W + ARROW_D) / 2}
          y={CHEVRON_H / 2 + 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.85)"
          fontSize={13}
          fontWeight={700}
        >
          {etapa.dentroDaEtapa.leads}
        </text>
        <text
          x={(isLast ? CHEVRON_W : CHEVRON_W + ARROW_D) / 2}
          y={CHEVRON_H / 2 + 22}
          textAnchor="middle"
          fill={color}
          fontSize={10}
          fontWeight={600}
        >
          {pct}%
        </text>
      </svg>
    </StyledChevronWrap>
  );
};

// ─── Linha de detalhe de etapa ────────────────────────────────────────────────

const EtapaDetailRow = ({
  etapa,
  maxLeads,
  delay,
}: {
  etapa: EtapaStats;
  maxLeads: number;
  delay: number;
}) => {
  const barWidth = maxLeads > 0
    ? Math.round((etapa.dentroDaEtapa.leads / maxLeads) * 100)
    : 0;
  const countLeads = useCountUp(etapa.dentroDaEtapa.leads, 900);

  return (
    <StyledDetailRow style={{ animationDelay: `${delay}ms` }}>
      <StyledDetailName>{stageName(etapa.etapaNome)}</StyledDetailName>
      <StyledBarWrap>
        <StyledBar
          style={{
            width: `${barWidth}%`,
            background: conversionColor(etapa.taxaConversao),
            animationDelay: `${delay}ms`,
          }}
        />
      </StyledBarWrap>
      <StyledDetailNum>{countLeads}</StyledDetailNum>
      <StyledDetailVal>{fBrl(etapa.dentroDaEtapa.valor)}</StyledDetailVal>
      <StyledDetailPct style={{ color: conversionColor(etapa.taxaConversao) }}>
        {etapa.taxaConversao}%
      </StyledDetailPct>
    </StyledDetailRow>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const AnaliseGanhoPerdaPage = () => {
  const [period, setPeriod] = useState<PeriodFilter>('mes');
  const { stats, loading }  = useAnaliseGanhoPerda(period);

  const etapas    = stats?.porEtapa ?? [];
  const maxLeads  = etapas.reduce((m, e) => Math.max(m, e.dentroDaEtapa.leads), 0);

  const ganhosLeads = useCountUp(loading ? 0 : (stats?.totalGanho.leads ?? 0), 1000);
  const perdidosLeads = useCountUp(loading ? 0 : (stats?.totalPerdido.leads ?? 0), 1000);

  return (
    <StyledPage>
      {/* Cabeçalho */}
      <StyledHeader>
        <StyledTitle>Análise Ganho-Perda</StyledTitle>
        <StyledPills>
          {PERIODS.map(({ key, label }) => (
            <StyledPill
              key={key}
              data-active={period === key ? 'true' : 'false'}
              onClick={() => setPeriod(key)}
            >
              {label}
            </StyledPill>
          ))}
        </StyledPills>
      </StyledHeader>

      {/* Resumo: Ganho vs Perdido */}
      <StyledSummaryRow>
        <StyledSummaryCard>
          <StyledSummaryLabel>Leads ganhos</StyledSummaryLabel>
          <StyledSummaryValue style={{ color: 'var(--stats-metric-primary)' }}>
            {loading ? '…' : ganhosLeads}
          </StyledSummaryValue>
          <StyledSummarySubValue>
            {loading ? '' : fBrl(stats?.totalGanho.valor ?? 0)}
          </StyledSummarySubValue>
        </StyledSummaryCard>

        <StyledSummaryCard>
          <StyledSummaryLabel>Leads perdidos</StyledSummaryLabel>
          <StyledSummaryValue style={{ color: 'var(--stats-chart-lost)' }}>
            {loading ? '…' : perdidosLeads}
          </StyledSummaryValue>
          <StyledSummarySubValue>
            {loading ? '' : fBrl(stats?.totalPerdido.valor ?? 0)}
          </StyledSummarySubValue>
        </StyledSummaryCard>

        <StyledSummaryCard>
          <StyledSummaryLabel>Ciclo de vida médio</StyledSummaryLabel>
          <StyledSummaryValue>
            {loading
              ? '…'
              : stats?.cicloVidaMedioEmDias
                ? `${Math.round(stats.cicloVidaMedioEmDias)} dias`
                : '—'}
          </StyledSummaryValue>
          <StyledSummarySubValue>da abertura até ganho</StyledSummarySubValue>
        </StyledSummaryCard>

        <StyledSummaryCard>
          <StyledSummaryLabel>Etapas no funil</StyledSummaryLabel>
          <StyledSummaryValue>{loading ? '…' : etapas.length}</StyledSummaryValue>
          <StyledSummarySubValue>stages configurados</StyledSummarySubValue>
        </StyledSummaryCard>
      </StyledSummaryRow>

      {/* Funil horizontal de chevrons */}
      <StyledFunnelCard>
        <StyledChartTitle>Funil de conversão</StyledChartTitle>
        {loading ? (
          <StyledFunnelSkeleton />
        ) : etapas.length === 0 ? (
          <StyledEmpty>Sem dados no período</StyledEmpty>
        ) : (
          <StyledChevronRow>
            {etapas.map((e, i) => (
              <FunnelChevron
                key={e.etapaNome}
                etapa={e}
                index={i}
                total={etapas.length}
              />
            ))}
          </StyledChevronRow>
        )}
      </StyledFunnelCard>

      {/* Detalhe por etapa */}
      {!loading && etapas.length > 0 && (
        <StyledDetailCard>
          <StyledChartTitle>Detalhe por etapa</StyledChartTitle>
          <StyledDetailHeader>
            <span style={{ flex: '0 0 100px' }}>Etapa</span>
            <span style={{ flex: 1 }}>Leads</span>
            <span style={{ width: 60, textAlign: 'right' }}>Qtd</span>
            <span style={{ width: 100, textAlign: 'right' }}>Valor</span>
            <span style={{ width: 60, textAlign: 'right' }}>Conv.</span>
          </StyledDetailHeader>
          {etapas.map((e, i) => (
            <EtapaDetailRow
              key={e.etapaNome}
              etapa={e}
              maxLeads={maxLeads}
              delay={i * 60}
            />
          ))}
        </StyledDetailCard>
      )}
    </StyledPage>
  );
};

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  background: var(--stats-bg-gradient);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 40px;
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StyledTitle = styled.h1`
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0;
`;

const StyledPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const StyledPill = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 14px;
  transition: background var(--anim-duration-fast) var(--anim-ease-out),
    color var(--anim-duration-fast) var(--anim-ease-out);

  &[data-active='true'] {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.5);
    color: #ffffff;
    font-weight: 600;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
  }
`;

const StyledSummaryRow = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, 1fr);
`;

const StyledSummaryCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
`;

const StyledSummaryLabel = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  font-weight: 500;
`;

const StyledSummaryValue = styled.div`
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.4px;
`;

const StyledSummarySubValue = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
`;

const StyledFunnelCard = styled.div`
  animation: fade-slide-up var(--anim-duration-slow) var(--anim-ease-out) both;
  animation-delay: 200ms;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 10px;
  padding: 18px 20px;
`;

const StyledDetailCard = styled.div`
  animation: fade-slide-up var(--anim-duration-slow) var(--anim-ease-out) both;
  animation-delay: 350ms;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 10px;
  padding: 18px 20px;
`;

const StyledChartTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 16px;
`;

const StyledChevronRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const StyledChevronWrap = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  flex-shrink: 0;
`;

const StyledFunnelSkeleton = styled.div`
  animation: skeleton-pulse var(--anim-duration-slow) var(--anim-ease-in-out) infinite;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  height: 64px;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  font-size: 12px;
  height: 64px;
  justify-content: center;
`;

const StyledDetailHeader = styled.div`
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  font-size: 10px;
  font-weight: 600;
  gap: 8px;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 4px;
  text-transform: uppercase;
`;

const StyledDetailRow = styled.div`
  align-items: center;
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  gap: 8px;
  padding: 10px 4px;
`;

const StyledDetailName = styled.div`
  color: rgba(255, 255, 255, 0.85);
  flex: 0 0 100px;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBarWrap = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  flex: 1;
  height: 8px;
  overflow: hidden;
`;

const StyledBar = styled.div`
  animation: grow-bar var(--anim-duration-slow) var(--anim-ease-out) both;
  border-radius: 4px;
  height: 100%;
`;

const StyledDetailNum = styled.div`
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  width: 60px;
`;

const StyledDetailVal = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-align: right;
  width: 100px;
`;

const StyledDetailPct = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  width: 60px;
`;
