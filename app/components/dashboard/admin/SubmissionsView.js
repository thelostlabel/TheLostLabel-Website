import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

export default function SubmissionsView({ demos, onDelete }) {
    const { showToast, showConfirm } = useToast();
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {['pending', 'reviewing', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === tab ? '#fff' : '#444',
                                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                paddingBottom: '5px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
            </div>

            <div style={glassStyle}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-hover)' }}>
                                <th style={thStyle}>DATE</th>
                                <th style={thStyle}>ARTIST</th>
                                <th style={thStyle}>TRACK / GENRE</th>
                                <th style={thStyle}>STATUS</th>
                                <th style={thStyle}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDemos.map((demo, i) => (
                                <motion.tr
                                    key={demo.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    style={{ borderBottom: '1px solid #1a1a1b' }}
                                >
                                    <td style={tdStyle}>{new Date(demo.createdAt).toLocaleDateString()}</td>
                                    <td style={tdStyle}>
                                        <strong>{demo.artist?.stageName || demo.artist?.email || 'Unknown'}</strong>
                                    </td>
                                    <td style={tdStyle}>
                                        <div>{demo.title}</div>
                                        <div style={{ fontSize: '10px', color: '#555' }}>{demo.genre}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: getStatusColor(demo.status) }}>
                                            {demo.status.toUpperCase()}
                                        </span>
                                        {demo.reviewedBy && (
                                            <div style={{ fontSize: '8px', color: '#444', marginTop: '2px' }}>BY {demo.reviewedBy.split('@')[0]}</div>
                                        )}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link
                                                href={`/dashboard/demo/${demo.id}`}
                                                style={{ ...btnStyle, color: '#fff', border: '1px solid var(--border)', background: 'var(--surface-hover)', textDecoration: 'none', height: 'auto', display: 'flex', alignItems: 'center' }}
                                            >
                                                REVIEW
                                            </Link>
                                            <button onClick={() => onDelete(demo.id)} style={{ ...btnStyle, color: '#444', height: 'auto' }}>DELETE</button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredDemos.length === 0 && (
                                <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO {activeTab.toUpperCase()} SUBMISSIONS</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
