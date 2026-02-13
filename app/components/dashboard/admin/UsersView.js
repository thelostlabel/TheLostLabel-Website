import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function UsersView({ users, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const roles = ['artist', 'a&r', 'admin'];
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            user.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            user.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [users, debouncedSearch]);

    const openEdit = (user) => {
        setEditingUser(user);
        let perms = {};
        try { perms = user.permissions ? JSON.parse(user.permissions) : {}; } catch (e) { }

        setEditForm({
            email: user.email || '',
            fullName: user.fullName || '',
            stageName: user.stageName || '',
            spotifyUrl: user.spotifyUrl || '',
            role: user.role || 'artist',
            status: user.status || 'pending',
            permissions: perms
        });
    };

    const handleSave = async (overrideData = null) => {
        setSaving(true);
        try {
            const data = overrideData || {
                userId: editingUser.id,
                ...editForm,
                permissions: JSON.stringify(editForm.permissions)
            };

            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to update user');

            if (!overrideData) {
                setEditingUser(null);
                showToast("User updated successfully", "success");
            }
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast('Save failed', "error");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = (userId) => {
        showConfirm(
            "APPROVE USER?",
            "Are you sure you want to approve this artist request? They will gain access to the dashboard.",
            async () => {
                await handleSave({ userId, status: 'approved' });
                showToast("User approved", "success");
            }
        );
    };

    const handleDelete = (userId) => {
        showConfirm(
            "DELETE USER?",
            "Are you sure you want to PERMANENTLY delete this user? This cannot be undone.",
            async () => {
                try {
                    const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete user');
                    showToast("User deleted", "success");
                    onRefresh();
                } catch (e) {
                    console.error(e);
                    showToast('Delete failed', "error");
                }
            }
        );
    };

    return (
        <div>
            {/* Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '850px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                                <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>USER_ACCESS_CONTROL</h3>
                            </div>
                            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '24px' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>EMAIL_ADDRESS</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>FULL_NAME</label>
                                        <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STAGE_NAME</label>
                                        <input type="text" value={editForm.stageName} onChange={(e) => setEditForm({ ...editForm, stageName: e.target.value })}
                                            style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SYSTEM_ROLE</label>
                                    <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)' }}>
                                        {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ACCOUNT_STATUS</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', color: editForm.status === 'approved' ? '#00ff88' : '#ff4444' }}>
                                        <option value="pending">PENDING APPROVAL</option>
                                        <option value="approved">APPROVED</option>
                                        <option value="rejected">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px', fontWeight: '900', letterSpacing: '2px' }}>PORTAL_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {[
                                            { key: 'view_overview', label: 'OVERVIEW' },
                                            { key: 'view_support', label: 'SUPPORT' },
                                            { key: 'view_releases', label: 'RELEASES' },
                                            { key: 'view_demos', label: 'DEMOS' },
                                            { key: 'view_earnings', label: 'EARNINGS' },
                                            { key: 'view_contracts', label: 'CONTRACTS' },
                                            { key: 'view_profile', label: 'PROFILE' },
                                            { key: 'submit_demos', label: 'SUBMIT_DEMO' },
                                            { key: 'request_changes', label: 'REQUEST_CHANGE' }
                                        ].map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '9px', fontWeight: '800', color: editForm.permissions?.[p.key] !== false ? '#fff' : '#333' }}>
                                                <input type="checkbox"
                                                    checked={editForm.permissions?.[p.key] !== false}
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px', fontWeight: '900', letterSpacing: '2px' }}>ADMIN_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {[
                                            { key: 'admin_view_overview', label: 'STATS' },
                                            { key: 'admin_view_submissions', label: 'DEMOS' },
                                            { key: 'admin_view_artists', label: 'ARTISTS' },
                                            { key: 'admin_view_contracts', label: 'CONTRACTS' },
                                            { key: 'admin_view_earnings', label: 'EARNINGS' },
                                            { key: 'admin_view_payments', label: 'PAYMENTS' },
                                            { key: 'admin_view_requests', label: 'REQUESTS' },
                                            { key: 'admin_view_users', label: 'USERS' },
                                            { key: 'admin_view_communications', label: 'COMMUNICATIONS' },
                                            { key: 'admin_view_content', label: 'CONTENT' },
                                            { key: 'admin_view_webhooks', label: 'WEBHOOKS' },
                                            { key: 'admin_view_settings', label: 'SETTINGS' }
                                        ].map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '9px', fontWeight: '800', color: editForm.permissions?.[p.key] === true ? 'var(--accent)' : '#333' }}>
                                                <input type="checkbox"
                                                    disabled={editForm.role === 'artist'}
                                                    checked={editForm.permissions?.[p.key] === true}
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={() => handleSave()} disabled={saving} className="glow-button" style={{ flex: 2, padding: '18px', fontWeight: '900', height: 'auto' }}>
                                {saving ? 'APPLYING_CHANGES...' : 'SAVE_USER_PERMISSIONS'}
                            </button>
                            <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px', borderRadius: '16px' }}>
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
                <div style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>
                    {users.filter(u => u.status === 'pending').length} PENDING REGISTRATIONS
                </div>
            </div>

            <div style={{
                ...glassStyle,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, i) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.3s ease' }}
                            >
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {user.email}
                                        {user.emailVerified ? (
                                            <div title={`Verified: ${new Date(user.emailVerified).toLocaleDateString()}`} style={{ color: '#00ff88', display: 'flex' }}><CheckCircle size={12} /></div>
                                        ) : (
                                            <div title="Not Verified" style={{ color: 'var(--status-warning)', display: 'flex' }}><AlertCircle size={12} /></div>
                                        )}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#ccc' }}>{user.stageName || user.fullName || '---'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        color: user.role === 'admin' ? 'var(--accent)' : '#888',
                                        letterSpacing: '1px'
                                    }}>
                                        {user.role?.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        background: user.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(245, 197, 66, 0.1)',
                                        color: user.status === 'approved' ? '#00ff88' : 'var(--accent)',
                                        border: `1px solid ${user.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.05)'}`
                                    }}>
                                        {user.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {user.status === 'pending' && (
                                            <button onClick={() => handleApprove(user.id)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>APPROVE</button>
                                        )}
                                        <button onClick={() => openEdit(user)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>EDIT</button>
                                        <button onClick={() => handleDelete(user.id)} style={{ ...btnStyle, color: 'var(--status-error)', background: 'rgba(255,68,68,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>DELETE</button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO USERS MATCHING SEARCH</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
