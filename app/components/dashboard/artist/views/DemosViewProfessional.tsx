"use client";

import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  FileSearch,
  CheckCircle,
  XCircle,
  Send,
  Play,
  Pause,
  Trash2,
  Plus,
  Music,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Chip, Modal, Button } from "@heroui/react";

interface Demo {
  id: string;
  title: string;
  genre?: string;
  status?: "pending" | "reviewing" | "approved" | "contract_sent" | "rejected";
  createdAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  trackLink?: string;
  files?: Array<{ id: string }>;
}

const STATUS_CONFIG = {
  pending: {
    label: "WAITING",
    color: "default" as const,
    icon: Clock,
    title: "Waiting for review",
    description: "Your demo is in queue and hasn't been picked up yet.",
    dot: "bg-default/30",
  },
  reviewing: {
    label: "IN REVIEW",
    color: "warning" as const,
    icon: FileSearch,
    title: "A&R is reviewing",
    description: "The team is actively listening and discussing.",
    dot: "bg-warning",
  },
  approved: {
    label: "ACCEPTED",
    color: "success" as const,
    icon: CheckCircle,
    title: "Accepted by label",
    description: "Demo passed review and moving to next stage.",
    dot: "bg-success",
  },
  contract_sent: {
    label: "DEAL SENT",
    color: "success" as const,
    icon: Send,
    title: "Contract sent",
    description: "Review the next release steps in demo details.",
    dot: "bg-success",
  },
  rejected: {
    label: "NOT ACCEPTED",
    color: "danger" as const,
    icon: XCircle,
    title: "Rejected by A&R",
    description: "This submission will not move forward.",
    dot: "bg-danger",
  },
};

interface DemosViewProfessionalProps {
  demos: Demo[];
  onNavigate?: () => void;
  onDelete?: (demoId: string, demoTitle: string) => void;
  shared?: any;
}

