"use client";
import React, { useState, useEffect } from 'react';
import BackgroundEffects from "../components/BackgroundEffects";
import { motion } from "framer-motion";

const STATIC_FAQS = [
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

export default function FAQPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch('/api/admin/content?key=faq');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.content) {
                        try {
                            const parsed = JSON.parse(data.content);
                            setFaqs(Array.isArray(parsed) ? parsed : STATIC_FAQS);
                        } catch (e) {
                            console.error("Failed to parse FAQ JSON", e);
                            setFaqs(STATIC_FAQS);
                        }
                    } else {
                        setFaqs(STATIC_FAQS);
                    }
                } else {
                    setFaqs(STATIC_FAQS);
                }
            } catch (error) {
                console.error("Fetch FAQs Error:", error);
                setFaqs(STATIC_FAQS);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            <BackgroundEffects />

            <div style={{ padding: '160px 20px 120px', position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', letterSpacing: '8px', marginBottom: '20px' }}>
                            FREQUENTLY ASKED <span style={{ color: 'rgba(229,231,235,0.9)' }}>QUESTIONS</span>
                        </h1>
                        <p style={{ color: '#444', fontSize: '12px', fontWeight: '800', letterSpacing: '3px' }}>LOST MUSIC GROUP // ARTIST SUPPORT</p>
                    </motion.div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: '#444', fontSize: '12px', letterSpacing: '2px', fontWeight: '800' }}>
                        LOADING...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-premium"
                                style={{
                                    padding: '40px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.3s ease'
                                }}
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px', color: '#fff' }}>
                                    {faq.q.toUpperCase()}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
