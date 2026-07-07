import { useNavigate } from 'react-router-dom';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import Badge from '@/tailadmin/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/tailadmin/ui/Table';

const STAGE_MAP: Record<string, { label: string; color: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' }> = {
  NEW:      { label: 'Leads Recebidos', color: 'info' },
  SCREENING:{ label: 'Triagem',         color: 'light' },
  MEETING:  { label: 'Reunião',         color: 'primary' },
  PROPOSAL: { label: 'Proposta',        color: 'warning' },
  CUSTOMER: { label: 'Negociação',      color: 'warning' },
  WON:      { label: 'Ganho',           color: 'success' },
  LOST:     { label: 'Perdido',         color: 'error' },
};

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];

export function VokaAtividadeRecente() {
  const navigate = useNavigate();

  const { records: leads, loading } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: {},
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 5,
    skip: false,
  } as any);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Atividade Recente
        </h3>
        <button
          onClick={() => navigate('/objects/opportunities')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Ver todos
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 items-center py-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-32 dark:bg-gray-700" />
                <div className="h-2 bg-gray-200 rounded w-20 dark:bg-gray-700" />
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded-full dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : (leads as any[])?.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">Nenhum lead encontrado.</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lead</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Etapa</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 text-right">Valor</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Criado</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(leads as any[]).map((lead: any, i: number) => {
                const stage = STAGE_MAP[lead.stage] ?? { label: lead.stage ?? '—', color: 'light' as const };
                const amount = (Number(lead.amount?.amountMicros ?? 0) || 0) / 1_000_000;
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    onClick={() => navigate(`/objects/opportunities/${lead.id}`)}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                          {initials(lead.name ?? 'Lead')}
                        </span>
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate max-w-[140px]">
                          {lead.name ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={stage.color}>{stage.label}</Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300 text-right font-medium">
                      {amount > 0 ? formatBRL(amount) : '—'}
                    </TableCell>
                    <TableCell className="py-3 text-gray-400 text-theme-xs">
                      {lead.createdAt ? timeAgo(lead.createdAt) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
