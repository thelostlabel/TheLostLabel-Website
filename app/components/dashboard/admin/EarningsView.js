import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function EarningsView({ earnings, contracts, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [form, setForm] = useState({
        contractId: '',
        period: new Date().toISOString().slice(0, 7),
        grossAmount: '',
        expenseAmount: '',
        streams: '',
        source: 'spotify'
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredEarnings = useMemo(() => {
        return earnings.filter(e =>
            e.contract?.release?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.contract?.user?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.contract?.user?.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.period?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.source?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [earnings, debouncedSearch]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/earnings/${editingId}` : '/api/earnings';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingId(null); // Reset editing state
                setForm({
                    contractId: '',
                    period: new Date().toISOString().slice(0, 7),
                    grossAmount: '',
                    expenseAmount: '',
                    streams: '',
                    source: 'spotify'
                });
                showToast(editingId ? "Earning record updated" : "Earning record added", "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save earning", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error saving earning", "error");
        }
        finally { setSaving(false); }
    };

    const handleEdit = (earning) => {
        setEditingId(earning.id);
        setForm({
            contractId: earning.contractId,
            period: earning.period,
            grossAmount: earning.grossAmount,
            expenseAmount: earning.expenseAmount || '',
            streams: earning.streams || '',
            source: earning.source || 'spotify'
        });
        setShowAdd(true);
    };

    const handleDelete = (id) => {
        showConfirm(
            "DELETE RECORD?",
            "Are you sure you want to delete this earning record? This cannot be undone.",
            async () => {
                try {
                    const res = await fetch(`/api/earnings/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Failed to delete", "error");
                    }
                } catch (e) { showToast("Error deleting", "error"); }
            }
        );
    };

    const totalGross = earnings.reduce((sum, e) => sum + (e.grossAmount || 0), 0);
    const totalArtist = earnings.reduce((sum, e) => sum + (e.artistAmount || 0), 0);
    const totalLabel = earnings.reduce((sum, e) => sum + (e.labelAmount || 0), 0);
    const totalExpense = earnings.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);

    const spendByRelease = Object.values(earnings.reduce((acc, e) => {
        const key = e.contract?.release?.name || 'Unknown';
        acc[key] = acc[key] || { name: key, spend: 0, revenue: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].revenue += e.labelAmount || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 5);

    const spendBySource = Object.values(earnings.reduce((acc, e) => {
        const key = (e.source || 'OTHER').toUpperCase();
        acc[key] = acc[key] || { source: key, spend: 0, streams: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].streams += e.streams || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 6);

    return (
        <div>
            <div className="earnings-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: `radial-gradient(circle, #fff 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>GROSS_VOLUME</div>
                        <div style={{ fontSize: '24px', fontWeight: '950', color: '#fff', letterSpacing: '-0.5px' }}>${totalGross.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} whileHover={{ y: -2 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`, opacity: 0.1, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>ARTIST_PAYOUTS</div>
                        <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent)', letterSpacing: '-0.5px' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: `radial-gradient(circle, #fff 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>LABEL_EARNINGS</div>
                        <div style={{ fontSize: '24px', fontWeight: '950', color: '#fff', letterSpacing: '-0.5px' }}>${totalLabel.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: `radial-gradient(circle, #ff4444 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>AD_SPEND</div>
                        <div style={{ fontSize: '24px', fontWeight: '950', color: '#fff', letterSpacing: '-0.5px' }}>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    </div>
                </motion.div>
            </div>

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="SEARCH EARNINGS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px', letterSpacing: '1px', fontWeight: '800' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                contractId: '',
                                period: new Date().toISOString().slice(0, 7),
                                grossAmount: '',
                                expenseAmount: '',
                                streams: '',
                                source: 'spotify'
                            });
                            setShowAdd(!showAdd);
                        }}
                        style={{ ...btnStyle, background: showAdd && !editingId ? 'rgba(255,255,255,0.05)' : '#fff', color: showAdd && !editingId ? '#fff' : '#000', border: showAdd && !editingId ? '1px solid rgba(255,255,255,0.1)' : 'none', height: 'auto', borderRadius: '8px', fontWeight: '950', letterSpacing: '1px' }}
                    >
                        {showAdd && !editingId ? 'CANCEL ENTRY' : '+ ADD MANUAL EARNING'}
                    </button>
                </div>
            </div>

            {/* Spend analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`, opacity: 0.03, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>TOP RELEASES BY AD SPEND</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>TOP 5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 2 }}>
                        {spendByRelease.map((r, i) => {
                            const pct = totalExpense ? Math.round((r.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} style={{ padding: '16px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '12px', letterSpacing: '0.5px' }}>{r.name.toUpperCase()}</div>
                                        <div style={{ color: 'var(--accent)', fontWeight: '950', fontSize: '13px' }}>${r.spend.toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#888', fontWeight: '900', marginBottom: '12px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>REV: ${r.revenue.toLocaleString()}</span>
                                        <span>{pct}% OF SPEND</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: 'var(--accent)' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '250px', height: '250px', background: `radial-gradient(circle, #fff 0%, transparent 70%)`, opacity: 0.03, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>SPEND BY SOURCE</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>TOP 6</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 2 }}>
                        {spendBySource.map((s, i) => {
                            const pct = totalExpense ? Math.round((s.spend / totalExpense) * 100) : 0;
                            return (
                                <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }} key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', transition: 'background-color 0.2s' }}>
                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '1px' }}>{s.source}</div>
                                    <div style={{ color: 'var(--accent)', fontWeight: '950', textAlign: 'right', fontSize: '12px' }}>${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', textAlign: 'right' }}>{pct}%</div>
                                    <div style={{ gridColumn: '1 / 4', width: '100%', height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '4px' }}>
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }} style={{ height: '100%', background: 'var(--accent)' }} />
                                    </div>
                                </motion.div>
                            );
                        })}
                        {spendBySource.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid #fff' }}
                >
                    <div style={{ marginBottom: '15px', color: editingId ? 'var(--accent)' : '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '2px' }}>
                        {editingId ? 'EDITING EARNING RECORD' : 'NEW EARNING RECORD'}
                    </div>
                    <form className="earnings-form" onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>CONTRACT (RELEASE + ARTIST)</label>
                            <select
                                value={form.contractId}
                                onChange={e => setForm({ ...form, contractId: e.target.value })}
                                required
                                style={{ ...inputStyle }}
                            >
                                <option value="">Select Contract...</option>
                                {contracts.map(c => {
                                    const releaseName = c.release?.name || c.title || 'Untitled Release';
                                    const artistName = c.artist?.name || c.user?.stageName || c.user?.fullName || c.primaryArtistName || 'Unknown Artist';
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {releaseName} - {artistName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>PERIOD (YYYY-MM)</label>
                            <input
                                type="month"
                                value={form.period}
                                onChange={e => setForm({ ...form, period: e.target.value })}
                                required
                                style={{ ...inputStyle }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GROSS AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.grossAmount}
                                onChange={e => setForm({ ...form, grossAmount: e.target.value })}
                                style={{ ...inputStyle }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AD SPEND / EXPENSES ($)</label>
                            <input
                                type="number" step="0.01"
                                value={form.expenseAmount}
                                onChange={e => setForm({ ...form, expenseAmount: e.target.value })}
                                style={{ ...inputStyle }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STREAMS (OPTIONAL)</label>
                            <input
                                type="number"
                                value={form.streams}
                                onChange={e => setForm({ ...form, streams: e.target.value })}
                                style={{ ...inputStyle }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SOURCE</label>
                            <select
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                style={{ ...inputStyle }}
                            >
                                <option value="spotify">Spotify</option>
                                <option value="apple">Apple Music</option>
                                <option value="youtube">YouTube</option>
                                <option value="ad_revenue">Ad Revenue (Meta/TikTok/etc)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={{ ...btnStyle, height: 'auto' }}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000', height: 'auto' }}>
                                {saving ? 'SAVING...' : (editingId ? 'UPDATE RECORD' : 'ADD RECORD')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1.5fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>PERIOD</div>
                    <div>RELEASE / ARTIST</div>
                    <div>GROSS</div>
                    <div>EXPENSES</div>
                    <div>ARTIST PAY</div>
                    <div>STREAMS</div>
                    <div>SOURCE</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredEarnings.map((e, idx) => (
                        <motion.div
                            key={e.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 1fr 1fr 1.5fr 1fr 1fr 1fr',
                                padding: '20px 24px',
                                borderBottom: idx === filteredEarnings.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.2s',
                                gap: '15px'
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#aaa', letterSpacing: '1px' }}>{e.period}</div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '13px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>{e.contract?.release?.name || e.contract?.title || 'Untitled'}</div>
                                <div style={{ fontSize: '10px', color: '#888', fontWeight: '800', marginTop: '4px' }}>{e.contract?.user?.stageName || e.contract?.primaryArtistName}</div>
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#eaeaea' }}>${(e.grossAmount || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#ff4444' }}>${(e.expenseAmount || 0).toLocaleString()}</div>

                            <div>
                                <span style={{ color: 'var(--accent)', background: 'var(--accent-10)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '950' }}>
                                    ${(e.artistAmount || 0).toLocaleString()}
                                </span>
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#aaa' }}>{e.streams ? e.streams.toLocaleString() : '--'}</div>

                            <div>
                                <span style={{
                                    fontSize: '9px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#888',
                                    border: '1px solid var(--border)',
                                    fontWeight: '950',
                                    letterSpacing: '1px',
                                    display: 'inline-block'
                                }}>
                                    {(e.source || 'spotify').toUpperCase()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleEdit(e)} style={{ ...btnStyle, fontSize: '9px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>
                                    EDIT
                                </button>
                                <button onClick={() => handleDelete(e.id)} style={{ ...btnStyle, fontSize: '9px', padding: '6px 12px', color: '#ff4444', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>
                                    DEL
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredEarnings.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                            NO RECORD FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
