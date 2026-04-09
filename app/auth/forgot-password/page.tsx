"use client";
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cinematicAuthStyles } from '../cinematic-auth-styles';

export default function ForgotPassword(): React.ReactElement {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error);
            }
        } catch (error: unknown) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ca-root ca-centered">
            <div className="ca-grid" />
            <style jsx>{cinematicAuthStyles}</style>

            <motion.div
                className="ca-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <Link href="/auth/login" className="ca-back">&larr; BACK TO SIGN IN</Link>

                <AnimatePresence mode="wait">
                    {!message ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="ca-header">
                                <h2>Forgot Password</h2>
                                <p>Enter your email and we&apos;ll send you a reset link.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="ca-form">
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="ca-error">
                                        {error}
                                    </motion.div>
                                )}

                                <div className="ca-field">
                                    <label>EMAIL ADDRESS</label>
                                    <input type="email" placeholder="artist@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
                                </div>

                                <button type="submit" disabled={loading} className="ca-submit">
                                    {loading ? <span className="ca-spinner" /> : 'SEND RESET LINK →'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45 }}
                            className="ca-success"
                        >
                            <div className="ca-success-icon">✉</div>
                            <h3>CHECK YOUR INBOX</h3>
                            <p>{message}</p>
                            <Link href="/auth/login" className="ca-success-btn">
                                Return to Login
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
