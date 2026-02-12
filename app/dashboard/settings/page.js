"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
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
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', color: '#fff' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '30px', letterSpacing: '2px' }}>SETTINGS</h1>

                <section className="glass" style={{ padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: 'var(--accent)' }}>CHANGE PASSWORD</h2>

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {message && <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600' }}>{message}</div>}
                        {error && <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>{error}</div>}

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#888' }}>CURRENT PASSWORD</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#888' }}>NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#888' }}>CONFIRM NEW PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="glow-button"
                            style={{ padding: '12px', marginTop: '10px' }}
                        >
                            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                        </button>
                    </form>
                </section>
            </motion.div>
        </div>
    );
}
