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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            ...btnStyle,
                            background: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab.id ? '#000' : '#888',
                            border: 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ ...glassStyle, padding: '30px' }}>

                {/* GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>SITE NAME</label>
                            <input type="text" value={config.siteName} onChange={(e) => handleChange('siteName', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>ADMIN EMAIL</label>
                            <input type="email" value={config.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>DEFAULT PLAYLIST ID (SYNC)</label>
                            <input type="text" value={config.defaultPlaylistId} onChange={(e) => handleChange('defaultPlaylistId', e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #222', display: 'grid', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>REGISTRATIONS OPEN</span>
                                <div onClick={() => toggle('registrationsOpen')} style={{ width: '40px', height: '20px', background: config.registrationsOpen ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.registrationsOpen ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--status-error)' }}>MAINTENANCE MODE</span>
                                <div onClick={() => toggle('maintenanceMode')} style={{ width: '40px', height: '20px', background: config.maintenanceMode ? 'var(--status-error)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.maintenanceMode ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { label: 'TOTAL_USERS', value: users.length, icon: <Users size={16} /> },
                            { label: 'TOTAL_ARTISTS', value: artists.length, icon: <Music size={16} /> },
                            { label: 'TOTAL_RELEASES', value: artists.reduce((acc, a) => acc + (a._count?.releases || 0), 0), icon: <Disc size={16} /> },
                            { label: 'TOTAL_CONTRACTS', value: artists.reduce((acc, a) => acc + (a._count?.contracts || 0), 0), icon: <FileText size={16} /> },
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', marginBottom: '10px' }}>
                                    {stat.icon}
                                    <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '2px' }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* GENRES SETTINGS */}
                {activeTab === 'genres' && (
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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
                                style={inputStyle}
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
                                style={{ ...btnStyle, background: 'var(--accent)', color: '#000', padding: '12px 20px', border: 'none', borderRadius: '16px' }}
                            >
                                ADD
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {config.genres.map(g => (
                                <div key={g} style={{
                                    padding: '10px 15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800' }}>{g}</span>
                                    <button
                                        onClick={() => handleChange('genres', config.genres.filter(genre => genre !== g))}
                                        style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', fontSize: '14px' }}
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
                            <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '800' }}>{item.l}</span>
                                <div onClick={() => toggle(item.k)} style={{ width: '40px', height: '20px', background: config[item.k] ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config[item.k] ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HOME PAGE SETTINGS */}
                {activeTab === 'home' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>HERO MAIN TEXT</label>
                            <input type="text" value={config.heroText} onChange={(e) => handleChange('heroText', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>HERO SUBTEXT</label>
                            <textarea value={config.heroSubText} onChange={(e) => handleChange('heroSubText', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: '800', color: '#666' }}>FEATURED CARD LABELS</label>
                            <input
                                type="text"
                                value={config.featuredReleaseLabel}
                                onChange={(e) => handleChange('featuredReleaseLabel', e.target.value)}
                                placeholder="FEATURED RELEASE"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={config.featuredReleaseSubLabel}
                                onChange={(e) => handleChange('featuredReleaseSubLabel', e.target.value)}
                                placeholder="NOW STREAMING"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={config.featuredReleaseStatus}
                                onChange={(e) => handleChange('featuredReleaseStatus', e.target.value)}
                                placeholder="Featured"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>FEATURED RELEASE ID (Hero highlight)</label>
                            <select
                                value={config.featuredReleaseId}
                                onChange={(e) => handleChange('featuredReleaseId', e.target.value)}
                                style={{ ...inputStyle, background: '#0d0d0d' }}
                            >
                                <option value="">(Auto-pick latest)</option>
                                {releaseOptions.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} — {r.artistName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                                Anasayfa hero&apos;da görünecek release. Seçilmezse en güncel release kullanılır.
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '800' }}>SHOW STATS SECTION</span>
                            <div onClick={() => toggle('showStats')} style={{ width: '40px', height: '20px', background: config.showStats ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.showStats ? '22px' : '2px', transition: 'left 0.3s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* JOIN PAGE SETTINGS */}
                {activeTab === 'join' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>JOIN PAGE TITLE</label>
                            <input type="text" value={config.joinHeroTitle} onChange={(e) => handleChange('joinHeroTitle', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>JOIN PAGE SUBTITLE</label>
                            <input type="text" value={config.joinHeroSub} onChange={(e) => handleChange('joinHeroSub', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(245, 197, 66, 0.05)', border: '1px solid rgba(245, 197, 66, 0.1)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800', margin: 0 }}>TIP: Detailed information like Accepted Genres and Commission Table are managed in the &ldquo;CONTENT&rdquo; section of the Admin Dashboard.</p>
                        </div>
                    </div>
                )}

                {/* SOCIALS SETTINGS */}
                {activeTab === 'socials' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {['discord', 'instagram', 'spotify', 'youtube', 'twitter', 'facebook'].map(social => (
                            <div key={social}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>{social.toUpperCase()} URL</label>
                                <input type="text" value={config[social]} onChange={(e) => handleChange(social, e.target.value)} style={inputStyle} placeholder={`https://${social}.com/...`} />
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={saving} className="glow-button" style={{ fontSize: '12px', padding: '12px 30px', height: 'auto' }}>
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>
        </div>
    );
}
