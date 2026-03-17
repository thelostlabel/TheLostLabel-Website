import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Edit2, Trash2, Power, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle } from './styles';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';

import { DashboardAnnouncement } from '../types';

interface AnnouncementsViewProps {
    announcements: DashboardAnnouncement[];
    onRefresh: () => void;
}

export default function AnnouncementsView({ announcements = [], onRefresh }: AnnouncementsViewProps) {
    const { showToast, showConfirm } = useToast() as any;
    const [editing, setEditing] = useState<string | 'new' | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [form, setForm] = useState({
        title: '',
        content: '',
        type: 'feature',
        active: true,
        linkUrl: '',
        linkText: 'Learn more'
    });

    const handleEdit = (item: DashboardAnnouncement | null = null) => {
        if (item) {
            setEditing(item.id);
            setForm({
                title: item.title,
                content: item.content,
                type: item.type || 'feature',
                active: item.active ?? true,
                linkUrl: item.linkUrl || '',
                linkText: item.linkText || 'Learn more'
            });
        } else {
            setEditing('new');
            setForm({
                title: '',
                content: '',
                type: 'feature',
                active: true,
                linkUrl: '',
                linkText: 'Learn more'
            });
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            showToast("Title and content are required", "warning");
            return;
        }

        setSaving(true);
        try {
            const body = {
                ...form,
                id: editing === 'new' ? undefined : editing
            };

            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Failed to save");

            showToast(editing === 'new' ? "Announcement created" : "Announcement updated", "success");
            setEditing(null);
            onRefresh();
        } catch (error: any) {
            showToast(error.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "DELETE ANNOUNCEMENT?",
            "This will permanently remove this announcement. Continue?",
            async () => {
                try {
                    const res = await fetch(`/api/admin/announcements?id=${id}`, {
                        method: 'DELETE'
                    });
                    if (!res.ok) throw new Error("Delete failed");
                    showToast("Announcement deleted", "success");
                    onRefresh();
                } catch (error: any) {
                    showToast(error.message || "Delete failed", "error");
                }
            }
        );
    };

    const toggleActive = async (item: DashboardAnnouncement) => {
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, active: !item.active })
            });
            if (!res.ok) throw new Error("Update failed");
            onRefresh();
        } catch (error: any) {
            showToast(error.message || "Update failed", "error");
        }
    };

    return (
        <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#fff', margin: 0 }}>FEATURE ANNOUNCEMENTS</h2>
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Announce new site features and updates to your users.</p>
                </div>
                {!editing && (
                    <button onClick={() => handleEdit()} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={14} /> NEW ANNOUNCEMENT
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {editing ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ ...glassStyle, padding: '40px', position: 'relative' }}
                    >
                        {saving && <DashboardLoader overlay label="PUBLISHING" />}
                        
                        <div style={{ display: 'grid', gap: '25px', maxWidth: '800px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#444', letterSpacing: '2px', marginBottom: '10px' }}>ANNOUNCEMENT TITLE</label>
                                <input 
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    placeholder="e.g. New Advanced Studio Player"
                                    style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', outline: 'none', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#444', letterSpacing: '2px', marginBottom: '10px' }}>TYPE</label>
                                    <select 
                                        value={form.type}
                                        onChange={e => setForm({...form, type: e.target.value})}
                                        style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', outline: 'none' }}
                                    >
                                        <option value="feature">NEW FEATURE</option>
                                        <option value="update">PLATFORM UPDATE</option>
                                        <option value="important">IMPORTANT NOTICE</option>
                                        <option value="maintenance">MAINTENANCE</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button 
                                        onClick={() => setForm({...form, active: !form.active})}
                                        style={{ 
                                            flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', 
                                            background: form.active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)',
                                            color: form.active ? '#4ade80' : '#666',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Power size={14} /> {form.active ? 'ACTIVE & VISIBLE' : 'INACTIVE (HIDDEN)'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#444', letterSpacing: '2px', marginBottom: '10px' }}>CONTENT</label>
                                <textarea 
                                    value={form.content}
                                    onChange={e => setForm({...form, content: e.target.value})}
                                    placeholder="What's new? Describe the feature or update..."
                                    rows={6}
                                    style={{ width: '100%', padding: '20px', background: '#000', border: '1px solid var(--border)', color: '#bbb', borderRadius: '12px', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#444', letterSpacing: '2px', marginBottom: '10px' }}>LINK URL (OPTIONAL)</label>
                                    <input 
                                        value={form.linkUrl}
                                        onChange={e => setForm({...form, linkUrl: e.target.value})}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#444', letterSpacing: '2px', marginBottom: '10px' }}>BUTTON TEXT</label>
                                    <input 
                                        value={form.linkText}
                                        onChange={e => setForm({...form, linkText: e.target.value})}
                                        placeholder="Learn more"
                                        style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
                                <button onClick={handleSave} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', padding: '14px 40px', borderRadius: '12px', fontWeight: 900 }}>
                                    {editing === 'new' ? 'CREATE ANNOUNCEMENT' : 'SAVE CHANGES'}
                                </button>
                                <button onClick={() => setEditing(null)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', padding: '14px 30px', borderRadius: '12px' }}>DISCARD</button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'grid', gap: '15px' }}
                    >
                        {announcements.length === 0 ? (
                            <div style={{ ...glassStyle, padding: '60px', textAlign: 'center', opacity: 0.5 }}>
                                <Bell size={32} style={{ marginBottom: '15px', color: '#444' }} />
                                <p style={{ fontSize: '12px' }}>No announcements found. Click &quot;NEW ANNOUNCEMENT&quot; to create one.</p>
                            </div>
                        ) : (
                            announcements.map((item: DashboardAnnouncement) => (
                                <div key={item.id} style={{ 
                                    ...glassStyle, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderLeft: `3px solid ${item.active ? 'var(--accent)' : 'transparent'}`,
                                    opacity: item.active ? 1 : 0.6
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                                        }}>
                                            <Bell size={18} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0 }}>{item.title}</h3>
                                                <span style={{ 
                                                    fontSize: '8px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px',
                                                    background: 'rgba(255,255,255,0.05)', color: '#666', letterSpacing: '1px'
                                                }}>{(item.type || 'FEATURE').toUpperCase()}</span>
                                            </div>
                                            <p style={{ fontSize: '11px', color: '#555', marginTop: '5px', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            onClick={() => toggleActive(item)}
                                            title={item.active ? "Deactivate" : "Activate"}
                                            style={{ ...btnStyle, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: item.active ? '#4ade80' : '#666' }}
                                        >
                                            <Power size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(item)}
                                            style={{ ...btnStyle, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent)' }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            style={{ ...btnStyle, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#ff4444' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
