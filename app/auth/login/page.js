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
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex' }}>
            {/* Left Side - Visuals (Hidden on Mobile) */}
            <div style={{
                flex: '1',
                position: 'relative',
                overflow: 'hidden'
            }} className="desktop-visual">
                {/* Background Image / Abstract */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 70% 50%, #1a1a1a, #000)',
                    zIndex: 0
                }} />

                {/* Noise */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.05,
                    filter: 'url(#noiseFilter)',
                    zIndex: 1
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '80px',
                    zIndex: 2
                }}>
                    <h1 style={{ fontSize: '60px', fontWeight: '900', lineHeight: '0.9', letterSpacing: '-0.03em', marginBottom: '20px' }}>
                        WELCOME<br />BACK.
                    </h1>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: '#0a0a0a',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 8vw', // Responsive padding
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>LOGIN</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>
                        ACCESS ARTIST PORTAL
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {error && <p style={{ color: '#ff4444', fontSize: '12px', fontWeight: '800' }}>{error.toUpperCase()}</p>}

                    <div>
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

                    <div>
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

                    <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '18px', width: '100%' }}>
                        {loading ? 'WAITING...' : 'ENTER'}
                    </button>
                </form>

                <p style={{ marginTop: '40px', fontSize: '11px', color: '#666', fontWeight: '600' }}>
                    NO ACCOUNT? <Link href="/auth/register" style={{ color: '#fff', textDecoration: 'underline' }}>REGISTER</Link>
                </p>
            </div>

            <style jsx>{`
                .desktop-visual {
                    display: none;
                }
                @media (min-width: 900px) {
                    .desktop-visual {
                        display: block !important;
                    }
                }
            `}</style>
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
