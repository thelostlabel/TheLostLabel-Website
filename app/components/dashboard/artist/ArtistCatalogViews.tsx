"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import NextImage from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Music,
  Trash2,
  Upload,
  Play,
  Pause,
  Clock3,
  CheckCircle2,
  XCircle,
  FileSearch,
  Send,
} from "lucide-react";
import { Alert, Card, Button, Chip, Skeleton, Modal, TextField, TextArea, Label, Input } from "@heroui/react";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import { usePublicSettings } from "@/app/components/PublicSettingsContext";

interface ReleaseRequest {
  id: string;
  status: string;
  type: string;
  updatedAt: string;
  adminNote?: string;
}

interface Release {
  id: string;
  name: string;
  type?: string;
  releaseDate?: string;
  createdAt?: string;
  image?: string;
  requests?: ReleaseRequest[];
}

interface DemoFile {
  id: string;
  size?: number;
}

interface Demo {
  id: string;
  title: string;
  status?: string;
  genre?: string;
  createdAt?: string;
  reviewedAt?: string;
  trackLink?: string;
  rejectionReason?: string;
  files?: DemoFile[];
}

interface SharedContext {
  DASHBOARD_THEME: Record<string, string>;
  glassStyle?: React.CSSProperties;
  btnStyle?: React.CSSProperties;
  getBaseTitle: (name: string) => string;
  resolveImageSrc: (src?: string, id?: string) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

interface RequestModal {
  releaseId: string;
  releaseName: string;
}

interface ReleasesViewProps {
  stats: { artistImage?: string; artistName?: string; [key: string]: unknown };
  showToast: (message: string, type: string) => void;
  onOpenSupport: (id?: string) => void;
  onOpenProfile: () => void;
  shared: SharedContext;
}

export function ReleasesView({
  stats,
  showToast,
  onOpenSupport,
  onOpenProfile,
  shared,
}: ReleasesViewProps) {
  const {
    DASHBOARD_THEME,
    glassStyle,
    btnStyle,
    getBaseTitle,
    resolveImageSrc,
    handleImageError,
  } = shared;
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [requestModal, setRequestModal] = useState<RequestModal | null>(null);
  const [requestType, setRequestType] = useState<string>("question");
  const [requestDetails, setRequestDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchReleases();
  }, []);

