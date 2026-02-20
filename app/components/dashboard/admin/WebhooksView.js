import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function WebhooksView({ webhooks, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState(null);
    const [form, setForm] = useState({ name: '', url: '', events: '', enabled: true, config: '' });
    const [saving, setSaving] = useState(false);

    const eventOptions = [
        { value: 'new_track', label: 'New Track Released' },
        { value: 'playlist_update', label: 'Playlist Update' },
        { value: 'demo_submit', label: 'Demo Submitted' },
        { value: 'demo_approved', label: 'Demo Approved' },
        { value: 'demo_rejected', label: 'Demo Rejected' },
    ];

    const resetForm = () => {
        setForm({ name: '', url: '', events: '', enabled: true, config: '' });
        setShowAdd(false);
        setEditingWebhook(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingWebhook) {
                await fetch('/api/admin/webhooks', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingWebhook.id, ...form })
                });
            } else {
                await fetch('/api/admin/webhooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }
            resetForm();
            showToast("Webhook configuration saved", "success");
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast('Save failed', "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        showConfirm(
            "DELETE WEBHOOK?",
            "Are you sure you want to delete this webhook? It will stop receiving events immediately.",
            async () => {
                try {
                    await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' });
                    showToast("Webhook deleted", "success");
                    onRefresh();
                } catch (e) {
                    console.error(e);
                    showToast("Delete failed", "error");
                }
            }
        );
    };

    const handleToggle = async (webhook) => {
        try {
            await fetch('/api/admin/webhooks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: webhook.id, enabled: !webhook.enabled })
            });
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const testWebhook = async (url) => {
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{ title: '🔔 Webhook Test', description: 'This is a test notification from LOST Admin Panel.', color: 0x00ff88 }]
                })
            });
            showToast('Test webhook sent!', "success");
        } catch (e) { showToast('Test failed', "error"); }
    };

    return (
        <div>
            {/* Add/Edit Modal */}
            {(showAdd || editingWebhook) && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '500px',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                                <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>
                                    {editingWebhook ? 'EDIT_WEBHOOK' : 'ADD_NEW_WEBHOOK'}
                                </h3>
                            </div>
                            <button onClick={() => { setShowAdd(false); setEditingWebhook(null); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '24px' }}>×</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>WEBHOOK_NAME</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Discord Notifications"
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ENDPOINT_URL</label>
                                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SUBSCRIBE_EVENTS</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'var(--glass)', padding: '15px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    {eventOptions.map(opt => {
                                        const isSelected = form.events.includes(opt.value);
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    const currentEvents = form.events ? form.events.split(',').filter(e => e) : [];
                                                    if (isSelected) {
                                                        setForm({ ...form, events: currentEvents.filter(e => e !== opt.value).join(',') });
                                                    } else {
                                                        setForm({ ...form, events: [...currentEvents, opt.value].join(',') });
                                                    }
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    fontSize: '9px',
                                                    fontWeight: '900',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                                                    color: isSelected ? '#000' : '#444',
                                                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {opt.label.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {form.events?.includes('playlist_update') && (
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>TARGET_PLAYLIST_ID</label>
                                    <input
                                        type="text"
                                        placeholder="Spotify Playlist ID"
                                        value={form.config ? JSON.parse(form.config).playlistId || '' : ''}
                                        onChange={(e) => {
                                            const currentConfig = form.config ? JSON.parse(form.config) : {};
                                            setForm({ ...form, config: JSON.stringify({ ...currentConfig, playlistId: e.target.value }) });
                                        }}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.url} className="glow-button" style={{ flex: 2, padding: '18px', fontWeight: '900', height: 'auto' }}>
                                {saving ? 'PROCESSING...' : (editingWebhook ? 'UPDATE_WEBHOOK' : 'CREATE_WEBHOOK')}
                            </button>
                            <button onClick={() => { setShowAdd(false); setEditingWebhook(null); }} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px', borderRadius: '16px' }}>
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff', margin: 0 }}>AUTOMATION_WEBHOOKS</h3>
                    <p style={{ fontSize: '9px', color: '#444', marginTop: '5px', fontWeight: '800' }}>NOTIFY DISCORD OR OTHER SERVICES ON SYSTEM EVENTS</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 25px' }}>+ NEW_WEBHOOK</button>
            </div>

            <div style={glassStyle}>
                <table className="admin-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--glass)' }}>
                            <th style={thStyle}>NAME / ENDPOINT</th>
                            <th style={thStyle}>SUBSCRIPTIONS</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {webhooks.map(webhook => (
                            <tr key={webhook.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td data-label="NAME / ENDPOINT" style={tdStyle}>
                                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{webhook.name}</div>
                                    <div style={{ fontSize: '9px', color: '#444', marginTop: '4px', letterSpacing: '0.5px' }}>{webhook.url.substring(0, 60)}...</div>
                                </td>
                                <td data-label="SUBSCRIPTIONS" style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {webhook.events?.split(',').filter(e => e).map(event => (
                                            <span key={event} style={{ fontSize: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', color: '#888', borderRadius: '4px', fontWeight: '800' }}>
                                                {event.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td data-label="STATUS" style={tdStyle}>
                                    <button
                                        onClick={() => handleToggle(webhook)}
                                        style={{
                                            background: webhook.enabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: webhook.enabled ? '#00ff88' : '#444',
                                            border: '1px solid var(--border)',
                                            padding: '6px 12px',
                                            fontSize: '9px',
                                            cursor: 'pointer',
                                            fontWeight: '900',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {webhook.enabled ? 'ACTIVE' : 'DISABLED'}
                                    </button>
                                </td>
                                <td data-label="ACTIONS" style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => testWebhook(webhook.url)} style={{ ...btnStyle, fontSize: '9px', background: 'var(--glass)' }}>TEST</button>
                                        <button onClick={() => {
                                            setEditingWebhook(webhook);
                                            setForm({
                                                name: webhook.name,
                                                url: webhook.url,
                                                events: webhook.events,
                                                enabled: webhook.enabled,
                                                config: webhook.config || ''
                                            });
                                        }} style={{ ...btnStyle, fontSize: '9px', background: 'var(--glass)' }}>EDIT</button>
                                        <button onClick={() => handleDelete(webhook.id)} style={{ ...btnStyle, fontSize: '9px', color: 'var(--status-error)', background: 'rgba(255,68,68,0.05)' }}>DELETE</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {webhooks.length === 0 && (
                            <tr><td colSpan="4" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '60px' }}>NO_WEBHOOKS_CONFIGURED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
