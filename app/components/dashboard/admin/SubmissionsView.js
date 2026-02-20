import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { btnStyle, glassStyle, inputStyle } from './styles';

export default function SubmissionsView({ demos, onDelete }) {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'reviewing', 'approved', 'rejected'
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--status-success)';
            case 'rejected': return 'var(--status-error)';
            case 'reviewing': return 'var(--status-warning)';
            default: return 'var(--status-neutral)';
        }
    };

    const filteredDemos = useMemo(() => {
        return demos.filter(demo => {
            const matchesTab = demo.status === activeTab;
            const matchesSearch = demo.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                demo.artist?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [demos, activeTab, debouncedSearch]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--glass)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {['pending', 'reviewing', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                ...btnStyle,
                                background: activeTab === tab ? 'var(--accent)' : 'transparent',
                                border: 'none',
                                color: activeTab === tab ? '#000' : '#888',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '950',
                                fontSize: '10px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                height: 'auto',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="SEARCH SUBMISSIONS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, width: '300px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', paddingLeft: '36px', fontSize: '10px', letterSpacing: '1px', fontWeight: '800' }}
                    />
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 3fr 1.5fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>DATE</div>
                    <div>ARTIST</div>
                    <div>TRACK / GENRE</div>
                    <div>STATUS</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredDemos.map((demo, idx) => (
                        <motion.div
                            key={demo.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 2fr 3fr 1.5fr 1fr',
                                padding: '20px 24px',
                                borderBottom: idx === filteredDemos.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.2s',
                                gap: '15px'
                            }}
                        >
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: '800' }}>
                                {new Date(demo.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>

                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>
                                    {demo.artist?.stageName || demo.artist?.email || 'UNKNOWN'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                    <PlayCircle size={16} color="var(--accent)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#eaeaea', letterSpacing: '0.5px', marginBottom: '2px' }}>{demo.title}</div>
                                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '1px' }}>{demo.genre?.toUpperCase()}</div>
                                </div>
                            </div>

                            <div>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '950',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: `${getStatusColor(demo.status)}15`,
                                    color: getStatusColor(demo.status),
                                    border: `1px solid ${getStatusColor(demo.status)}30`,
                                    letterSpacing: '1px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {demo.status === 'pending' && <Clock size={10} />}
                                    {demo.status === 'approved' && <CheckCircle size={10} />}
                                    {demo.status === 'rejected' && <XCircle size={10} />}
                                    {demo.status.toUpperCase()}
                                </span>
                                {demo.reviewedBy && (
                                    <div style={{ fontSize: '8px', color: '#555', marginTop: '6px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                        BY {demo.reviewedBy.split('@')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <Link
                                    href={`/dashboard/demo/${demo.id}`}
                                    style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', color: '#000', background: 'var(--accent)', border: 'none', textDecoration: 'none', height: 'auto', display: 'flex', alignItems: 'center', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}
                                >
                                    REVIEW
                                </Link>
                                <button onClick={() => onDelete(demo.id)} style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', color: '#ff4444', height: 'auto', borderRadius: '6px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', fontWeight: '950', letterSpacing: '1px', cursor: 'pointer' }}>
                                    DEL
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredDemos.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Search size={20} color="#444" />
                            </div>
                            <div style={{ color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                                NO {activeTab.toUpperCase()} SUBMISSIONS FOUND
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
