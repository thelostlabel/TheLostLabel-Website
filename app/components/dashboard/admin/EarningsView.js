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
            <div className="earnings-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px', marginBottom: '24px' }}>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>ARTIST PAYOUTS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>LABEL EARNINGS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>${totalLabel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>AD SPEND</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffaa00' }}>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input
                        type="text"
                        placeholder="Search earnings by release, artist or period..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.02)' }}
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
                        style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none', height: 'auto' }}
                    >
                        <Plus size={14} /> {showAdd && !editingId ? 'CLOSE' : 'ADD MANUAL EARNING'}
                    </button>
                </div>
            </div>

            {/* Spend analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '22px' }}>
                <div style={{ ...glassStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>TOP RELEASES BY AD SPEND</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {spendByRelease.map((r, i) => {
                            const pct = totalExpense ? Math.round((r.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <div style={{ color: '#fff', fontWeight: '900' }}>{r.name}</div>
                                        <div style={{ color: '#ffaa00', fontWeight: '900' }}>${r.spend.toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '800', marginBottom: '6px' }}>REV: ${r.revenue.toLocaleString()} • {pct}% of spend</div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 10px #ffaa0055' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>

                <div style={{ ...glassStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>SPEND BY SOURCE</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 6</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {spendBySource.map((s, i) => {
                            const pct = totalExpense ? Math.round((s.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 40px', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ color: '#fff', fontWeight: '900' }}>{s.source}</div>
                                    <div style={{ color: '#ffaa00', fontWeight: '900', textAlign: 'right' }}>${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '9px', color: '#777', fontWeight: '800', textAlign: 'right' }}>{pct}%</div>
                                    <div style={{ gridColumn: '1 / 4', width: '100%', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 8px #ffaa0055' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendBySource.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GROSS AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.grossAmount}
                                onChange={e => setForm({ ...form, grossAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AD SPEND / EXPENSES ($)</label>
                            <input
                                type="number" step="0.01"
                                value={form.expenseAmount}
                                onChange={e => setForm({ ...form, expenseAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STREAMS (OPTIONAL)</label>
                            <input
                                type="number"
                                value={form.streams}
                                onChange={e => setForm({ ...form, streams: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SOURCE</label>
                            <select
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
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

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>PERIOD</th>
                            <th style={thStyle}>RELEASE / ARTIST</th>
                            <th style={thStyle}>GROSS</th>
                            <th style={thStyle}>EXPENSES</th>
                            <th style={thStyle}>ARTIST PAY</th>
                            <th style={thStyle}>STREAMS</th>
                            <th style={thStyle}>SOURCE</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEarnings.map((e, i) => (
                            <motion.tr
                                key={e.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <td style={tdStyle}>{e.period}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{e.contract?.release?.name || e.contract?.title || 'Untitled'}</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{e.contract?.user?.stageName || e.contract?.primaryArtistName}</div>
                                </td>
                                <td style={tdStyle}>${(e.grossAmount || 0).toLocaleString()}</td>
                                <td style={tdStyle}>${(e.expenseAmount || 0).toLocaleString()}</td>
                                <td style={tdStyle}><span style={{ color: 'var(--accent)', fontWeight: '800' }}>${(e.artistAmount || 0).toLocaleString()}</span></td>
                                <td style={tdStyle}>{e.streams ? e.streams.toLocaleString() : '--'}</td>
                                <td style={tdStyle}><span style={{ fontSize: '9px', fontWeight: '900', color: '#666' }}>{(e.source || 'spotify').toUpperCase()}</span></td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleEdit(e)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>EDIT</button>
                                        <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', fontSize: '14px' }}>DEL</button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
