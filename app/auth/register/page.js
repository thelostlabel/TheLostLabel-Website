"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HandwrittenLogo } from '@/components/ui/handwritten-logo';
import { usePublicSettings } from '../../components/PublicSettingsContext';
import { cinematicAuthStyles } from '../cinematic-auth-styles';

const FEATURES = [
    'Keep 100% of your rights',
    'Global streaming distribution',
    'Real-time earnings & analytics',
    'Dedicated artist support',
];

export default function Register() {
    const [formData, setFormData] = useState({ fullName: '', stageName: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const publicSettings = usePublicSettings();
    const maintenanceMode = publicSettings.maintenanceMode === true;
    const registrationsOpen = publicSettings.registrationsOpen !== false && !maintenanceMode;

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/auth/verify-pending?email=${encodeURIComponent(formData.email)}`);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!registrationsOpen) {
        return (
            <div className="ca-root ca-centered">
                <div className="ca-grid" />
                <style jsx>{cinematicAuthStyles}</style>
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="ca-closed"
                >
                    <div className="ca-closed-icon">{maintenanceMode ? '⚙' : '◉'}</div>
                    <h2>{maintenanceMode ? 'MAINTENANCE' : 'INVITE ONLY'}</h2>
                    <p>
                        {maintenanceMode
                            ? 'Registration is temporarily disabled during maintenance.'
                            : 'Registrations are currently closed.'}
                    </p>
                    <Link href="/" className="ca-success-btn" style={{ marginTop: 12 }}>
                        Return Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="ca-root">
            <div className="ca-grid" />
            <style jsx>{cinematicAuthStyles}</style>

            {/* Left branding */}
            <div className="ca-left">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="ca-left-content"
                >
                    <div className="ca-brand-logo">
                        <HandwrittenLogo text={publicSettings.brandingFullName || "The Lost Company"} animate={false} color="#ffffff" font="bofly" />
                    </div>
                    <h1 className="ca-headline">
                        Define<br />your<br />sound.
                    </h1>
                    <p className="ca-tagline">
                        Join the fastest growing independent distribution network. Your music, your rules.
                    </p>

                    <ul className="ca-features">
                        {FEATURES.map((f, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.55 + i * 0.1, duration: 0.4 }}
                            >
                                <span className="ca-check">✓</span>
                                {f}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Right form */}
            <motion.div
                className="ca-right"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="ca-header">
                    <Link href="/" className="ca-back">&larr; BACK TO HOME</Link>
                    <h2>Create Account</h2>
                    <p>Join the collective</p>
                </div>

                <form onSubmit={handleRegister} className="ca-form">
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="ca-error">
                            {error}
                        </motion.div>
                    )}

                    <div className="ca-two-col">
                        <div className="ca-field">
                            <label>FULL NAME</label>
                            <input type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                        </div>
                        <div className="ca-field">
                            <label>STAGE NAME</label>
                            <input type="text" placeholder="Phantom" value={formData.stageName} onChange={(e) => setFormData({ ...formData, stageName: e.target.value })} required />
                            <span className="ca-hint">Auto-linked to Spotify if found</span>
                        </div>
                    </div>

                    <div className="ca-field">
                        <label>EMAIL ADDRESS</label>
                        <input type="email" placeholder="artist@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>

                    <div className="ca-field">
                        <label>PASSWORD</label>
                        <input type="password" placeholder="Minimum 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    </div>

                    <button type="submit" disabled={loading} className="ca-submit">
                        {loading ? <span className="ca-spinner" /> : 'CREATE ACCOUNT →'}
                    </button>
                </form>

                <p className="ca-switch">
                    Already have an account?{' '}
                    <Link href="/auth/login">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