export default function DemosViewProfessional({
  demos = [],
  onNavigate,
  onDelete,
}: DemosViewProfessionalProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getStatusConfig = (status?: string) =>
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

  const getDemoAudioUrl = (demo: Demo) =>
    demo.files?.[0] ? `/api/files/demo/${demo.files[0].id}` : demo.trackLink;

  const handlePlay = (demo: Demo) => {
    const fileUrl = getDemoAudioUrl(demo);
    if (!fileUrl || !audioRef.current) return;

    if (playingId === demo.id) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current.pause();
    audioRef.current.src = fileUrl;
    audioRef.current.play().catch(() => {});
    setPlayingId(demo.id);
  };

  const handleDeleteClick = (demo: Demo) => {
    setSelectedDemo(demo);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDemo && onDelete) {
      onDelete(selectedDemo.id, selectedDemo.title);
    }
    setDeleteConfirmOpen(false);
    setSelectedDemo(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const demoStats = useMemo(() => {
    const stats = { total: demos.length, approved: 0, rejected: 0, reviewing: 0, pending: 0 };
    demos.forEach((demo) => {
      const status = demo.status || "pending";
      if (status === "approved" || status === "contract_sent") stats.approved++;
      else if (status === "rejected") stats.rejected++;
      else if (status === "reviewing") stats.reviewing++;
      else stats.pending++;
    });
    return stats;
  }, [demos]);

  if (demos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] ds-text-label">Submissions</p>
            <p className="mt-1 text-sm font-semibold ds-text-muted">
              Submit your demos for A&R review and get feedback from our team.
            </p>
          </div>
          <button
            onClick={onNavigate}
            className="ds-btn-ghost"
          >
            <Plus size={16} />
            NEW DEMO
          </button>
        </div>

        <div className="ds-glass flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="ds-item mb-5 grid h-14 w-14 place-items-center rounded-full">
            <Music size={24} className="ds-text-muted" />
          </div>
          <h3 className="text-base font-black ds-text">No demos yet</h3>
          <p className="mt-2 mb-6 max-w-sm text-sm ds-text-muted">
            Start submitting your demos to get feedback from our A&R team.
          </p>
          <button
            onClick={onNavigate}
            className="ds-btn-ghost"
          >
            <Plus size={16} />
            SUBMIT YOUR FIRST DEMO
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        playsInline
        onEnded={() => setPlayingId(null)}
        style={{ display: "none" }}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] ds-text-label">Submissions</p>
            <p className="mt-1 text-sm font-semibold ds-text-muted">
              {demoStats.total} submission{demoStats.total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onNavigate}
            className="ds-btn-ghost"
          >
            <Plus size={16} />
            NEW DEMO
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="TOTAL" value={demoStats.total} />
          <StatPill label="ACCEPTED" value={demoStats.approved} accent="text-success" />
          <StatPill label="IN REVIEW" value={demoStats.reviewing} accent="text-warning" />
          <StatPill label="REJECTED" value={demoStats.rejected} accent="text-danger" />
        </div>

        {/* Demos List */}
        <div className="space-y-2">
          {demos.map((demo, i) => {
            const statusConfig = getStatusConfig(demo.status);
            const hasAudio = Boolean(getDemoAudioUrl(demo));
            const submittedDate = formatDate(demo.createdAt);
            const StatusIcon = statusConfig.icon;
            const isPlaying = playingId === demo.id;

            return (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group ds-item relative"
              >
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  {/* Play / Icon */}
                  <div className="shrink-0">
                    {hasAudio ? (
                      <button
                        onClick={() => handlePlay(demo)}
                        className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${
                          isPlaying
                            ? "border-[var(--ds-item-border-hover)] bg-[var(--ds-item-bg-hover)] ds-text"
                            : "border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] ds-text-muted hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text)]"
                        }`}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] ds-text-faint">
                        <Music size={16} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="truncate text-sm font-black ds-text">{demo.title}</span>
                      {isPlaying && (
                        <div className="flex items-end gap-0.5 h-3">
                          {[0.8, 0.6, 0.9].map((d, idx) => (
                            <motion.div
                              key={idx}
                              animate={{ scaleY: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: d, delay: idx * 0.15 }}
                              className="origin-bottom rounded-full bg-white/60"
                              style={{ height: "100%" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {/* Status dot + label */}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                        <span
                          className={`text-[11px] font-black tracking-wide ${
                            statusConfig.color === "success"
                              ? "text-success"
                              : statusConfig.color === "warning"
                              ? "text-warning"
                              : statusConfig.color === "danger"
                              ? "text-danger"
                              : "ds-text-muted"
                          }`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      {demo.genre && (
                        <span className="rounded-full border border-[var(--ds-pill-border)] bg-[var(--ds-pill-bg)] px-2 py-0.5 text-[11px] font-semibold ds-text-muted">
                          {demo.genre}
                        </span>
                      )}
                      {submittedDate && (
                        <span className="text-[11px] ds-text-faint">{submittedDate}</span>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {demo.status === "rejected" && demo.rejectionReason && (
                      <div className="mt-2.5 flex gap-2 rounded-xl border border-danger-soft bg-danger/6 px-3 py-2">
                        <XCircle size={13} className="text-danger shrink-0 mt-0.5" />
                        <p className="text-[12px] text-danger/80">{demo.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {demo.trackLink && (
                      <a
                        href={demo.trackLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-8 w-8 place-items-center rounded-full ds-text-faint transition-colors hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text-sub)]"
                      >
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                    <Link
                      href={`/dashboard/demo/${demo.id}`}
                      className="grid h-8 w-8 place-items-center rounded-full ds-text-faint transition-colors hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text-sub)]"
                    >
                      <ChevronRight size={15} />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(demo)}
                      className="grid h-8 w-8 place-items-center rounded-full ds-text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Modal.Backdrop variant="blur" className="bg-black/80" />
        <Modal.Container>
          <Modal.Dialog className="rounded-2xl border border-default/6 bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <Modal.Header className="px-6 pt-6 pb-0">
              <Modal.Heading className="text-sm font-black tracking-[2px] text-foreground">
                DELETE DEMO?
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-6 py-5">
              <p className="text-sm text-foreground/70">
                Are you sure you want to delete{" "}
                <span className="font-bold text-foreground">&quot;{selectedDemo?.title}&quot;</span>?
              </p>
              <p className="mt-1 text-xs text-foreground/40">This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer className="flex gap-2 px-6 pb-6 pt-0">
              <Button variant="ghost" onPress={() => setDeleteConfirmOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1 bg-danger text-white" onPress={handleConfirmDelete}>
                Delete
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </>
  );
}

function StatPill({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="ds-item rounded-[20px] px-4 py-4">
      <p className="text-[10px] font-black tracking-[0.18em] ds-text-label">{label}</p>
      <p className={`mt-1.5 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}
