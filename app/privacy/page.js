"use client";
import React, { useState, useEffect } from 'react';

export default function PrivacyPage() {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch('/api/admin/content?key=privacy');
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
                    left: '-5%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    filter: 'blur(100px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
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
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.6
            }} />

            <div style={{ padding: '160px 20px 120px', position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ marginBottom: '80px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>
                        PRIVACY <span style={{ color: 'var(--accent)' }}>POLICY</span>
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
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>1. DATA COLLECTION</h2>
                                    <p>We collect personal identifiers (name, email, stage name), financial information for royalty processing, and musical content submitted through our portal. We also collect technical data such as IP addresses and browser cookies to improve your user experience and for security purposes.</p>
                                </section>

                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>2. PURPOSE OF DATA USAGE</h2>
                                    <p>Your data is used exclusively to manage your artist profile, evaluate demo submissions, facilitate contract execution, and process royalty payments. We may also use your contact information to provide critical system updates or A&R feedback.</p>
                                </section>

                                <section style={{ marginBottom: '60px', padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>3. DATA PROTECTION & DISCLOSURE</h2>
                                    <p>We implement professional-grade encryption (Bcrypt for passwords, SSL/TLS for data in transit) to safeguard your information. We do not sell your data. Disclosure only occurs to trusted third-party partners (e.g., DSPs, payment processors) necessary to fulfill our distribution and payment obligations.</p>
                                </section>

                                <section style={{ marginBottom: 0, padding: 0 }}>
                                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: '900', letterSpacing: '2px' }}>4. YOUR RIGHTS (GDPR/CCPA)</h2>
                                    <p>You have the right to access, correct, or request the deletion of your personal data at any time. You may also request a copy of the data we hold about you. For such inquiries, please contact our data compliance team through the Support portal.</p>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
