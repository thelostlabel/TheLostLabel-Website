"use client";
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDialog, Button, CloseButton } from '@heroui/react';
import { X, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ConfirmState {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    showConfirm: (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => void;
}

interface ChangelogItem {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
}

interface ChangelogState extends ChangelogItem {
    userId: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const CHANGELOG_STORAGE_PREFIX = 'seenChangelog';
const CHANGELOG_DELAY_MS = 1200;
const changelogData: ChangelogItem = {
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

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [changelog, setChangelog] = useState<ChangelogState | null>(null);
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

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
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
            <AlertDialog.Backdrop
                isOpen={Boolean(confirm)}
                onOpenChange={(open: boolean) => { if (!open) handleCancel(); }}
                variant="blur"
            >
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[400px]">
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="danger" />
                            <AlertDialog.Heading>{confirm?.title}</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>{confirm?.message}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button variant="tertiary" onPress={handleCancel}>Cancel</Button>
                            <Button variant="danger" onPress={handleConfirm}>Confirm</Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none',
                width: 'min(calc(100vw - 32px), 420px)'
            }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

type AlertStatus = "default" | "success" | "danger" | "warning" | "accent";

const TOAST_STATUS: Record<string, AlertStatus> = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'accent',
};

interface ToastItemProps {
    message: string;
    type: ToastType;
    onRemove: () => void;
}

const ToastItem = ({ message, type, onRemove }: ToastItemProps) => {
    const status = TOAST_STATUS[type] || 'accent';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 32, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto w-full"
        >
            <Alert status={status}>
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Description>{message}</Alert.Description>
                </Alert.Content>
                <CloseButton aria-label="Dismiss notification" onPress={onRemove} />
            </Alert>
        </motion.div>
    );
};


interface ChangelogCardProps {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
    onClose: () => void;
}

const ChangelogCard = ({ eyebrow, title, description, items, onClose }: ChangelogCardProps) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
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
                onClick={(event: React.MouseEvent) => event.stopPropagation()}
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
