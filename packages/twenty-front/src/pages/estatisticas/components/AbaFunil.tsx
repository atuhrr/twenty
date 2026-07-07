// FORK: Voka CRM — T-7: aba Funil (conversão entre etapas + tabela)
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import type { GanhoPerdaStats } from '@/analytics/hooks/useAnaliseGanhoPerda';
import {
  ChartCard,
  ChartSkeleton,
} from '~/pages/estatisticas/components/ChartCard';
import { formatBRL, themeColor } from '~/pages/estatisticas/estatisticasShared';

interface AbaFunilProps {
  stats: GanhoPerdaStats | null;
  loading: boolean;
}

export function AbaFunil({ stats, loading }: AbaFunilProps) {
  if (loading) return <ChartSkeleton height={320} />;

  const etapas = stats?.porEtapa ?? [];

  if (etapas.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
        Sem dados de funil para o período selecionado
      </div>
    );
  }

  const funnelOptions: ApexOptions = {
    colors: [themeColor('brand-500')],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        barHeight: '70%',
        isFunnel: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opt) =>
        `${etapas[opt?.dataPointIndex ?? -1]?.etapaNome ?? ''}: ${val}`,
      dropShadow: { enabled: false },
    },
    xaxis: { categories: etapas.map((e) => e.etapaNome) },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v} leads` } },
  };

  return (
    <div className="space-y-6">
      <ChartCard title="Funil de conversão entre etapas">
        <Chart
          options={funnelOptions}
          series={[
            { name: 'Leads', data: etapas.map((e) => e.entrouNaEtapa.leads) },
          ]}
          type="bar"
          height={Math.max(240, etapas.length * 56)}
        />
      </ChartCard>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                  Etapa
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Entraram
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Na etapa
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Perdidos
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Taxa de conversão
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Valor total
                </th>
              </tr>
            </thead>
            <tbody>
              {etapas.map((e) => (
                <tr
                  key={e.etapaNome}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-white/90">
                    {e.etapaNome}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {e.entrouNaEtapa.leads}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {e.dentroDaEtapa.leads}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-error-500">
                    {e.perdidoNaEtapa.leads}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium text-gray-800 dark:text-white/90">
                    {Math.round(e.taxaConversao)}%
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {formatBRL(e.dentroDaEtapa.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
