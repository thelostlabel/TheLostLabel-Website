"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function JoinUsPage() {
    const [genres, setGenres] = useState([
        "House (Deep House / Slap House / G-House)",
        "Pop",
        "Phonk",
        "Hardstyle",
        "HyperTechno",
        "Gaming Music (Midtempo, D&B, Trap, Future Bass)",
        "Reggaeton",
        "Other"
    ]);

    const [commissionData, setCommissionData] = useState([
        { released: "Yes", listeners: "0 – 250K", commission: "$25 or 1% royalties" },
        { released: "Yes", listeners: "250K – 750K", commission: "$50 or 2.5% royalties" },
        { released: "Yes", listeners: "750K+", commission: "$75 or 5% royalties" },
        { released: "No", listeners: "0 – 250K", commission: "$25 or 5% royalties" },
        { released: "No", listeners: "250K – 500K", commission: "$50 or 5% royalties" },
        { released: "No", listeners: "500K – 1M", commission: "$75 or 5% royalties" },
        { released: "No", listeners: "1M+", commission: "$100 or 7.5% royalties" },
    ]);

    const [loading, setLoading] = useState(true);
    const [hero, setHero] = useState({
        title: 'WORK WITH THE LOST. COMPANY',
        sub: 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [genresRes, commissionRes, settingsRes] = await Promise.all([
                    fetch('/api/admin/content?key=join_genres'),
                    fetch('/api/admin/content?key=join_commissions'),
                    fetch('/api/settings/public')
                ]);

                const genresData = await genresRes.json();
                const commissionData = await commissionRes.json();
                const settingsData = await settingsRes.json();

                if (genresData?.content) {
                    const gList = genresData.content.split(/[\n,]/).map(s => s.trim()).filter(s => s);
                    if (gList.length > 0) setGenres(gList);
                }

                if (commissionData?.content) {
                    try {
                        const parsed = JSON.parse(commissionData.content);
                        if (Array.isArray(parsed) && parsed.length > 0) setCommissionData(parsed);
                    } catch (e) { console.error("Parse Error:", e); }
                }

                if (settingsData) {
                    setHero({
                        title: settingsData.joinHeroTitle || hero.title,
                        sub: settingsData.joinHeroSub || hero.sub
                    });
                }
            } catch (e) {
                console.error("Fetch Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    return (
        <div style={{ padding: '120px 20px 100px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: '#050505', color: '#fff' }}>
            <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '80px' }}
            >
                <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '900', letterSpacing: '8px', marginBottom: '20px', lineHeight: 1.1 }}>
                    {hero.title.split('LOST.').map((part, i, arr) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && <span style={{ color: 'var(--accent)' }}>LOST.</span>}
                        </React.Fragment>
                    ))}
                </h1>
                <p style={{ color: '#888', fontSize: '10px', fontWeight: '800', letterSpacing: '4px' }}>{hero.sub.toUpperCase()}</p>
            </motion.header>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: '100px', color: '#444', fontSize: '11px', letterSpacing: '2px' }}
                    >
                        SYNCING_MISSION_DATA...
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <section className="glass" style={{ padding: '40px', marginBottom: '60px', border: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '12px', letterSpacing: '4px', marginBottom: '30px', color: 'var(--accent)', fontWeight: '900' }}>THE MISSION</h2>
                            <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '40px', fontWeight: '400' }}>
                                Know anyone with a high-quality original demo? <br />
                                Send us the track — if we sign it, <strong style={{ color: '#fff' }}>you earn a commission.</strong>
                            </p>

                            <h3 style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '20px', color: '#666', fontWeight: '800' }}>GENRES WE ACCEPT:</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                                {genres.map(genre => (
                                    <div key={genre} style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', borderRadius: '12px' }}>
                                        {genre.toUpperCase()}
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #fff', fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '1px' }}>
                                NO COVER SONGS. ORIGINALS ONLY & NO VOCAL SAMPLES.
                            </div>
                        </section>

                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                                <h2 style={{ fontSize: '16px', letterSpacing: '4px', fontWeight: '900' }}>COMMISSION <span style={{ color: 'var(--accent)' }}>SYSTEM</span></h2>
                                <span style={{ fontSize: '9px', color: '#333', fontWeight: '900' }}>INTERNAL_METRICS_v1.2</span>
                            </div>

                            <div className="glass" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <th style={thStyle}>LOST. HISTORY</th>
                                                <th style={thStyle}>SPOTIFY MONTHLY LISTENERS</th>
                                                <th style={thStyle}>COMMISSION RATE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commissionData.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={tdStyle}>
                                                        <span style={{ color: row.released === 'Yes' ? 'var(--accent)' : '#666' }}>
                                                            {row.released === 'Yes' ? 'ALREADY RELEASED' : 'FIRST-TIME SIGNING'}
                                                        </span>
                                                    </td>
                                                    <td style={tdStyle}>{row.listeners}</td>
                                                    <td style={tdStyle}><strong style={{ color: '#fff' }}>{row.commission}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <footer style={{ marginTop: '80px', textAlign: 'center' }}>
                            <Link href="/dashboard/artist" className="glow-button" style={{ padding: '20px 60px' }}>
                                SUBMIT DEMO NOW
                            </Link>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const thStyle = {
    padding: '24px',
    fontSize: '9px',
    fontWeight: '900',
    color: '#444',
    letterSpacing: '3px'
};

const tdStyle = {
    padding: '24px',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1px'
};

