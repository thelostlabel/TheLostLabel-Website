"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

const INTRO_SEEN_KEY = 'lost_dashboard_intro_seen_v1';

export default function DashboardLoader({
    label = 'LOADING DASHBOARD',
    subLabel = 'Syncing modules...',
    fullScreen = false,
    overlay = false
}) {
    const [showIntroLoader] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            return window.localStorage.getItem(INTRO_SEEN_KEY) !== '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (!fullScreen || !showIntroLoader || typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(INTRO_SEEN_KEY, '1');
        } catch {
            // no-op (private mode / blocked storage)
        }
    }, [fullScreen, showIntroLoader]);

    if (fullScreen) {
        if (typeof document === 'undefined') return null;

        const fullScreenContent = showIntroLoader ? (
            <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#050505',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ fontSize: '64px', fontWeight: '900', letterSpacing: '-2px', color: '#FFFFFF' }}
                >
                    LOST.
                </motion.div>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '200px' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    style={{ height: '2px', background: 'rgba(255,255,255,0.45)', marginTop: '24px', borderRadius: '2px' }}
                />
            </motion.div>
        ) : (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#050505',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    overflow: 'hidden'
                }}
            >
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '13px', letterSpacing: '2px', fontWeight: '900' }}>
                    LOADING...
                </p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '1px', fontWeight: '700' }}>
                    {subLabel || label}
                </p>
            </motion.div>
        );

        return createPortal(fullScreenContent, document.body);
    }

    const wrapperClass = overlay
        ? 'absolute inset-0 z-30 flex min-h-[52vh] w-full items-center justify-center overflow-hidden bg-[#050505]/95 backdrop-blur-sm'
        : 'relative flex min-h-[52vh] w-full items-center justify-center overflow-hidden bg-[#050505]';

    const content = (
        <div className={wrapperClass}>
            <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08) 0%, rgba(5,5,5,0.98) 62%)'
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 text-center"
            >
                <p className="mb-3 text-[11px] font-black tracking-[0.22em] text-white/70">{label}</p>
                <div className="text-[clamp(52px,9vw,128px)] font-black leading-none tracking-[0.34em] text-white">
                    LOST.
                </div>

                <p className="mt-5 text-xs font-semibold tracking-[0.08em] text-white/65">{subLabel}</p>
            </motion.div>
        </div>
    );

    if (fullScreen && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }

    return content;
}
