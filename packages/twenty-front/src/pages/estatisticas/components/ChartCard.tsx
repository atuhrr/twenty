// FORK: Voka CRM — T-7: card de gráfico no padrão TailAdmin (MonthlySalesChart)
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, action, children }: ChartCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-xl w-full dark:bg-gray-700"
      style={{ height }}
    />
  );
}
