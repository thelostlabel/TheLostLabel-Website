import BackgroundEffects from "../components/BackgroundEffects";
import { getPublicSettings } from "@/lib/public-settings";
import { getSiteContentByKey } from "@/lib/site-content";
import { parseFaqItems } from "@/lib/site-content-data";

export default async function FAQPage() {
    const [publicSettings, faqContent] = await Promise.all([
        getPublicSettings(),
        getSiteContentByKey('faq')
    ]);
    const faqs = parseFaqItems(faqContent.content);

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            <BackgroundEffects />

            <div style={{ padding: '160px 20px 120px', position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', letterSpacing: '8px', marginBottom: '20px' }}>
                        FREQUENTLY ASKED <span style={{ color: 'rgba(229,231,235,0.9)' }}>QUESTIONS</span>
                    </h1>
                    <p style={{ color: '#444', fontSize: '12px', fontWeight: '800', letterSpacing: '3px' }}>
                        {(publicSettings.siteName || 'LOST MUSIC').toUpperCase()} {'//'} ARTIST SUPPORT
                    </p>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {faqs.map((faq, index) => (
                        <section
                            key={`${faq.q}-${index}`}
                            className="glass-premium"
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <h2 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px', color: '#fff' }}>
                                {faq.q.toUpperCase()}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>{faq.a}</p>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
