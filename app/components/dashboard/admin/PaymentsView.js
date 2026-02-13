import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function PaymentsView({ payments, onRefresh, users }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [form, setForm] = useState({
        userId: '',
        amount: '',
        method: 'bank_transfer',
        reference: '',
        notes: '',
        status: 'completed'
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p =>
            p.user?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.user?.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.user?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.reference?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [payments, debouncedSearch]);

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = '/api/payments';
            const method = editingPayment ? 'PATCH' : 'POST';
            const body = { ...form };
            if (editingPayment) body.id = editingPayment.id;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingPayment(null);
                showToast(`Payment ${editingPayment ? 'updated' : 'recorded'} successfully`, "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save payment", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error saving payment", "error");
        }
        finally { setSaving(false); }
    };

    const handleDeletePayment = async (id) => {
        showConfirm(
            "DELETE PAYMENT?",
            "Are you sure you want to delete this payment record?",
            async () => {
                try {
                    const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Payment record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Delete failed", "error");
                    }
                } catch (e) { showToast("Delete error", "error"); }
            }
        );
    };

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input
                        type="text"
                        placeholder="Search payments by artist or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.02)' }}
                    />
                </div>
                <button
                    onClick={() => {
                        if (!showAdd) {
                            setForm({
                                userId: '',
                                amount: '',
                                method: 'bank_transfer',
                                reference: '',
                                notes: '',
                                status: 'completed'
                            });
                            setEditingPayment(null);
                        }
                        setShowAdd(!showAdd);
                    }}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', height: 'auto' }}
                >
                    <Plus size={14} /> RECORD PAYMENT
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid var(--accent)' }}
                >
                    <form onSubmit={handleSubmitPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST / USER</label>
                            <select
                                value={form.userId}
                                onChange={e => setForm({ ...form, userId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="">Select Recipient...</option>
                                {users.filter(u => u.role === 'artist' || u.role === 'a&r' || u.role === 'admin').map(u => (
                                    <option key={u.id} value={u.id}>{u.stageName || u.fullName} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>METHOD</label>
                            <select
                                value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="paypal">PayPal</option>
                                <option value="wise">Wise</option>
                                <option value="crypto">Crypto</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>REFERENCE / ID</label>
                            <input
                                type="text"
                                value={form.reference}
                                onChange={e => setForm({ ...form, reference: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STATUS</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={{ ...btnStyle, height: 'auto' }}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', height: 'auto' }}>
                                {saving ? 'SAVING...' : editingPayment ? 'SAVE CHANGES' : 'RECORD PAYMENT'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>DATE</th>
                            <th style={thStyle}>RECIPIENT</th>
                            <th style={thStyle}>AMOUNT</th>
                            <th style={thStyle}>METHOD</th>
                            <th style={thStyle}>REFERENCE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map((p, i) => (
                            <motion.tr
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{p.user?.stageName || p.user?.fullName}</div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{p.user?.email}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent)' }}>${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>{p.method?.replace('_', ' ')}</span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>{p.reference || '---'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px', padding: '4px 8px', borderRadius: '16px',
                                        background: p.status === 'completed' ? 'rgba(245, 197, 66, 0.18)' : 'rgba(255,255,255,0.05)',
                                        color: p.status === 'completed' ? 'var(--accent)' : '#888',
                                        fontWeight: '900'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => {
                                            setEditingPayment(p);
                                            setForm({
                                                userId: p.userId || '',
                                                amount: p.amount,
                                                method: p.method,
                                                reference: p.reference || '',
                                                notes: p.notes || '',
                                                status: p.status
                                            });
                                            setShowAdd(true);
                                        }} style={{ ...btnStyle, height: 'auto', padding: '5px 10px' }}>
                                            EDIT
                                        </button>
                                        <button onClick={() => handleDeletePayment(p.id)} style={{ ...btnStyle, color: 'var(--status-error)', height: 'auto', padding: '5px 10px' }}>
                                            DELETE
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredPayments.length === 0 && (
                            <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO PAYMENTS RECORDED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
