"use client";

import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", children, ...rest }: TableProps) {
  return (
    <div className={`glass-card p-0 ${className}`} {...rest}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse admin-responsive-table">
          {children}
        </table>
      </div>
    </div>
  );
}

type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHead({ children, ...rest }: TableHeadProps) {
  return <thead {...rest}>{children}</thead>;
}

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  hoverable?: boolean;
};

export function TableRow({ hoverable = true, className = "", children, ...rest }: TableRowProps) {
  return (
    <tr
      className={`${hoverable ? "hover:bg-white/[0.03] transition-colors" : ""} ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  label?: string;
};

export function TableCell({ label, className = "", children, ...rest }: TableCellProps) {
  return (
    <td className={`dash-td ${className}`} data-label={label} {...rest}>
      {children}
    </td>
  );
}

type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TableHeaderCell({ className = "", children, ...rest }: TableHeaderCellProps) {
  return (
    <th className={`dash-th ${className}`} {...rest}>
      {children}
    </th>
  );
}
