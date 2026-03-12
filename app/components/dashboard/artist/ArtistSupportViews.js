"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";

import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";

export function SupportView({
  requests,
  selectedId,
  currentUser,
  onNavigate,
  onRefresh,
  showToast,
  shared,
}) {
  const { DASHBOARD_THEME, glassStyle, btnStyle, inputStyle } = shared;
  const selectedRequest = requests.find((request) => request.id === selectedId);
  const [isCreating, setIsCreating] = useState(false);

  if (selectedRequest) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <button
          onClick={() => onNavigate(null)}
          style={{ ...btnStyle, alignSelf: "flex-start", background: "transparent" }}
        >
          <ArrowLeft size={14} /> BACK TO SUPPORT
        </button>

        <div style={{ ...glassStyle, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "25px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--accent)", fontWeight: "900", letterSpacing: "2px", marginBottom: "5px" }}>
                {selectedRequest.type.toUpperCase().replace("_", " ")} CHANGE
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "800" }}>{selectedRequest.release?.name || "Support Ticket"}</h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, fontWeight: "800" }}>STATUS</div>
              <div style={{ fontSize: "12px", fontWeight: "900", color: "#fff" }}>{selectedRequest.status.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ height: "600px", display: "flex", flexDirection: "column" }}>
            <RequestComments
              request={selectedRequest}
              currentUser={currentUser}
              inputStyle={inputStyle}
              shared={shared}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <button
          onClick={() => setIsCreating(false)}
          style={{ ...btnStyle, alignSelf: "flex-start", background: "transparent" }}
        >
          <ArrowLeft size={14} /> CANCEL
        </button>
        <div style={glassStyle}>
          <div style={{ padding: "25px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <h3 style={{ fontSize: "12px", letterSpacing: "2px", fontWeight: "900" }}>
              CREATE_NEW_SUPPORT_TICKET
            </h3>
          </div>
          <CreateSupportForm
            onToast={showToast}
            onComplete={async () => {
              setIsCreating(false);
              onNavigate(null);
              if (onRefresh) await onRefresh();
            }}
            shared={shared}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <button
          onClick={() => setIsCreating(true)}
          style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#071311", border: "none" }}
        >
          + NEW SUPPORT TICKET
        </button>
      </div>
      {requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px", ...glassStyle }}>
          <p style={{ fontSize: "12px", letterSpacing: "1px", color: DASHBOARD_THEME.muted }}>
            NO ACTIVE SUPPORT REQUESTS
          </p>
        </div>
      ) : (
        requests.map((request) => (
          <div
            key={request.id}
            onClick={() => onNavigate(request.id)}
            style={{
              ...glassStyle,
              padding: "20px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.2s",
              background: DASHBOARD_THEME.surfaceElevated,
            }}
            className="support-item"
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.06)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={16} color={DASHBOARD_THEME.muted} />
              </div>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
                  {request.release?.name || "Support Ticket"}
                </h4>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: "900", color: "var(--accent)", letterSpacing: "1px" }}>
                    {request.type.toUpperCase().replace("_", " ")}
                  </span>
                  <span style={{ fontSize: "10px", color: DASHBOARD_THEME.muted }}>•</span>
                  <div style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>
                    {request.details}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
              <span style={{ fontSize: "12px", color: DASHBOARD_THEME.muted }}>{new Date(request.createdAt).toLocaleDateString()}</span>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: request.status === "completed" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.08)",
                  color: request.status === "completed" ? DASHBOARD_THEME.success : DASHBOARD_THEME.muted,
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                {request.status === "pending" ? "OPEN" : request.status.toUpperCase()}
              </div>
            </div>
          </div>
        ))
      )}
      <style jsx>{`
        .support-item:hover {
          background: ${DASHBOARD_THEME.surfaceSoft} !important;
          border-color: ${DASHBOARD_THEME.borderStrong} !important;
        }
      `}</style>
    </div>
  );
}

