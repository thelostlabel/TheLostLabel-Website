"use client";
import React, { useState, useEffect } from 'react';

export default function FAQPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    const staticFaqs = [
        {
            q: "How do I submit a demo?",
            a: "Register as an artist, access your portal, and use the 'NEW SUBMISSION' button. You can now upload multiple files (Master, Lyrics, etc.) directly."
        },
        {
            q: "How can I track my distribution?",
            a: "Once signed, our A&R team will provide updates through the portal. You can use the 'CHANGE REQUEST' system to manage revisions or metadata updates for your releases."
        },
        {
            q: "How do royalties and payments work?",
            a: "Royalties from Spotify, Apple Music, and other DSPs are calculated monthly. You can view your detailed revenue breakdown in the 'EARNINGS' tab and request withdrawals once the $50 threshold is met."
        },
        {
            q: "What about legal contracts?",
            a: "All signing contracts are generated digitally. You can view, download, and track the status of your contracts in the 'CONTRACTS' section of your Artist Dashboard."
        },
        {
            q: "Do you offer Spotify sync?",
            a: "Yes. Our system automatically syncs with your Spotify Artist profile to fetch the latest release data and update your portal metrics."
        }
    ];

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch('/api/admin/content?key=faq');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.content) {
                        try {
                            const parsed = JSON.parse(data.content);
                            setFaqs(Array.isArray(parsed) ? parsed : staticFaqs);
                        } catch (e) {
                            console.error("Failed to parse FAQ JSON", e);
                            setFaqs(staticFaqs);
                        }
                    } else {
                        setFaqs(staticFaqs);
                    }
                } else {
                    setFaqs(staticFaqs);
                }
            } catch (error) {
                console.error("Fetch FAQs Error:", error);
                setFaqs(staticFaqs);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

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
                    top: '10%',
                    left: '10%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
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
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '8px', marginBottom: '20px' }}>
                        FREQUENTLY ASKED <span style={{ color: 'var(--accent)' }}>QUESTIONS</span>
                    </h1>
                    <p style={{ color: '#444', fontSize: '12px', fontWeight: '800', letterSpacing: '3px' }}>LOST MUSIC GROUP // ARTIST SUPPORT</p>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: '#444', fontSize: '12px', letterSpacing: '2px', fontWeight: '800' }}>
                        LOADING...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="glass"
                                style={{
                                    padding: '40px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '0',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.background = 'var(--glass)';
                                }}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px', color: '#fff' }}>
                                    {faq.q.toUpperCase()}
                                </h3>
                                <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.8' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
