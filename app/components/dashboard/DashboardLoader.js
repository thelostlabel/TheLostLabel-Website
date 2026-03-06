"use client";

import { motion } from 'framer-motion';

export default function DashboardLoader({
    label = 'LOADING',
    subLabel = 'Syncing modules...',
    fullScreen = false,
    overlay = false,
    branded = false
}) {
    if (fullScreen) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="dash-loader-fullscreen"
            >
                <div className="dash-loader-glow" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="dash-loader-logo"
                >
                    LOST<span className="dash-loader-dot">.</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="dash-loader-label"
                >
                    {label}
                </motion.div>

                <motion.div className="dash-loader-track">
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: [0, 0.6, 0.8, 1] }}
                        transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], times: [0, 0.4, 0.7, 1] }}
                        className="dash-loader-bar"
                    />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="dash-loader-sublabel"
                >
                    {subLabel}
                </motion.p>

                {/* Pulse ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.08, 0], scale: [0.8, 1.8, 2.4] }}
                    transition={{ duration: 2.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.3 }}
                    className="dash-loader-ring"
                />

                <style jsx>{`
                    .dash-loader-fullscreen {
                        position: fixed;
                        inset: 0;
                        background: #050505;
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 0;
                        overflow: hidden;
                    }
                    .dash-loader-glow {
                        position: absolute;
                        width: 400px;
                        height: 400px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .dash-loader-logo {
                        font-size: 48px;
                        font-weight: 900;
                        letter-spacing: -2px;
                        color: #fff;
                        position: relative;
                        z-index: 2;
                        font-family: 'Sora', system-ui, sans-serif;
                    }
                    .dash-loader-dot {
                        color: rgba(255,255,255,0.25);
                    }
                    .dash-loader-label {
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 4px;
                        color: rgba(255,255,255,0.25);
                        margin-top: 16px;
                        position: relative;
                        z-index: 2;
                        font-family: 'Space Grotesk', system-ui, sans-serif;
                    }
                    .dash-loader-track {
                        width: 100px;
                        height: 1.5px;
                        background: rgba(255,255,255,0.06);
                        border-radius: 2px;
                        margin-top: 14px;
                        overflow: hidden;
                        position: relative;
                        z-index: 2;
                    }
                    .dash-loader-bar {
                        width: 100%;
                        height: 100%;
                        background: rgba(255,255,255,0.35);
                        border-radius: 2px;
                        transform-origin: left;
                    }
                    .dash-loader-sublabel {
                        font-size: 11px;
                        font-weight: 500;
                        color: rgba(255,255,255,0.15);
                        margin-top: 12px;
                        letter-spacing: 0.5px;
                        position: relative;
                        z-index: 2;
                        font-family: 'Space Grotesk', system-ui, sans-serif;
                    }
                    .dash-loader-ring {
                        position: absolute;
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        border: 1px solid rgba(255,255,255,0.04);
                        pointer-events: none;
                    }
                `}</style>
            </motion.div>
        );
    }

    // Inline / overlay loader (used inside dashboard views)
    const wrapperStyle = overlay
        ? {
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            background: 'rgba(5,5,5,0.92)',
            backdropFilter: 'blur(6px)',
        }
        : {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
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
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '10px',
                    letterSpacing: '3px',
                    fontWeight: '700',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    marginBottom: '14px'
                }}>
                    {label}
                </p>

                <div style={{
                    width: '80px',
                    height: '1.5px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    margin: '0 auto'
                }}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                        style={{
                            width: '40%',
                            height: '100%',
                            background: 'rgba(255,255,255,0.4)',
                            borderRadius: '2px'
                        }}
                    />
                </div>

                {subLabel && (
                    <p style={{
                        margin: 0,
                        marginTop: '14px',
                        color: 'rgba(255,255,255,0.12)',
                        fontSize: '11px',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        fontFamily: "'Space Grotesk', system-ui, sans-serif"
                    }}>
                        {subLabel}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