function CreateSupportForm({ onComplete, onToast, shared }) {
  const { DASHBOARD_THEME, btnStyle } = shared;
  const [type, setType] = useState("general_support");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const labelStyle = { display: "block", fontSize: "12px", letterSpacing: "0.8px", color: DASHBOARD_THEME.muted, marginBottom: "8px", fontWeight: "900" };
  const inputStyle = { width: "100%", padding: "14px 18px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none" };

  const handleSubmit = async (e) => {
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
      if (onToast) onToast("Support ticket created.", "success");
      onComplete();
    } catch (e) {
      const message = getDashboardErrorMessage(e, "An error occurred");
      if (onToast) onToast(message, "error");
      else alert(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>REQUEST_TYPE</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          <option value="general_support">GENERAL SUPPORT</option>
          <option value="metadata_correction">METADATA CORRECTION</option>
          <option value="technical_issue">TECHNICAL ISSUE</option>
          <option value="earnings_billing">EARNINGS / BILLING</option>
          <option value="take_down">TAKE DOWN REQUEST</option>
          <option value="marketing_request">MARKETING REQUEST</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>DETAILS_AND_MESSAGE</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe your issue in detail..."
          required
          rows={6}
          style={{ ...inputStyle, resize: "none" }}
        />
      </div>
      <button
        type="submit"
        disabled={sending || !details.trim()}
        style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#071311", border: "none", justifyContent: "center", height: "50px", marginTop: "10px" }}
      >
        {sending ? "SUBMITTING..." : "OPEN TICKET"}
      </button>
    </form>
  );
}

function RequestComments({ request, currentUser, inputStyle, shared }) {
  const { DASHBOARD_THEME, btnStyle } = shared;
  const requestId = request.id;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await dashboardRequestJson(`/api/requests/${requestId}/comments`, {
        context: "support comments",
      });
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      const data = await dashboardRequestJson(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        context: "post support comment",
        retry: false,
      });
      setComments([...comments, data]);
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <DashboardLoader label="LOADING CONVERSATION" subLabel="Fetching support thread messages..." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", padding: "30px" }}>
        <div style={{ alignSelf: "center", margin: "20px 0", textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: "900", color: DASHBOARD_THEME.muted, letterSpacing: "1px" }}>CONVERSATION_STARTED</div>
          <div style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, marginTop: "5px" }}>{new Date(request.createdAt).toLocaleString()}</div>
        </div>

        <div style={{ alignSelf: "flex-end", maxWidth: "70%", background: DASHBOARD_THEME.accent, color: "#041311", padding: "15px 20px", borderRadius: "15px 15px 2px 15px", border: "1px solid rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", lineHeight: "1.5" }}>{request.details}</div>
          <div style={{ fontSize: "8px", opacity: 0.5, marginTop: "8px", fontWeight: "900", textAlign: "right" }}>YOU (INITIAL)</div>
        </div>

        {comments.map((comment) => {
          const isMe = comment.userId === currentUser?.id;
          const isStaff = comment.user.role === "admin" || comment.user.role === "a&r";

          return (
            <div
              key={comment.id}
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                maxWidth: "70%",
                background: isMe ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                padding: "15px 20px",
                borderRadius: isMe ? "15px 15px 2px 15px" : "15px 15px 15px 2px",
                border: `1px solid ${DASHBOARD_THEME.border}`,
              }}
            >
              {!isMe && (
                <div style={{ fontSize: "12px", fontWeight: "900", color: isStaff ? DASHBOARD_THEME.accent : DASHBOARD_THEME.muted, marginBottom: "8px", letterSpacing: "0.8px" }}>
                  {comment.user.stageName?.toUpperCase() || "EXTERNAL"} {isStaff ? "(STAFF)" : ""}
                </div>
              )}
              <div style={{ fontSize: "12px", lineHeight: "1.6", color: isMe ? "#fff" : "#d6dbea" }}>{comment.content}</div>
              <div style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, marginTop: "10px", fontWeight: "800", textAlign: isMe ? "right" : "left" }}>
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} style={{ padding: "30px", borderTop: "1px solid rgba(255,255,255,0.08)", background: DASHBOARD_THEME.surface, display: "flex", gap: "15px" }}>
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your message..." style={{ ...inputStyle, flex: 1 }} />
        <button disabled={sending || !newComment.trim()} style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#071311", border: "none", padding: "0 25px" }}>
          {sending ? "..." : "SEND"}
        </button>
      </form>
    </div>
  );
}
