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
    const [decisionModal, setDecisionModal] = useState({ open: false, payment: null, status: 'completed', note: '' });
    const [decisionSaving, setDecisionSaving] = useState(false);

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

    const statusLabel = (status) => {
        if (status === 'failed') return 'REJECTED';
        return String(status || '').toUpperCase();
    };

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

    const openDecisionModal = (payment, status) => {
        setDecisionModal({ open: true, payment, status, note: '' });
    };

    const handleDecisionSubmit = async (e) => {
        e.preventDefault();
        if (!decisionModal.payment) return;
        setDecisionSaving(true);
        try {
            const res = await fetch('/api/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: decisionModal.payment.id,
                    status: decisionModal.status,
                    adminNote: decisionModal.note
                })
            });
            if (res.ok) {
                showToast(
                    decisionModal.status === 'completed'
                        ? "Payout approved and artist notified"
                        : "Payout rejected and artist notified",
                    "success"
                );
                setDecisionModal({ open: false, payment: null, status: 'completed', note: '' });
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Decision failed", "error");
            }
        } catch (e) {
            showToast("Error processing decision", "error");
        } finally {
            setDecisionSaving(false);
        }
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
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Search payments by artist or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '44px', background: 'var(--glass)', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', width: '100%' }}
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
                    style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none', height: 'auto', borderRadius: '8px', fontWeight: '950', fontSize: '11px', letterSpacing: '1px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={14} /> {showAdd ? 'CLOSE FORM' : 'RECORD PAYOUT'}
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{ ...glassStyle, padding: '32px', marginBottom: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '32px', height: '2px', background: 'var(--accent)' }}></div>
                        <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', margin: 0 }}>{editingPayment ? 'EDIT PAYMENT' : 'NEW PAYMENT'}</h3>
                    </div>

                    <form onSubmit={handleSubmitPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', position: 'relative', zIndex: 1 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>ARTIST RECIPIENT *</label>
                            <select
                                value={form.userId}
                                onChange={e => setForm({ ...form, userId: e.target.value })}
                                required
                                style={{ ...inputStyle, borderRadius: '8px', fontSize: '12px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', width: '100%', color: '#fff' }}
                            >
                                <option value="" style={{ color: '#000' }}>Select Recipient...</option>
                                {users.filter(u => u.role === 'artist' || u.role === 'a&r' || u.role === 'admin').map(u => (
                                    <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.stageName || u.fullName || u.email} ({u.role.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>AMOUNT (USD) *</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: '900', fontSize: '14px' }}>$</span>
                                <input
                                    type="number" step="0.01" required
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    style={{ ...inputStyle, borderRadius: '8px', fontSize: '14px', fontWeight: '950', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px 16px 16px 36px', width: '100%' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>PAYMENT METHOD</label>
                            <select
                                value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}
                                style={{ ...inputStyle, borderRadius: '8px', fontSize: '12px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', width: '100%', color: '#fff' }}
                            >
                                <option value="bank_transfer" style={{ color: '#000' }}>Bank Transfer</option>
                                <option value="paypal" style={{ color: '#000' }}>PayPal</option>
                                <option value="wise" style={{ color: '#000' }}>Wise</option>
                                <option value="crypto" style={{ color: '#000' }}>Crypto</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>REFERENCE ID</label>
                            <input
                                type="text"
                                value={form.reference}
                                onChange={e => setForm({ ...form, reference: e.target.value })}
                                style={{ ...inputStyle, borderRadius: '8px', fontSize: '12px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', width: '100%' }}
                                placeholder="TXN ID / DEKONT NO"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>STATUS</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                style={{ ...inputStyle, borderRadius: '8px', fontSize: '12px', background: 'var(--glass)', border: '1px solid var(--border)', padding: '16px', width: '100%', color: '#fff' }}
                            >
                                <option value="completed" style={{ color: '#000' }}>COMPLETED</option>
                                <option value="pending" style={{ color: '#000' }}>PENDING</option>
                                <option value="failed" style={{ color: '#000' }}>FAILED</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={{ ...btnStyle, height: 'auto', borderRadius: '8px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', padding: '16px 32px' }}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none', height: 'auto', borderRadius: '8px', fontWeight: '950', fontSize: '11px', letterSpacing: '1px', padding: '16px 32px' }}>
                                {saving ? 'SAVING...' : editingPayment ? 'UPDATE PAYMENT' : 'RECORD PAYMENT'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {decisionModal.open && decisionModal.payment && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '560px',
                            padding: '40px',
                            background: 'var(--surface)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: `radial-gradient(circle, ${decisionModal.status === 'completed' ? 'var(--accent)' : '#ff4444'} 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: '32px', height: '2px', background: decisionModal.status === 'completed' ? 'var(--accent)' : '#ff4444' }}></div>
                            <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', margin: 0 }}>
                                {decisionModal.status === 'completed' ? 'APPROVE PAYOUT REQUEST' : 'REJECT PAYOUT REQUEST'}
                            </h3>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                            <div>
                                <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px', marginBottom: '6px' }}>RECIPIENT</div>
                                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '950', letterSpacing: '0.5px' }}>{decisionModal.payment.user?.stageName || decisionModal.payment.user?.email || 'Artist'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px', marginBottom: '6px' }}>AMOUNT</div>
                                <div style={{ fontSize: '24px', color: decisionModal.status === 'completed' ? 'var(--accent)' : '#ff4444', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                    ${Number(decisionModal.payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {decisionModal.payment.notes && (
                            <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', fontWeight: '900', letterSpacing: '1px' }}>ARTIST REQUEST NOTE</div>
                                <div style={{ fontSize: '13px', color: '#ddd', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>"{decisionModal.payment.notes}"</div>
                            </div>
                        )}

                        <form onSubmit={handleDecisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
                            <div>
                                <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>ADMIN NOTE (WILL BE EMAILED TO ARTIST)</label>
                                <textarea
                                    value={decisionModal.note}
                                    onChange={(e) => setDecisionModal((prev) => ({ ...prev, note: e.target.value }))}
                                    placeholder={decisionModal.status === 'completed' ? 'Optional: transfer timing/reference details...' : 'Optional: reason for rejection...'}
                                    style={{ ...inputStyle, width: '100%', fontSize: '12px', minHeight: '120px', resize: 'vertical', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <button
                                    type="submit"
                                    disabled={decisionSaving}
                                    style={{
                                        ...btnStyle,
                                        flex: 2,
                                        fontSize: '11px',
                                        height: 'auto',
                                        padding: '16px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '950',
                                        letterSpacing: '1px',
                                        justifyContent: 'center',
                                        background: decisionModal.status === 'completed' ? '#fff' : '#ff4444',
                                        color: decisionModal.status === 'completed' ? '#000' : '#fff'
                                    }}
                                >
                                    {decisionSaving ? 'SENDING...' : decisionModal.status === 'completed' ? 'APPROVE & NOTIFY' : 'REJECT & NOTIFY'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDecisionModal({ open: false, payment: null, status: 'completed', note: '' })}
                                    style={{ ...btnStyle, flex: 1, fontSize: '11px', height: 'auto', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontWeight: '950', letterSpacing: '1px', justifyContent: 'center' }}
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'var(--glass)' }}>
                    <div>DATE</div>
                    <div>RECIPIENT</div>
                    <div>AMOUNT</div>
                    <div>METHOD</div>
                    <div>REFERENCE</div>
                    <div>STATUS</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredPayments.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 1.5fr',
                                padding: '20px 24px',
                                borderBottom: idx === filteredPayments.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.2s',
                                gap: '15px'
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#aaa', letterSpacing: '1px' }}>
                                {new Date(p.createdAt).toLocaleDateString()}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '13px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>{p.user?.stageName || p.user?.fullName || 'UNKNOWN'}</div>
                                <div style={{ fontSize: '10px', color: '#777', fontWeight: '800', marginTop: '4px', letterSpacing: '0.5px' }}>{p.user?.email}</div>
                            </div>

                            <div style={{ fontSize: '14px', fontWeight: '950', color: p.status === 'completed' ? '#fff' : 'var(--accent)', letterSpacing: '0.5px' }}>
                                ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>

                            <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                    {p.method?.replace('_', ' ')}
                                </span>
                            </div>

                            <div style={{ fontSize: '11px', color: '#777', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                {p.reference || '---'}
                            </div>

                            <div>
                                <span style={{
                                    fontSize: '9px', padding: '6px 10px', borderRadius: '4px',
                                    background: p.status === 'completed' ? 'rgba(57, 255, 20, 0.05)' : p.status === 'pending' ? 'rgba(255, 240, 0, 0.05)' : 'rgba(255, 68, 68, 0.05)',
                                    color: p.status === 'completed' ? 'var(--accent)' : p.status === 'pending' ? '#fff000' : '#ff4444',
                                    border: `1px solid ${p.status === 'completed' ? 'rgba(57, 255, 20, 0.1)' : p.status === 'pending' ? 'rgba(255, 240, 0, 0.1)' : 'rgba(255, 68, 68, 0.1)'}`,
                                    fontWeight: '950', letterSpacing: '1px', display: 'inline-block'
                                }}>
                                    {statusLabel(p.status)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {p.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => openDecisionModal(p, 'completed')}
                                            style={{ ...btnStyle, height: 'auto', padding: '6px 12px', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px' }}
                                        >
                                            APPROVE
                                        </button>
                                        <button
                                            onClick={() => openDecisionModal(p, 'failed')}
                                            style={{ ...btnStyle, height: 'auto', padding: '6px 12px', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '4px' }}
                                        >
                                            REJECT
                                        </button>
                                    </>
                                )}
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
                                }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', padding: '6px 12px', borderRadius: '4px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                    EDIT
                                </button>
                                <button onClick={() => handleDeletePayment(p.id)} style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)', color: '#ff4444', cursor: 'pointer', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', padding: '6px 12px', borderRadius: '4px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,68,68,0.05)'}>
                                    DEL
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredPayments.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                            NO PAYMENTS RECORDED
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
