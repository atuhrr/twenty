import { useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { Dropdown } from '@/tailadmin/ui/Dropdown';
import { DropdownItem } from '@/tailadmin/ui/DropdownItem';
import { MoreDotIcon } from '@/tailadmin/icons';
import { BRAND } from '~/brand/brand.config';

const META_MENSAL = 50000;

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function VokaMetaMes() {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { records: wonLeads, loading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {
      and: [{ stage: { eq: 'WON' } }, { closeDate: { gte: startOfMonth } }],
    },
    skip: false,
  } as any);

  const receita = (wonLeads as any[])?.reduce(
    (sum: number, l: any) => sum + ((Number(l.amount?.amountMicros ?? 0) || 0) / 1_000_000),
    0,
  ) ?? 0;

  const pct = Math.min(Math.round((receita / META_MENSAL) * 100), 100);

  const options: ApexOptions = {
    colors: [BRAND.primary],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'radialBar',
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: '80%' },
        track: { background: '#E4E7EC', strokeWidth: '100%', margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: '36px',
            fontWeight: '600',
            offsetY: -40,
            color: '#1D2939',
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    },
    fill: { type: 'solid', colors: [BRAND.primary] },
    stroke: { lineCap: 'round' },
    labels: ['Progresso'],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Meta do Mês
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Meta definida para o mês
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
              <DropdownItem onItemClick={() => setIsOpen(false)} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                Ver mais
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative">
          {loading ? (
            <div className="h-[330px] flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 rounded-full w-48 h-48 dark:bg-gray-700" />
            </div>
          ) : (
            <div className="max-h-[330px]">
              <Chart options={options} series={[pct]} type="radialBar" height={330} />
            </div>
          )}
          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            {pct}% atingido
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Você arrecadou {formatBRL(receita)} este mês. Continue assim!
        </p>
      </div>
      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Meta</p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">{formatBRL(META_MENSAL)}</p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800" />
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Realizado</p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">{formatBRL(receita)}</p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800" />
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Restante</p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">{formatBRL(Math.max(META_MENSAL - receita, 0))}</p>
        </div>
      </div>
    </div>
  );
}
