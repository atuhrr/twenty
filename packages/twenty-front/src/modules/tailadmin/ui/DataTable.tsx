import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from './Table';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className="animate-pulse h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 ${col.className ?? ''}`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  className={`px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500`}
                >
                  <span style={{ gridColumn: `span ${columns.length}` }}>
                    {emptyMessage}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={(row as any).id ?? i}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`px-5 py-4 text-theme-sm ${col.className ?? ''}`}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
