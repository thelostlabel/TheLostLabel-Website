"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Disc, FileText, Music, Users, X } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import {
    getDefaultSystemSettings,
    normalizeSystemSettingsConfig,
    parseSystemSettingsConfig,
    SystemSettingsConfig,
} from '@/lib/system-settings';
import {
    Button,
    Card,
    Input,
    Label,
    Switch,
    Tabs,
    TextArea,
    TextField,
} from '@heroui/react';
import { DashboardUser, DashboardArtist } from '@/app/components/dashboard/types';

// ── Local types ───────────────────────────────────────────────────────────────

interface ReleaseOption {
    id: string;
    name: string;
    artistName?: string | null;
}

interface ToggleRowProps {
    label: string;
    isSelected: boolean;
    onChange: (value: boolean) => void;
    danger?: boolean;
}

interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}

interface SettingsViewProps {
    users?: DashboardUser[];
    artists?: DashboardArtist[];
}

// ── Sub-components defined OUTSIDE to prevent remount on every render ─────────

function ToggleRow({ label, isSelected, onChange, danger = false }: ToggleRowProps) {
    return (
        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 ${danger ? 'border-red-500/15 bg-red-500/5' : 'border-border bg-surface'}`}>
            <span className={`text-[11px] font-black uppercase tracking-widest ${danger ? 'text-red-400' : 'text-foreground'}`}>
                {label}
            </span>
            <Switch isSelected={isSelected} onChange={onChange}>
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
            </Switch>
        </div>
    );
}

const INPUT_CLASS = 'dash-input';

function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
    return (
        <TextField fullWidth type={type} value={value} onChange={onChange}>
            <Label className="dash-label">{label}</Label>
            <Input placeholder={placeholder} className={INPUT_CLASS} variant="secondary" />
        </TextField>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsView({ users = [], artists = [] }: SettingsViewProps) {
    const { showToast } = useToast();
    const [config, setConfig] = useState<SystemSettingsConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [releaseOptions, setReleaseOptions] = useState<ReleaseOption[]>([]);
    const [newGenre, setNewGenre] = useState<string>('');

    useEffect(() => {
        fetchSettings();
        fetchReleases();
    }, []);

    const fetchSettings = async (): Promise<void> => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setConfig(data.config
                ? normalizeSystemSettingsConfig(parseSystemSettingsConfig(data.config))
                : getDefaultSystemSettings()
            );
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchReleases = async (): Promise<void> => {
        try {
            const res = await fetch('/api/releases?limit=60');
            const data = await res.json();
            if (data?.releases) setReleaseOptions(data.releases.slice(0, 50));
        } catch (e) { console.error('Failed to fetch releases', e); }
    };

    const handleSave = async (): Promise<void> => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });
            if (!res.ok) throw new Error('Failed to save');
            showToast('System settings saved successfully', 'success');
        } catch (e) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: keyof SystemSettingsConfig): void =>
        setConfig((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);

    const handleChange = (key: keyof SystemSettingsConfig, value: unknown): void =>
        setConfig((prev) => prev ? { ...prev, [key]: value } : prev);

    const addGenre = (): void => {
        const val = newGenre.trim();
        if (val && config && !config.genres.includes(val)) {
            handleChange('genres', [...config.genres, val]);
            setNewGenre('');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-[12px] font-black uppercase tracking-widest text-muted">
            Loading settings...
        </div>
    );
    if (!config) return null;

    return (
        <div className="max-w-3xl">
            <Tabs defaultSelectedKey="general" className="w-full">
                <Tabs.ListContainer>
                    <Tabs.List aria-label="Settings sections" className="mb-5 w-full overflow-x-auto">
                        {['general', 'system', 'genres', 'requests', 'home', 'join', 'socials'].map((id) => (
                            <Tabs.Tab key={id} id={id}>
                                {id.toUpperCase().replace('-', ' ')}
                                <Tabs.Indicator />
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs.ListContainer>

                {/* ── General ──────────────────────────────── */}
                <Tabs.Panel id="general" className="flex flex-col gap-5">
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-6">
                            <Field label="Site Name" value={config.siteName || ''} onChange={(v) => handleChange('siteName', v)} />
                            <Field label="Admin Email" value={config.adminEmail || ''} onChange={(v) => handleChange('adminEmail', v)} type="email" />
                            <Field label="Default Playlist ID (Sync)" value={config.defaultPlaylistId || ''} onChange={(v) => handleChange('defaultPlaylistId', v)} />
                        </Card.Content>
                    </Card>
                    <Card>
                        <Card.Content className="flex flex-col gap-3 p-5">
                            <ToggleRow label="Registrations Open" isSelected={config.registrationsOpen} onChange={(v) => handleChange('registrationsOpen', v)} />
                            <ToggleRow label="Maintenance Mode" isSelected={config.maintenanceMode} onChange={(v) => handleChange('maintenanceMode', v)} danger />
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                {/* ── System ───────────────────────────────── */}
                <Tabs.Panel id="system">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { label: 'Total Users', value: users.length, icon: <Users size={16} /> },
                            { label: 'Total Artists', value: artists.length, icon: <Music size={16} /> },
                            { label: 'Total Releases', value: artists.reduce((a, x) => a + ((x._count as Record<string, number> | undefined)?.releases || 0), 0), icon: <Disc size={16} /> },
                            { label: 'Total Contracts', value: artists.reduce((a, x) => a + ((x._count as Record<string, number> | undefined)?.contracts || 0), 0), icon: <FileText size={16} /> },
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <Card.Content className="p-6">
                                    <div className="mb-3 flex items-center gap-2.5 text-accent">
                                        {stat.icon}
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">{stat.label}</span>
                                    </div>
                                    <p className="text-[36px] font-black leading-none tracking-tight text-foreground">{stat.value}</p>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                </Tabs.Panel>

                {/* ── Genres ───────────────────────────────── */}
                <Tabs.Panel id="genres" className="flex flex-col gap-4">
                    <div className="flex gap-2.5">
                        <TextField fullWidth aria-label="New genre" className="flex-1" value={newGenre} onChange={setNewGenre}>
                            <Input
                                placeholder="Add new genre..."
                                className={INPUT_CLASS}
                                variant="secondary"
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') addGenre(); }}
                            />
                        </TextField>
                        <Button variant="primary" onPress={addGenre}>Add Genre</Button>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {config.genres.map((g) => (
                            <div key={g} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                                <span className="text-[12px] font-bold text-foreground">{g}</span>
                                <button
                                    type="button"
                                    onClick={() => handleChange('genres', config.genres.filter((x) => x !== g))}
                                    className="grid h-6 w-6 place-items-center rounded-full bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Tabs.Panel>

                {/* ── Requests ─────────────────────────────── */}
                <Tabs.Panel id="requests">
                    <Card>
                        <Card.Content className="flex flex-col gap-3 p-5">
                            {[
                                { k: 'allowCoverArt' as const, l: 'Allow Cover Art Updates' },
                                { k: 'allowAudio' as const, l: 'Allow Audio File Updates' },
                                { k: 'allowDelete' as const, l: 'Allow Takedown Requests' },
                                { k: 'allowOther' as const, l: 'Allow Other Requests' },
                            ].map((item) => (
                                <ToggleRow key={item.k} label={item.l} isSelected={config[item.k] as boolean} onChange={(v) => handleChange(item.k, v)} />
                            ))}
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                {/* ── Home Page ────────────────────────────── */}
                <Tabs.Panel id="home" className="flex flex-col gap-5">
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-6">
                            <Field label="Hero Main Text" value={config.heroText || ''} onChange={(v) => handleChange('heroText', v)} />
                            <TextField fullWidth value={config.heroSubText || ''} onChange={(v) => handleChange('heroSubText', v)}>
                                <Label className="dash-label">Hero Subtext</Label>
                                <TextArea className={`${INPUT_CLASS} min-h-20 resize-y`} variant="secondary" />
                            </TextField>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">Featured Card Labels</Card.Title>
                        </Card.Header>
                        <Card.Content className="grid gap-4 pt-0 sm:grid-cols-3">
                            {[
                                { key: 'featuredReleaseLabel' as const, placeholder: 'FEATURED RELEASE' },
                                { key: 'featuredReleaseSubLabel' as const, placeholder: 'NOW STREAMING' },
                                { key: 'featuredReleaseStatus' as const, placeholder: 'Featured' },
                            ].map((f) => (
                                <TextField key={f.key} fullWidth value={config[f.key] || ''} onChange={(v) => handleChange(f.key, v)}>
                                    <Input placeholder={f.placeholder} className={INPUT_CLASS} variant="secondary" />
                                </TextField>
                            ))}
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Content className="flex flex-col gap-3 p-5">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                                    Featured Release (Hero Highlight)
                                </label>
                                <select
                                    value={config.featuredReleaseId || ''}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('featuredReleaseId', e.target.value)}
                                    className="dash-input"
                                >
                                    <option value="">(Auto-pick latest)</option>
                                    {releaseOptions.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} — {r.artistName || 'Unknown'}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-[10px] text-muted">
                                    Anasayfa hero&apos;da görünecek release. Seçilmezse en güncel release kullanılır.
                                </p>
                            </div>
                            <ToggleRow label="Show Stats Section" isSelected={config.showStats} onChange={(v) => handleChange('showStats', v)} />
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                {/* ── Join Page ────────────────────────────── */}
                <Tabs.Panel id="join" className="flex flex-col gap-5">
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-6">
                            <Field label="Join Page Title" value={config.joinHeroTitle || ''} onChange={(v) => handleChange('joinHeroTitle', v)} />
                            <Field label="Join Page Subtitle" value={config.joinHeroSub || ''} onChange={(v) => handleChange('joinHeroSub', v)} />
                        </Card.Content>
                    </Card>
                    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3.5">
                        <p className="text-[11px] font-semibold leading-relaxed text-amber-400/80">
                            TIP: Detailed information like Accepted Genres and Commission Table are managed in the &ldquo;CONTENT&rdquo; section of the Admin Dashboard.
                        </p>
                    </div>
                </Tabs.Panel>

                {/* ── Socials ──────────────────────────────── */}
                <Tabs.Panel id="socials">
                    <Card>
                        <Card.Content className="grid gap-5 p-6 sm:grid-cols-2">
                            {(['discord', 'instagram', 'spotify', 'youtube', 'twitter', 'facebook'] as const).map((social) => (
                                <TextField key={social} fullWidth type="url" value={config[social] || ''} onChange={(v) => handleChange(social, v)}>
                                    <Label className="dash-label">
                                        {social.toUpperCase()} URL
                                    </Label>
                                    <Input placeholder={`https://${social}.com/...`} className={INPUT_CLASS} variant="secondary" />
                                </TextField>
                            ))}
                        </Card.Content>
                    </Card>
                </Tabs.Panel>
            </Tabs>

            {/* ── Save button ──────────────────────────────── */}
            <div className="mt-6 flex justify-end border-t border-border pt-5">
                <Button variant="primary" onPress={handleSave} isDisabled={saving} className="px-10">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
