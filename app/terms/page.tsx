import { getPublicSettings } from "@/lib/public-settings";
import { getSiteContentByKey } from "@/lib/site-content";

export default async function TermsPage() {
    const [publicSettings, contentRecord] = await Promise.all([
        getPublicSettings(),
        getSiteContentByKey('terms')
    ]);
    const updatedLabel = contentRecord.updatedAt
        ? new Date(contentRecord.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
        : 'SYSTEM DEFAULT';

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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
                    <p style={{ color: '#444', fontSize: '10px', fontWeight: '800', letterSpacing: '3px' }}>
                        LAST UPDATED: {updatedLabel} {'//'} {(publicSettings.siteName || 'LOST MUSIC').toUpperCase()}
                    </p>
                </header>

                <div className="glass" style={{ padding: '60px 50px', borderRadius: '0', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '14px', lineHeight: '2', color: '#888', whiteSpace: 'pre-wrap' }}>
                        {contentRecord.content}
                    </div>
                </div>
            </div>
        </div>
    );
}
