"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import NextImage from "next/image";
import Link from "next/link";
import { AlertCircle, Music, Trash2, Upload, Play, Pause, ExternalLink } from "lucide-react";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import { usePublicSettings } from "@/app/components/PublicSettingsContext";

export function ReleasesView({
  stats,
  showToast,
  onOpenSupport,
  onOpenProfile,
  shared,
}) {
  const {
    DASHBOARD_THEME,
    glassStyle,
    btnStyle,
    getBaseTitle,
    resolveImageSrc,
    handleImageError,
  } = shared;
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(null);
  const [requestType, setRequestType] = useState("question");
  const [requestDetails, setRequestDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    void fetchReleases();
  }, []);

  const fetchReleases = async () => {
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

  const handleRequestSubmit = async () => {
    if (!requestDetails.trim()) {
      if (showToast) showToast("Please provide details for your request.", "warning");
      else alert("Please provide details for your request.");
      return;
    }

    setSubmitting(true);
    try {
      await dashboardRequestJson("/api/artist/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: requestModal.releaseId,
          type: requestType,
          details: requestDetails,
        }),
        context: "create release request",
        retry: false,
      });
      if (showToast) showToast("Request submitted successfully!", "success");
      else alert("Request submitted successfully!");
      setRequestModal(null);
      setRequestDetails("");
      await fetchReleases();
    } catch (e) {
      const message = getDashboardErrorMessage(e, "Request failed");
      if (showToast) showToast(message, "error");
      else alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRequestStatus = (release) => {
    if (!release.requests || release.requests.length === 0) return null;
    const sorted = [...release.requests].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
    const active = sorted.find((request) => request.status !== "rejected");
    return active || sorted[0];
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: DASHBOARD_THEME.muted }}>
        Loading releases...
      </div>
    );
  }

  return (
    <div>
      {requestModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          <div style={{ ...glassStyle, padding: "30px", width: "450px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "10px", letterSpacing: "2px", fontWeight: "800" }}>
              REQUEST CHANGE
            </h3>
            <p style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, marginBottom: "25px", letterSpacing: "0.6px" }}>
              FOR: <strong style={{ color: "#fff" }}>{requestModal.releaseName.toUpperCase()}</strong>
            </p>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontSize: "12px", color: DASHBOARD_THEME.muted, marginBottom: "5px", fontWeight: "800" }}>
                REQUEST TYPE
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                style={{ width: "100%", padding: "10px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: "#fff", fontSize: "13px", borderRadius: "8px" }}
              >
                <option value="question">Question / Help / Support</option>
                <option value="cover_art">Update Cover Art</option>
                <option value="audio">Update Audio File</option>
                <option value="delete">Request Takedown (Delete)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", fontSize: "12px", color: DASHBOARD_THEME.muted, marginBottom: "5px", fontWeight: "800" }}>
                DETAILS / LINKS
              </label>
              <textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Describe your request. For files, provide a Dropbox/Drive link."
                rows={4}
                style={{ width: "100%", padding: "10px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: "#fff", resize: "vertical", borderRadius: "8px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleRequestSubmit} disabled={submitting} style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#0B0F1A", border: "none", justifyContent: "center", flex: 1, padding: "12px" }}>
                {submitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
              </button>
              <button onClick={() => setRequestModal(null)} style={{ ...btnStyle, flex: 1, padding: "12px" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {error === "Spotify URL not set" ? (
        <div style={{ textAlign: "center", padding: "80px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", background: "rgba(255,255,255,0.01)" }}>
          <AlertCircle size={40} color="var(--accent)" style={{ marginBottom: "20px", opacity: 0.5 }} />
          <p style={{ fontSize: "12px", letterSpacing: "2px", fontWeight: "900", color: "#fff" }}>SPOTIFY_PROFILE_REQUIRED</p>
          <p style={{ fontSize: "10px", marginTop: "10px", color: "#666", maxWidth: "400px", margin: "15px auto", lineHeight: "1.6" }}>
            To sync your catalog, please add your Spotify Artist URL in the Profile tab. This allows us to link your releases to your dashboard.
          </p>
          <button
            onClick={onOpenProfile}
            style={{ ...btnStyle, background: "var(--accent)", color: "#0B0F1A", border: "none", padding: "12px 30px", marginTop: "10px" }}
          >
            GO TO PROFILE
          </button>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--status-error)" }}>
          <p style={{ fontSize: "12px", letterSpacing: "2px", fontWeight: "900" }}>ERROR: {error.toUpperCase()}</p>
          <button onClick={fetchReleases} style={{ ...btnStyle, marginTop: "20px" }}>RETRY_SYNC</button>
        </div>
      ) : releases.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: "#444" }}>
          <p style={{ fontSize: "12px", letterSpacing: "2px" }}>NO RELEASES FOUND</p>
          <p style={{ fontSize: "10px", marginTop: "10px", color: "#666" }}>Your releases will appear here once distributed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {(() => {
            const groups = releases.reduce((acc, release) => {
              const base = getBaseTitle(release.name);
              if (!acc[base]) acc[base] = [];
              acc[base].push(release);
              return acc;
            }, {});

            const groupEntries = Object.entries(groups).sort((a, b) => {
              const dateA = new Date(Math.max(...a[1].map((release) => new Date(release.releaseDate))));
              const dateB = new Date(Math.max(...b[1].map((release) => new Date(release.releaseDate))));
              return dateB - dateA;
            });

            const upcomingGroups = groupEntries.filter(([, groupReleases]) =>
              groupReleases.some((release) => new Date(release.releaseDate) > new Date()),
            );

            const pastGroups = groupEntries.filter(([, groupReleases]) =>
              groupReleases.every((release) => new Date(release.releaseDate) <= new Date()),
            );

            return (
              <>
                {upcomingGroups.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--accent)", fontWeight: "900", marginBottom: "20px", borderLeft: "3px solid var(--accent)", paddingLeft: "12px" }}>
                      UPCOMING_DROPS
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
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
                  <h3 style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", fontWeight: "900", marginBottom: "20px", borderLeft: "3px solid #333", paddingLeft: "12px" }}>
                    DISCOGRAPHY
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
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
                    <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.01)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <p style={{ fontSize: "10px", letterSpacing: "2px", color: "#444", fontWeight: "800" }}>NO RELEASES FOUND IN DISCOGRAPHY</p>
                    </div>
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

function ReleaseCard({ release, versions = [], stats, getRequestStatus, setRequestModal, onNavigate, shared }) {
  const {
    glassStyle,
    btnStyle,
    getBaseTitle,
    resolveImageSrc,
    handleImageError,
  } = shared;
  const activeRequest = getRequestStatus(release);
  const baseTitle = getBaseTitle(release.name);
  const hasMultiple = versions.length > 1;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px", transition: "border-color 0.18s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ width: "100%", aspectRatio: "1/1", background: "#000", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
        {release.image ? (
          <NextImage
            src={resolveImageSrc(release.image, release.id)}
            alt={release.name}
            width={300}
            height={300}
            unoptimized
            onError={handleImageError}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
            <NextImage
              src={resolveImageSrc(stats?.artistImage)}
              alt={release.name}
              width={300}
              height={300}
              unoptimized
              onError={handleImageError}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
            />
          </div>
        )}
        {hasMultiple && (
          <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "#000", padding: "4px 8px", borderRadius: "2px", fontSize: "9px", fontWeight: "900", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
            {versions.length} VERSIONS
          </div>
        )}
      </div>
      <div>
        <h3 style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 3px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{baseTitle.toUpperCase()}</h3>
        <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>
          {release.type?.toUpperCase()} · {new Date(release.releaseDate || release.createdAt).toLocaleDateString()}
        </p>
      </div>

      {(() => {
        if (activeRequest) {
          const isApproved = activeRequest.status === "approved" || activeRequest.status === "completed";
          const isRejected = activeRequest.status === "rejected";

          const getStatusLabel = (status) => {
            if (status === "approved") return "APPROVED";
            if (status === "processing") return "PROCESSING";
            if (status === "reviewing") return "UNDER REVIEW";
            if (status === "completed") return "COMPLETED";
            if (status === "rejected") return "REJECTED";
            return "PENDING";
          };

          const getStatusColor = (status) => {
            if (status === "approved" || status === "completed") return "var(--status-success)";
            if (status === "processing") return "var(--status-info)";
            if (status === "reviewing") return "var(--status-warning)";
            if (status === "rejected") return "var(--status-error)";
            return "var(--status-neutral)";
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.01)",
                  border: `1px solid ${isApproved ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "9px", color: getStatusColor(activeRequest.status), fontWeight: "900", letterSpacing: "1px" }}>
                    {getStatusLabel(activeRequest.status)}
                  </span>
                  <span style={{ fontSize: "8px", color: "#444" }}>{new Date(activeRequest.updatedAt).toLocaleDateString()}</span>
                </div>

                <div style={{ fontSize: "11px", color: "#fff", fontWeight: "800", marginBottom: "4px" }}>
                  {activeRequest.type.toUpperCase().replace("_", " ")} CHANGE
                </div>

                {activeRequest.adminNote && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#888",
                      lineHeight: "1.4",
                    }}
                  >
                    <strong style={{ color: "#aaa", fontSize: "8px", display: "block", marginBottom: "2px" }}>NOTE:</strong>
                    {activeRequest.adminNote}
                  </div>
                )}

                {!isRejected && !isApproved && activeRequest.status !== "completed" && (
                  <div style={{ fontSize: "9px", color: "#444", marginTop: "8px", fontStyle: "italic" }}>
                    Request is being reviewed by the team.
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigate(activeRequest.id)}
                style={{ ...btnStyle, width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", color: "#fff" }}
              >
                VIEW CONVERSATION
              </button>
            </div>
          );
        }

        return (
          <button
            onClick={() => setRequestModal({ releaseId: release.id, releaseName: release.name })}
            style={{ ...btnStyle, width: "100%", padding: "10px" }}
          >
            REQUEST CHANGE
          </button>
        );
      })()}
    </div>
  );
}

export function DemosView({ demos, onNavigate, onDelete, shared }) {
  const { DASHBOARD_THEME, glassStyle, btnStyle } = shared;
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const getStatusColor = (status) => {
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

  const handlePlay = (demo) => {
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
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const getDemoAudioAvailable = (demo) => Boolean(demo.files?.[0] || demo.trackLink);

  return (
    <div>
      <audio ref={audioRef} playsInline onEnded={() => setPlayingId(null)} style={{ display: "none" }} />
      {demos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: DASHBOARD_THEME.muted }}>
          <p style={{ fontSize: "12px", letterSpacing: "1px", marginBottom: "20px" }}>NO DEMOS SUBMITTED YET</p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate(null)}
            style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#071311", border: "none", padding: "12px 30px" }}
          >
            SUBMIT YOUR FIRST DEMO
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {demos.map((demo) => (
            <div
              key={demo.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "border-color 0.18s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {/* Status bar */}
              <div style={{ width: "3px", alignSelf: "stretch", borderRadius: "999px", background: getStatusColor(demo.status), flexShrink: 0 }} />

              {/* Play button */}
              {getDemoAudioAvailable(demo) ? (
                <button
                  type="button"
                  onClick={() => handlePlay(demo)}
                  style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    border: `1px solid ${playingId === demo.id ? "rgba(255,255,255,0.2)" : "var(--border)"}`,
                    background: playingId === demo.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0,
                    transition: "all 0.18s ease",
                  }}
                >
                  {playingId === demo.id ? <Pause size={13} /> : <Play size={13} />}
                </button>
              ) : (
                <div style={{ width: "34px", flexShrink: 0 }} />
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                <p style={{ margin: 0, fontSize: "11px", color: "#555", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span>{demo.genre || "No genre"}</span>
                  <span>·</span>
                  <span>{new Date(demo.createdAt).toLocaleDateString()}</span>
                  {demo.files?.length > 0 && (
                    <><span>·</span><span>{demo.files.length} file{demo.files.length > 1 ? "s" : ""}</span></>
                  )}
                </p>
                {demo.status === "rejected" && demo.rejectionReason && (
                  <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "8px", maxWidth: "460px" }}>
                    <p style={{ margin: "0 0 2px 0", fontSize: "9px", color: "#ef4444", fontWeight: 900, letterSpacing: "0.8px" }}>REJECTION REASON</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#ddd", lineHeight: 1.5 }}>{demo.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Actions + Status */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{
                  fontSize: "9px", fontWeight: 900, letterSpacing: "1px",
                  color: getStatusColor(demo.status),
                  padding: "4px 10px",
                  border: `1px solid ${getStatusColor(demo.status)}40`,
                  borderRadius: "999px",
                }}>
                  {demo.status.toUpperCase()}
                </span>
                {demo.trackLink && (
                  <a
                    href={demo.trackLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...btnStyle, padding: "6px 12px", fontSize: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", textDecoration: "none", color: DASHBOARD_THEME.muted }}
                  >
                    LINK
                  </a>
                )}
                <Link
                  href={`/dashboard/demo/${demo.id}`}
                  style={{ ...btnStyle, padding: "6px 12px", fontSize: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", textDecoration: "none", color: "#fff" }}
                >
                  VIEW
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(demo.id, demo.title)}
                    style={{ width: "30px", height: "30px", background: "transparent", border: "none", color: "#444", cursor: "pointer", display: "grid", placeItems: "center", borderRadius: "6px", transition: "color 0.18s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
}) {
  const { DASHBOARD_THEME, glassStyle } = shared;
  const publicSettings = usePublicSettings();
  const genres = publicSettings.genres?.length ? publicSettings.genres : ["Hip-Hop", "R&B", "Pop", "Electronic", "Other"];

  const labelStyle = { display: "block", fontSize: "12px", letterSpacing: "0.8px", color: DASHBOARD_THEME.muted, marginBottom: "8px", fontWeight: "950" };
  const inputStyle = { width: "100%", padding: "14px 18px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "8px", color: "#fff", fontSize: "12px", outline: "none", transition: "border-color 0.2s" };
  const selectedGenreLabel = genre || "Not selected";
  const fileCount = files.length;
  const totalFileSizeMb = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0) / (1024 * 1024);
  const isReadyToSubmit = Boolean(title.trim()) && (fileCount > 0 || trackLink.trim());

  return (
    <form onSubmit={handleSubmit}>
      <div className="submit-grid">
        <div style={{ ...glassStyle, padding: "28px" }}>
          <div style={{ marginBottom: "22px" }}>
            <p style={{ fontSize: "11px", color: DASHBOARD_THEME.muted, letterSpacing: "1.1px", fontWeight: "900", margin: 0 }}>NEW SUBMISSION</p>
            <h3 style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "900", color: "#fff" }}>Release Delivery Form</h3>
          </div>

          <div className="submit-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>TRACK_TITLE *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>GENRE / VIBE</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle}>
                <option value="">Select Genre</option>
                {genres.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>TRACK_LINK (OPTIONAL)</label>
            <input type="url" value={trackLink} onChange={(e) => setTrackLink(e.target.value)} placeholder="https://soundcloud.com/..." style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>MESSAGE_FOR_AR (OPTIONAL)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about this record..." rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: "1.45", paddingTop: "12px", paddingBottom: "12px" }} />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>MASTERED_AUDIO (WAV ONLY) *</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${dragActive ? DASHBOARD_THEME.accent : "rgba(255,255,255,0.14)"}`,
                padding: "28px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragActive ? "rgba(209,213,219,0.06)" : "rgba(255,255,255,0.02)",
                borderRadius: "10px",
                transition: "all 0.22s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
              }}
            >
              <Upload size={22} style={{ color: dragActive ? "#e5e7eb" : "#555", flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "#c9c9c9", fontSize: "12px", fontWeight: 700, margin: 0 }}>
                  {dragActive ? "Drop WAV file here" : "Drag & drop WAV files or click to browse"}
                </p>
                <p style={{ color: "#555", fontSize: "10px", fontWeight: 600, margin: "3px 0 0 0" }}>
                  Multiple files supported · WAV format only
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".wav" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
                {files.map((file, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{ padding: "7px", background: "rgba(255,255,255,0.08)", color: "#d1d5db", borderRadius: "8px" }}>
                        <Music size={14} />
                      </div>
                      <span style={{ fontSize: "11px", color: "#fff", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name} <span style={{ color: DASHBOARD_THEME.muted, marginLeft: "6px" }}>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      </span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(index); }} style={{ background: "transparent", border: "none", color: DASHBOARD_THEME.muted, cursor: "pointer", padding: "5px" }}>
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
                  <span style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "0.8px", color: DASHBOARD_THEME.accent }}>UPLOADING TRACK...</span>
                  <span style={{ fontSize: "12px", fontWeight: "900", color: "#fff" }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
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
          <div style={{ ...glassStyle, padding: "20px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", fontWeight: "900", letterSpacing: "1px" }}>SUBMISSION STATUS</p>
            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#d1d5db" }}>Title</span>
                <span style={{ color: title.trim() ? "#fff" : "#6b7280", fontWeight: "800" }}>{title.trim() ? "Ready" : "Missing"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#d1d5db" }}>Genre</span>
                <span style={{ color: "#fff", fontWeight: "800" }}>{selectedGenreLabel}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#d1d5db" }}>Audio Files</span>
                <span style={{ color: "#fff", fontWeight: "800" }}>{fileCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#d1d5db" }}>Total Size</span>
                <span style={{ color: "#fff", fontWeight: "800" }}>{totalFileSizeMb.toFixed(1)} MB</span>
              </div>
            </div>
            <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${isReadyToSubmit ? "rgba(34,197,94,0.35)" : DASHBOARD_THEME.border}`, background: isReadyToSubmit ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)", fontSize: "11px", fontWeight: "800", color: isReadyToSubmit ? "#bbf7d0" : "#9ca3af" }}>
              {isReadyToSubmit ? "Ready to submit" : "Add title + audio file or track link"}
            </div>
          </div>

          <div style={{ ...glassStyle, padding: "20px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", fontWeight: "900", letterSpacing: "1px" }}>RECOMMENDED CHECKLIST</p>
            <div style={{ marginTop: "12px", display: "grid", gap: "8px", fontSize: "12px", color: "#d1d5db" }}>
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
