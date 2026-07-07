import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  CheckLineIcon,
  DollarLineIcon,
  GroupIcon,
} from '@/tailadmin/icons';
import Badge from '@/tailadmin/ui/Badge';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700" />
      <div className="mt-5 space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded dark:bg-gray-700" />
        <div className="h-6 w-16 bg-gray-200 rounded dark:bg-gray-700" />
      </div>
    </div>
  );
}

export function VokaKpiCards() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { records: leads, loading: leadsLoading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {},
    skip: false,
  } as any);

  const { records: wonLeads, loading: wonLoading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {
      and: [
        { stage: { eq: 'WON' } },
        { closeDate: { gte: startOfMonth } },
      ],
    },
    skip: false,
  } as any);

  const { records: tasks, loading: tasksLoading } = useFindManyRecords({
    objectNameSingular: 'task',
    filter: { status: { neq: 'CONCLUIDO' } },
    skip: false,
  } as any);

  const totalLeads = (leads as any[])?.length ?? 0;
  const totalWon = (wonLeads as any[])?.length ?? 0;
  const receita = (wonLeads as any[])?.reduce(
    (sum: number, l: any) => sum + ((Number(l.amount?.amountMicros ?? 0) || 0) / 1_000_000),
    0,
  ) ?? 0;
  const conversao =
    totalLeads > 0 ? Math.round((totalWon / totalLeads) * 100) : 0;
  const tarefasPendentes = (tasks as any[])?.length ?? 0;

  const loading = leadsLoading || wonLoading || tasksLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <Skeleton /><Skeleton /><Skeleton /><Skeleton />
      </div>
    );
  }

  const cards = [
    {
      label: 'Leads Totais',
      value: totalLeads.toLocaleString('pt-BR'),
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      badge: <Badge color="success" size="sm"><ArrowUpIcon />0%</Badge>,
    },
    {
      label: 'Receita do Mês',
      value: formatBRL(receita),
      icon: <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />,
      badge: <Badge color="success" size="sm"><ArrowUpIcon />0%</Badge>,
    },
    {
      label: 'Taxa de Conversão',
      value: `${conversao}%`,
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      badge:
        conversao >= 0 ? (
          <Badge color="success" size="sm"><ArrowUpIcon />{conversao}%</Badge>
        ) : (
          <Badge color="error" size="sm"><ArrowDownIcon />{Math.abs(conversao)}%</Badge>
        ),
    },
    {
      label: 'Tarefas Pendentes',
      value: tarefasPendentes.toLocaleString('pt-BR'),
      icon: <CheckLineIcon className="text-gray-800 size-6 dark:text-white/90" />,
      badge: <Badge color="warning" size="sm">{tarefasPendentes} abertas</Badge>,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {card.icon}
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {card.label}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {card.value}
              </h4>
            </div>
            {card.badge}
          </div>
        </div>
      ))}
    </div>
  );
}
