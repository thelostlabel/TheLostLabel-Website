"use client";

import { motion } from 'framer-motion';

export default function DashboardLoader({
    label = 'LOADING DASHBOARD',
    subLabel = 'Syncing modules...',
    fullScreen = false,
    overlay = false
}) {
    const wrapperStyle = fullScreen
        ? {
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050505'
        }
        : overlay
            ? {
                position: 'absolute',
                inset: 0,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5,5,5,0.72)',
                backdropFilter: 'blur(4px)'
            }
            : {
                minHeight: '52vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            };

    return (
        <div style={wrapperStyle}>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                    width: 'min(520px, 92%)',
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: '#0E0E0E',
                    padding: '24px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <p style={{ margin: 0, color: '#fff', fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>{label}</p>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.12)',
                            borderTopColor: '#FFFFFF'
                        }}
                    />
                </div>

                <p style={{ margin: '0 0 14px 0', color: '#8b8b8b', fontSize: '12px', fontWeight: 700 }}>{subLabel}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '8px' }}>
                    {[72, 46, 52].map((w, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 0.75, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.15, delay: i * 0.08 }}
                            style={{
                                height: '8px',
                                width: `${w}%`,
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.5)'
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
