"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, Settings } from 'lucide-react';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Password updated successfully");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || "Failed to update password");
            }
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100%',
            padding: '40px 32px',
            position: 'relative',
        }}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '36px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Settings size={16} color="#D1D5DB" />
                        </div>
                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: '900',
                            letterSpacing: '3px',
                            color: '#fff',
                            textTransform: 'uppercase',
                            margin: 0,
                        }}>Settings</h1>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0, paddingLeft: '48px' }}>
                        Manage your account preferences
                    </p>
                </motion.div>

                {/* Glass Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        padding: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Card inner glow */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    }} />

                    {/* Section title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                        <div style={{
                            width: '30px', height: '30px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Lock size={13} color="#D1D5DB" />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#D1D5DB', textTransform: 'uppercase' }}>
                                Change Password
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                                Keep your account secure
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Feedback */}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px',
                                    background: 'rgba(34,197,94,0.08)',
                                    border: '1px solid rgba(34,197,94,0.2)',
                                    borderRadius: '10px',
                                    color: '#4ade80',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                <ShieldCheck size={15} />
                                {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    padding: '12px 16px',
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: '10px',
                                    color: '#f87171',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <GlassInput
                            label="Current Password"
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            show={showCurrent}
                            onToggle={() => setShowCurrent(v => !v)}
                            required
                        />
                        <GlassInput
                            label="New Password"
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            show={showNew}
                            onToggle={() => setShowNew(v => !v)}
                            required
                        />
                        <GlassInput
                            label="Confirm New Password"
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            show={showConfirm}
                            onToggle={() => setShowConfirm(v => !v)}
                            required
                        />

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                                marginTop: '8px',
                                padding: '14px 24px',
                                background: loading
                                    ? 'rgba(255,255,255,0.06)'
                                    : '#fff',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '12px',
                                color: loading ? '#888' : '#000',
                                fontSize: '12px',
                                fontWeight: '800',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '12px', height: '12px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Updating...
                                </span>
                            ) : 'Update Password'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '28px 0' }} />

                {/* More sections placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '20px',
                        padding: '24px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        opacity: 0.5,
                    }}
                >
                    <ShieldCheck size={18} color="#888" />
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', color: '#888', textTransform: 'uppercase' }}>
                            More settings coming soon
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
                            Notifications, privacy, appearance
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .glass-input:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2) !important;
                    box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important;
                }
            `}</style>
        </div>
    );
}

function GlassInput({ label, type, value, onChange, show, onToggle, required }) {
    return (
        <div>
            <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '2px',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    className="glass-input"
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    style={{
                        width: '100%',
                        padding: '13px 44px 13px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                    }}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );
}
