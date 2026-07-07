// FORK: Voka CRM — T-7: aba Equipe (ranking de responsáveis + comparativo)
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import {
  ChartCard,
  ChartSkeleton,
} from '~/pages/estatisticas/components/ChartCard';
import {
  formatBRL,
  leadValor,
  themeColor,
  type LeadRecord,
} from '~/pages/estatisticas/estatisticasShared';

interface AbaEquipeProps {
  leads: LeadRecord[];
  loading: boolean;
}

type LinhaEquipe = {
  nome: string;
  ativos: number;
  ganhos: number;
  receita: number;
  taxa: number;
};

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-success-50 text-success-700',
  'bg-warning-50 text-warning-700',
  'bg-blue-light-50 text-blue-light-700',
  'bg-error-50 text-error-700',
];

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

export function AbaEquipe({ leads, loading }: AbaEquipeProps) {
  const ranking = useMemo<LinhaEquipe[]>(() => {
    const porNome: Record<
      string,
      { ativos: number; ganhos: number; receita: number; total: number }
    > = {};
    for (const l of leads) {
      const nome = l.createdBy?.name ?? '—';
      porNome[nome] ??= { ativos: 0, ganhos: 0, receita: 0, total: 0 };
      porNome[nome].total += 1;
      if (l.stage === 'WON') {
        porNome[nome].ganhos += 1;
        porNome[nome].receita += leadValor(l);
      } else if (l.stage !== 'LOST') {
        porNome[nome].ativos += 1;
      }
    }
    return Object.entries(porNome)
      .map(([nome, d]) => ({
        nome,
        ativos: d.ativos,
        ganhos: d.ganhos,
        receita: d.receita,
        taxa: d.total > 0 ? Math.round((d.ganhos / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.receita - a.receita);
  }, [leads]);

  const comparativo = ranking.slice(0, 8);

  const groupedOptions: ApexOptions = {
    colors: [themeColor('brand-500'), themeColor('success-500')],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: comparativo.map((r) => r.nome),
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

  if (loading) return <ChartSkeleton height={320} />;

  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
        Sem dados de equipe
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ranking */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ranking de responsáveis
          </h3>
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar mt-4">
          <table className="min-w-full">
            <thead>
              <tr className="border-y border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                  Responsável
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Leads ativos
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Ganhos
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Receita
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                  Taxa
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr
                  key={r.nome}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                      >
                        {iniciais(r.nome)}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {r.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {r.ativos}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-success-600">
                    {r.ganhos}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium text-gray-800 dark:text-white/90">
                    {formatBRL(r.receita)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-gray-500 dark:text-gray-400">
                    {r.taxa}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparativo */}
      <ChartCard title="Comparativo entre responsáveis">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[650px] xl:min-w-full">
            <Chart
              options={groupedOptions}
              series={[
                {
                  name: 'Leads ativos',
                  data: comparativo.map((r) => r.ativos),
                },
                { name: 'Ganhos', data: comparativo.map((r) => r.ganhos) },
              ]}
              type="bar"
              height={280}
            />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
