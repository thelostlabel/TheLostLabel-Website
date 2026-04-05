"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import Link from "next/link";
import { Table, Chip, Button, SearchField, Tabs, Pagination, Tooltip, Modal } from "@heroui/react";
import { PlayCircle, Clock, CheckCircle, XCircle, Search, Trash2, Eye, History, StickyNote } from "lucide-react";
import DemoVersionHistory from "@/app/components/dashboard/primitives/DemoVersionHistory";
import { dashboardRequestJson } from "@/app/components/dashboard/lib/dashboard-request";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DemoStatus =
  | "approved"
  | "rejected"
  | "reviewing"
  | "contract_sent"
  | "pending"
  | (string & {}); // allow arbitrary status strings from the API

interface DemoArtist {
  stageName?: string;
  email?: string;
}

interface Demo {
  id: string;
  title?: string;
  genre?: string;
  status?: DemoStatus;
  createdAt: string | number | Date;
  reviewedBy?: string;
  rejectionReason?: string;
  artist?: DemoArtist;
}

type ChipColor = "success" | "danger" | "warning" | "default";

interface SubmissionsViewProps {
  demos: Demo[];
  onDelete: (id: string) => void;
  canDelete?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const STATUS_COLOR_MAP: Record<string, ChipColor> = {
  approved: "success",
  rejected: "danger",
  reviewing: "warning",
  contract_sent: "default",
  pending: "default",
};

const PREFERRED_ORDER: string[] = ["all", "pending", "reviewing", "approved", "rejected", "contract_sent"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubmissionsView({ demos, onDelete, canDelete = false }: SubmissionsViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
  const [page, setPage] = useState<number>(1);
  const [versionHistoryDemoId, setVersionHistoryDemoId] = useState<string | null>(null);
  const [notesDemoId, setNotesDemoId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [rejectionText, setRejectionText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const openNotes = useCallback(async (demoId: string) => {
    setNotesDemoId(demoId);
    setNotesLoading(true);
    const demo = demos.find((d) => d.id === demoId);
    setRejectionText(demo?.rejectionReason || "");
    try {
      const data = (await dashboardRequestJson(`/api/admin/demos/${demoId}/notes`, {
        context: "load demo notes",
      })) as { notes?: string; rejectionReason?: string };
      setNotesText(data.notes || "");
      if (data.rejectionReason !== undefined) setRejectionText(data.rejectionReason);
    } catch {
      setNotesText("");
    } finally {
      setNotesLoading(false);
    }
  }, [demos]);

  const saveNotes = useCallback(async () => {
    if (!notesDemoId) return;
    setNotesSaving(true);
    try {
      await dashboardRequestJson(`/api/admin/demos/${notesDemoId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText, rejectionReason: rejectionText }),
        context: "save demo notes",
      });
      setNotesDemoId(null);
    } catch {
      // silently fail
    } finally {
      setNotesSaving(false);
    }
  }, [notesDemoId, notesText, rejectionText]);

  const availableTabs = useMemo<string[]>(() => {
    const demoStatuses = Array.from(
      new Set(demos.map((d) => String(d.status || "").toLowerCase()).filter(Boolean))
    );
    const orderedKnown = PREFERRED_ORDER.filter((t) => t === "all" || demoStatuses.includes(t));
    const extra = demoStatuses.filter((s) => !PREFERRED_ORDER.includes(s)).sort();
    return [...orderedKnown, ...extra];
  }, [demos]);

  const selectedTab: string = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] || "all";

  const filteredDemos = useMemo<Demo[]>(() => {
    return demos.filter((demo) => {
      const normalizedStatus = String(demo.status || "").toLowerCase();
      const matchesTab = selectedTab === "all" || normalizedStatus === selectedTab;
      const matchesSearch =
        demo.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        demo.artist?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesTab && (matchesSearch ?? false);
    });
  }, [demos, debouncedSearch, selectedTab]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedTab]);

  const totalPages: number = Math.max(1, Math.ceil(filteredDemos.length / PAGE_SIZE));
  const pagedDemos: Demo[] = filteredDemos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Build page numbers with ellipsis
  const pageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalPages, page]);
    for (let d = -2; d <= 2; d++) { const p = page + d; if (p > 1 && p < totalPages) pages.add(p); }
    return Array.from(pages).sort((a, b) => a - b);
  }, [totalPages, page]);

  const formatDate = useCallback((value: string | number | Date): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }, []);

  const getChipColor = (status: DemoStatus | undefined): ChipColor =>
    STATUS_COLOR_MAP[status ?? ""] ?? "default";

  const getStatusIcon = (status: DemoStatus | undefined): React.ReactElement => {
    if (status === "approved") return <CheckCircle size={10} />;
    if (status === "rejected") return <XCircle size={10} />;
    return <Clock size={10} />;
  };

  return (
    <div className="submissions-view flex flex-col gap-4">
      {/* Toolbar */}
      <div className="submissions-toolbar flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="submissions-tabs-scroll">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="submissions-tabs"
            variant="secondary"
          >
            <Tabs.ListContainer className="submissions-tabs-container">
              <Tabs.List aria-label="Filter submissions" className="submissions-tabs-list">
                {availableTabs.map((tab) => (
                  <Tabs.Tab key={tab} id={tab} className="submissions-tab">
                    <Tabs.Separator />
                    {tab.replace(/_/g, " ").toUpperCase()}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <SearchField
          aria-label="Search submissions"
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full lg:w-72"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search submissions..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Table */}
      <Table aria-label="Submissions Table">
        <Table.ScrollContainer>
          <Table.Content className="min-w-200">
            <Table.Header>
              <Table.Column isRowHeader id="date">DATE</Table.Column>
              <Table.Column id="artist">ARTIST</Table.Column>
              <Table.Column id="track">TRACK / GENRE</Table.Column>
              <Table.Column id="status">STATUS</Table.Column>
              <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
            </Table.Header>
            <Table.Body
              items={pagedDemos}
              renderEmptyState={() => (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-dashed border-border">
                    <Search size={20} className="text-muted" />
                  </div>
                  <p className="text-muted text-xs font-bold tracking-widest uppercase">
                    No {selectedTab} submissions found
                  </p>
                </div>
              )}
            >
              {(demo: Demo) => {
                const artistName = demo.artist?.stageName || demo.artist?.email || "Unknown";
                const artistSecondary =
                  demo.artist?.stageName && demo.artist?.email ? demo.artist.email : "";
                const genreLabel = demo.genre?.toUpperCase() || "NO GENRE";
                const reviewerLabel = demo.reviewedBy
                  ? demo.reviewedBy.split("@")[0].toUpperCase()
                  : "";

                return (
                  <Table.Row key={demo.id} id={demo.id}>
                    <Table.Cell>
                      <span className="text-xs text-muted font-semibold">
                        {formatDate(demo.createdAt)}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold tracking-wide">
                          {artistName}
                        </span>
                        {artistSecondary && (
                          <span className="text-[10px] text-muted font-semibold tracking-wide">
                            {artistSecondary}
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center border border-border">
                          <PlayCircle size={16} className="text-accent" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold tracking-wide">
                            {demo.title}
                          </span>
                          <Chip size="sm" variant="soft">
                            <Chip.Label>{genreLabel}</Chip.Label>
                          </Chip>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <Chip
                          size="sm"
                          variant="soft"
                          color={getChipColor(demo.status)}
                        >
                          {getStatusIcon(demo.status)}
                          <Chip.Label>{demo.status?.toUpperCase()}</Chip.Label>
                        </Chip>
                        {reviewerLabel && (
                          <span className="text-[9px] text-muted font-semibold tracking-wide">
                            BY {reviewerLabel}
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip delay={0}>
                          <Button
                            size="sm"
                            isIconOnly
                            variant="ghost"
                            onPress={() => openNotes(demo.id)}
                          >
                            <StickyNote size={14} />
                          </Button>
                          <Tooltip.Content>A&amp;R Notes</Tooltip.Content>
                        </Tooltip>
                        <Tooltip delay={0}>
                          <Button
                            size="sm"
                            isIconOnly
                            variant="ghost"
                            onPress={() => setVersionHistoryDemoId(demo.id)}
                          >
                            <History size={14} />
                          </Button>
                          <Tooltip.Content>Version History</Tooltip.Content>
                        </Tooltip>
                        <Tooltip delay={0}>
                          <Button
                            size="sm"
                            isIconOnly
                            variant="secondary"
                            render={(props: React.HTMLAttributes<HTMLElement>) => (
                              <Link {...(props as React.ComponentPropsWithoutRef<typeof Link>)} href={`/dashboard/demo/${demo.id}`} />
                            )}
                          >
                            <Eye size={14} />
                          </Button>
                          <Tooltip.Content>Review</Tooltip.Content>
                        </Tooltip>
                        {canDelete && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost" className="text-danger hover:bg-danger/10"
                            onPress={() => onDelete(demo.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        {totalPages > 1 && (
          <Table.Footer>
            <Pagination size="sm" className="submissions-pagination">
              <Pagination.Summary>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredDemos.length)} of {filteredDemos.length}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous isDisabled={page === 1} onPress={() => setPage((p) => p - 1)}>
                    <Pagination.PreviousIcon />
                    <span>Prev</span>
                  </Pagination.Previous>
                </Pagination.Item>

                {pageNumbers.map((p, i) => {
                  const prev = pageNumbers[i - 1];
                  const showEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <Pagination.Item>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      )}
                      <Pagination.Item>
                        <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    </React.Fragment>
                  );
                })}

                <Pagination.Item>
                  <Pagination.Next isDisabled={page === totalPages} onPress={() => setPage((p) => p + 1)}>
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>

      {/* Version History Modal */}
      <Modal.Backdrop isOpen={!!versionHistoryDemoId} onOpenChange={(open) => !open && setVersionHistoryDemoId(null)} variant="blur">
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[520px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-sm font-black tracking-[2px] text-foreground">
                VERSION HISTORY
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {versionHistoryDemoId && (
                <DemoVersionHistory
                  demoId={versionHistoryDemoId}
                  canRestore={true}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" slot="close">
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* A&R Notes Modal */}
      <Modal.Backdrop isOpen={!!notesDemoId} onOpenChange={(open) => !open && setNotesDemoId(null)} variant="blur">
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[480px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-sm font-black tracking-[2px] text-foreground">
                A&amp;R NOTES
              </Modal.Heading>
              <p className="text-[11px] text-muted mt-1">
                Internal notes visible only to admin/A&amp;R team
              </p>
            </Modal.Header>
            <Modal.Body>
              {notesLoading ? (
                <div className="py-8 text-center text-[11px] text-muted">Loading...</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Rejection Reason */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionText}
                      onChange={(e) => setRejectionText(e.target.value)}
                      placeholder="Reason for rejection (visible to artist)..."
                      className="w-full min-h-[80px] resize-y rounded-xl border border-red-500/10 bg-red-500/[0.02] px-4 py-3 text-[13px] text-foreground placeholder:text-white/20 outline-none focus:border-red-500/20"
                    />
                    <p className="text-[9px] text-muted/60">This may be shown to the artist</p>
                  </div>

                  {/* Internal Notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted">
                      Internal Notes
                    </label>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add internal notes, feedback, or review comments..."
                      className="w-full min-h-[120px] resize-y rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-foreground placeholder:text-white/20 outline-none focus:border-white/[0.12]"
                    />
                    <p className="text-[9px] text-muted/60">Only visible to admin &amp; A&amp;R</p>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" slot="close">
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={saveNotes}
                isDisabled={notesSaving}
              >
                {notesSaving ? "Saving..." : "Save"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <style jsx>{`
        .submissions-view {
          min-width: 0;
        }

        .submissions-toolbar {
          min-width: 0;
        }

        .submissions-tabs {
          width: 100%;
          min-width: 0;
        }

        .submissions-tabs-scroll {
          width: 100%;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .submissions-tabs-container {
          width: max-content;
          min-width: 100%;
          padding-bottom: 2px;
        }

        .submissions-tabs-list {
          display: inline-flex;
          width: max-content;
          min-width: max-content;
          flex-wrap: nowrap;
          border-radius: 999px;
          padding: 4px;
        }

        .submissions-tab {
          white-space: nowrap;
          flex: 0 0 auto;
          min-height: 40px;
          padding-inline: 16px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .submissions-search {
          flex-shrink: 0;
        }

        .submissions-tab :global(.tabs__separator) {
          margin-inline-end: 12px;
          opacity: 0.35;
        }

        .submissions-tab:first-child :global(.tabs__separator) {
          display: none;
        }

        .submissions-pagination {
          width: 100%;
          justify-content: space-between;
          gap: 12px;
        }

        .submissions-pagination :global(.pagination__summary) {
          font-size: 12px;
          font-weight: 600;
          color: var(--ds-text-muted);
        }

        @media (max-width: 1024px) {
          .submissions-search {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .submissions-toolbar {
            gap: 12px;
          }

          .submissions-tabs-container {
            margin-inline: -2px;
            padding-inline: 2px;
            min-width: max-content;
          }

          .submissions-tabs-scroll {
            margin-inline: -2px;
            padding-inline: 2px;
          }

          .submissions-tabs-list {
            padding: 3px;
          }

          .submissions-tab {
            min-height: 38px;
            padding-inline: 14px;
            font-size: 10px;
            letter-spacing: 0.06em;
          }

          .submissions-pagination {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
