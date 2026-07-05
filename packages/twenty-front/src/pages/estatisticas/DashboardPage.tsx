// FORK: Voka CRM — Fase 20.3-FIX: Painel de estatísticas (visual Kommo dark)
import { useMemo, useState } from 'react';

import { styled } from '@linaria/react';
import { ResponsivePie } from '@nivo/pie';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useCountUp } from '@/analytics/hooks/useCountUp';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import {
  type PeriodFilter,
  useDashboardStats,
} from '@/analytics/hooks/useDashboardStats';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Garante que os keyframes globais sejam injetados pelo Linaria
void fadeSlideUpKeyframes;

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'hoje',   label: 'Hoje' },
  { key: 'ontem',  label: 'Ontem' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes',    label: 'Este mês' },
  { key: 'tudo',   label: 'Tudo' },
];

const CANAL_LABELS: Record<string, string> = {
  WHATSAPP:  'WhatsApp',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
  TELEGRAM:  'Telegram',
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style:    'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── HeroCard: cartão grande com número 64px ──────────────────────────────────

type HeroCardProps = {
  label:   string;
  value:   number;
  color?:  string;
  sub?:    string;
  loading: boolean;
  delay?:  number;
};

const HeroCard = ({
  label,
  value,
  color = '#fff',
  sub = 'este mês',
  loading,
  delay = 0,
}: HeroCardProps) => {
  const displayed = useCountUp(loading ? 0 : value, 1200);

  return (
    <StyledHeroCard style={{ animationDelay: `${delay}ms` }}>
      <StyledCardLabel>{label}</StyledCardLabel>
      <StyledHeroValue style={{ color }}>
        {loading ? <StyledSkeleton style={{ width: 96, height: 48 }} /> : displayed.toLocaleString('pt-BR')}
      </StyledHeroValue>
      <StyledCardSub>{sub}</StyledCardSub>
    </StyledHeroCard>
  );
};

// ─── MetricCard: cartão compacto ─────────────────────────────────────────────

type MetricCardProps = {
  label:   string;
  value:   number | string;
  color?:  string;
  loading: boolean;
  delay?:  number;
};

const MetricCard = ({
  label,
  value,
  color = '#fff',
  loading,
  delay = 0,
}: MetricCardProps) => {
  const numValue = typeof value === 'number' ? value : 0;
  const displayed = useCountUp(loading ? 0 : numValue, 1200);

  return (
    <StyledCard style={{ animationDelay: `${delay}ms` }}>
      <StyledCardLabel>{label}</StyledCardLabel>
      <StyledCardValue style={{ color }}>
        {loading ? (
          <StyledSkeleton />
        ) : typeof value === 'string' ? (
          value
        ) : (
          displayed.toLocaleString('pt-BR')
        )}
      </StyledCardValue>
    </StyledCard>
  );
};

// ─── DonutChart ───────────────────────────────────────────────────────────────

const DonutChart = ({
  data,
  loading,
  title,
}: {
  data: { id: string; value: number; label: string }[];
  loading: boolean;
  title: string;
}) => {
  const colors = useMemo(() => {
    const root = document.documentElement;
    const g = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
    return [
      g('--stats-metric-primary'),
      g('--stats-metric-secondary'),
      g('--stats-chart-line'),
      g('--stats-metric-warning'),
      g('--stats-chart-lost'),
    ];
  }, []);

  return (
    <StyledChartCard>
      <StyledChartTitle>{title}</StyledChartTitle>
      {loading ? (
        <StyledChartSkeleton />
      ) : data.length === 0 ? (
        <StyledEmpty>Sem dados no período</StyledEmpty>
      ) : (
        <div style={{ height: 200 }}>
          <ResponsivePie
            data={data}
            innerRadius={0.62}
            padAngle={0.4}
            cornerRadius={3}
            colors={colors}
            animate={true}
            motionConfig="gentle"
            enableArcLabels={false}
            enableArcLinkLabels={true}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLinkLabelsDiagonalLength={6}
            arcLinkLabelsStraightLength={8}
            arcLinkLabelsTextColor="rgba(255,255,255,0.85)"
            arcLinkLabelsThickness={1}
            tooltip={({ datum }) => (
              <StyledTooltip>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: datum.color, marginRight: 6 }} />
                {datum.label}: <strong>{datum.value}</strong>
              </StyledTooltip>
            )}
          />
        </div>
      )}
    </StyledChartCard>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const [period, setPeriod] = useState<PeriodFilter>('mes');
  const { stats, loading } = useDashboardStats(period);
  const workspace = useAtomStateValue(currentWorkspaceState);

  const canalData = useMemo(
    () => (stats?.porCanal ?? []).map((c) => ({
      id: c.canal, label: CANAL_LABELS[c.canal] ?? c.canal, value: c.quantidade,
    })),
    [stats],
  );

  const fonteData = useMemo(
    () => (stats?.fontesDeLead ?? []).map((f) => ({
      id: f.nome, label: f.nome, value: f.quantidade,
    })),
    [stats],
  );

  return (
    <StyledPage>
      {/* Nome do workspace */}
      <StyledWorkspaceName>
        {workspace?.displayName ?? 'Painel'}
      </StyledWorkspaceName>

      {/* Filtros de período */}
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

      {/* Métricas hero — 3 colunas com número 64px */}
      <StyledGrid cols={3}>
        <HeroCard
          label="MENSAGENS RECEBIDAS"
          value={stats?.mensagensRecebidas ?? 0}
          color="var(--stats-metric-primary)"
          loading={loading}
          delay={0}
        />
        <HeroCard
          label="CONVERSAS EM ANDAMENTO"
          value={stats?.conversasEmAndamento ?? 0}
          color="var(--stats-metric-secondary)"
          loading={loading}
          delay={80}
        />
        <HeroCard
          label="CONVERSAS SEM RESPOSTA"
          value={stats?.conversasSemResposta ?? 0}
          color="var(--stats-metric-secondary)"
          loading={loading}
          delay={160}
        />
      </StyledGrid>

      {/* Tempos */}
      <StyledGrid cols={2}>
        <MetricCard
          label="TEMPO MÉDIO DE RESPOSTA"
          value={loading ? 0 : formatMinutes(stats?.tempoMedioResposta ?? 0)}
          color="#fff"
          loading={loading}
          delay={240}
        />
        <MetricCard
          label="MAIOR TEMPO AGUARDANDO"
          value={loading ? 0 : formatMinutes(stats?.maiorTempoAguardando ?? 0)}
          color={(stats?.maiorTempoAguardando ?? 0) > 60 ? 'var(--stats-chart-lost)' : '#fff'}
          loading={loading}
          delay={320}
        />
      </StyledGrid>

      {/* Leads */}
      <StyledSectionLabel>Leads &amp; Valor</StyledSectionLabel>
      <StyledGrid cols={3}>
        <MetricCard
          label="LEADS GANHOS"
          value={stats?.leadsGanhos ?? 0}
          color="var(--stats-metric-primary)"
          loading={loading}
          delay={400}
        />
        <MetricCard
          label="VALOR GANHO"
          value={loading ? 0 : formatBrl(stats?.valorLeadsGanhos ?? 0)}
          color="var(--stats-metric-primary)"
          loading={loading}
          delay={480}
        />
        <MetricCard
          label="LEADS ATIVOS"
          value={stats?.leadsAtivos ?? 0}
          color="var(--stats-chart-line)"
          loading={loading}
          delay={560}
        />
      </StyledGrid>
      <StyledGrid cols={2}>
        <MetricCard
          label="VALOR PIPELINE ATIVO"
          value={loading ? 0 : formatBrl(stats?.valorLeadsAtivos ?? 0)}
          color="var(--stats-chart-line)"
          loading={loading}
          delay={640}
        />
        <MetricCard
          label="TAREFAS NO PERÍODO"
          value={stats?.tarefas ?? 0}
          color="var(--stats-metric-warning)"
          loading={loading}
          delay={720}
        />
      </StyledGrid>

      {/* Gráficos de distribuição */}
      <StyledGrid cols={2} style={{ marginTop: 8 }}>
        <DonutChart data={canalData} loading={loading} title="Por canal" />
        <DonutChart data={fonteData} loading={loading} title="Fontes de lead" />
      </StyledGrid>
    </StyledPage>
  );
};

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  background: var(--stats-bg-gradient);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  /* Garante cobertura total mesmo com conteúdo curto */
  min-height: 100%;
  overflow-y: auto;
  padding: 28px 32px 48px;
