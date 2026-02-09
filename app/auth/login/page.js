"use client";
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundEffects from '../../components/BackgroundEffects';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            type: 'login'
        });

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '10px',
        fontWeight: '900',
        color: 'var(--accent)',
        letterSpacing: '2px',
        textTransform: 'uppercase'
    };

    const inputStyle = {
        width: '100%',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontFamily: 'inherit',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.3s ease'
    };

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', display: 'flex' }}>
            <BackgroundEffects />

            {/* Left Side - Visuals (Hidden on Mobile) */}
            <div style={{
                flex: '1',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} className="desktop-visual">

                <div style={{ position: 'relative', zIndex: 2, padding: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 style={{ fontSize: 'clamp(50px, 5vw, 80px)', fontWeight: '900', lineHeight: '0.9', letterSpacing: '-0.04em', marginBottom: '30px' }}>
                            WELCOME<br /><span style={{ color: 'var(--accent)' }}>BACK.</span>
                        </h1>
                        <p style={{ maxWidth: '400px', fontSize: '14px', color: '#888', lineHeight: '1.6', letterSpacing: '0.5px' }}>
                            Access your artist portal, manage releases, and check your stats.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(5, 6, 7, 0.8)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 8vw', // Responsive padding
                position: 'relative',
                zIndex: 10
            }}>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div style={{ marginBottom: '60px' }}>
                        <Link href="/" style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#666', marginBottom: '20px', display: 'block', textDecoration: 'none' }}>← BACK TO HOME</Link>
                        <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>LOGIN</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                            ACCESS ARTIST PORTAL
                        </p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {error && (
                            <div style={{ padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', color: '#ff4444', fontSize: '11px', fontWeight: '800' }}>
                                {error.toUpperCase()}
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                placeholder="artist@example.com"
                                style={inputStyle}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-focus-glow"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>PASSWORD</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={inputStyle}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-focus-glow"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '20px', width: '100%', borderRadius: '16px', fontSize: '13px', letterSpacing: '1px' }}>
                            {loading ? 'AUTHENTICATING...' : 'ENTER PORTAL'}
                        </button>
                    </form>

                    <p style={{ marginTop: '40px', fontSize: '11px', color: '#666', fontWeight: '600', textAlign: 'center' }}>
                        NO ACCOUNT? <Link href="/auth/register" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid #fff', paddingBottom: '2px' }}>APPLY NOW</Link>
                    </p>
                </motion.div>
            </div>

            <style jsx>{`
                .desktop-visual {
                    display: none;
                }
                .input-focus-glow:focus {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 15px rgba(158, 240, 26, 0.1);
                }
                @media (min-width: 1024px) {
                    .desktop-visual {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
