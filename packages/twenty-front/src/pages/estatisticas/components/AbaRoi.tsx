// FORK: Voka CRM — T-7: aba ROI (baseada nos relatórios ROI existentes)
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import { useRoiRelatorios } from '@/analytics/hooks/useRoiRelatorio';
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
  formatBRL,
  MESES_CURTOS,
  themeColor,
} from '~/pages/estatisticas/estatisticasShared';

export function AbaRoi() {
  const { relatorios, loading } = useRoiRelatorios();

  const totais = useMemo(() => {
    const investimento = relatorios.reduce((s, r) => s + r.investimento, 0);
    const receita = relatorios.reduce((s, r) => s + r.receita, 0);
    const leadsGanhos = relatorios.reduce((s, r) => s + r.leadsGanhos, 0);
    const roi =
      investimento > 0 ? ((receita - investimento) / investimento) * 100 : 0;
    const custoPorLeadGanho = leadsGanhos > 0 ? investimento / leadsGanhos : 0;
    return { investimento, receita, roi, custoPorLeadGanho };
  }, [relatorios]);

  // Evolução mensal (investimento vs receita, agrupado pelo mês de criação)
  const evolucao = useMemo(() => {
    const porMes: Record<string, { investimento: number; receita: number }> =
      {};
    for (const r of relatorios) {
      const d = new Date(r.criadoEm);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      porMes[key] ??= { investimento: 0, receita: 0 };
      porMes[key].investimento += r.investimento;
      porMes[key].receita += r.receita;
    }
    const chaves = Object.keys(porMes).sort();
    return {
      categorias: chaves.map((k) => {
        const [ano, mes] = k.split('-');
        return `${MESES_CURTOS[Number(mes)]}/${ano.slice(2)}`;
      }),
      investimento: chaves.map((k) => Math.round(porMes[k].investimento)),
      receita: chaves.map((k) => Math.round(porMes[k].receita)),
    };
  }, [relatorios]);

  const evolucaoOptions: ApexOptions = {
    colors: [themeColor('warning-500'), themeColor('success-500')],
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

  if (relatorios.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
        Nenhum relatório de ROI cadastrado. Crie relatórios em Estatísticas →
        ROI.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <KpiCard
          label="Investimento"
          value={formatBRL(totais.investimento)}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="Receita gerada"
          value={formatBRL(totais.receita)}
          icon={
            <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="ROI"
          value={`${Math.round(totais.roi)}%`}
          icon={
            <CheckLineIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
        <KpiCard
          label="Custo por lead ganho"
          value={formatBRL(totais.custoPorLeadGanho)}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
        />
      </div>

      <ChartCard title="Evolução mensal — investimento vs receita">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[650px] xl:min-w-full">
            <Chart
              options={evolucaoOptions}
              series={[
                { name: 'Investimento', data: evolucao.investimento },
                { name: 'Receita', data: evolucao.receita },
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
