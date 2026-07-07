// FORK: Voka CRM — T-7: KPI card no padrão TailAdmin (igual VokaKpiCards do T-2)
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  badge?: ReactNode;
}

export function KpiCard({ label, value, icon, badge }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {icon}
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
        </div>
        {badge}
      </div>
    </div>
  );
}

export function KpiSkeleton() {
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
