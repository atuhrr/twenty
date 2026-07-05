import type { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}
interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <table className={`min-w-full ${className}`}>{children}</table>
);

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = '',
}) => <thead className={className}>{children}</thead>;

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = '',
}) => <tbody className={className}>{children}</tbody>;

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  onClick,
}) => (
  <tr className={className} onClick={onClick}>
    {children}
  </tr>
);

export const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = '',
}) => {
  const Tag = isHeader ? 'th' : 'td';
  return <Tag className={className}>{children}</Tag>;
};
