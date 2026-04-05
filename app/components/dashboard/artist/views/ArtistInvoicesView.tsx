"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { Download, ExternalLink, FileText, RefreshCw } from "lucide-react";

import DashboardEmptyState from "@/app/components/dashboard/primitives/DashboardEmptyState";
import { dashboardRequestJson } from "@/app/components/dashboard/lib/dashboard-request";

type ArtistInvoice = {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  submittedAt: string | null;
  paymentDate: string | null;
  hasPdf: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "border-default/20 bg-default/8 text-muted" },
  pending: { label: "Pending", color: "border-amber-500/25 bg-amber-500/8 text-amber-400" },
  viewed: { label: "Viewed", color: "border-blue-500/25 bg-blue-500/8 text-blue-400" },
  completed: { label: "Completed", color: "border-green-500/25 bg-green-500/8 text-green-400" },
  paid: { label: "Paid", color: "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" },
  overdue: { label: "Overdue", color: "border-red-500/25 bg-red-500/8 text-red-400" },
  cancelled: { label: "Cancelled", color: "border-default/20 bg-default/8 text-muted" },
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ArtistInvoicesView() {
  const [invoices, setInvoices] = useState<ArtistInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await dashboardRequestJson("/api/artist/invoices", {
        context: "load invoices",
      })) as { invoices?: ArtistInvoice[] };
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownloadPdf = useCallback((invoiceId: string) => {
    window.open(`/api/artist/invoices/${invoiceId}/pdf`, "_blank", "noopener,noreferrer");
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-5 py-8 text-center">
        <p className="text-[13px] text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-3" onPress={fetchInvoices}>
          Retry
        </Button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <DashboardEmptyState
        title="No invoices yet"
        description="When an invoice is sent to you, it will appear here. You can view and download submitted invoices."
        icon={<FileText size={40} className="opacity-15" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: invoices.length },
          { label: "Pending", value: invoices.filter((i) => i.status === "pending" || i.status === "viewed").length },
          { label: "Completed", value: invoices.filter((i) => i.status === "completed" || i.status === "paid").length },
          {
            label: "Total Amount",
            value: formatCurrency(
              invoices
                .filter((i) => i.status === "completed" || i.status === "paid")
                .reduce((sum, i) => sum + i.amount, 0),
              invoices[0]?.currency || "USD",
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">
              {stat.label}
            </p>
            <p className="mt-1 text-[18px] font-black text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => {
          const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;

          return (
            <Card key={invoice.id} variant="default" className="ds-glass">
              <Card.Content className="flex flex-col gap-4 p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-[14px] font-black tracking-tight text-foreground">
                      {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                    </h4>
                    {invoice.description && (
                      <p className="mt-1 truncate text-[11px] text-muted">
                        {invoice.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded border px-2 py-1 text-[8px] font-black uppercase tracking-widest ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Amount */}
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Amount
                  </p>
                  <p className="mt-0.5 text-[20px] font-black text-(--color-accent)">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <p className="text-[9px] text-muted">{invoice.currency}</p>
                </div>

                {/* Dates */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black tracking-wide text-muted">Created</span>
                    <span className="text-foreground">{formatDate(invoice.createdAt)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black tracking-wide text-muted">Due</span>
                      <span className="text-foreground">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  {invoice.submittedAt && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black tracking-wide text-muted">Submitted</span>
                      <span className="text-foreground">{formatDate(invoice.submittedAt)}</span>
                    </div>
                  )}
                  {invoice.paymentDate && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black tracking-wide text-muted">Paid</span>
                      <span className="text-green-400">{formatDate(invoice.paymentDate)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-default/8 pt-3">
                  {invoice.hasPdf && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onPress={() => handleDownloadPdf(invoice.id)}
                    >
                      <Download size={14} />
                      Download PDF
                    </Button>
                  )}
                  {(invoice.status === "pending" || invoice.status === "viewed") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onPress={() => {
                        // Navigate to the invoice form link — but since artists
                        // access via token link (email), we just show a hint
                      }}
                      isDisabled
                    >
                      <ExternalLink size={14} />
                      Awaiting Submission
                    </Button>
                  )}
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
