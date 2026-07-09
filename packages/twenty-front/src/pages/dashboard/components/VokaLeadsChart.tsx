import { useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { Dropdown } from '@/tailadmin/ui/Dropdown';
import { DropdownItem } from '@/tailadmin/ui/DropdownItem';
import { MoreDotIcon } from '@/tailadmin/icons';
import { BRAND } from '~/brand/brand.config';

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Leads Recebidos',
  SCREENING: 'Triagem',
  MEETING: 'Reunião',
  PROPOSAL: 'Proposta',
  CUSTOMER: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export function VokaLeadsChart() {
  const [isOpen, setIsOpen] = useState(false);

  const { records: leads, loading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {},
    skip: false,
  } as any);

  const counts: Record<string, number> = {};
  (leads as any[])?.forEach((l: any) => {
    const stage = l.stage ?? 'NEW';
    counts[stage] = (counts[stage] ?? 0) + 1;
  });

  const stages = Object.keys(counts).length > 0
    ? Object.keys(counts)
    : ['NEW', 'SCREENING', 'MEETING', 'PROPOSAL', 'CUSTOMER', 'WON'];

  const categories = stages.map((s) => STAGE_LABELS[s] ?? s);
  const data = stages.map((s) => counts[s] ?? 0);

  const options: ApexOptions = {
    colors: [BRAND.primary],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: 180,
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
    stroke: { show: true, width: 4, colors: ['transparent'] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val} leads` },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Leads por Etapa
        </h3>
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
      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded w-full h-32 dark:bg-gray-700" />
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[400px] xl:min-w-full pl-2">
            <Chart options={options} series={[{ name: 'Leads', data }]} type="bar" height={180} />
          </div>
        </div>
      )}
    </div>
  );
}
