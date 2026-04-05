"use client";

import { useState, useEffect, useMemo } from "react";
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import {
  Button,
  Card,
  Chip,
  Input,
  Modal,
  SearchField,
  Table,
  TextField,
  Label,
} from "@heroui/react";
import { Zap, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/app/components/ToastContext";
import { ACTION_BUTTON } from "@/app/components/dashboard/lib/action-styles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentUser {
  id?: string;
  email?: string;
  stageName?: string;
  fullName?: string;
}

interface PaymentArtist {
  id?: string;
  name?: string;
  email?: string;
}

interface Payment {
  id: string;
  artistId?: string;
  userId?: string;
  amount: number | string;
  method?: string;
  reference?: string;
  notes?: string;
  status: string;
  createdAt: string;
  artist?: PaymentArtist;
  user?: PaymentUser;
}

interface WisePayoutsViewProps {
  payments: Payment[];
  onRefresh: () => void;
}

interface ExecuteState {
  open: boolean;
  payment: Payment | null;
  email: string;
  name: string;
  currency: string;
  loading: boolean;
  result: null | { success: boolean; transferId?: number; error?: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getLabel = (p: Payment): string =>
  p.artist?.name ??
  p.user?.stageName ??
  p.user?.fullName ??
  p.user?.email ??
  "Unknown Artist";

const getEmail = (p: Payment): string =>
  p.artist?.email ?? p.user?.email ?? "";

/** Extract a Wise email from notes if the artist wrote "Wise: email@…" */
const extractWiseEmail = (notes?: string): string => {
  if (!notes) return "";
  const m = notes.match(/(?:wise[:\s]+)?([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
  return m?.[1] ?? "";
};

const formatAmount = (amount: number | string) =>
  `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WisePayoutsView({ payments, onRefresh }: WisePayoutsViewProps) {
  const { showToast } = useToast() as { showToast: (msg: string, type: string) => void };
  const [search, setSearch, debouncedSearch] = useDebouncedSearch();
  const [configured, setConfigured] = useState<null | boolean>(null);
  const [configNote, setConfigNote] = useState("");
  const [executeState, setExecuteState] = useState<ExecuteState>({
    open: false,
    payment: null,
    email: "",
    name: "",
    currency: "USD",
    loading: false,
    result: null,
  });

  // Check Wise configuration on mount
  useEffect(() => {
    fetch("/api/wise/payout")
      .then((r) => r.json())
      .then((data: { configured: boolean; sandbox?: boolean; reason?: string; error?: string }) => {
        setConfigured(data.configured);
        if (!data.configured) {
          setConfigNote(data.reason ?? data.error ?? "Not configured");
        } else if (data.sandbox) {
          setConfigNote("SANDBOX MODE – transfers will not move real money");
        }
      })
      .catch(() => {
        setConfigured(false);
        setConfigNote("Could not reach Wise API");
      });
  }, []);

  // Filter: only Wise payments
  const wisePayments = useMemo(
    () => payments.filter((p) => p.method?.toLowerCase() === "wise"),
    [payments],
  );

  const pending = useMemo(
    () => wisePayments.filter((p) => p.status === "pending"),
    [wisePayments],
  );

  const completed = useMemo(
    () => wisePayments.filter((p) => p.status !== "pending"),
    [wisePayments],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return wisePayments.filter(
      (p) =>
        getLabel(p).toLowerCase().includes(q) ||
        getEmail(p).toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q),
    );
  }, [wisePayments, debouncedSearch]);

  const openExecute = (payment: Payment) => {
    const guessedEmail = extractWiseEmail(payment.notes) || getEmail(payment);
    setExecuteState({
      open: true,
      payment,
      email: guessedEmail,
      name: getLabel(payment),
      currency: "USD",
      loading: false,
      result: null,
    });
  };

  const closeExecute = () =>
    setExecuteState((s) => ({ ...s, open: false, loading: false, result: null }));

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const { payment, email, name, currency } = executeState;
    if (!payment) return;

    setExecuteState((s) => ({ ...s, loading: true, result: null }));

    try {
      const res = await fetch("/api/wise/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          recipientEmail: email,
          recipientName: name,
          currency,
        }),
      });
      const data = await res.json() as { success?: boolean; transferId?: number; error?: string };

      if (res.ok && data.success) {
        setExecuteState((s) => ({
          ...s,
          loading: false,
          result: { success: true, transferId: data.transferId },
        }));
        showToast(`Wise transfer ${data.transferId} sent successfully`, "success");
        onRefresh();
      } else {
        setExecuteState((s) => ({
          ...s,
          loading: false,
          result: { success: false, error: data.error ?? "Unknown error" },
        }));
        showToast(data.error ?? "Wise payout failed", "error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setExecuteState((s) => ({
        ...s,
        loading: false,
        result: { success: false, error: msg },
      }));
      showToast(msg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Config Status Banner ─────────────────────── */}
      {configured !== null && (
        <Card
          variant="secondary"
          className={`border ${configured ? "border-success/20 bg-success/5" : "border-danger/20 bg-danger/5"}`}
        >
          <Card.Content className="flex items-center gap-3 py-3">
            {configured ? (
              <CheckCircle size={16} className="text-success shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-danger shrink-0" />
            )}
            <div className="flex-1">
              <span className="text-[11px] font-black uppercase tracking-widest">
                {configured ? "WISE CONNECTED" : "WISE NOT CONFIGURED"}
              </span>
              {configNote && (
                <span className="ml-3 text-[11px] text-foreground/50">{configNote}</span>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* ── Summary Stats ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Wise Payouts", value: pending.length, color: "warning" as const },
          { label: "Completed via Wise", value: completed.filter((p) => p.status === "completed").length, color: "success" as const },
          {
            label: "Total Pending Value",
            value: formatAmount(pending.reduce((s, p) => s + Number(p.amount || 0), 0)),
            color: "default" as const,
          },
        ].map((stat) => (
          <Card key={stat.label} variant="default" className="border-default/6">
            <Card.Content className="py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2">
                {stat.label}
              </p>
              <p className="text-[22px] font-black text-foreground">{stat.value}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <SearchField
          aria-label="Search Wise payments"
          value={search}
          onChange={setSearch}
          className="flex-1 max-w-sm"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by artist or reference..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* ── Execute Modal ─────────────────────────────── */}
      <Modal
        isOpen={executeState.open}
        onOpenChange={(open: boolean) => { if (!open) closeExecute(); }}
      >
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-0.5 bg-accent" />
              <h3 className="text-sm font-black tracking-widest m-0">SEND VIA WISE</h3>
            </div>

            {/* Payment summary */}
            {executeState.payment && (
              <div className="flex justify-between items-center p-5 bg-surface border border-border rounded-xl mb-5">
                <div>
                  <div className="text-[10px] text-muted font-black tracking-widest mb-1">RECIPIENT</div>
                  <div className="text-sm font-black">{getLabel(executeState.payment)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted font-black tracking-widest mb-1">AMOUNT</div>
                  <div className="text-2xl font-black text-accent">
                    {formatAmount(executeState.payment.amount)}
                  </div>
                </div>
              </div>
            )}

            {/* Artist notes / payout details */}
            {executeState.payment?.notes && (
              <div className="bg-surface border border-border p-4 rounded-xl mb-5">
                <div className="text-[10px] text-muted mb-2 font-black tracking-widest">ARTIST REQUEST NOTE</div>
                <div className="text-sm text-foreground/75 whitespace-pre-wrap leading-relaxed">
                  &quot;{executeState.payment.notes}&quot;
                </div>
              </div>
            )}

            {/* Result feedback */}
            {executeState.result && (
              <div
                className={`p-4 rounded-xl mb-5 border ${
                  executeState.result.success
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-danger/10 border-danger/30 text-danger"
                }`}
              >
                <p className="text-[11px] font-black tracking-widest">
                  {executeState.result.success
                    ? `✓ Transfer ${executeState.result.transferId} submitted to Wise`
                    : `✗ ${executeState.result.error}`}
                </p>
              </div>
            )}

            {!executeState.result?.success && (
              <form onSubmit={handleExecute} className="flex flex-col gap-4">
                <TextField
                  fullWidth
                  type="email"
                  value={executeState.email}
                  onChange={(v: string) => setExecuteState((s) => ({ ...s, email: v }))}
                  isRequired
                >
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">
                    Artist&apos;s Wise Account Email *
                  </Label>
                  <Input
                    aria-label="Wise account email"
                    placeholder="artist@email.com"
                    fullWidth
                  />
                </TextField>

                <TextField
                  fullWidth
                  value={executeState.name}
                  onChange={(v: string) => setExecuteState((s) => ({ ...s, name: v }))}
                  isRequired
                >
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">
                    Recipient Name *
                  </Label>
                  <Input
                    aria-label="Recipient name"
                    placeholder="Full name or stage name"
                    fullWidth
                  />
                </TextField>

                <TextField
                  fullWidth
                  value={executeState.currency}
                  onChange={(v: string) => setExecuteState((s) => ({ ...s, currency: v.toUpperCase() }))}
                >
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">
                    Target Currency
                  </Label>
                  <Input
                    aria-label="Currency"
                    placeholder="USD"
                    fullWidth
                  />
                </TextField>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isDisabled={executeState.loading || !executeState.email || !executeState.name || !configured}
                  >
                    <Zap size={14} />
                    {executeState.loading ? "SENDING..." : "EXECUTE PAYOUT"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onPress={closeExecute}
                    isDisabled={executeState.loading}
                  >
                    CANCEL
                  </Button>
                </div>

                {!configured && (
                  <p className="text-[11px] text-danger text-center font-semibold">
                    Wise is not configured. Set WISE_API_TOKEN in environment.
                  </p>
                )}
              </form>
            )}

            {executeState.result?.success && (
              <Button variant="primary" onPress={closeExecute} fullWidth>
                CLOSE
              </Button>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* ── Payments Table ───────────────────────────── */}
      <Table aria-label="Wise Payments">
        <Table.ScrollContainer>
          <Table.Content className="min-w-[860px]" selectionMode="none">
            <Table.Header>
              <Table.Column isRowHeader id="date">DATE</Table.Column>
              <Table.Column id="artist">ARTIST</Table.Column>
              <Table.Column id="amount">AMOUNT</Table.Column>
              <Table.Column id="notes">WISE DETAILS</Table.Column>
              <Table.Column id="reference">TRANSFER ID</Table.Column>
              <Table.Column id="status">STATUS</Table.Column>
              <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
            </Table.Header>
            <Table.Body
              items={filtered}
              renderEmptyState={() => (
                <div className="py-16 flex flex-col items-center gap-3">
                  <p className="text-muted text-xs font-black tracking-widest uppercase">
                    No Wise payment requests
                  </p>
                  <p className="text-foreground/35 text-[11px]">
                    Artists must select &quot;Wise&quot; as their withdrawal method
                  </p>
                </div>
              )}
            >
              {(p: Payment) => (
                <Table.Row key={p.id} id={p.id}>
                  <Table.Cell>
                    <span className="text-xs text-muted font-black">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black">{getLabel(p)}</span>
                      <span className="text-[10px] text-muted font-semibold">{getEmail(p)}</span>
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-sm font-black">{formatAmount(p.amount)}</span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-[11px] text-foreground/60 font-mono max-w-[180px] truncate block">
                      {p.notes
                        ? p.notes.length > 60
                          ? p.notes.slice(0, 60) + "…"
                          : p.notes
                        : "—"}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    {p.reference ? (
                      <span className="text-[11px] font-mono text-accent">{p.reference}</span>
                    ) : (
                      <span className="text-[11px] text-foreground/30">—</span>
                    )}
                  </Table.Cell>

                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={
                        p.status === "completed"
                          ? "success"
                          : p.status === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      <Chip.Label>{p.status.toUpperCase()}</Chip.Label>
                    </Chip>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "pending" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => openExecute(p)}
                        >
                          <Zap size={12} />
                          SEND
                        </Button>
                      )}
                      {p.reference?.startsWith("WISE-") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-foreground/50"
                          onPress={() => {
                            const id = p.reference?.replace("WISE-", "");
                            window.open(
                              `https://wise.com/transactions/${id}`,
                              "_blank",
                            );
                          }}
                        >
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
