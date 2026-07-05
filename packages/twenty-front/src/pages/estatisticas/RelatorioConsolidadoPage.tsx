// FORK: Voka CRM — Fase 20.7: Relatório Consolidado (LineChart + donuts @nivo)
import { useMemo, useState } from 'react';

import { styled } from '@linaria/react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

import { useCountUp } from '@/analytics/hooks/useCountUp';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import {
  type GranularidadeType,
  type StatusTarefa,
  useRelatorioConsolidado,
} from '@/analytics/hooks/useRelatorioConsolidado';
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

const GRAN: { key: GranularidadeType; label: string }[] = [
  { key: 'DIA',    label: 'Dia' },
  { key: 'SEMANA', label: 'Semana' },
  { key: 'MES',    label: 'Mês' },
];

const STATUS_PT: Record<string, string> = {
  TODO:        'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE:        'Concluída',
};

// ─── Formatação ───────────────────────────────────────────────────────────────

function fBrl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Donut mini ───────────────────────────────────────────────────────────────

const MiniDonut = ({
  data,
  colors,
  loading,
}: {
  data: { id: string; label: string; value: number }[];
  colors: string[];
  loading: boolean;
}) => {
  if (loading) return <StyledDonutSkeleton />;
  if (data.length === 0 || data.every((d) => d.value === 0))
    return <StyledEmpty>Sem dados</StyledEmpty>;

  return (
    <div style={{ height: 180 }}>
      <ResponsivePie
        data={data}
        innerRadius={0.6}
        padAngle={0.5}
        cornerRadius={2}
        colors={colors}
        animate={true}
        motionConfig="gentle"
        enableArcLabels={false}
        enableArcLinkLabels={true}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLinkLabelsDiagonalLength={5}
        arcLinkLabelsStraightLength={6}
        arcLinkLabelsTextColor="rgba(255,255,255,0.8)"
        arcLinkLabelsThickness={1}
        tooltip={({ datum }) => (
          <StyledTooltip>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: datum.color, display: 'inline-block', marginRight: 5,
              }}
            />
            {datum.label}: <strong>{datum.value}</strong>
          </StyledTooltip>
        )}
      />
    </div>
  );
};

// ─── Linha de status de tarefa ────────────────────────────────────────────────