`;

const StyledWorkspaceName = styled.h1`
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0 0 4px;
  text-align: center;
`;

const StyledPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 8px;
`;

const StyledPill = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 16px;
  transition: all 150ms ease-out;

  &[data-active='true'] {
    background: #ffffff;
    border-color: #ffffff;
    color: #101828;
    font-weight: 600;
  }

  &:hover:not([data-active='true']) {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }
`;

const StyledSectionLabel = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  margin-top: 4px;
  text-transform: uppercase;
`;

const StyledGrid = styled.div<{ cols: number }>`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(${({ cols }) => cols}, 1fr);
`;

/* Card hero — número 64px */
const StyledHeroCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 12px;
  box-shadow: var(--stats-card-shadow);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 24px;
  transition: box-shadow 150ms ease-out, transform 150ms ease-out;

  &:hover {
    box-shadow: var(--stats-card-shadow-hover);
    transform: translateY(-2px);
  }
`;

const StyledHeroValue = styled.div`
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -2px;
  line-height: 1;
  min-height: 64px;
`;

/* Card compacto — número 28px */
const StyledCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 12px;
  box-shadow: var(--stats-card-shadow);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 24px;
  transition: box-shadow 150ms ease-out, transform 150ms ease-out;

  &:hover {
    box-shadow: var(--stats-card-shadow-hover);
    transform: translateY(-2px);
  }
`;

const StyledCardLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StyledCardValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  min-height: 34px;
`;

const StyledCardSub = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 2px;
`;

const StyledSkeleton = styled.span`
  animation: skeleton-pulse var(--anim-duration-slow) var(--anim-ease-in-out) infinite;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  display: inline-block;
  height: 28px;
  width: 80px;
`;

const StyledChartCard = styled.div`
  animation: fade-slide-up var(--anim-duration-slow) var(--anim-ease-out) both;
  animation-delay: 400ms;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 12px;
  box-shadow: var(--stats-card-shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 20px 12px;
`;

const StyledChartTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StyledChartSkeleton = styled.div`
  animation: skeleton-pulse var(--anim-duration-slow) var(--anim-ease-in-out) infinite;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  height: 160px;
  margin: 20px auto 0;
  width: 160px;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  font-size: 12px;
  height: 160px;
  justify-content: center;
`;

const StyledTooltip = styled.div`
  align-items: center;
  background: rgba(15, 42, 74, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #ffffff;
  display: flex;
  font-size: 12px;
  padding: 6px 10px;
`;
