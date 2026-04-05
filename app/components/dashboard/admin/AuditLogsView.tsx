"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Clock, ChevronDown, ChevronUp, RefreshCw, Shield } from "lucide-react";
import { Button, Chip, SearchField, Table } from "@heroui/react";
import { useToast } from "@/app/components/ToastContext";
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import type { OffsetPaginationMeta } from "@/lib/api-pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogUser {
  id: string;
  email: string | null;
  stageName: string | null;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: AuditLogUser;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: OffsetPaginationMeta;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "login", label: "Login" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "artist", label: "Artist" },
  { value: "payment", label: "Payment" },
  { value: "contract", label: "Contract" },
  { value: "demo", label: "Demo" },
  { value: "user", label: "User" },
  { value: "earning", label: "Earning" },
  { value: "request", label: "Request" },
  { value: "release", label: "Release" },
  { value: "announcement", label: "Announcement" },
  { value: "webhook", label: "Webhook" },
  { value: "settings", label: "Settings" },
];

const ACTION_COLOR_MAP: Record<string, "success" | "accent" | "danger" | "warning" | "default"> = {
  create: "success",
  update: "accent",
  delete: "danger",
  approve: "success",
  reject: "danger",
  login: "default",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogsView() {
  const { showToast } = useToast() as any;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<OffsetPaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Expanded details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "50");
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      if (searchText.trim()) params.set("search", searchText.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const data = await dashboardRequestJson<AuditLogsResponse>(
        `/api/admin/audit-logs?${params.toString()}`,
        { context: "audit logs" },
      );

      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to load audit logs"), "error");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, searchText, startDate, endDate, showToast]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const handleFilterApply = () => {
    setPage(1);
    fetchLogs(1);
  };

  const activeFilterCount = [actionFilter, entityFilter, searchText, startDate, endDate].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase text-foreground">
            Audit Logs
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            Track admin actions across the platform.
            {pagination && ` ${pagination.total} entries.`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={() => fetchLogs(page)} isDisabled={loading}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          REFRESH
        </Button>
      </div>

      {/* Compact inline filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          aria-label="Search audit logs"
          value={searchText}
          onChange={setSearchText}
          onSubmit={handleFilterApply}
          className="flex-1 min-w-[180px] max-w-xs"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); }}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-[11px] font-semibold text-foreground outline-none"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); }}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-[11px] font-semibold text-foreground outline-none"
        >
          {ENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-[11px] font-semibold text-foreground outline-none"
        />
        <span className="text-[10px] text-muted font-bold">—</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-[11px] font-semibold text-foreground outline-none"
        />
        <Button variant="primary" size="sm" onPress={handleFilterApply}>
          <Search size={12} /> FILTER
        </Button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => { setActionFilter(""); setEntityFilter(""); setSearchText(""); setStartDate(""); setEndDate(""); setPage(1); }}
            className="text-[10px] font-bold text-muted hover:text-foreground transition-colors"
          >
            CLEAR ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Table */}
      {loading && logs.length === 0 ? (
        <DashboardLoader label="AUDIT LOGS" subLabel="Loading audit trail..." />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-full border border-dashed border-border bg-surface flex items-center justify-center">
            <Shield size={20} className="text-muted" />
          </div>
          <p className="text-xs font-bold text-muted tracking-widest uppercase">
            No audit log entries found
          </p>
          <p className="text-[10px] text-muted">
            Actions will appear here as admins interact with the platform.
          </p>
        </div>
      ) : (
        <div className="relative">
          {loading && logs.length > 0 && <DashboardLoader overlay label="LOADING" />}

          <Table aria-label="Audit Logs">
            <Table.ScrollContainer>
              <Table.Content className="min-w-[800px]">
                <Table.Header>
                  <Table.Column isRowHeader id="timestamp" className="w-[120px]">TIME</Table.Column>
                  <Table.Column id="user" className="w-[160px]">USER</Table.Column>
                  <Table.Column id="action" className="w-[100px]">ACTION</Table.Column>
                  <Table.Column id="entity" className="w-[100px]">ENTITY</Table.Column>
                  <Table.Column id="entityId" className="w-[140px]">ID</Table.Column>
                  <Table.Column id="details">DETAILS</Table.Column>
                </Table.Header>
                <Table.Body>
                  {logs.map((log) => (
                    <Table.Row key={log.id} id={log.id}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {formatTimestamp(log.createdAt)}
                          </span>
                          <span className="text-[9px] text-muted">{timeAgo(log.createdAt)}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground truncate max-w-[140px]">
                            {log.user.stageName || log.user.email || log.userId.slice(0, 8)}
                          </span>
                          {log.user.stageName && log.user.email && (
                            <span className="text-[9px] text-muted truncate max-w-[140px]">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={ACTION_COLOR_MAP[log.action] || "default"}
                        >
                          <Chip.Label>{log.action.toUpperCase()}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                          {log.entity}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-[10px] text-muted">
                          {log.entityId ? truncate(log.entityId, 12) : "\u2014"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {log.details ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId((prev) => (prev === log.id ? null : log.id))}
                            className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-foreground text-left"
                          >
                            <span className={expandedId === log.id ? "" : "truncate max-w-[280px] block"}>
                              {expandedId === log.id ? log.details : truncate(log.details, 60)}
                            </span>
                            {log.details.length > 60 && (
                              expandedId === log.id
                                ? <ChevronUp size={11} className="shrink-0" />
                                : <ChevronDown size={11} className="shrink-0" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted/30">{"\u2014"}</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--ds-divider)] px-4 py-3 mt-1">
              <span className="text-[10px] font-bold text-muted tracking-wider">
                PAGE {pagination.page} OF {pagination.pages} · {pagination.total} ENTRIES
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={pagination.page <= 1}
                  onPress={() => setPage(Math.max(1, pagination.page - 1))}
                >
                  PREV
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={pagination.page >= pagination.pages}
                  onPress={() => setPage(pagination.page + 1)}
                >
                  NEXT
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
