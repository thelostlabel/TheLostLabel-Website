"use client";
import React, { useState, useEffect } from 'react';

export default function TermsPage() {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch('/api/admin/content?key=terms');
                const data = await res.json();
                if (data && data.content) setContent(data.content);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchContent();
    }, []);

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Enhanced Ambient Glows */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    filter: 'blur(100px)'
                }} />
            </div>

            {/* Grid Background Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.6
            }} />

            <div style={{ padding: '160px 20px 120px', position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ marginBottom: '80px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>
                        TERMS OF <span style={{ color: 'var(--accent)' }}>SERVICE</span>
                    </h1>
                    <p style={{ color: '#444', fontSize: '10px', fontWeight: '800', letterSpacing: '3px' }}>LAST UPDATED: FEBRUARY 2026 // LOST MUSIC GROUP</p>
                </header>

                <div className="glass" style={{ padding: '60px 50px', borderRadius: '0', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '14px', lineHeight: '2', color: '#888' }}>

                        {loading ? (
                            <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px' }}>LOADING_LEGAL_DOCUMENTS...</p>
                        ) : content ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                        ) : (
                            <>
                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>1. ARTIST ELIGIBILITY</h2>
                                    <p>By registering with LOST MUSIC GROUP, you affirm that you are at least 18 years of age (or have legal guardian consent) and possess the full authority to enter into a distribution agreement for the musical works you submit.</p>
                                </section>

                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>2. DEMO SUBMISSIONS & CONTENT STANDARDS</h2>
                                    <p>Submitting a demo does not guarantee a release. You represent that all submissions are 100% original works. Use of uncleared samples, stolen tracks, or fraudulent content will result in immediate account termination and potential legal action.</p>
                                </section>

                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>3. GLOBAL DISTRIBUTION RIGHTS</h2>
                                    <p>Upon formal acceptance and contract execution, you grant LOST MUSIC GROUP the exclusive, sub-licensable right to distribute, promote, and monetize your content across over 50 global Digital Service Providers (DSPs), including Spotify, Apple Music, and Amazon.</p>
                                </section>

                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>4. ROYALTIES & PAYMENTS</h2>
                                    <p>Royalties are calculated based on net revenue received from DSPs. Payouts are made quarterly (every 3 months) via Bank Transfer or PayPal. The minimum payout threshold is $50.00 USD. Undistributed earnings remain in your account until the threshold is met.</p>
                                </section>

                                <section style={{ marginBottom: 0, padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>5. INTELLECTUAL PROPERTY</h2>
                                    <p>The &quot;LOST.&quot; trademark, logos, and website infrastructure remain the sole property of LOST MUSIC GROUP. Artists retain ownership of their compositions unless otherwise specified in a separate, written Recording or Publishing Agreement.</p>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
