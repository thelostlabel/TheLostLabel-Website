import { useState, useEffect, useMemo, useCallback } from 'react';

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { useDashboardAuth } from '@/app/components/dashboard/context/DashboardAuthProvider';
import { useDashboardRoute } from '@/app/components/dashboard/hooks/useDashboardRoute';
import { dashboardRequestJson, getDashboardErrorMessage } from '@/app/components/dashboard/lib/dashboard-request';
import {
    canDeleteUsers,
    canEditUsers,
    canManageUserPermissions,
    canManageUserRoles,
    canManageUserStatus,
    DEMO_PERMISSION_OPTIONS,
    MANAGEMENT_VIEW_PERMISSION_OPTIONS,
    parsePermissions,
    PORTAL_PERMISSION_OPTIONS,
    USER_PERMISSION_OPTIONS
} from '@/lib/permissions';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function UsersView({ users, onRefresh }) {
    const { currentUser } = useDashboardAuth();
    const { recordId, setRecordId, clearRecordId } = useDashboardRoute();
    const { showToast, showConfirm } = useToast();
    const roles = ['artist', 'a&r', 'admin'];
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const canEditProfile = canEditUsers(currentUser);
    const canManageStatus = canManageUserStatus(currentUser);
    const canManageRoles = canManageUserRoles(currentUser);
    const canManagePermissions = canManageUserPermissions(currentUser);
    const canDeleteUser = canDeleteUsers(currentUser);
    const canOpenEditor = canEditProfile || canManageStatus || canManageRoles || canManagePermissions;
    const permissionSections = [
        { title: 'PORTAL_PERMISSIONS', options: PORTAL_PERMISSION_OPTIONS, enabledByDefault: true },
        { title: 'MANAGEMENT_VIEWS', options: MANAGEMENT_VIEW_PERMISSION_OPTIONS, enabledByDefault: false },
        { title: 'DEMO_WORKFLOW', options: DEMO_PERMISSION_OPTIONS, enabledByDefault: false },
        { title: 'USER_MANAGEMENT', options: USER_PERMISSION_OPTIONS, enabledByDefault: false }
    ];

    // Deep link to user
    useEffect(() => {
        if (!canOpenEditor || users.length === 0) return;
        if (!recordId) {
            setEditingUser(null);
            return;
        }

        const user = users.find(u => u.id === recordId);
        if (user && user.id !== editingUser?.id) {
            setEditingUser(user);
            const perms = parsePermissions(user.permissions);
            setEditForm({
                email: user.email || '',
                fullName: user.fullName || '',
                stageName: user.stageName || '',
                spotifyUrl: user.spotifyUrl || '',
                role: user.role || 'artist',
                status: user.status || 'pending',
                permissions: perms
            });
        }
    }, [users, recordId, editingUser?.id, canOpenEditor]);

    const openEdit = useCallback((user, updateRoute = true) => {
        setEditingUser(user);
        const perms = parsePermissions(user.permissions);

        if (updateRoute) {
            setRecordId(user.id);
        }

        setEditForm({
            email: user.email || '',
            fullName: user.fullName || '',
            stageName: user.stageName || '',
            spotifyUrl: user.spotifyUrl || '',
            role: user.role || 'artist',
            status: user.status || 'pending',
            permissions: perms
        });
    }, [setRecordId]);

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

    const handleSave = async (overrideData = null) => {
        if (!overrideData && !canOpenEditor) {
            showToast('You do not have permission to edit users.', "error");
            return;
        }

        setSaving(true);
        try {
            const data = overrideData || {
                userId: editingUser.id,
                ...(canEditProfile ? {
                    email: editForm.email,
                    fullName: editForm.fullName,
                    stageName: editForm.stageName,
                    spotifyUrl: editForm.spotifyUrl
                } : {}),
                ...(canManageRoles ? { role: editForm.role } : {}),
                ...(canManageStatus ? { status: editForm.status } : {}),
                ...(canManagePermissions ? { permissions: JSON.stringify(editForm.permissions) } : {})
            };

            await dashboardRequestJson('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                context: 'update user',
                retry: false
            });

            if (!overrideData) {
                clearRecordId({ replace: true });
                showToast("User updated successfully", "success");
            }
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Save failed'), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = (userId) => {
        if (!canManageStatus) {
            showToast('You do not have permission to approve users.', "error");
            return;
        }

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
        if (!canDeleteUser) {
            showToast('You do not have permission to delete users.', "error");
            return;
        }

        showConfirm(
            "DELETE USER?",
            "Are you sure you want to PERMANENTLY delete this user? This cannot be undone.",
            async () => {
                try {
                    await dashboardRequestJson(`/api/admin/users?id=${userId}`, {
                        method: 'DELETE',
                        context: 'delete user',
                        retry: false
                    });
                    showToast("User deleted", "success");
                    clearRecordId({ replace: true });
                    await onRefresh?.();
                } catch (e) {
                    showToast(getDashboardErrorMessage(e, 'Delete failed'), "error");
                }
            }
        );
    };

    return (
        <div>
            <style jsx>{`
                @media (max-width: 900px) {
                    .users-toolbar {
                        flex-direction: column;
                        align-items: stretch !important;
                    }

                    .users-toolbar-count {
                        text-align: left;
                    }
                }

                @media (max-width: 768px) {
                    .users-modal-panel {
                        padding: 20px !important;
                    }

                    .users-modal-grid,
                    .users-basic-grid,
                    .users-permissions-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .users-modal-actions {
                        flex-direction: column;
                    }

                    .users-modal-actions > button {
                        width: 100%;
                    }
                }

                @media (max-width: 640px) {
                    .users-row-actions {
                        flex-wrap: wrap;
                        justify-content: flex-start !important;
                    }

                    .users-email-cell {
                        align-items: flex-start !important;
                        flex-wrap: wrap;
                        word-break: break-word;
                    }
                }
            `}</style>
            {/* Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="users-modal-panel"
                        style={{
                            width: '95vw',
                            maxWidth: '850px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '40px',
                            background: 'var(--surface)',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '2px', background: 'var(--accent)' }}></div>
                                <h3 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '950', color: '#fff', margin: 0 }}>USER_ACCESS_CONTROL</h3>
                            </div>
                            <button onClick={() => {
                                clearRecordId({ replace: true });
                            }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '24px' }}>×</button>

                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }} className="users-modal-grid">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>EMAIL_ADDRESS</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        disabled={!canEditProfile}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', opacity: canEditProfile ? 1 : 0.6 }} />
                                </div>
                                <div className="users-basic-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>FULL_NAME</label>
                                        <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            disabled={!canEditProfile}
                                            style={{ ...inputStyle, width: '100%', padding: '15px', opacity: canEditProfile ? 1 : 0.6 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STAGE_NAME</label>
                                        <input type="text" value={editForm.stageName} onChange={(e) => setEditForm({ ...editForm, stageName: e.target.value })}
                                            disabled={!canEditProfile}
                                            style={{ ...inputStyle, width: '100%', padding: '15px', opacity: canEditProfile ? 1 : 0.6 }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SYSTEM_ROLE</label>
                                    <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        disabled={!canManageRoles}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', opacity: canManageRoles ? 1 : 0.6 }}>
                                        {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ACCOUNT_STATUS</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        disabled={!canManageStatus}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', color: editForm.status === 'approved' ? '#00ff88' : '#ff4444', opacity: canManageStatus ? 1 : 0.6 }}>
                                        <option value="pending">PENDING APPROVAL</option>
                                        <option value="approved">APPROVED</option>
                                        <option value="rejected">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {!canManagePermissions && (
                                    <div style={{ padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '10px', color: '#777', letterSpacing: '0.6px', lineHeight: 1.6 }}>
                                        Some controls are read-only for your account. Advanced access toggles unlock only if your own user grants permission management rights.
                                    </div>
                                )}
                                {permissionSections.map((section) => (
                                    <div key={section.title}>
                                        <p style={{ fontSize: '10px', color: '#555', marginBottom: '15px', fontWeight: '950', letterSpacing: '2px' }}>{section.title}</p>
                                        <div className="users-permissions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '24px', borderRadius: '2px', border: '1px solid var(--border)' }}>
                                            {section.options.map((p) => {
                                                const isEnabled = section.enabledByDefault
                                                    ? editForm.permissions?.[p.key] !== false
                                                    : editForm.permissions?.[p.key] === true;

                                                return (
                                                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: canManagePermissions ? 'pointer' : 'not-allowed', fontSize: '9px', fontWeight: '800', color: isEnabled ? (section.enabledByDefault ? '#fff' : 'var(--accent)') : '#333', opacity: canManagePermissions ? 1 : 0.7 }}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={!canManagePermissions}
                                                            checked={isEnabled}
                                                            onChange={(e) => setEditForm({
                                                                ...editForm,
                                                                permissions: {
                                                                    ...editForm.permissions,
                                                                    [p.key]: e.target.checked
                                                                }
                                                            })}
                                                            style={{ accentColor: 'var(--accent)' }}
                                                        />
                                                        {p.label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="users-modal-actions" style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={() => handleSave()} disabled={saving || !canOpenEditor} style={{ ...btnStyle, flex: 2, padding: '18px', background: 'var(--accent)', color: '#000', border: 'none', height: 'auto', opacity: saving || !canOpenEditor ? 0.6 : 1 }}>
                                {saving ? 'APPLYING_CHANGES...' : 'SAVE_USER_PERMISSIONS'}
                            </button>
                            <button onClick={() => {
                                clearRecordId({ replace: true });
                            }} style={{ ...btnStyle, flex: 1, padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', height: 'auto' }}>
                                CANCEL
                            </button>

                        </div>
                    </motion.div>
                </div>
            )}

            <div className="users-toolbar" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '100%', maxWidth: '300px', background: 'var(--glass)', borderRadius: '2px' }}
                />
                <div className="users-toolbar-count" style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>
                    {users.filter(u => u.status === 'pending').length} PENDING REGISTRATIONS
                </div>
            </div>

            <div style={{
                ...glassStyle,
                border: '1px solid var(--border)',
                background: 'var(--glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}>
                <table className="admin-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--glass)' }}>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td data-label="EMAIL" style={tdStyle}>
                                    <div className="users-email-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {user.email}
                                        {user.emailVerified ? (
                                            <div title={`Verified: ${new Date(user.emailVerified).toLocaleDateString()}`} style={{ color: '#00ff88', display: 'flex' }}><CheckCircle size={12} /></div>
                                        ) : (
                                            <div title="Not Verified" style={{ color: 'var(--status-warning)', display: 'flex' }}><AlertCircle size={12} /></div>
                                        )}
                                    </div>
                                </td>
                                <td data-label="NAME" style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#ccc' }}>{user.stageName || user.fullName || '---'}</div>
                                </td>
                                <td data-label="ROLE" style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        color: user.role === 'admin' ? 'var(--accent)' : '#888',
                                        letterSpacing: '1px'
                                    }}>
                                        {user.role?.toUpperCase()}
                                    </span>
                                </td>
                                <td data-label="STATUS" style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '950',
                                        padding: '4px 12px',
                                        borderRadius: '2px',
                                        background: user.status === 'approved' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 240, 0, 0.05)',
                                        color: user.status === 'approved' ? '#00ff88' : '#fff000',
                                        letterSpacing: '1px',
                                        border: `1px solid ${user.status === 'approved' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 240, 0, 0.2)'}`
                                    }}>
                                        {user.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </td>
                                <td data-label="ACTIONS" style={tdStyle}>
                                    <div className="users-row-actions" style={{ display: 'flex', gap: '8px' }}>
                                        {user.status === 'pending' && canManageStatus && (
                                            <button onClick={() => handleApprove(user.id)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '2px', fontSize: '9px', height: 'auto' }}>APPROVE</button>
                                        )}
                                        {canOpenEditor && (
                                            <button onClick={() => openEdit(user)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '2px', fontSize: '9px', height: 'auto' }}>EDIT</button>
                                        )}
                                        {canDeleteUser && (
                                            <button onClick={() => handleDelete(user.id)} style={{ ...btnStyle, color: '#ff4444', background: 'rgba(255,68,68,0.05)', padding: '6px 12px', borderRadius: '2px', fontSize: '9px', height: 'auto', borderColor: 'rgba(255,68,68,0.2)' }}>DELETE</button>
                                        )}
                                        {!canManageStatus && !canOpenEditor && !canDeleteUser && (
                                            <span style={{ fontSize: '9px', color: '#555', fontWeight: '800', letterSpacing: '1px' }}>READ_ONLY</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
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
