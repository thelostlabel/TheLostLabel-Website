"use client";
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);
const CHANGELOG_STORAGE_PREFIX = 'seenChangelog';
const CHANGELOG_DELAY_MS = 1200;
const changelogData = {
    id: 'changelog-2026-03-10-v3',
    eyebrow: 'Portal Update',
    title: "What's New in the Dashboard",
    description: 'A few improvements just shipped to make the artist portal cleaner, safer, and easier to manage.',
    items: [
        'Contract access rules are now stricter for better account security.',
        'PDF viewing and document handling are more stable across the portal.',
        'Deployment tooling was optimized for faster pnpm-based releases.',
        'Admin-side data filters were refined for cleaner management workflows.'
    ]
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export const ToastProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [toasts, setToasts] = useState([]);
    const [confirm, setConfirm] = useState(null);
    const [changelog, setChangelog] = useState(null);
    const currentUserId = session?.user?.id || null;
    const isDashboardRoute = pathname?.startsWith('/dashboard');

    const changelogStorageKey = useMemo(() => {
        if (!currentUserId) return null;
        return `${CHANGELOG_STORAGE_PREFIX}:${currentUserId}:${changelogData.id}`;
    }, [currentUserId]);

    const activeChangelog = currentUserId && isDashboardRoute && changelog?.userId === currentUserId
        ? changelog
        : null;

    useEffect(() => {
        if (status === 'loading') return;
        if (!currentUserId || !isDashboardRoute || !changelogStorageKey) return;

        const hasSeenChangelog = localStorage.getItem(changelogStorageKey) === '1';
        if (hasSeenChangelog || activeChangelog) return;

        const timer = setTimeout(() => {
            setChangelog({
                ...changelogData,
                userId: currentUserId
            });
        }, CHANGELOG_DELAY_MS);

        return () => clearTimeout(timer);
    }, [activeChangelog, changelogStorageKey, currentUserId, isDashboardRoute, status]);

    const closeChangelog = useCallback(() => {
        setChangelog(null);
        if (changelogStorageKey) {
            localStorage.setItem(changelogStorageKey, '1');
        }
    }, [changelogStorageKey]);

    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback((title, message, onConfirm, onCancel) => {
        setConfirm({ title, message, onConfirm, onCancel });
    }, []);

    const handleConfirm = () => {
        if (confirm?.onConfirm) confirm.onConfirm();
        setConfirm(null);
    };

    const handleCancel = () => {
        if (confirm?.onCancel) confirm.onCancel();
        setConfirm(null);
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast, showConfirm }}>
            {children}
            <AnimatePresence>
                {activeChangelog && (
                    <ChangelogCard
                        {...activeChangelog}
                        onClose={closeChangelog}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        title={confirm.title}
                        message={confirm.message}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                )}
            </AnimatePresence>
            <div style={{
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none'
            }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ id, message, type, onRemove }) => {
    const icons = {
        success: <CheckCircle size={18} color="#00ff88" />,
        error: <AlertCircle size={18} color="#ff4444" />,
        warning: <AlertTriangle size={18} color="#ffaa00" />,
        info: <Info size={18} color="#00aaff" />
    };

    const colors = {
        success: 'rgba(0, 255, 136, 0.1)',
        error: 'rgba(255, 68, 68, 0.1)',
        warning: 'rgba(255, 170, 0, 0.1)',
        info: 'rgba(0, 170, 255, 0.1)'
    };

    const borders = {
        success: 'rgba(0, 255, 136, 0.2)',
        error: 'rgba(255, 68, 68, 0.2)',
        warning: 'rgba(255, 170, 0, 0.2)',
        info: 'rgba(0, 170, 255, 0.2)'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            style={{
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${borders[type]}`,
                padding: '16px 20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                minWidth: '300px',
                maxWidth: '450px',
                pointerEvents: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '4px',
                background: type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00aaff',
                opacity: 0.5
            }} />

            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: colors[type],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {icons[type]}
            </div>

            <div style={{ flex: 1 }}>
                <p style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    margin: 0,
                    lineHeight: '1.4'
                }}>
                    {message}
                </p>
            </div>

            <button
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#444',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                    background: '#0a0a0b',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '450px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                }}
            >
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 25px'
                }}>
                    <AlertTriangle size={24} color="#ff4444" />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '35px' }}>{message}</p>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#666',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        ABORT_ACTION
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: '#ff4444',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(255, 68, 68, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        CONFIRM_EXECUTE
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ChangelogCard = ({ eyebrow, title, description, items, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'rgba(0, 0, 0, 0.72)',
                backdropFilter: 'blur(16px)',
                pointerEvents: 'auto'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.97 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                    position: 'relative',
                    width: 'min(560px, 100%)',
                    maxHeight: 'min(720px, calc(100vh - 48px))',
                    overflowY: 'auto',
                    background: 'linear-gradient(180deg, rgba(18, 18, 20, 0.98) 0%, rgba(10, 10, 11, 0.98) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '28px',
                    padding: '28px',
                    boxShadow: '0 40px 120px rgba(0, 0, 0, 0.55)'
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '28px',
                    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 36%)',
                    pointerEvents: 'none'
                }} />

                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '18px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Sparkles size={22} color="#F5F5F5" />
                        </div>
                        <div>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: 'rgba(255,255,255,0.48)',
                                letterSpacing: '0.16em',
                                textTransform: 'uppercase',
                                marginBottom: '8px'
                            }}>
                                {eyebrow}
                            </div>
                            <h3 style={{
                                fontSize: 'clamp(24px, 4vw, 30px)',
                                fontWeight: '900',
                                color: '#fff',
                                margin: 0,
                                lineHeight: '1.05',
                                letterSpacing: '-0.03em'
                            }}>
                                {title}
                            </h3>
                            <p style={{
                                margin: '12px 0 0',
                                fontSize: '14px',
                                lineHeight: '1.7',
                                color: 'rgba(255,255,255,0.68)',
                                maxWidth: '420px'
                            }}>
                                {description}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.55)',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + index * 0.07 }}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <div style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '999px',
                                background: '#FFFFFF',
                                opacity: 0.9,
                                marginTop: '6px',
                                flexShrink: 0
                            }} />
                            <span style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.84)',
                                lineHeight: '1.55'
                            }}>
                                {item}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <div style={{
                    position: 'relative',
                    marginTop: '24px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.42)',
                        lineHeight: '1.5'
                    }}>
                        Once dismissed, this update will stay hidden for this account on this browser.
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F5F5F5',
                            border: 'none',
                            color: '#090909',
                            cursor: 'pointer',
                            padding: '12px 18px',
                            borderRadius: '14px',
                            fontSize: '12px',
                            fontWeight: '900',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                        }}
                    >
                        Got It
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
