"use client";

import { motion } from 'framer-motion';
import { BRANDING } from '@/lib/branding';

const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const shimmer = {
    initial: { x: '-100%' },
    animate: prefersReducedMotion ? { x: '-100%' } : { x: '200%' },
    transition: { duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8 }
};

interface SkeletonCardProps {
    delay?: number;
    wide?: boolean;
}

const SkeletonCard = ({ delay = 0, wide = false }: SkeletonCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + delay * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
            background: 'var(--loader-skeleton-bg)',
            border: '1px solid var(--loader-skeleton-border)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            gridColumn: wide ? 'span 2' : 'span 1',
            minHeight: wide ? '180px' : '120px',
        }}
    >
        {/* Shimmer overlay */}
        <motion.div
            initial={shimmer.initial}
            animate={shimmer.animate}
            transition={{ ...shimmer.transition, delay: delay * 0.15 } as any}
            style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, var(--loader-shimmer) 50%, transparent 100%)`,
                zIndex: 2,
            }}
        />
        <div style={{ width: '80px', height: '8px', background: 'var(--loader-skeleton-bar1)', borderRadius: '4px', marginBottom: '16px' }} />
        <div style={{ width: wide ? '160px' : '100px', height: '24px', background: 'var(--loader-skeleton-bar2)', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ width: '60px', height: '6px', background: 'var(--loader-skeleton-bar3)', borderRadius: '3px' }} />
        <div style={{
            position: 'absolute',
            top: '-40px', right: '-40px',
            width: '120px', height: '120px',
            background: 'radial-gradient(circle, var(--loader-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
        }} />
    </motion.div>
);

interface SkeletonRowProps {
    delay?: number;
}

const SkeletonRow = ({ delay = 0 }: SkeletonRowProps) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 + delay * 0.06, duration: 0.4 }}
        style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 80px 60px',
            gap: '16px',
            padding: '16px',
            borderBottom: '1px solid var(--loader-skeleton-bar3)',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <motion.div
            initial={shimmer.initial}
            animate={shimmer.animate}
            transition={{ ...shimmer.transition, delay: delay * 0.1 } as any}
            style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, var(--loader-shimmer) 50%, transparent 100%)`,
            }}
        />
        <div style={{ width: '70%', height: '10px', background: 'var(--loader-skeleton-bar2)', borderRadius: '4px' }} />
        <div style={{ width: '50%', height: '10px', background: 'var(--loader-skeleton-bar2)', borderRadius: '4px' }} />
        <div style={{ width: '60%', height: '10px', background: 'var(--loader-skeleton-bar3)', borderRadius: '4px' }} />
        <div style={{ width: '40%', height: '10px', background: 'var(--loader-skeleton-bar3)', borderRadius: '4px' }} />
    </motion.div>
);

interface DashboardLoaderProps {
    label?: string;
    subLabel?: string;
    fullScreen?: boolean;
    overlay?: boolean;
}

export default function DashboardLoader({
    label = 'LOADING',
    subLabel = 'Syncing modules...',
    fullScreen = false,
    overlay = false,
}: DashboardLoaderProps) {
    if (fullScreen) {
        return (
            <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'var(--background)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '40px',
                    }}
                >
                    {/* Background glow */}
                    <div style={{
                        position: 'absolute',
                        width: '500px', height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, var(--loader-glow) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(12px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: '42px',
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            color: 'var(--foreground)',
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: "'Sora', system-ui, sans-serif",
                            marginBottom: '8px',
                        }}
                    >
                        {BRANDING.shortName}<span style={{ color: 'var(--loader-dot-color)' }}>.</span>
                    </motion.div>

                    {/* Label */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '5px',
                            color: 'var(--loader-label)',
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: "'Space Grotesk', system-ui, sans-serif",
                            textTransform: 'uppercase',
                            marginBottom: '32px',
                        }}
                    >
                        {label}
                    </motion.div>

                    {/* Skeleton preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: '100%', maxWidth: '700px', position: 'relative', zIndex: 2 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <SkeletonCard delay={0} />
                            <SkeletonCard delay={1} />
                            <SkeletonCard delay={2} />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            style={{
                                background: 'var(--loader-skeleton-bg)',
                                border: '1px solid var(--loader-skeleton-border)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 80px 60px',
                                gap: '16px',
                                padding: '14px 16px',
                                background: 'var(--loader-skeleton-bg)',
                                borderBottom: '1px solid var(--loader-skeleton-bar3)',
                            }}>
                                {[70, 50, 40, 30].map((w, i) => (
                                    <div key={i} style={{ width: `${w}%`, height: '7px', background: 'var(--loader-skeleton-bar1)', borderRadius: '3px' }} />
                                ))}
                            </div>
                            <SkeletonRow delay={0} />
                            <SkeletonRow delay={1} />
                            <SkeletonRow delay={2} />
                            <SkeletonRow delay={3} />
                        </motion.div>
                    </motion.div>

                    {/* Sub label */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--loader-sublabel)',
                            marginTop: '24px',
                            letterSpacing: '0.5px',
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        }}
                    >
                        {subLabel}
                    </motion.p>

                    {/* Pulse ring */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.06, 0], scale: [0.8, 1.6, 2.2] }}
                        transition={{ duration: 2.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.5 }}
                        style={{
                            position: 'absolute',
                            width: '120px', height: '120px',
                            borderRadius: '50%',
                            border: '1px solid var(--loader-ring)',
                            pointerEvents: 'none',
                        }}
                    />
                </motion.div>
        );
    }

    // Inline / overlay loader
    const wrapperStyle: React.CSSProperties = overlay
        ? {
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--loader-overlay)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 'inherit',
        }
        : {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 120px)',
            background: 'transparent',
        };

    return (
        <div style={wrapperStyle}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: 'center' }}
            >
                <p style={{
                    margin: 0,
                    color: 'var(--loader-label)',
                    fontSize: '9px',
                    letterSpacing: '4px',
                    fontWeight: '700',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    marginBottom: '16px',
                }}>
                    {label}
                </p>

                <div style={{
                    width: '80px',
                    height: '1.5px',
                    background: 'var(--loader-bar-track)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    margin: '0 auto',
                }}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                        style={{
                            width: '40%',
                            height: '100%',
                            background: 'var(--loader-bar-fill)',
                            borderRadius: '2px',
                        }}
                    />
                </div>

                {subLabel && (
                    <p style={{
                        margin: 0,
                        marginTop: '14px',
                        color: 'var(--loader-sublabel)',
                        fontSize: '11px',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    }}>
                        {subLabel}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
