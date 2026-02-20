import { useState, useEffect } from 'react';
import { Users, Music, Disc, FileText } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle } from './styles';

export default function SettingsView({ users = [], artists = [] }) {
    const { showToast } = useToast();
    const [config, setConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [releaseOptions, setReleaseOptions] = useState([]);

    useEffect(() => {
        fetchSettings();
        fetchReleases();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.config) {
                let parsed;
                try {
                    parsed = JSON.parse(data.config);
                    // Handle potential double-stringification
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse config", e);
                    parsed = {};
                }

                setConfig({
                    // Requests
                    allowCoverArt: parsed.allowCoverArt ?? true,
                    allowAudio: parsed.allowAudio ?? true,
                    allowDelete: parsed.allowDelete ?? true,
                    allowOther: parsed.allowOther ?? true,
                    // General
                    siteName: parsed.siteName || 'LOST MUSIC',
                    registrationsOpen: parsed.registrationsOpen ?? true,
                    maintenanceMode: parsed.maintenanceMode ?? false,
                    adminEmail: parsed.adminEmail || '',
                    defaultPlaylistId: parsed.defaultPlaylistId || '6QHy5LPKDRHDdKZGBFxRY8',
                    // Home Page
                    heroText: parsed.heroText || 'THE NEW ORDER',
                    heroSubText: parsed.heroSubText || 'INDEPENDENT DISTRIBUTION REDEFINED.',
                    featuredReleaseId: parsed.featuredReleaseId || '',
                    featuredReleaseLabel: parsed.featuredReleaseLabel || 'FEATURED RELEASE',
                    featuredReleaseSubLabel: parsed.featuredReleaseSubLabel || 'NOW STREAMING',
                    featuredReleaseStatus: parsed.featuredReleaseStatus || 'Featured',
                    showStats: parsed.showStats ?? true,
                    // Socials
                    discord: parsed.discord || '',
                    instagram: parsed.instagram || '',
                    spotify: parsed.spotify || '',
                    youtube: parsed.youtube || '',
                    twitter: parsed.twitter || '',
                    facebook: parsed.facebook || '',
                    // Genres
                    genres: parsed.genres || ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other'],
                    // Join Page
                    joinHeroTitle: parsed.joinHeroTitle || 'WORK WITH THE LOST. COMPANY',
                    joinHeroSub: parsed.joinHeroSub || 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
                });
            } else {
                // Defaults
                setConfig({
                    allowCoverArt: true, allowAudio: true, allowDelete: true, allowOther: true,
                    siteName: 'LOST MUSIC', registrationsOpen: true, maintenanceMode: false, adminEmail: '',
                    heroText: 'THE NEW ORDER', heroSubText: 'INDEPENDENT DISTRIBUTION REDEFINED.', featuredReleaseId: '',
                    featuredReleaseLabel: 'FEATURED RELEASE', featuredReleaseSubLabel: 'NOW STREAMING', featuredReleaseStatus: 'Featured',
                    showStats: true,
                    discord: '', instagram: '', spotify: '', youtube: '', twitter: '', facebook: '',
                    defaultPlaylistId: '6QHy5LPKDRHDdKZGBFxRY8',
                    genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other'],
                    joinHeroTitle: 'WORK WITH THE LOST. COMPANY',
                    joinHeroSub: 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchReleases = async () => {
        try {
            const res = await fetch('/api/releases');
            const data = await res.json();
            if (data?.releases) {
                setReleaseOptions(data.releases.slice(0, 50));
            }
        } catch (e) {
            console.error("Failed to fetch releases for settings", e);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            });
            if (!res.ok) throw new Error('Failed to save settings');
            showToast('System settings saved successfully', "success");
        } catch (e) {
            console.error(e);
            showToast('Failed to save settings', "error");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#444' }}>Loading settings...</div>;
    if (!config) return null;

    const tabs = [
        { id: 'general', label: 'GENERAL' },
        { id: 'system', label: 'SYSTEM' },
        { id: 'genres', label: 'GENRES' },
        { id: 'requests', label: 'REQUESTS' },
        { id: 'home', label: 'HOME PAGE' },
        { id: 'join', label: 'JOIN PAGE' },
        { id: 'socials', label: 'SOCIALS' }
    ];

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            ...btnStyle,
                            background: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.02)',
                            color: activeTab === tab.id ? '#000' : '#888',
                            border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            fontSize: '11px',
                            fontWeight: '950',
                            letterSpacing: '1px',
                            padding: '12px 20px',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(255,255,255,0.1)' : 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ background: '#080808', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>

                {/* GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>SITE NAME</label>
                            <input type="text" value={config.siteName} onChange={(e) => handleChange('siteName', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>ADMIN EMAIL</label>
                            <input type="email" value={config.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>DEFAULT PLAYLIST ID (SYNC)</label>
                            <input type="text" value={config.defaultPlaylistId} onChange={(e) => handleChange('defaultPlaylistId', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '1px', color: '#ccc' }}>REGISTRATIONS OPEN</span>
                                <div onClick={() => toggle('registrationsOpen')} style={{ width: '48px', height: '24px', background: config.registrationsOpen ? '#fff' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#000', borderRadius: '50%', position: 'absolute', top: '2px', left: config.registrationsOpen ? '26px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,68,68,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,68,68,0.1)' }}>
                                <span style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '1px', color: '#ff4444' }}>MAINTENANCE MODE</span>
                                <div onClick={() => toggle('maintenanceMode')} style={{ width: '48px', height: '24px', background: config.maintenanceMode ? '#ff4444' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.maintenanceMode ? '26px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {[
                            { label: 'TOTAL USERS', value: users.length, icon: <Users size={18} /> },
                            { label: 'TOTAL ARTISTS', value: artists.length, icon: <Music size={18} /> },
                            { label: 'TOTAL RELEASES', value: artists.reduce((acc, a) => acc + (a._count?.releases || 0), 0), icon: <Disc size={18} /> },
                            { label: 'TOTAL CONTRACTS', value: artists.reduce((acc, a) => acc + (a._count?.contracts || 0), 0), icon: <FileText size={18} /> },
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '32px 24px', background: '#0E0E0E', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', borderRadius: '50%' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)' }}>
                                    {stat.icon}
                                    <span style={{ fontSize: '10px', fontWeight: '950', letterSpacing: '1.5px', color: '#888' }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: '950', color: '#fff', letterSpacing: '-1px' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* GENRES SETTINGS */}
                {activeTab === 'genres' && (
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <input
                                type="text"
                                placeholder="Add new genre..."
                                id="newGenreInput"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.trim();
                                        if (val && !config.genres.includes(val)) {
                                            handleChange('genres', [...config.genres, val]);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                                style={{ ...inputStyle, flex: 1, borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px' }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('newGenreInput');
                                    const val = input.value.trim();
                                    if (val && !config.genres.includes(val)) {
                                        handleChange('genres', [...config.genres, val]);
                                        input.value = '';
                                    }
                                }}
                                style={{ ...btnStyle, background: '#fff', color: '#000', padding: '0 32px', border: 'none', borderRadius: '8px', height: 'auto', fontWeight: '950', fontSize: '11px', letterSpacing: '1px' }}
                            >
                                ADD GENRE
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                            {config.genres.map(g => (
                                <div key={g} style={{
                                    padding: '16px 20px', background: 'var(--glass)', border: '1px solid var(--border)',
                                    borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#ccc' }}>{g}</span>
                                    <button
                                        onClick={() => handleChange('genres', config.genres.filter(genre => genre !== g))}
                                        style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', lineHeight: 1 }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REQUESTS SETTINGS */}
                {activeTab === 'requests' && (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {[{ k: 'allowCoverArt', l: 'Allow Cover Art Updates' }, { k: 'allowAudio', l: 'Allow Audio File Updates' }, { k: 'allowDelete', l: 'Allow Takedown Requests' }, { k: 'allowOther', l: 'Allow Other Requests' }].map(item => (
                            <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '950', letterSpacing: '1px' }}>{item.l.toUpperCase()}</span>
                                <div onClick={() => toggle(item.k)} style={{ width: '48px', height: '24px', background: config[item.k] ? '#fff' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#000', borderRadius: '50%', position: 'absolute', top: '2px', left: config[item.k] ? '26px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HOME PAGE SETTINGS */}
                {activeTab === 'home' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>HERO MAIN TEXT</label>
                            <input type="text" value={config.heroText} onChange={(e) => handleChange('heroText', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>HERO SUBTEXT</label>
                            <textarea value={config.heroSubText} onChange={(e) => handleChange('heroSubText', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px', minHeight: '100px', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'grid', gap: '16px', padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: '950', color: '#ccc', letterSpacing: '1.5px' }}>FEATURED CARD LABELS</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <input
                                    type="text"
                                    value={config.featuredReleaseLabel}
                                    onChange={(e) => handleChange('featuredReleaseLabel', e.target.value)}
                                    placeholder="FEATURED RELEASE"
                                    style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px 16px', fontSize: '12px' }}
                                />
                                <input
                                    type="text"
                                    value={config.featuredReleaseSubLabel}
                                    onChange={(e) => handleChange('featuredReleaseSubLabel', e.target.value)}
                                    placeholder="NOW STREAMING"
                                    style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px 16px', fontSize: '12px' }}
                                />
                                <input
                                    type="text"
                                    value={config.featuredReleaseStatus}
                                    onChange={(e) => handleChange('featuredReleaseStatus', e.target.value)}
                                    placeholder="Featured"
                                    style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px 16px', fontSize: '12px' }}
                                />
                            </div>
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>FEATURED RELEASE ID (Hero highlight)</label>
                            <select
                                value={config.featuredReleaseId}
                                onChange={(e) => handleChange('featuredReleaseId', e.target.value)}
                                style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px', color: '#fff' }}
                            >
                                <option value="" style={{ color: '#000' }}>(Auto-pick latest)</option>
                                {releaseOptions.map(r => (
                                    <option key={r.id} value={r.id} style={{ color: '#000' }}>
                                        {r.name} — {r.artistName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '10px', color: '#666', marginTop: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                Anasayfa hero'da görünecek release. Seçilmezse en güncel release kullanılır.
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
                            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '950', letterSpacing: '1px' }}>SHOW STATS SECTION</span>
                            <div onClick={() => toggle('showStats')} style={{ width: '48px', height: '24px', background: config.showStats ? '#fff' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                <div style={{ width: '20px', height: '20px', background: '#000', borderRadius: '50%', position: 'absolute', top: '2px', left: config.showStats ? '26px' : '2px', transition: 'left 0.3s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* JOIN PAGE SETTINGS */}
                {activeTab === 'join' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>JOIN PAGE TITLE</label>
                            <input type="text" value={config.joinHeroTitle} onChange={(e) => handleChange('joinHeroTitle', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>JOIN PAGE SUBTITLE</label>
                            <input type="text" value={config.joinHeroSub} onChange={(e) => handleChange('joinHeroSub', e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} />
                        </div>
                        <div style={{ padding: '24px', background: 'rgba(255, 240, 0, 0.05)', border: '1px solid rgba(255, 240, 0, 0.1)', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '950', margin: 0, letterSpacing: '0.5px', lineHeight: 1.5 }}>TIP: Detailed information like Accepted Genres and Commission Table are managed in the &ldquo;CONTENT&rdquo; section of the Admin Dashboard.</p>
                        </div>
                    </div>
                )}

                {/* SOCIALS SETTINGS */}
                {activeTab === 'socials' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', position: 'relative', zIndex: 1 }}>
                        {['discord', 'instagram', 'spotify', 'youtube', 'twitter', 'facebook'].map(social => (
                            <div key={social}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '900', color: '#888', letterSpacing: '1px' }}>{social.toUpperCase()} URL</label>
                                <input type="text" value={config[social]} onChange={(e) => handleChange(social, e.target.value)} style={{ ...inputStyle, width: '100%', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px' }} placeholder={`https://${social}.com/...`} />
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                    <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none', padding: '16px 48px', height: 'auto', borderRadius: '8px', fontWeight: '950', fontSize: '11px', letterSpacing: '1px' }}>
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>
        </div>
    );
}
