// FORK: Voka CRM — T-7: aba Visão Geral (KPIs + evolução + distribuição + top responsáveis)
import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import type { PeriodFilter } from '@/analytics/hooks/useDashboardStats';
import {
  BoxIconLine,
  CheckLineIcon,
  DollarLineIcon,
  GroupIcon,
} from '@/tailadmin/icons';
import {
  ChartCard,
  ChartSkeleton,
} from '~/pages/estatisticas/components/ChartCard';
import { KpiCard, KpiSkeleton } from '~/pages/estatisticas/components/KpiCard';
import {
  dentroDoPeriodo,
  formatBRL,
  leadValor,
  MESES_CURTOS,
  STAGE_LABELS,
  startOfDay,
  themeColor,
  type LeadRecord,
} from '~/pages/estatisticas/estatisticasShared';

type RangeEvolucao = '7d' | '30d' | '3m' | '12m';

const RANGES: { key: RangeEvolucao; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '3m', label: '3 meses' },
  { key: '12m', label: '12 meses' },
];

interface AbaVisaoGeralProps {
  leads: LeadRecord[];
  loading: boolean;
  periodo: PeriodFilter;
}

export function AbaVisaoGeral({ leads, loading, periodo }: AbaVisaoGeralProps) {
  const [range, setRange] = useState<RangeEvolucao>('12m');

  const criados = useMemo(
    () => leads.filter((l) => dentroDoPeriodo(l.createdAt, periodo)),
    [leads, periodo],
  );
  const ganhos = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.stage === 'WON' &&
          dentroDoPeriodo(l.closeDate ?? l.createdAt, periodo),
      ),
    [leads, periodo],
  );
  const receita = ganhos.reduce((s, l) => s + leadValor(l), 0);
  const ticketMedio = ganhos.length > 0 ? receita / ganhos.length : 0;

  // ─── Evolução (criados vs ganhos por bucket) ────────────────────────────────
  const evolucao = useMemo(() => {
    const hoje = startOfDay(new Date());
    const buckets: { label: string; inicio: Date; fim: Date }[] = [];

    if (range === '7d' || range === '30d') {
      const dias = range === '7d' ? 7 : 30;
      for (let i = dias - 1; i >= 0; i--) {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - i);
        const fim = new Date(inicio);
        fim.setDate(fim.getDate() + 1);
        buckets.push({
          label: `${String(inicio.getDate()).padStart(2, '0')}/${String(inicio.getMonth() + 1).padStart(2, '0')}`,
          inicio,
          fim,
        });
      }
    } else {
      const meses = range === '3m' ? 3 : 12;
      for (let i = meses - 1; i >= 0; i--) {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
        buckets.push({ label: MESES_CURTOS[inicio.getMonth()], inicio, fim });
      }
    }

    const noBucket = (
      iso: string | null | undefined,
      b: { inicio: Date; fim: Date },
    ) => {
      if (typeof iso !== 'string' || iso === '') return false;
      const d = new Date(iso);
      return d >= b.inicio && d < b.fim;
    };

    return {
      categorias: buckets.map((b) => b.label),
      criados: buckets.map(
        (b) => leads.filter((l) => noBucket(l.createdAt, b)).length,
      ),
      ganhos: buckets.map(
        (b) =>
          leads.filter(
            (l) => l.stage === 'WON' && noBucket(l.closeDate ?? l.createdAt, b),
          ).length,
      ),
    };
  }, [leads, range]);

  const lineOptions: ApexOptions = {
    colors: [themeColor('brand-500'), themeColor('success-500')],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'line',
      toolbar: { show: false },
    },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: evolucao.categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit',
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { x: { show: true } },
  };

  // ─── Distribuição por etapa (donut) ─────────────────────────────────────────
  const distribuicao = useMemo(() => {
    const contagem: Record<string, number> = {};
    for (const l of leads) {
      const stage = l.stage ?? 'NEW';
      contagem[stage] = (contagem[stage] ?? 0) + 1;
    }
    const stages = Object.keys(contagem);
    return {
      labels: stages.map((s) => STAGE_LABELS[s] ?? s),
      series: stages.map((s) => contagem[s]),
    };
  }, [leads]);

  const donutOptions: ApexOptions = {
    colors: [
      themeColor('brand-500'),
      themeColor('success-500'),
      themeColor('warning-500'),
      themeColor('error-500'),
      themeColor('blue-light-500'),
      themeColor('gray-400'),
      themeColor('brand-300'),
    ],
    chart: { fontFamily: 'Outfit, sans-serif', type: 'donut' },
    labels: distribuicao.labels,
    legend: { position: 'bottom', fontFamily: 'Outfit' },
    dataLabels: { enabled: false },
    stroke: { show: false },
  };

  // ─── Top 5 responsáveis por receita ─────────────────────────────────────────
  const topResponsaveis = useMemo(() => {
    const porResponsavel: Record<string, number> = {};
    for (const l of leads) {
      if (l.stage !== 'WON') continue;
      const nome = l.createdBy?.name ?? '—';
      porResponsavel[nome] = (porResponsavel[nome] ?? 0) + leadValor(l);
    }
    return Object.entries(porResponsavel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [leads]);

  const barOptions: ApexOptions = {
    colors: [themeColor('brand-500')],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: topResponsaveis.map(([nome]) => nome),
      labels: { formatter: (v) => formatBRL(Number(v)) },
    },
    grid: { yaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: (v: number) => formatBRL(v) } },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <ChartSkeleton height={280} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <KpiCard
          label="Leads criados"
          value={criados.length.toLocaleString('pt-BR')}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="Leads ganhos"
          value={ganhos.length.toLocaleString('pt-BR')}
          icon={
            <CheckLineIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="Receita total"
          value={formatBRL(receita)}
          icon={
            <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="Ticket médio"
          value={formatBRL(ticketMedio)}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
      </div>

      {/* Evolução de Leads */}
      <ChartCard
        title="Evolução de Leads"
        action={
          <div className="flex items-center gap-1.5">
            {RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  range === key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[650px] xl:min-w-full">
            <Chart
              options={lineOptions}
              series={[
                { name: 'Criados', data: evolucao.criados },
                { name: 'Ganhos', data: evolucao.ganhos },
              ]}
              type="line"
              height={280}
            />
          </div>
        </div>
      </ChartCard>

      {/* Donut + Top 5 */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <ChartCard title="Distribuição por etapa">
            {distribuicao.series.length > 0 ? (
              <Chart
                options={donutOptions}
                series={distribuicao.series}
                type="donut"
                height={280}
              />
            ) : (
              <p className="text-sm text-gray-400 py-10 text-center">
                Sem dados
              </p>
            )}
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <ChartCard title="Top 5 responsáveis por receita">
            {topResponsaveis.length > 0 ? (
              <Chart
                options={barOptions}
                series={[
                  {
                    name: 'Receita',
                    data: topResponsaveis.map(([, v]) => Math.round(v)),
                  },
                ]}
                type="bar"
                height={280}
              />
            ) : (
              <p className="text-sm text-gray-400 py-10 text-center">
                Sem dados
              </p>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
