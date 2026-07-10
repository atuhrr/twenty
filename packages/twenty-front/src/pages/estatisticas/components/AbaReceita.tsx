// FORK: Zellate — F2 Financeiro: aba Receita (dados reais das faturas)
import { useQuery } from '@apollo/client/react';
import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';

import { RECEITA_STATS } from '@/financeiro/graphql/financeiroQueries';
import { DollarLineIcon } from '@/tailadmin/icons';
import {
  ChartCard,
  ChartSkeleton,
} from '~/pages/estatisticas/components/ChartCard';
import { KpiCard, KpiSkeleton } from '~/pages/estatisticas/components/KpiCard';
import {
  formatBRL,
  themeColor,
} from '~/pages/estatisticas/estatisticasShared';

type ReceitaStats = {
  recebidoPorMes: Array<{ mes: string; centavos: number }>;
  inadimplenciaPercent: number;
  ticketMedioCentavos: number;
  previsaoMesCentavos: number;
  topClientes: Array<{ nome: string; centavos: number }>;
};

const MESES_ROTULO = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const rotuloMes = (mes: string) => {
  const [ano, m] = mes.split('-');
  return `${MESES_ROTULO[Number(m) - 1]}/${ano.slice(2)}`;
};

export const AbaReceita = () => {
  const { data, loading } = useQuery<{ receitaStats: ReceitaStats }>(
    RECEITA_STATS,
    { fetchPolicy: 'cache-and-network' },
  );
  const stats = data?.receitaStats;

  const serieMensal = useMemo(
    () => stats?.recebidoPorMes ?? [],
    [stats],
  );

  const opcoesBarra: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, fontFamily: 'inherit' },
      colors: [themeColor('brand')],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: serieMensal.map((m) => rotuloMes(m.mes)),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (v: number) => formatBRL(v / 100),
        },
      },
      grid: { strokeDashArray: 4 },
      tooltip: {
        y: { formatter: (v: number) => formatBRL(v / 100) },
      },
    }),
    [serieMensal],
  );

  const opcoesClientes: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, fontFamily: 'inherit' },
      colors: [themeColor('success')],
      plotOptions: {
        bar: { horizontal: true, borderRadius: 6, barHeight: '55%' },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: (stats?.topClientes ?? []).map((c) => c.nome),
        labels: { formatter: (v: string) => formatBRL(Number(v) / 100) },
      },
      grid: { strokeDashArray: 4 },
      tooltip: {
        y: { formatter: (v: number) => formatBRL(v / 100) },
      },
    }),
    [stats],
  );

  if (loading && !stats) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const recebidoTotal = serieMensal.reduce((acc, m) => acc + m.centavos, 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<DollarLineIcon className="size-6" />}
          label="Recebido (12 meses)"
          value={formatBRL(recebidoTotal / 100)}
        />
        <KpiCard
          icon={<DollarLineIcon className="size-6" />}
          label="Previsão do mês"
          value={formatBRL((stats?.previsaoMesCentavos ?? 0) / 100)}
        />
        <KpiCard
          icon={<DollarLineIcon className="size-6" />}
          label="Ticket médio"
          value={formatBRL((stats?.ticketMedioCentavos ?? 0) / 100)}
        />
        <KpiCard
          icon={<DollarLineIcon className="size-6" />}
          label="Inadimplência"
          value={`${(stats?.inadimplenciaPercent ?? 0).toLocaleString('pt-BR')}%`}
        />
      </div>

      {/* Recebido por mês */}
      <ChartCard title="Recebido por mês (últimos 12 meses)">
        {serieMensal.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Nenhum recebimento ainda — as faturas pagas aparecem aqui.
          </p>
        ) : (
          <Chart
            type="bar"
            height={300}
            options={opcoesBarra}
            series={[
              {
                name: 'Recebido',
                data: serieMensal.map((m) => m.centavos),
              },
            ]}
          />
        )}
      </ChartCard>

      {/* Top clientes */}
      <ChartCard title="Top clientes por receita">
        {(stats?.topClientes ?? []).length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Sem dados de clientes pagantes ainda.
          </p>
        ) : (
          <Chart
            type="bar"
            height={280}
            options={opcoesClientes}
            series={[
              {
                name: 'Receita',
                data: (stats?.topClientes ?? []).map((c) => c.centavos),
              },
            ]}
          />
        )}
      </ChartCard>
    </div>
  );
};
