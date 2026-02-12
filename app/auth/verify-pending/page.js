
"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BackgroundEffects from '../../components/BackgroundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Edit2, Send, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function VerifyPendingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [isEditing, setIsEditing] = useState(false);
    const [newEmail, setNewEmail] = useState(email);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Professional verification link resent! Please check your inbox.");
                setResendCooldown(60);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to resend. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (newEmail === email) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/update-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentEmail: email, newEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setEmail(newEmail);
                setIsEditing(false);
                setMessage("Email updated successfully! A new link has been sent to your new address.");
                // Update URL without refreshing
                const url = new URL(window.location);
                url.searchParams.set('email', newEmail);
                window.history.pushState({}, '', url);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to update email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', width: '100%', position: 'relative', zIndex: 10 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Icon Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'rgba(158, 240, 26, 0.1)',
                        border: '1px solid rgba(158, 240, 26, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#9ef01a'
                    }}>
                        <Mail size={32} />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                        VERIFY YOUR <span style={{ color: 'var(--accent)' }}>EMAIL.</span>
                    </h1>
                    <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', letterSpacing: '0.5px' }}>
                        We&apos;ve sent a premium verification link to your inbox. Please confirm your identity to activate your artist portal.
                    </p>
                </div>

                {/* Email Display / Edit Box */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '30px',
                    marginBottom: '30px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <AnimatePresence mode="wait">
                        {!isEditing ? (
                            <motion.div
                                key="display"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '4px' }}>SENDING TO</p>
                                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{email}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '10px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    title="Edit Email"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="edit"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleUpdateEmail}
                                style={{ display: 'flex', gap: '12px' }}
                            >
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                    style={{
                                        flex: 1,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--accent)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    placeholder="Enter new email"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        background: 'var(--accent)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '0 20px',
                                        color: '#000',
                                        fontWeight: '900',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    SAVE
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{
                                padding: '16px',
                                background: 'rgba(158, 240, 26, 0.05)',
                                border: '1px solid rgba(158, 240, 26, 0.2)',
                                borderRadius: '16px',
                                color: '#9ef01a',
                                fontSize: '13px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <CheckCircle size={18} />
                                {message}
                            </div>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{
                                padding: '16px',
                                background: 'rgba(255, 68, 68, 0.05)',
                                border: '1px solid rgba(255, 68, 68, 0.2)',
                                borderRadius: '16px',
                                color: '#ff4444',
                                fontSize: '13px',
                                fontWeight: '700',
                                marginBottom: '20px'
                            }}>
                                {error.toUpperCase()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        onClick={handleResend}
                        disabled={loading || resendCooldown > 0}
                        className="glow-button"
                        style={{
                            padding: '20px',
                            width: '100%',
                            borderRadius: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontSize: '13px',
                            letterSpacing: '1px',
                            opacity: (loading || resendCooldown > 0) ? 0.6 : 1
                        }}
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        {resendCooldown > 0 ? `COOLDOWN (${resendCooldown}s)` : 'RESEND VERIFICATION'}
                    </button>

                    <Link
                        href="/auth/login"
                        style={{
                            padding: '18px',
                            width: '100%',
                            borderRadius: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '2px',
                            color: '#666',
                            textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.03)',
                            background: 'rgba(255,255,255,0.01)',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                    >
                        ALREADY VERIFIED? PROCEED TO LOGIN <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Support Info */}
                <p style={{ marginTop: '40px', fontSize: '11px', color: '#444', textAlign: 'center', lineHeight: '1.6' }}>
                    Didn&apos;t receive the email? Check your junk/spam folder.<br />
                    If you&apos;re still having trouble, contact our support collective.
                </p>
            </motion.div>
        </div>
    );
}

export default function VerifyPending() {
    return (
        <div style={{
            background: '#050607',
            color: '#fff',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <BackgroundEffects />
            <Suspense fallback={<div style={{ color: '#444', fontWeight: '900', letterSpacing: '4px', fontSize: '10px' }}>SYNCING_INTERFACE...</div>}>
                <VerifyPendingContent />
            </Suspense>

            <style jsx global>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
