"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Edit2, Send, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cinematicAuthStyles } from "../cinematic-auth-styles";

function VerifyPendingContent() {
    const searchParams = useSearchParams();
    const flow = searchParams.get("step") || "verify";
    const isApprovalFlow = flow === "approval";

    const initialEmail = searchParams.get("email") || "";
    const [email, setEmail] = useState(initialEmail);
    const [isEditing, setIsEditing] = useState(false);
    const [newEmail, setNewEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleResend = async () => {
        if (!email) { setError("Please enter your email address first."); return; }
        if (resendCooldown > 0) return;
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) { setMessage("Verification email has been resent."); setResendCooldown(60); }
            else { setError(data.error || "Failed to send email."); }
        } catch { setError("Failed to send email. Please check your connection."); }
        finally { setLoading(false); }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!email) { setError("Current email information not found."); return; }
        if (newEmail === email) { setIsEditing(false); return; }
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch("/api/auth/update-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentEmail: email, newEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                setEmail(newEmail);
                setIsEditing(false);
                setMessage("Email updated and a new verification link has been sent.");
                const url = new URL(window.location.href);
                url.searchParams.set("email", newEmail);
                window.history.replaceState({}, "", url);
            } else { setError(data.error || "Failed to update email."); }
        } catch { setError("Failed to update email."); }
        finally { setLoading(false); }
    };

    return (
        <div className="ca-center" style={{ maxWidth: 480 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Icon + heading */}
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 18px", color: "rgba(255,255,255,0.5)",
                    }}>
                        <Mail size={26} />
                    </div>
                    <h1 style={{
                        fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8,
                        background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.45) 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                        {isApprovalFlow ? "Pending Approval" : "Email Verification"}
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.7 }}>
                        {isApprovalFlow
                            ? "Your email has been verified. Your account is now pending admin approval."
                            : "Click the link sent to your inbox to activate your account."}
                    </p>
                </div>

                {isApprovalFlow ? (
                    <div style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 18, padding: 22,
                    }}>
                        {email && (
                            <div style={{ marginBottom: 14 }}>
                                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 2, fontWeight: 700, marginBottom: 3 }}>ACCOUNT</p>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{email}</p>
                            </div>
                        )}
                        <div style={{
                            padding: "12px 14px", borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.02)",
                            color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6,
                        }}>
                            Once admin approval is complete, you can sign in and access your dashboard.
                        </div>
                        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                            <Link href="/auth/login" className="ca-success-btn" style={{ flex: 1, textAlign: "center" }}>
                                Try Sign In
                            </Link>
                            <Link href="/" style={{
                                flex: 1, padding: "12px 16px", borderRadius: 12, textAlign: "center",
                                border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
                                fontWeight: 600, textDecoration: "none", fontSize: 11,
                            }}>
                                Home
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Email display / edit */}
                        <div style={{
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 16, padding: 20, marginBottom: 18,
                        }}>
                            <AnimatePresence mode="wait">
                                {!isEditing ? (
                                    <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                                    >
                                        <div style={{ overflow: "hidden" }}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginBottom: 3 }}>SENT TO</p>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                                {email || "No email provided"}
                                            </p>
                                        </div>
                                        <button onClick={() => setIsEditing(true)} style={{
                                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 10, padding: 9, color: "rgba(255,255,255,0.4)", cursor: "pointer",
                                        }}>
                                            <Edit2 size={14} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                        onSubmit={handleUpdateEmail} style={{ display: "flex", gap: 8 }}
                                    >
                                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="New email"
                                            className="ca-field" style={{
                                                flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.15)",
                                                borderRadius: 10, padding: "11px 13px", color: "#fff", fontSize: 13, outline: "none",
                                            }}
                                        />
                                        <button type="submit" disabled={loading} className="ca-success-btn" style={{ padding: "0 16px", fontSize: 10 }}>
                                            SAVE
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Messages */}
                        <AnimatePresence>
                            {message && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                                    <div style={{
                                        padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 12, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600,
                                        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                                    }}>
                                        <CheckCircle size={14} /> {message}
                                    </div>
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                                    <div className="ca-error" style={{ marginBottom: 12 }}>{error}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button onClick={handleResend} disabled={loading || resendCooldown > 0} className="ca-submit"
                                style={{ opacity: loading || resendCooldown > 0 ? 0.4 : 1, display: "flex", gap: 8 }}
                            >
                                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Verification Email"}
                            </button>

                            <Link href="/auth/login" style={{
                                padding: 14, width: "100%", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                                color: "rgba(255,255,255,0.3)", textDecoration: "none",
                                border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)",
                            }}>
                                BACK TO SIGN IN <ArrowRight size={12} />
                            </Link>
                        </div>

                        <p style={{ marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
                            If you didn&apos;t receive the email, check your spam folder.
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyPending() {
    return (
        <div className="ca-root ca-centered">
            <div className="ca-grid" />
            <style jsx>{cinematicAuthStyles}</style>
            <Suspense fallback={<div style={{ color: "rgba(255,255,255,0.1)", fontWeight: 700, letterSpacing: 4, fontSize: 9 }}>LOADING...</div>}>
                <VerifyPendingContent />
            </Suspense>
            <style jsx global>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
