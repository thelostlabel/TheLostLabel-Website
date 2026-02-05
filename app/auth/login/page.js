"use client";
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

    return (

        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Noise Texture Filter */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                opacity: 0.04,
                filter: 'url(#noiseFilter)'
            }} />

            {/* Enhanced Ambient Glows */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                    filter: 'blur(100px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-5%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)',
                    filter: 'blur(120px)'
                }} />
            </div>

            {/* Grid Background Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.6
            }} />

            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                position: 'relative',
                zIndex: 2
            }}>
                <div className="glass" style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '50px 40px',
                    borderRadius: '0',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(10,10,10,0.6)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '4px' }}>LOGIN</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '11px', fontWeight: '800', letterSpacing: '2px' }}>
                        LOST ARTIST PORTAL
                    </p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {error && <p style={{ color: '#ff4444', fontSize: '12px', fontWeight: '800' }}>{error.toUpperCase()}</p>}

                        <div style={{ textAlign: 'left' }}>
                            <label style={labelStyle}>EMAIL</label>
                            <input
                                type="email"
                                placeholder="mail@example.com"
                                style={inputStyle}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label style={labelStyle}>PASSWORD</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={inputStyle}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '15px', padding: '15px' }}>
                            {loading ? 'WAITING...' : 'ENTER'}
                        </button>
                    </form>

                    <p style={{ marginTop: '40px', fontSize: '11px', color: '#666', fontWeight: '800', letterSpacing: '1px' }}>
                        NO ACCOUNT? <Link href="/auth/register" style={{ color: '#fff', textDecoration: 'underline' }}>REGISTER</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '2px'
};

const inputStyle = {
    width: '100%',
    padding: '14px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '0',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
};
