"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Tag,
} from "lucide-react";
import { Button, TextField, TextArea, Label, Input } from "@heroui/react";

import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";

// ── Types ─────────────────────────────────────────────────────────────────────
type RequestStatus = "pending" | "open" | "in_progress" | "completed" | "closed";

type SupportRequest = {
  id: string;
  type?: string | null;
  details?: string | null;
  status?: RequestStatus | string | null;
  createdAt?: string | Date | null;
  release?: { name?: string | null } | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { stageName?: string; role?: string };
};

type SupportViewProps = {
  requests: SupportRequest[];
  selectedId?: string | null;
  currentUser?: { id?: string } | null;
  onNavigate: (id: string | null) => void;
  onRefresh?: () => Promise<void>;
  showToast?: (msg: string, type: string) => void;
  shared?: unknown;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const TICKET_TYPES: { value: string; label: string }[] = [
  { value: "general_support",     label: "General Support" },
  { value: "metadata_correction", label: "Metadata Correction" },
  { value: "technical_issue",     label: "Technical Issue" },
  { value: "earnings_billing",    label: "Earnings / Billing" },
  { value: "take_down",           label: "Take Down Request" },
  { value: "marketing_request",   label: "Marketing Request" },
];

function statusMeta(status: string): { label: string; color: string; bg: string; icon: React.ReactNode } {
  switch (status) {
    case "completed":
    case "closed":
      return { label: "Closed",       color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: <CheckCircle2 size={11} /> };
    case "in_progress":
      return { label: "In Progress",  color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: <Clock size={11} /> };
    case "open":
      return { label: "Open",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <AlertCircle size={11} /> };
    default:
      return { label: "Pending",      color: "var(--ds-text-muted)", bg: "var(--ds-item-bg)", icon: <Clock size={11} /> };
  }
}

function formatRequestType(type?: string | null) {
  return (type || "general_support").replace(/_/g, " ");
}

function formatRequestDate(value?: string | Date | null, mode: "short" | "datetime" = "short") {
  if (!value) return mode === "datetime" ? "Unknown time" : "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return mode === "datetime" ? "Unknown time" : "Unknown date";

  if (mode === "datetime") {
    return parsed.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Main SupportView ──────────────────────────────────────────────────────────
export function SupportView({ requests, selectedId, currentUser, onNavigate, onRefresh, showToast }: SupportViewProps) {
  const [isCreating, setIsCreating] = useState(false);

  const selectedRequest = requests.find((r) => r.id === selectedId);

  // ── Detail / chat view ──────────────────────────────────────────────────────
  if (selectedRequest) {
    const meta = statusMeta(selectedRequest.status || "pending");
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3"
      >
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className="ds-btn-ghost self-start"
        >
          <ArrowLeft size={13} />
          Back to tickets
        </button>

        <div className="ds-glass overflow-hidden">
          {/* Header */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-5"
            style={{ borderBottom: "1px solid var(--ds-divider)" }}
          >
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] ds-text-label">
                {formatRequestType(selectedRequest.type)}
              </p>
              <h3 className="text-[16px] font-black ds-text">
                {selectedRequest.release?.name || "Support Ticket"}
              </h3>
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.icon}
              {meta.label}
            </div>
          </div>

          {/* Chat */}
          <div style={{ height: 560 }}>
            <RequestComments
              request={selectedRequest}
              currentUser={currentUser}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Create form view ────────────────────────────────────────────────────────
  if (isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3"
      >
        <button
          type="button"
          onClick={() => setIsCreating(false)}
          className="ds-btn-ghost self-start"
        >
          <ArrowLeft size={13} />
          Cancel
        </button>

        <div className="ds-glass">
          <div className="p-5" style={{ borderBottom: "1px solid var(--ds-divider)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] ds-text-label">New Support Ticket</p>
            <p className="mt-1 text-[13px] font-bold ds-text">Tell us how we can help</p>
          </div>
          <CreateSupportForm
            onToast={showToast}
            onComplete={async () => {
              setIsCreating(false);
              onNavigate(null);
              if (onRefresh) await onRefresh();
            }}
          />
        </div>
      </motion.div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-black ds-text">Support</h2>
          <p className="text-[12px] ds-text-muted">{requests.length} ticket{requests.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={() => setIsCreating(true)}
          className="gap-1.5"
        >
          <Plus size={14} />
          New Ticket
        </Button>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="ds-glass flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: "var(--ds-item-bg)", border: "1px solid var(--ds-item-border)" }}
          >
            <MessageSquare size={22} style={{ color: "var(--ds-text-muted)" }} />
          </div>
          <p className="text-[13px] font-bold ds-text">No support tickets yet</p>
          <p className="text-[12px] ds-text-muted">Open a ticket and we&apos;ll get back to you shortly.</p>
          <Button variant="outline" size="sm" onPress={() => setIsCreating(true)}>
            <Plus size={13} />
            Open first ticket
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {requests.map((request, i) => {
              const meta = statusMeta(request.status || "pending");
              return (
                <motion.button
                  key={request.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                  type="button"
                  onClick={() => onNavigate(request.id)}
                  className="group ds-item flex w-full items-center gap-4 p-4 text-left"
                >
                  {/* Icon */}
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: "var(--ds-item-bg)", border: "1px solid var(--ds-item-border)" }}
                  >
                    <MessageSquare size={15} style={{ color: "var(--ds-text-muted)" }} />
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold ds-text">
                      {request.release?.name || "Support Ticket"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide"
                        style={{ color: "var(--accent, #e44ccf)" }}
                      >
                        <Tag size={9} />
                        {formatRequestType(request.type)}
                      </span>
                      <span className="ds-text-faint text-[10px]">·</span>
                      <span className="truncate text-[11px] ds-text-muted max-w-[320px]">
                        {request.details || "No details provided."}
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] ds-text-faint">
                      {formatRequestDate(request.createdAt)}
                    </span>
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.icon}
                      {meta.label}
                    </div>
                  </div>

                  <ChevronRight size={14} className="shrink-0 ds-text-faint transition-colors group-hover:ds-text-muted" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Create Form ───────────────────────────────────────────────────────────────
function CreateSupportForm({
  onComplete,
  onToast,
}: {
  onComplete: () => Promise<void>;
  onToast?: (msg: string, type: string) => void;
}) {
  const [type, setType] = useState("general_support");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || sending) return;

    setSending(true);
    try {
      await dashboardRequestJson("/api/artist/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, details }),
        context: "create support request",
        retry: false,
      });
      onToast?.("Support ticket created.", "success");
      await onComplete();
    } catch (err) {
      const message = getDashboardErrorMessage(err, "An error occurred");
      onToast?.(message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
      {/* Type selector */}
      <div className="flex flex-col gap-2">
        <label
          className="text-[11px] font-black uppercase tracking-[0.14em] ds-text-label"
          htmlFor="ticket-type"
        >
          Request Type
        </label>
        <div className="relative">
          <select
            id="ticket-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-[13px] font-semibold outline-none transition-all"
            style={{
              background: "var(--ds-item-bg)",
              border: "1px solid var(--ds-item-border)",
              color: "var(--ds-text)",
            }}
          >
            {TICKET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronRight
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 ds-text-muted"
          />
        </div>
      </div>

      {/* Details textarea */}
      <TextField
        name="details"
        value={details}
        onChange={setDetails}
        isRequired
        className="w-full"
      >
        <Label className="text-[11px] font-black uppercase tracking-[0.14em] ds-text-label">
          Details & Message
        </Label>
        <TextArea
          placeholder="Describe your issue in detail — include any relevant release names, dates, or steps to reproduce..."
          rows={6}
          style={{ resize: "none" }}
          className="mt-1.5 w-full"
        />
      </TextField>

      <Button
        type="submit"
        variant="primary"
        isDisabled={sending || !details.trim()}
        isPending={sending}
        fullWidth
        size="lg"
        className="mt-1"
      >
        {sending ? "Submitting…" : "Open Ticket"}
      </Button>
    </form>
  );
}

// ── Chat / Comments ───────────────────────────────────────────────────────────
function RequestComments({
  request,
  currentUser,
}: {
  request: SupportRequest;
  currentUser?: { id?: string } | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await dashboardRequestJson(`/api/requests/${request.id}/comments`, {
        context: "support comments",
      });
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [request.id]);

  useEffect(() => { void fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      const data = await dashboardRequestJson(`/api/requests/${request.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        context: "post support comment",
        retry: false,
      });
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <DashboardLoader label="Loading conversation" subLabel="Fetching support thread messages…" />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
      >
        {/* Timestamp pill */}
        <div className="mx-auto my-2 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold ds-text-faint"
            style={{ background: "var(--ds-item-bg)", border: "1px solid var(--ds-item-border)" }}
          >
            {formatRequestDate(request.createdAt, "datetime")}
          </span>
        </div>

        {/* Initial message bubble */}
        <div className="flex justify-end">
          <div
            className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3"
            style={{ background: "var(--accent, #e44ccf)", color: "#fff" }}
          >
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.95)" }}>
              {request.details || "No details provided."}
            </p>
            <p className="mt-2 text-right text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
              You (initial)
            </p>
          </div>
        </div>

        {/* Replies */}
        <AnimatePresence initial={false}>
          {comments.map((comment) => {
            const isMe = comment.userId === currentUser?.id;
            const isStaff = comment.user.role === "admin" || comment.user.role === "a&r";

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 ${isMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                  style={{
                    background: isMe ? "var(--ds-glass-bg-hover)" : "var(--ds-item-bg)",
                    border: "1px solid var(--ds-item-border)",
                  }}
                >
                  {!isMe && (
                    <p
                      className="mb-1.5 text-[11px] font-black tracking-wide"
                      style={{ color: isStaff ? "var(--accent, #e44ccf)" : "var(--ds-text-muted)" }}
                    >
                      {comment.user.stageName || "Support"}{isStaff ? " · Staff" : ""}
                    </p>
                  )}
                  <p className="text-[13px] leading-relaxed ds-text-sub">{comment.content}</p>
                  <p
                    className={`mt-1.5 text-[10px] ds-text-faint ${isMe ? "text-right" : "text-left"}`}
                  >
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-3 p-4"
        style={{ borderTop: "1px solid var(--ds-divider)", background: "var(--ds-glass-bg)" }}
      >
        <TextField
          name="message"
          value={newComment}
          onChange={setNewComment}
          className="flex-1"
          aria-label="Message"
        >
          <Input placeholder="Type your message…" className="w-full" />
        </TextField>
        <Button
          type="submit"
          variant="primary"
          isDisabled={sending || !newComment.trim()}
          isPending={sending}
          isIconOnly
          size="md"
          aria-label="Send"
        >
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