  const fetchReleases = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardRequestJson("/api/artist/releases", {
        context: "artist releases",
      });
      setReleases(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getDashboardErrorMessage(e, "FAILED TO CONNECT"));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (): Promise<void> => {
    if (!requestDetails.trim()) {
      showToast("Please provide details for your request.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await dashboardRequestJson("/api/artist/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: requestModal!.releaseId,
          type: requestType,
          details: requestDetails,
        }),
        context: "create release request",
        retry: false,
      });
      showToast("Request submitted successfully!", "success");
      setRequestModal(null);
      setRequestDetails("");
      await fetchReleases();
    } catch (e) {
      const message = getDashboardErrorMessage(e, "Request failed");
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getRequestStatus = (release: Release): ReleaseRequest | null => {
    if (!release.requests || release.requests.length === 0) return null;
    const sorted = [...release.requests].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const active = sorted.find((request) => request.status !== "rejected");
    return active || sorted[0];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="rounded-xl aspect-3/4" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <Modal.Backdrop
        isOpen={Boolean(requestModal)}
        onOpenChange={(open: boolean) => {
          if (!open) setRequestModal(null);
        }}
        variant="blur"
        className="bg-black/80"
      >
        <Modal.Container className="px-3 sm:px-4" placement="center">
          <Modal.Dialog
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-default/6 bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          >
            {requestModal ? (
              <>
                <Modal.Header className="px-4 pt-4 pb-0 sm:px-7 sm:pt-7">
                  <div className="min-w-0">
                    <Modal.Heading className="text-sm font-extrabold tracking-[2px] text-foreground">
                      REQUEST CHANGE
                    </Modal.Heading>
                    <p className="mt-1 text-xs tracking-wide text-muted">
                      FOR:{" "}
                      <strong className="wrap-break-word text-foreground">
                        {requestModal.releaseName.toUpperCase()}
                      </strong>
                    </p>
                  </div>
                </Modal.Header>
                <Modal.Body className="px-4 py-5 sm:px-7">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-muted">REQUEST TYPE</label>
                      <select
                        value={requestType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRequestType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface-soft p-3 text-[13px] text-foreground outline-none"
                      >
                        <option value="question">Question / Help / Support</option>
                        <option value="cover_art">Update Cover Art</option>
                        <option value="audio">Update Audio File</option>
                        <option value="delete">Request Takedown (Delete)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-muted">DETAILS / LINKS</label>
                      <textarea
                        value={requestDetails}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestDetails(e.target.value)}
                        placeholder="Describe your request. For files, provide a Dropbox/Drive link."
                        rows={5}
                        className="min-h-32 w-full rounded-lg border border-border bg-surface-soft p-3 text-sm text-foreground outline-none resize-y"
                      />
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex flex-col gap-2 px-4 pt-0 pb-4 sm:flex-row sm:px-7 sm:pb-7">
                  <Button
                    variant="primary"
                    className="w-full sm:flex-1"
                    onPress={handleRequestSubmit}
                    isDisabled={submitting}
                  >
                    {submitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1"
                    slot="close"
                  >
                    CANCEL
                  </Button>
                </Modal.Footer>
              </>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {error === "Spotify URL not set" ? (
        <Card className="rounded-2xl border border-default/5 bg-default/1">
          <Card.Content className="py-20 flex flex-col items-center text-center">
            <AlertCircle size={40} className="text-accent opacity-50 mb-5" />
            <p className="text-xs tracking-[2px] font-black ds-text">SPOTIFY_PROFILE_REQUIRED</p>
            <p className="mt-4 max-w-100 text-[10px] leading-relaxed ds-text-muted">
              To sync your catalog, please add your Spotify Artist URL in the Profile tab. This allows us to link your releases to your dashboard.
            </p>
            <Button variant="primary" className="mt-4" onPress={onOpenProfile}>
              GO TO PROFILE
            </Button>
          </Card.Content>
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border border-default/5">
          <Card.Content className="py-20 flex flex-col items-center text-center text-danger">
            <p className="text-xs tracking-[2px] font-black">ERROR: {error.toUpperCase()}</p>
            <Button variant="outline" className="mt-5" onPress={fetchReleases}>RETRY_SYNC</Button>
          </Card.Content>
        </Card>
      ) : releases.length === 0 ? (
        <Card className="rounded-2xl border border-default/3 bg-default/1">
          <Card.Content className="py-20 text-center">
            <p className="text-xs tracking-[2px] text-muted">NO RELEASES FOUND</p>
            <p className="text-[10px] mt-2.5 text-muted">Your releases will appear here once distributed.</p>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-8 sm:gap-10">
          {(() => {
            const groups = releases.reduce<Record<string, Release[]>>((acc, release) => {
              const base = getBaseTitle(release.name);
              if (!acc[base]) acc[base] = [];
              acc[base].push(release);
              return acc;
            }, {});

            const groupEntries = Object.entries(groups).sort((a, b) => {
              const dateA = new Date(Math.max(...a[1].map((release) => new Date(release.releaseDate ?? release.createdAt ?? 0).getTime())));
              const dateB = new Date(Math.max(...b[1].map((release) => new Date(release.releaseDate ?? release.createdAt ?? 0).getTime())));
              return dateB.getTime() - dateA.getTime();
            });

            const upcomingGroups = groupEntries.filter(([, groupReleases]) =>
              groupReleases.some((release) => new Date(release.releaseDate ?? 0) > new Date()),
            );

            const pastGroups = groupEntries.filter(([, groupReleases]) =>
              groupReleases.every((release) => new Date(release.releaseDate ?? 0) <= new Date()),
            );

            return (
              <>
                {upcomingGroups.length > 0 && (
                  <div>
                    <h3 className="text-[11px] tracking-[3px] text-accent font-black mb-5 border-l-3 border-accent pl-3">
                      UPCOMING_DROPS
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3.5">
                      {upcomingGroups.map(([baseName, groupReleases]) => (
                        <ReleaseCard
                          key={baseName}
                          stats={stats}
                          release={groupReleases[0]}
                          versions={groupReleases}
                          getRequestStatus={getRequestStatus}
                          setRequestModal={setRequestModal}
                          onNavigate={onOpenSupport}
                          shared={shared}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[11px] tracking-[3px] text-[#555] font-black mb-5 border-l-3 border-[#333] pl-3">
                    DISCOGRAPHY
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3.5">
                    {pastGroups.map(([baseName, groupReleases]) => (
                      <ReleaseCard
                        key={baseName}
                        stats={stats}
                        release={groupReleases[0]}
                        versions={groupReleases}
                        getRequestStatus={getRequestStatus}
                        setRequestModal={setRequestModal}
                        onNavigate={onOpenSupport}
                        shared={shared}
                      />
                    ))}
                  </div>
                  {pastGroups.length === 0 && (
                    <Card className="rounded-2xl border border-default/3 bg-default/1">
                      <Card.Content className="py-15 text-center">
                        <p className="text-[10px] tracking-[2px] text-muted font-extrabold">NO RELEASES FOUND IN DISCOGRAPHY</p>
                      </Card.Content>
                    </Card>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const REQUEST_CHIP_MAP: Record<string, 'success' | 'accent' | 'warning' | 'danger' | 'default'> = {
  approved: "success",
  completed: "success",
  processing: "accent",
  reviewing: "warning",
  rejected: "danger",
};

interface ReleaseCardProps {
  release: Release;
  versions?: Release[];
  stats: { artistImage?: string; artistName?: string; [key: string]: unknown };
  getRequestStatus: (release: Release) => ReleaseRequest | null;
  setRequestModal: (modal: RequestModal | null) => void;
  onNavigate: (id?: string) => void;
  shared: SharedContext;
}

function ReleaseCard({ release, versions = [], stats, getRequestStatus, setRequestModal, onNavigate, shared }: ReleaseCardProps) {
  const { getBaseTitle, resolveImageSrc, handleImageError } = shared;
  const activeRequest = getRequestStatus(release);
  const baseTitle = getBaseTitle(release.name);
  const hasMultiple = versions.length > 1;
  const releaseType = (release.type || "release").toUpperCase();
  const releaseDate = new Date(release.releaseDate || release.createdAt || Date.now()).toLocaleDateString();

  const getStatusLabel = (status: string): string => {
    if (status === "approved") return "APPROVED";
    if (status === "processing") return "PROCESSING";
    if (status === "reviewing") return "UNDER REVIEW";
    if (status === "completed") return "COMPLETED";
    if (status === "rejected") return "REJECTED";
    return "PENDING";
  };

  return (
    <Card className="overflow-hidden rounded-[18px] border border-border bg-surface transition-colors hover:border-default/12">
      <Card.Content className="p-3 sm:p-0">
        <div className="flex items-start gap-3 sm:block">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[16px] bg-black sm:h-auto sm:w-full sm:rounded-none sm:aspect-square">
            {release.image ? (
              <NextImage
                src={resolveImageSrc(release.image, release.id)}
                alt={release.name}
                width={300}
                height={300}
                unoptimized
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            ) : (
              <NextImage
                src={resolveImageSrc(stats?.artistImage)}
                alt={release.name}
                width={300}
                height={300}
                unoptimized
                onError={handleImageError}
                className="h-full w-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-x-0 top-0 hidden items-start justify-between gap-2 p-2 sm:flex">
              <Chip
                size="sm"
                variant="soft"
                className="border border-default/10 bg-black/55 backdrop-blur-sm"
              >
                <Chip.Label className="text-[8px] font-black tracking-[0.12em] text-white/90">
                  {releaseType}
                </Chip.Label>
              </Chip>
              {hasMultiple ? (
                <Chip
                  size="sm"
                  variant="soft"
                  className="border border-default/10 bg-black/55 backdrop-blur-sm"
                >
                  <Chip.Label className="text-[8px] font-black tracking-[0.12em] text-white/90">
                    {versions.length} VER
                  </Chip.Label>
                </Chip>
              ) : null}
            </div>
            {hasMultiple && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-14 sm:block"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.52) 72%, rgba(0,0,0,0.72))",
                }}
              />
            )}
            <div className="absolute bottom-2 left-2 right-2 hidden items-end justify-between gap-2 sm:flex">
              <div className="min-w-0">
                <div className="text-[8px] font-black tracking-[0.14em] text-white/55">
                  RELEASE DATE
                </div>
                <div className="truncate text-[10px] font-bold text-white/92">
                  {releaseDate}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
              <Chip size="sm" variant="soft" className="border border-default/8 bg-default/6">
                <Chip.Label className="text-[9px] font-black tracking-[0.12em] text-foreground/80">
                  {releaseType}
                </Chip.Label>
              </Chip>
              {hasMultiple ? (
                <Chip size="sm" variant="soft" className="border border-default/8 bg-default/6">
                  <Chip.Label className="text-[9px] font-black tracking-[0.12em] text-foreground/80">
                    {versions.length} VERSIONS
                  </Chip.Label>
                </Chip>
              ) : null}
            </div>

            <div className="min-w-0">
              <h3 className="m-0 line-clamp-2 text-[13px] font-extrabold leading-tight text-foreground sm:text-[13px]">
                {baseTitle.toUpperCase()}
              </h3>
              <p className="m-0 mt-1 text-[10px] font-medium ds-text-muted">
                {String(stats?.artistName || "Artist").toUpperCase()}
              </p>
              <div className="mt-1.5 text-[10px] font-bold tracking-[0.08em] ds-text-faint sm:hidden">
                RELEASE DATE · {releaseDate}
              </div>
            </div>

            {activeRequest ? (
              <div className="flex flex-col gap-2">
                <div className={`rounded-[14px] border p-2.5 ${
                  activeRequest.status === "approved" || activeRequest.status === "completed"
                    ? "border-green-500/25"
                    : "border-default/8"
                }`} style={{ background: "linear-gradient(180deg, var(--ds-item-bg-hover), var(--ds-item-bg))" }}>
                  <div className="mb-2 flex flex-col items-start gap-1.5">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={REQUEST_CHIP_MAP[activeRequest.status] || "default"}
                      className="max-w-full"
                    >
                      <Chip.Label>{getStatusLabel(activeRequest.status)}</Chip.Label>
                    </Chip>
                    <span className="text-[8px] ds-text-muted">
                      {new Date(activeRequest.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-1 line-clamp-2 wrap-break-word text-[10px] font-extrabold text-foreground sm:text-[11px]">
                    {activeRequest.type.toUpperCase().replace("_", " ")} CHANGE
                  </div>

                  {activeRequest.adminNote && (
                    <div className="mt-2 rounded-[10px] border border-default/5 bg-default/3 p-2 text-[9px] leading-snug ds-text-muted">
                      <strong className="mb-0.5 block text-[8px] ds-text-sub">NOTE</strong>
                      <span className="line-clamp-3 wrap-break-word">{activeRequest.adminNote}</span>
                    </div>
                  )}

                  {activeRequest.status !== "rejected" && activeRequest.status !== "approved" && activeRequest.status !== "completed" && (
                    <p className="m-0 mt-2 text-[8px] italic ds-text-muted sm:text-[9px]">
                      Request is being reviewed by the team.
                    </p>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-full px-3 text-[10px] font-extrabold tracking-[0.08em] sm:text-[10px] sm:tracking-[0.12em]"
                  onPress={() => onNavigate(activeRequest.id)}
                >
                  VIEW CONVERSATION
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-auto w-full rounded-full px-3 text-[10px] font-extrabold tracking-[0.08em] sm:text-[10px] sm:tracking-[0.12em]"
                onPress={() => setRequestModal({ releaseId: release.id, releaseName: release.name })}
              >
                REQUEST CHANGE
              </Button>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

interface DemoStatusMeta {
  label: string;
  title: string;
  description: string;
  accent: string;
  border: string;
  background: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface DemosViewProps {
  demos: Demo[];
  onNavigate?: (id: string | null) => void;
  onDelete?: (id: string, title: string) => void;
  shared: SharedContext;
}

export function DemosView({ demos, onNavigate, onDelete, shared }: DemosViewProps) {
  const { DASHBOARD_THEME } = shared;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const DEMO_STATUS_META: Record<string, DemoStatusMeta> = {
    pending: {
      label: "WAITING",
      title: "Waiting for review",
      description: "Your demo is in queue and has not been picked up by A&R yet.",
      accent: "#94a3b8",
      border: "rgba(148,163,184,0.18)",
      background: "rgba(148,163,184,0.08)",
      icon: Clock3,
    },
    reviewing: {
      label: "IN REVIEW",
      title: "A&R is reviewing this demo",
      description: "The team is actively listening and discussing the submission.",
      accent: "#f59e0b",
      border: "rgba(245,158,11,0.22)",
      background: "rgba(245,158,11,0.09)",
      icon: FileSearch,
    },
    approved: {
      label: "ACCEPTED",
      title: "Accepted by the label",
      description: "This demo passed review and is moving to the next stage.",
      accent: "#22c55e",
      border: "rgba(34,197,94,0.22)",
      background: "rgba(34,197,94,0.09)",
      icon: CheckCircle2,
    },
    contract_sent: {
      label: "DEAL SENT",
      title: "Contract has been sent",
      description: "Open the demo detail to review the next release steps.",
      accent: "#38bdf8",
      border: "rgba(56,189,248,0.22)",
      background: "rgba(56,189,248,0.09)",
      icon: Send,
    },
    rejected: {
      label: "NOT ACCEPTED",
      title: "Rejected by A&R",
      description: "This submission will not move forward in its current form.",
      accent: "#ef4444",
      border: "rgba(239,68,68,0.22)",
      background: "rgba(239,68,68,0.09)",
      icon: XCircle,
    },
    default: {
      label: "STATUS",
      title: "Status updated",
      description: "Open the submission for the latest details.",
      accent: "#94a3b8",
      border: "rgba(148,163,184,0.18)",
      background: "rgba(148,163,184,0.08)",
      icon: Clock3,
    },
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "var(--status-success)";
      case "rejected":
        return "var(--status-error)";
      case "reviewing":
        return "var(--status-warning)";
      default:
        return "var(--status-neutral)";
    }
  };

  const getStatusMeta = (status: string): DemoStatusMeta => DEMO_STATUS_META[status] || DEMO_STATUS_META.default;

  const formatDate = (value?: string): string | null => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString();
  };

  const handlePlay = (demo: Demo): void => {
    const fileUrl = demo.files?.[0] ? `/api/files/demo/${demo.files[0].id}` : demo.trackLink;
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

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (audio) audio.pause();
    };
  }, []);

  const getDemoAudioAvailable = (demo: Demo): boolean => Boolean(demo.files?.[0] || demo.trackLink);
  const demoStatusSummary = [
    { key: "approved", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "reviewing", label: "In review" },
    { key: "pending", label: "Waiting" },
  ].filter((item) => demos.some((demo) => (demo.status || "pending") === item.key));

  return (
    <div>
      <audio ref={audioRef} playsInline onEnded={() => setPlayingId(null)} style={{ display: "none" }} />
      {demos.length === 0 ? (
        <Card className="rounded-[24px] border border-default/6 bg-default/2">
          <Card.Content className="px-4 py-14 text-center sm:px-8 sm:py-20">
            <p style={{ fontSize: "12px", letterSpacing: "1px", marginBottom: "20px", color: DASHBOARD_THEME.muted }}>
              NO DEMOS SUBMITTED YET
            </p>
            <Button
              onPress={() => onNavigate && onNavigate(null)}
              className="w-full max-w-sm sm:w-auto"
            >
              SUBMIT YOUR FIRST DEMO
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {demoStatusSummary.map((item) => {
              const count = demos.filter((demo) => (demo.status || "pending") === item.key).length;
              const meta = getStatusMeta(item.key);
              return (
                <Card
                  key={item.key}
                  variant="secondary"
                  className="rounded-[18px] border"
                  style={{
                    borderColor: meta.border,
                    background: `linear-gradient(180deg, ${meta.background}, var(--ds-item-bg))`,
                  }}
                >
                  <Card.Content className="p-3">
                    <p className="m-0 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: meta.accent }}>
                      {item.label}
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="m-0 text-[30px] font-black leading-none text-foreground">{count}</p>
                      <Chip size="sm" variant="soft" color={
                        item.key === "approved"
                          ? "success"
                          : item.key === "rejected"
                            ? "danger"
                            : item.key === "reviewing"
                              ? "warning"
                              : "default"
                      }>
                        <Chip.Label>{meta.label}</Chip.Label>
                      </Chip>
                    </div>
                  </Card.Content>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:gap-2.5">
            {demos.map((demo) => {
              const status = demo.status || "pending";
              const statusMeta = getStatusMeta(status);
              const StatusIcon = statusMeta.icon;
              const createdAtLabel = formatDate(demo.createdAt);
              const reviewedAtLabel = formatDate(demo.reviewedAt);
              const chipColor =
                status === "approved" || status === "contract_sent"
                  ? "success"
                  : status === "rejected"
                    ? "danger"
                    : status === "reviewing"
                      ? "warning"
                      : "default";

              return (
                <Card
                  key={demo.id}
                  variant="default"
                  className="rounded-[20px] border border-border bg-surface transition-colors"
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <Card.Content className="flex flex-col gap-3 p-3.5 sm:gap-4 sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3 sm:flex-1 sm:min-w-0">
                        <div style={{ width: "3px", alignSelf: "stretch", borderRadius: "999px", background: statusMeta.accent, flexShrink: 0 }} />

                        {getDemoAudioAvailable(demo) ? (
                          <Button
                            isIconOnly
                            variant="tertiary"
                            size="sm"
                            aria-label={playingId === demo.id ? "Pause demo" : "Play demo"}
                            onPress={() => handlePlay(demo)}
                            className="mt-0.5 rounded-full"
                          >
                            {playingId === demo.id ? <Pause size={13} /> : <Play size={13} />}
                          </Button>
                        ) : (
                          <div style={{ width: "36px", flexShrink: 0 }} />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="m-0 line-clamp-2 text-[14px] font-extrabold leading-tight text-foreground sm:line-clamp-1">
                              {demo.title}
                            </h3>
                            {playingId === demo.id && (
                              <div style={{ display: "flex", gap: "2px", alignItems: "center", height: "12px", flexShrink: 0 }}>
                                <motion.div animate={{ height: [3, 12, 3] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: "2px", background: "var(--accent)", borderRadius: "1px" }} />
                                <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: "2px", background: "var(--accent)", borderRadius: "1px" }} />
                                <motion.div animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.9 }} style={{ width: "2px", background: "var(--accent)", borderRadius: "1px" }} />
                              </div>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--ds-text-muted)", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                            <span>{demo.genre || "No genre"}</span>
                            {createdAtLabel ? <><span>·</span><span>Submitted {createdAtLabel}</span></> : null}
                            {demo.files?.length && demo.files.length > 0 ? <><span>·</span><span>{demo.files.length} file{demo.files.length > 1 ? "s" : ""}</span></> : null}
                          </p>

                          <div
                            className="mt-3 flex flex-wrap items-start gap-3 rounded-[14px] border px-3 py-2.5"
                            style={{
                              borderColor: statusMeta.border,
                              background: statusMeta.background,
                            }}
                          >
                            <div
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border"
                              style={{ borderColor: statusMeta.border, color: statusMeta.accent, background: "rgba(0,0,0,0.14)" }}
                            >
                              <StatusIcon size={15} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color={chipColor}>
                                  <Chip.Label>{statusMeta.label}</Chip.Label>
                                </Chip>
                                {reviewedAtLabel ? (
                                  <span className="text-[10px] font-semibold text-foreground/45">Updated {reviewedAtLabel}</span>
                                ) : null}
                              </div>
                              <p className="mt-2 mb-0 text-[13px] font-black text-foreground">{statusMeta.title}</p>
                              <p className="mt-1 mb-0 text-[11px] leading-[1.45] text-foreground/60">{statusMeta.description}</p>
                            </div>
                          </div>

                          {status === "rejected" && demo.rejectionReason ? (
                            <Alert status="danger" className="mt-3 border-red-500/20 bg-red-500/6">
                              <Alert.Indicator />
                              <Alert.Content>
                                <Alert.Title className="text-[11px] font-black tracking-[0.08em]">
                                  REJECTION NOTE
                                </Alert.Title>
                                <Alert.Description className="wrap-break-word text-[11px] leading-[1.55] text-[#e5e7eb]">
                                  {demo.rejectionReason}
                                </Alert.Description>
                              </Alert.Content>
                            </Alert>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <Card.Footer className="flex flex-wrap items-center gap-2 px-0 pt-0 pb-0 sm:flex-nowrap sm:justify-end">
                      {demo.trackLink && (
                        <a href={demo.trackLink} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" className="w-full">
                            LINK
                          </Button>
                        </a>
                      )}
                      <Link href={`/dashboard/demo/${demo.id}`} className="flex-1 sm:flex-none">
                        <Button variant="secondary" size="sm" className="w-full">
                          VIEW
                        </Button>
                      </Link>
                      {onDelete && (
                        <Button
                          isIconOnly
                          variant="ghost"
                          size="sm"
                          aria-label="Delete demo"
                          onPress={() => onDelete(demo.id, demo.title)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </Card.Footer>
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface SubmitViewProps {
  title: string;
  setTitle: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  trackLink: string;
  setTrackLink: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  files: File[];
  dragActive: boolean;
  handleDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  uploadProgress: number;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  shared: SharedContext;
}

export function SubmitView({
  title,
  setTitle,
  genre,
  setGenre,
  trackLink,
  setTrackLink,
  message,
  setMessage,
  files,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileSelect,
  removeFile,
  fileInputRef,
  uploading,
  uploadProgress,
  handleSubmit,
  shared,
}: SubmitViewProps) {
  const { DASHBOARD_THEME, glassStyle } = shared;
  const publicSettings = usePublicSettings();
  const genres: string[] = publicSettings.genres?.length ? publicSettings.genres : ["Hip-Hop", "R&B", "Pop", "Electronic", "Other"];

  const selectedGenreLabel = genre || "Not selected";
  const fileCount = files.length;
  const totalFileSizeMb = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0) / (1024 * 1024);
  const isReadyToSubmit = Boolean(title.trim()) && (fileCount > 0 || trackLink.trim());

  return (
    <form onSubmit={handleSubmit}>
      <div className="submit-grid">
        <div className="ds-glass" style={{ padding: "28px" }}>
          <div style={{ marginBottom: "22px" }}>
            <p style={{ fontSize: "11px", color: "var(--ds-text-muted)", letterSpacing: "1.1px", fontWeight: "900", margin: 0 }}>NEW SUBMISSION</p>
            <h3 style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "900", color: "var(--ds-text)" }}>Release Delivery Form</h3>
          </div>

          <div className="submit-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "20px" }}>
            <TextField fullWidth name="title" value={title} onChange={(val: string) => setTitle(val)}>
              <Label className="dash-label">TRACK TITLE *</Label>
              <Input placeholder="Track title" required variant="secondary" />
            </TextField>
            <div>
              <Label className="dash-label">GENRE / VIBE</Label>
              <select
                value={genre}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGenre(e.target.value)}
                className="dash-input"
              >
                <option value="">Select Genre</option>
                {genres.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <TextField fullWidth name="trackLink" type="url" value={trackLink} onChange={(val: string) => setTrackLink(val)}>
              <Label className="dash-label">TRACK LINK (OPTIONAL)</Label>
              <Input placeholder="https://soundcloud.com/..." variant="secondary" />
            </TextField>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <TextField fullWidth name="message" value={message} onChange={(val: string) => setMessage(val)}>
              <Label className="dash-label">MESSAGE FOR A&R (OPTIONAL)</Label>
              <TextArea placeholder="Tell us about this record..." className="min-h-25 resize-y" variant="secondary" />
            </TextField>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <Label className="dash-label">MASTERED AUDIO (WAV ONLY) *</Label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${dragActive ? "var(--ds-glass-border-hover)" : "var(--ds-glass-border)"}`,
                padding: "28px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragActive ? "var(--ds-item-bg-hover)" : "var(--ds-item-bg)",
                borderRadius: "10px",
                transition: "all 0.22s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
              }}
            >
              <Upload size={22} style={{ color: dragActive ? "var(--ds-text-sub)" : "var(--ds-text-faint)", flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "var(--ds-text-sub)", fontSize: "12px", fontWeight: 700, margin: 0 }}>
                  {dragActive ? "Drop WAV file here" : "Drag & drop WAV files or click to browse"}
                </p>
                <p style={{ color: "var(--ds-text-faint)", fontSize: "10px", fontWeight: 600, margin: "3px 0 0 0" }}>
                  Multiple files supported · WAV format only
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".wav" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
                {files.map((file, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--ds-item-bg)", border: "1px solid var(--ds-item-border)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{ padding: "7px", background: "var(--ds-item-bg-hover)", color: "var(--ds-text-sub)", borderRadius: "8px" }}>
                        <Music size={14} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--ds-text)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name} <span style={{ color: "var(--ds-text-muted)", marginLeft: "6px" }}>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      </span>
                    </div>
                    <button type="button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); removeFile(index); }} style={{ background: "transparent", border: "none", color: "var(--ds-text-muted)", cursor: "pointer", padding: "5px" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {uploading ? (
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "0.8px", color: "var(--ds-text-sub)" }}>UPLOADING TRACK...</span>
                  <span style={{ fontSize: "12px", fontWeight: "900", color: "var(--ds-text)" }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "var(--ds-item-border)", borderRadius: "999px", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} style={{ height: "100%", background: "var(--accent)" }} />
                </div>
              </div>
            ) : (
              <button type="submit" style={{ width: "100%", padding: "15px", background: "var(--accent)", color: "#0b0b0b", border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: "900", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                SUBMIT DEMO
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: "12px", alignContent: "start" }}>
          <div className="ds-glass" style={{ padding: "20px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--ds-text-muted)", fontWeight: "900", letterSpacing: "1px" }}>SUBMISSION STATUS</p>
            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--ds-text-sub)" }}>Title</span>
                <span style={{ color: title.trim() ? "var(--ds-text)" : "var(--ds-text-faint)", fontWeight: "800" }}>{title.trim() ? "Ready" : "Missing"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--ds-text-sub)" }}>Genre</span>
                <span style={{ color: "var(--ds-text)", fontWeight: "800" }}>{selectedGenreLabel}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--ds-text-sub)" }}>Audio Files</span>
                <span style={{ color: "var(--ds-text)", fontWeight: "800" }}>{fileCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--ds-text-sub)" }}>Total Size</span>
                <span style={{ color: "var(--ds-text)", fontWeight: "800" }}>{totalFileSizeMb.toFixed(1)} MB</span>
              </div>
            </div>
            <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${isReadyToSubmit ? "rgba(34,197,94,0.35)" : "var(--ds-glass-border)"}`, background: isReadyToSubmit ? "rgba(34,197,94,0.08)" : "var(--ds-item-bg)", fontSize: "11px", fontWeight: "800", color: isReadyToSubmit ? "#bbf7d0" : "var(--ds-text-muted)" }}>
              {isReadyToSubmit ? "Ready to submit" : "Add title + audio file or track link"}
            </div>
          </div>

          <div className="ds-glass" style={{ padding: "20px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--ds-text-muted)", fontWeight: "900", letterSpacing: "1px" }}>RECOMMENDED CHECKLIST</p>
            <div style={{ marginTop: "12px", display: "grid", gap: "8px", fontSize: "12px", color: "var(--ds-text-sub)" }}>
              <p style={{ margin: 0 }}>1. Final WAV exported and mastered.</p>
              <p style={{ margin: 0 }}>2. Track title matches release metadata.</p>
              <p style={{ margin: 0 }}>3. Optional message includes important notes.</p>
              <p style={{ margin: 0 }}>4. Verify links before submitting.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .submit-grid {
          width: 100%;
          max-width: none;
          margin: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 12px;
          align-items: start;
        }
        @media (max-width: 1080px) {
          .submit-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .submit-fields-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
