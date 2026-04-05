"use client";

/**
 * Skeleton loading components for dashboard views.
 * Usage: <DashboardSkeleton variant="table" /> or <DashboardSkeleton variant="cards" />
 */

function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`}
      style={style}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <Bone className="mb-3 h-3 w-20" />
      <Bone className="mb-2 h-7 w-28" />
      <Bone className="h-2 w-36" />
    </div>
  );
}

function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Bone className={`h-4 ${i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24"}`} />
        </td>
      ))}
    </tr>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Bone className="h-4 w-32 mb-2" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="h-20 w-full mb-3" />
      <div className="flex gap-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <Bone className="h-3 w-32 mb-2" />
      <Bone className="h-3 w-48 mb-4" />
      <div className="flex items-end gap-1 h-[180px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <Bone
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

type SkeletonVariant = "stats" | "table" | "cards" | "chart" | "overview";

export default function DashboardSkeleton({
  variant = "table",
  rows = 6,
  cols = 5,
  cards = 6,
}: {
  variant?: SkeletonVariant;
  rows?: number;
  cols?: number;
  cards?: number;
}) {
  if (variant === "stats") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return <ChartSkeleton />;
  }

  if (variant === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "overview") {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-0">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <Bone className="h-4 w-40" />
          </div>
          <table className="w-full">
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={cols} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // table variant
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-0">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <Bone className="h-4 w-40" />
        <Bone className="h-8 w-32 rounded-lg" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-2.5">
                <Bone className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Bone, StatCardSkeleton, TableRowSkeleton, CardSkeleton, ChartSkeleton };