const TaskStatusRow = ({
  row,
  maxQtd,
  delay,
}: {
  row: StatusTarefa;
  maxQtd: number;
  delay: number;
}) => {
  const pct = maxQtd > 0 ? Math.round((row.quantidade / maxQtd) * 100) : 0;
  return (
    <StyledTaskRow style={{ animationDelay: `${delay}ms` }}>
      <StyledTaskLabel>{STATUS_PT[row.status] ?? row.status}</StyledTaskLabel>
      <StyledTaskBarWrap>
        <StyledTaskBar style={{ width: `${pct}%`, animationDelay: `${delay}ms` }} />
      </StyledTaskBarWrap>
      <StyledTaskCount>{row.quantidade}</StyledTaskCount>
      <StyledTaskPct>{row.percentual}%</StyledTaskPct>
    </StyledTaskRow>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const RelatorioConsolidadoPage = () => {
  const [period, setPeriod]      = useState<PeriodFilter>('mes');
  const [granularidade, setGran] = useState<GranularidadeType>('DIA');
  const { relatorio, loading }   = useRelatorioConsolidado(period, granularidade);

  const chartColors = useMemo(() => {
    const root = document.documentElement;
    const get  = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
    return {
      line:  get('--stats-chart-line'),
      won:   get('--stats-metric-primary'),
      lost:  get('--stats-chart-lost'),
      warn:  get('--stats-metric-warning'),
      brand: get('--stats-metric-secondary'),
    };
  }, []);

  const lineData = useMemo(() => {
    const serie = relatorio?.serieLeads ?? [];
    return [
      {
        id:    'Leads',
        color: chartColors.line,
        data:  serie.map((p) => ({ x: fDate(p.data), y: p.quantidade })),
      },
    ];
  }, [relatorio, chartColors.line]);

  const etapaData = useMemo(
    () =>
      (relatorio?.porEtapa ?? []).map((e) => ({
        id:    e.nome,
        label: e.nome,
        value: e.quantidade,
      })),
    [relatorio],
  );

  const contatoData = useMemo(
    () =>
      (relatorio?.contatos.porTipo ?? []).map((c) => ({
        id:    c.tipo,
        label: c.tipo,
        value: c.quantidade,
      })),
    [relatorio],
  );

  const maxTaskQtd = Math.max(
    ...(relatorio?.tarefas.porStatus.map((t) => t.quantidade) ?? [0]),
    0,
  );

  const totalLeads = useCountUp(loading ? 0 : (relatorio?.totalLeads ?? 0), 1000);

  return (
    <StyledPage>
      {/* Cabeçalho */}
      <StyledHeader>
        <StyledTitle>Relatório Consolidado</StyledTitle>
        <StyledControlRow>
          <StyledPillGroup>
            {PERIODS.map(({ key, label }) => (
              <StyledPill
                key={key}
                data-active={period === key ? 'true' : 'false'}
                onClick={() => setPeriod(key)}
              >
                {label}
              </StyledPill>
            ))}
          </StyledPillGroup>
          <StyledPillGroup>
            {GRAN.map(({ key, label }) => (
              <StyledPill
                key={key}
                data-active={granularidade === key ? 'true' : 'false'}
                onClick={() => setGran(key)}
              >
                {label}
              </StyledPill>
            ))}
          </StyledPillGroup>
        </StyledControlRow>
      </StyledHeader>

      {/* Totais */}
      <StyledSummaryRow>
        <StyledSummaryCard style={{ animationDelay: '0ms' }}>
          <StyledSummaryLabel>Total de leads</StyledSummaryLabel>
          <StyledSummaryValue>{loading ? '…' : totalLeads}</StyledSummaryValue>
        </StyledSummaryCard>
        <StyledSummaryCard style={{ animationDelay: '80ms' }}>
          <StyledSummaryLabel>Valor total pipeline</StyledSummaryLabel>
          <StyledSummaryValue style={{ color: 'var(--stats-chart-line)' }}>
            {loading ? '…' : fBrl(relatorio?.valorTotal ?? 0)}
          </StyledSummaryValue>
        </StyledSummaryCard>
        <StyledSummaryCard style={{ animationDelay: '160ms' }}>
          <StyledSummaryLabel>Total contatos</StyledSummaryLabel>
          <StyledSummaryValue>
            {loading ? '…' : (relatorio?.contatos.total ?? 0)}
          </StyledSummaryValue>
        </StyledSummaryCard>
        <StyledSummaryCard style={{ animationDelay: '240ms' }}>
          <StyledSummaryLabel>Total tarefas</StyledSummaryLabel>
          <StyledSummaryValue>
            {loading ? '…' : (relatorio?.tarefas.total ?? 0)}
          </StyledSummaryValue>
        </StyledSummaryCard>
      </StyledSummaryRow>

      {/* LineChart de leads */}
      <StyledChartCard>
        <StyledChartTitle>Leads ao longo do tempo</StyledChartTitle>
        {loading ? (
          <StyledLineSkeleton />
        ) : lineData[0]?.data.length === 0 ? (
          <StyledEmpty>Sem dados no período</StyledEmpty>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveLine
              data={lineData}
              margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, nice: true }}
              animate={true}
              motionConfig="gentle"
              colors={[chartColors.line]}
              lineWidth={2}
              enablePoints={true}
              pointSize={6}
              pointColor={chartColors.line}
              pointBorderWidth={0}
              enableArea={true}
              areaOpacity={0.12}
              enableGridX={false}
              gridYValues={4}
              theme={{
                grid:  { line: { stroke: 'rgba(255,255,255,0.08)' } },
                axis:  { ticks: { text: { fill: 'rgba(255,255,255,0.5)', fontSize: 10 } } },
                crosshair: { line: { stroke: 'rgba(255,255,255,0.3)' } },
              }}
              axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -30 }}
              axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
              tooltip={({ point }) => (
                <StyledTooltip>
                  <strong>{String(point.data.x)}</strong>: {String(point.data.y)} leads
                </StyledTooltip>
              )}
            />
          </div>
        )}
      </StyledChartCard>

      {/* Donuts + tarefas */}
      <StyledBottomRow>
        <StyledChartCard style={{ flex: 1 }}>
          <StyledChartTitle>Por etapa</StyledChartTitle>
          <MiniDonut
            data={etapaData}
            colors={[chartColors.brand, chartColors.line, chartColors.won, chartColors.warn, chartColors.lost]}
            loading={loading}
          />
        </StyledChartCard>

        <StyledChartCard style={{ flex: 1 }}>
          <StyledChartTitle>Contatos</StyledChartTitle>
          <MiniDonut
            data={contatoData}
            colors={[chartColors.line, chartColors.brand]}
            loading={loading}
          />
        </StyledChartCard>

        <StyledChartCard style={{ flex: '0 0 280px' }}>
          <StyledChartTitle>Tarefas por status</StyledChartTitle>
          {loading ? (
            <StyledDonutSkeleton />
          ) : (relatorio?.tarefas.porStatus ?? []).length === 0 ? (
            <StyledEmpty>Sem tarefas</StyledEmpty>
          ) : (
            <div style={{ marginTop: 8 }}>
              {relatorio!.tarefas.porStatus.map((t, i) => (
                <TaskStatusRow key={t.status} row={t} maxQtd={maxTaskQtd} delay={i * 80} />
              ))}
            </div>
          )}
        </StyledChartCard>
      </StyledBottomRow>
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
  min-height: 100%;
  overflow-y: auto;
  padding: 24px 28px 40px;
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledTitle = styled.h1`
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0;
`;

const StyledControlRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const StyledPillGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const StyledPill = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  transition: all var(--anim-duration-fast) var(--anim-ease-out);

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
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.4px;
`;

const StyledChartCard = styled.div`
  animation: fade-slide-up var(--anim-duration-slow) var(--anim-ease-out) both;
  animation-delay: 300ms;
  background: var(--stats-card-bg);
  border: 1px solid var(--stats-card-border);
  border-radius: 10px;
  padding: 16px 18px;
`;

const StyledChartTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
`;

const StyledLineSkeleton = styled.div`
  animation: skeleton-pulse var(--anim-duration-slow) var(--anim-ease-in-out) infinite;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  height: 220px;
`;

const StyledDonutSkeleton = styled.div`
  animation: skeleton-pulse var(--anim-duration-slow) var(--anim-ease-in-out) infinite;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  height: 140px;
  margin: 20px auto;
  width: 140px;
`;

const StyledBottomRow = styled.div`
  display: flex;
  gap: 12px;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  font-size: 12px;
  height: 120px;
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
  gap: 4px;
  padding: 6px 10px;
`;

const StyledTaskRow = styled.div`
  align-items: center;
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
`;

const StyledTaskLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  flex: 0 0 110px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTaskBarWrap = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  flex: 1;
  height: 8px;
  overflow: hidden;
`;

const StyledTaskBar = styled.div`
  animation: grow-bar var(--anim-duration-slow) var(--anim-ease-out) both;
  background: var(--stats-chart-line);
  border-radius: 4px;
  height: 100%;
`;

const StyledTaskCount = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  width: 36px;
`;

const StyledTaskPct = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  text-align: right;
  width: 32px;
`;
