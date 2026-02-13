"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BackgroundEffects from "../../components/BackgroundEffects";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Edit2, Send, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

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
        if (!email) {
            setError("Lutfen once e-posta adresinizi girin.");
            return;
        }
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
            if (res.ok) {
                setMessage("Dogrulama e-postasi tekrar gonderildi.");
                setResendCooldown(60);
            } else {
                setError(data.error || "Gonderim basarisiz oldu.");
            }
        } catch {
            setError("Gonderim basarisiz oldu. Baglantinizi kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Mevcut e-posta bilgisi bulunamadi.");
            return;
        }
        if (newEmail === email) {
            setIsEditing(false);
            return;
        }

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
                setMessage("E-posta guncellendi ve yeni dogrulama linki gonderildi.");

                const url = new URL(window.location.href);
                url.searchParams.set("email", newEmail);
                window.history.replaceState({}, "", url);
            } else {
                setError(data.error || "E-posta guncellenemedi.");
            }
        } catch {
            setError("E-posta guncellenemedi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "520px", width: "100%", position: "relative", zIndex: 10 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div style={{ textAlign: "center", marginBottom: "34px" }}>
                    <div
                        style={{
                            width: "74px",
                            height: "74px",
                            borderRadius: "20px",
                            background: "rgba(158, 240, 26, 0.12)",
                            border: "1px solid rgba(158, 240, 26, 0.22)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                            color: "#9ef01a",
                        }}
                    >
                        <Mail size={30} />
                    </div>

                    <h1 style={{ fontSize: "30px", fontWeight: "900", letterSpacing: "-0.02em", marginBottom: "10px" }}>
                        {isApprovalFlow ? "ONAY SIRASINDA" : "E-POSTA DOGRULAMA"}
                    </h1>
                    <p style={{ color: "#9098a7", fontSize: "14px", lineHeight: "1.65" }}>
                        {isApprovalFlow
                            ? "E-posta dogrulamaniz tamamlandi. Hesabiniz admin onayina dustu."
                            : "Gelen kutunuza giden linke tiklayarak hesabinizi aktif edin."}
                    </p>
                </div>

                {isApprovalFlow ? (
                    <div
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "22px",
                            padding: "26px",
                        }}
                    >
                        {email && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "11px", color: "#95a0b1", marginBottom: "4px" }}>Hesap</p>
                                <p style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>{email}</p>
                            </div>
                        )}

                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: "14px",
                                border: "1px solid rgba(158, 240, 26, 0.28)",
                                background: "rgba(158, 240, 26, 0.06)",
                                color: "#cbe896",
                                fontSize: "13px",
                                lineHeight: "1.6",
                            }}
                        >
                            Admin onayi tamamlandiginda giris yaparak dashboarda ulasabilirsiniz.
                        </div>

                        <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <Link
                                href="/auth/login"
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    background: "#fff",
                                    color: "#000",
                                    fontWeight: "800",
                                    textDecoration: "none",
                                }}
                            >
                                Giris Sayfasi
                            </Link>
                            <Link
                                href="/"
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    fontWeight: "700",
                                    textDecoration: "none",
                                }}
                            >
                                Ana Sayfa
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "22px",
                                padding: "24px",
                                marginBottom: "22px",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {!isEditing ? (
                                    <motion.div
                                        key="display"
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}
                                    >
                                        <div style={{ overflow: "hidden" }}>
                                            <p style={{ fontSize: "10px", fontWeight: "900", color: "var(--accent)", letterSpacing: "2px", marginBottom: "4px" }}>
                                                GONDERILEN ADRES
                                            </p>
                                            <p style={{ fontSize: "15px", fontWeight: "700", color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                                {email || "E-posta girilmedi"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "12px",
                                                padding: "10px",
                                                color: "#fff",
                                                cursor: "pointer",
                                            }}
                                            title="E-posta degistir"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="edit"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        onSubmit={handleUpdateEmail}
                                        style={{ display: "flex", gap: "10px" }}
                                    >
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                            placeholder="Yeni e-posta adresi"
                                            style={{
                                                flex: 1,
                                                background: "rgba(0,0,0,0.3)",
                                                border: "1px solid var(--accent)",
                                                borderRadius: "12px",
                                                padding: "12px 14px",
                                                color: "#fff",
                                                fontSize: "14px",
                                                outline: "none",
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            style={{
                                                background: "var(--accent)",
                                                border: "none",
                                                borderRadius: "12px",
                                                padding: "0 18px",
                                                color: "#000",
                                                fontWeight: "900",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            KAYDET
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div
                                        style={{
                                            padding: "14px",
                                            background: "rgba(158, 240, 26, 0.08)",
                                            border: "1px solid rgba(158, 240, 26, 0.24)",
                                            borderRadius: "14px",
                                            color: "#bfe97f",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginBottom: "14px",
                                        }}
                                    >
                                        <CheckCircle size={16} />
                                        {message}
                                    </div>
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div
                                        style={{
                                            padding: "14px",
                                            background: "rgba(255, 68, 68, 0.08)",
                                            border: "1px solid rgba(255, 68, 68, 0.24)",
                                            borderRadius: "14px",
                                            color: "#ff7373",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            marginBottom: "14px",
                                        }}
                                    >
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <button
                                onClick={handleResend}
                                disabled={loading || resendCooldown > 0}
                                className="glow-button"
                                style={{
                                    padding: "18px",
                                    width: "100%",
                                    borderRadius: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    fontSize: "13px",
                                    letterSpacing: "0.8px",
                                    opacity: loading || resendCooldown > 0 ? 0.6 : 1,
                                }}
                            >
                                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                {resendCooldown > 0 ? `Tekrar Gonder (${resendCooldown}s)` : "Dogrulama E-postasini Tekrar Gonder"}
                            </button>

                            <Link
                                href="/auth/login"
                                style={{
                                    padding: "16px",
                                    width: "100%",
                                    borderRadius: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    fontSize: "11px",
                                    fontWeight: "900",
                                    letterSpacing: "1.5px",
                                    color: "#99a3b5",
                                    textDecoration: "none",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.01)",
                                }}
                            >
                                GIRIS SAYFASINA DON <ArrowRight size={14} />
                            </Link>
                        </div>

                        <p style={{ marginTop: "22px", fontSize: "11px", color: "#687184", textAlign: "center", lineHeight: "1.6" }}>
                            Mail gelmediyse spam klasorunu kontrol edin.
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyPending() {
    return (
        <div
            style={{
                background: "#050607",
                color: "#fff",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <BackgroundEffects />
            <Suspense
                fallback={
                    <div style={{ color: "#444", fontWeight: "900", letterSpacing: "4px", fontSize: "10px" }}>
                        SYNCING_INTERFACE...
                    </div>
                }
            >
                <VerifyPendingContent />
            </Suspense>

            <style jsx global>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
