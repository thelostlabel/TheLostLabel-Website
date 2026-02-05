"use client";
import React from 'react';
import Link from 'next/link';

export default function JoinUsPage() {
    const genres = [
        "House (Deep House / Slap House / G-House)",
        "Pop",
        "Phonk",
        "Hardstyle",
        "HyperTechno",
        "Gaming Music (Midtempo, D&B, Trap, Future Bass)",
        "Reggaeton",
        "Other (any other tracks you think are dope)"
    ];

    const commissionData = [
        { released: "Yes", listeners: "0 – 250K", commission: "$25 or 1% royalties" },
        { released: "Yes", listeners: "250K – 750K", commission: "$50 or 2.5% royalties" },
        { released: "Yes", listeners: "750K+", commission: "$75 or 5% royalties" },
        { released: "No", listeners: "0 – 250K", commission: "$25 or 5% royalties" },
        { released: "No", listeners: "250K – 500K", commission: "$50 or 5% royalties" },
        { released: "No", listeners: "500K – 1M", commission: "$75 or 5% royalties" },
        { released: "No", listeners: "1M+", commission: "$100 or 7.5% royalties" },
    ];

    return (
        <div style={{ padding: '120px 20px 100px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '8px', marginBottom: '20px' }}>
                    WORK WITH THE <span style={{ color: 'var(--accent)' }}>LOST.</span> COMPANY
                </h1>
                <p style={{ color: '#888', fontSize: '12px', fontWeight: '800', letterSpacing: '3px' }}>A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS</p>
            </header>

            <section className="glass" style={{ padding: '60px', marginBottom: '60px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '14px', letterSpacing: '4px', marginBottom: '30px', color: 'var(--accent)' }}>THE MISSION</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '40px', fontWeight: '400' }}>
                    Know anyone with a high-quality original demo? <br />
                    Send us the track — if we sign it, <strong>you earn a commission.</strong>
                </p>

                <h3 style={{ fontSize: '12px', letterSpacing: '2px', marginBottom: '20px', color: '#fff' }}>GENRES WE ACCEPT:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                    {genres.map(genre => (
                        <div key={genre} style={{ padding: '12px 20px', background: '#0a0a0a', border: '1px solid #1a1a1b', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>
                            {genre}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #fff', fontSize: '12px', color: '#888', fontWeight: '800', letterSpacing: '1px' }}>
                    NO COVER SONGS. ORIGINALS ONLY & NO VOCAL SAMPLES.
                </div>
            </section>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', letterSpacing: '4px' }}>COMMISSION <span style={{ color: 'var(--accent)' }}>SYSTEM</span></h2>
                    <span style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>INTERNAL_METRICS_v1.2</span>
                </div>

                <div className="glass" style={{ overflow: 'hidden', border: '1px solid #1a1a1b' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#111' }}>
                                <th style={thStyle}>LOST. HISTORY</th>
                                <th style={thStyle}>SPOTIFY MONTHLY LISTENERS</th>
                                <th style={thStyle}>COMMISSION RATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionData.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                                    <td style={tdStyle}>
                                        <span style={{ color: row.released === 'Yes' ? 'var(--accent)' : '#888' }}>
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
            </section>

            <footer style={{ marginTop: '80px', textAlign: 'center' }}>
                <Link href="/dashboard/artist" className="glow-button" style={{ padding: '18px 50px' }}>
                    SUBMIT DEMO NOW
                </Link>
            </footer>
        </div>
    );
}

const thStyle = {
    padding: '20px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#444',
    letterSpacing: '2px'
};

const tdStyle = {
    padding: '20px',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1px'
};
