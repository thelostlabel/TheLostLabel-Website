import type { CSSProperties } from "react";

import Link from 'next/link';

import { getPublicSettings } from '@/lib/public-settings';
import { getSiteContentByKey } from '@/lib/site-content';
import { parseJoinCommissionRows, parseJoinGenres } from '@/lib/site-content-data';
import { BRANDING } from '@/lib/branding';

export default async function JoinUsPage() {
    const [publicSettings, genresContent, commissionsContent] = await Promise.all([
        getPublicSettings(),
        getSiteContentByKey('join_genres'),
        getSiteContentByKey('join_commissions')
    ]);

    const genres = parseJoinGenres(genresContent.content);
    const commissionData = parseJoinCommissionRows(commissionsContent.content);
    const hero = {
        title: publicSettings.joinHeroTitle,
        sub: publicSettings.joinHeroSub
    };

    return (
        <div style={{ padding: '120px 20px 100px', maxWidth: '1080px', margin: '0 auto', minHeight: '100vh', background: 'transparent', color: '#fff' }}>
            <header style={{ textAlign: 'center', marginBottom: '70px' }}>
                <h1 style={{ fontSize: 'clamp(32px, 7vw, 54px)', fontWeight: '900', letterSpacing: '6px', marginBottom: '18px', lineHeight: 1.1 }}>
                    {hero.title.split(BRANDING.dotName).map((part, index, list) => (
                        <span key={`${part}-${index}`}>
                            {part}
                            {index < list.length - 1 && <span style={{ color: 'rgba(229,231,235,0.95)' }}>{BRANDING.dotName}</span>}
                        </span>
                    ))}
                </h1>
                <p style={{ color: '#777', fontSize: '10px', fontWeight: '800', letterSpacing: '4px' }}>{hero.sub.toUpperCase()}</p>
            </header>

            <section style={{ padding: '36px', marginBottom: '60px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'linear-gradient(120deg, #121212 0%, #171717 55%, #111 100%)' }}>
                <h2 style={{ fontSize: '12px', letterSpacing: '4px', marginBottom: '26px', color: 'rgba(229,231,235,0.92)', fontWeight: '900' }}>THE MISSION</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '40px', fontWeight: '400' }}>
                    Know anyone with a high-quality original demo? <br />
                    Send us the track - if we sign it, <strong style={{ color: '#fff' }}>you earn a commission.</strong>
                </p>

                <h3 style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '20px', color: '#666', fontWeight: '800' }}>GENRES WE ACCEPT:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                    {genres.map((genre) => (
                        <div key={genre} style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', borderRadius: '12px' }}>
                            {genre.toUpperCase()}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid rgba(229,231,235,0.9)', borderRadius: '8px', fontSize: '10px', color: '#777', fontWeight: '800', letterSpacing: '1px' }}>
                    NO COVER SONGS. ORIGINALS ONLY & NO VOCAL SAMPLES.
                </div>
            </section>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', letterSpacing: '4px', fontWeight: '900' }}>COMMISSION <span style={{ color: 'rgba(229,231,235,0.92)' }}>SYSTEM</span></h2>
                    <span style={{ fontSize: '9px', color: '#333', fontWeight: '900' }}>INTERNAL_METRICS</span>
                </div>

                <div style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: '#111' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <th style={thStyle}>{BRANDING.dotName} HISTORY</th>
                                    <th style={thStyle}>SPOTIFY MONTHLY LISTENERS</th>
                                    <th style={thStyle}>COMMISSION RATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissionData.map((row, index) => (
                                    <tr key={`${row.listeners}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={tdStyle}>
                                            <span style={{ color: row.released === 'Yes' ? 'rgba(229,231,235,0.9)' : '#777' }}>
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
                <Link href="/dashboard?view=my-submit" style={{
                    display: 'inline-block',
                    padding: '16px 34px',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#000',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '900',
                    letterSpacing: '2px',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    SUBMIT DEMO NOW
                </Link>
            </footer>
        </div>
    );
}

const thStyle: CSSProperties = {
    padding: '24px',
    fontSize: '9px',
    fontWeight: '900',
    color: '#666',
    letterSpacing: '3px'
};

const tdStyle: CSSProperties = {
    padding: '24px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ddd',
    letterSpacing: '1px'
};
