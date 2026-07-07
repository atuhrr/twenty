// FORK: Voka CRM — T-7: aba Conversão (ganho/perda por mês + perdas por etapa)
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import type { GanhoPerdaStats } from '@/analytics/hooks/useAnaliseGanhoPerda';
import {
  ChartCard,
  ChartSkeleton,
} from '~/pages/estatisticas/components/ChartCard';
import {
  MESES_CURTOS,
  startOfDay,
  themeColor,
  type LeadRecord,
} from '~/pages/estatisticas/estatisticasShared';

interface AbaConversaoProps {
  leads: LeadRecord[];
  stats: GanhoPerdaStats | null;
  loading: boolean;
}

export function AbaConversao({ leads, stats, loading }: AbaConversaoProps) {
  // Ganhos vs perdidos por mês (últimos 12 meses), a partir dos leads reais
  const porMes = useMemo(() => {
    const hoje = startOfDay(new Date());
    const buckets: { label: string; inicio: Date; fim: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
      buckets.push({ label: MESES_CURTOS[inicio.getMonth()], inicio, fim });
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
      ganhos: buckets.map(
        (b) =>
          leads.filter(
            (l) => l.stage === 'WON' && noBucket(l.closeDate ?? l.createdAt, b),
          ).length,
      ),
      perdidos: buckets.map(
        (b) =>
          leads.filter(
            (l) =>
              l.stage === 'LOST' && noBucket(l.closeDate ?? l.createdAt, b),
          ).length,
      ),
    };
  }, [leads]);

  const stackedOptions: ApexOptions = {
    colors: [themeColor('success-500'), themeColor('error-500')],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '39%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: porMes.categorias,
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
  };

  const perdasPorEtapa = useMemo(() => {
    const etapas = stats?.porEtapa ?? [];
    const totalPerdido = etapas.reduce((s, e) => s + e.perdidoNaEtapa.leads, 0);
    return {
      linhas: etapas
        .filter((e) => e.perdidoNaEtapa.leads > 0)
        .map((e) => ({
          etapa: e.etapaNome,
          qtd: e.perdidoNaEtapa.leads,
          pct:
            totalPerdido > 0
              ? Math.round((e.perdidoNaEtapa.leads / totalPerdido) * 100)
              : 0,
        })),
      total: totalPerdido,
    };
  }, [stats]);

  if (loading) return <ChartSkeleton height={320} />;

  return (
    <div className="space-y-6">
      <ChartCard title="Ganhos e perdas por mês">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[650px] xl:min-w-full">
            <Chart
              options={stackedOptions}
              series={[
                { name: 'Ganhos', data: porMes.ganhos },
                { name: 'Perdidos', data: porMes.perdidos },
              ]}
              type="bar"
              height={280}
            />
          </div>
        </div>
      </ChartCard>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Perdas por etapa
          </h3>
        </div>
        {perdasPorEtapa.linhas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">
            Nenhuma perda registrada no período
          </p>
        ) : (
          <table className="min-w-full mt-4">
            <thead>
              <tr className="border-y border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                  Etapa
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Leads perdidos
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  % do total
                </th>
              </tr>
            </thead>
            <tbody>
              {perdasPorEtapa.linhas.map((linha) => (
                <tr
                  key={linha.etapa}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-white/90">
                    {linha.etapa}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-error-500">
                    {linha.qtd}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {linha.pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
