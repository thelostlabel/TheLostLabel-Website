import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { btnStyle, glassStyle, inputStyle } from './styles';

export default function SubmissionsView({ demos, onDelete, canDelete = false }) {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const availableTabs = useMemo(() => {
        const preferredOrder = ['all', 'pending', 'reviewing', 'approved', 'rejected'];
        const demoStatuses = Array.from(new Set(demos.map((demo) => String(demo.status || '').toLowerCase()).filter(Boolean)));
        const orderedKnownTabs = preferredOrder.filter((tab) => tab === 'all' || demoStatuses.includes(tab));
        const extraTabs = demoStatuses.filter((status) => !preferredOrder.includes(status)).sort();
        return [...orderedKnownTabs, ...extraTabs];
    }, [demos]);

    const selectedTab = availableTabs.includes(activeTab) ? activeTab : (availableTabs[0] || 'all');

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--status-success)';
            case 'rejected': return 'var(--status-error)';
            case 'reviewing': return 'var(--status-warning)';
            default: return 'var(--status-neutral)';
        }
    };

    const formatSubmissionDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString(undefined, options);
    };

    const renderStatusBadge = (status) => {
        const tone = getStatusColor(status);
        const icon = status === 'approved'
            ? <CheckCircle size={10} />
            : status === 'rejected'
                ? <XCircle size={10} />
                : <Clock size={10} />;

        return (
            <span
                className="submissions-status-pill"
                style={{
                    fontSize: '9px',
                    fontWeight: '950',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: `${tone}15`,
                    color: tone,
                    border: `1px solid ${tone}30`,
                    letterSpacing: '1px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                {icon}
                {status.toUpperCase()}
            </span>
        );
    };

    const filteredDemos = useMemo(() => {
        return demos.filter(demo => {
            const normalizedStatus = String(demo.status || '').toLowerCase();
            const matchesTab = selectedTab === 'all' || normalizedStatus === selectedTab;
            const matchesSearch = demo.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                demo.artist?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [demos, debouncedSearch, selectedTab]);

    return (
        <div className="submissions-root">
            <style jsx global>{`
                .submissions-root {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .table-row-hover:hover {
                    background-color: rgba(255,255,255,0.02) !important;
                }

                .submissions-track-cell,
                .submissions-track-copy,
                .submissions-artist-block,
                .submissions-status-cell,
                .submissions-date-cell {
                    min-width: 0;
                }

                .submissions-row-mobile-head,
                .submissions-block-label {
                    display: none;
                }

                .submissions-track-title,
                .submissions-artist-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .submissions-artist-secondary {
                    font-size: 10px;
                    color: #666;
                    font-weight: 700;
                    letter-spacing: 0.4px;
                    margin-top: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .submissions-genre-chip {
                    display: inline-flex;
                    width: fit-content;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #7f7f7f;
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                @media (max-width: 1024px) {
                    .submissions-toolbar {
                        margin-bottom: 18px !important;
                        flex-direction: column;
                        align-items: stretch !important;
                    }

                    .submissions-filter-tabs {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr;
                        width: 100%;
                        flex-wrap: wrap;
                    }

                    .submissions-filter-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .submissions-toolbar-search,
                    .submissions-toolbar-search input {
                        width: 100% !important;
                    }

                    .submissions-table-shell {
                        background: transparent !important;
                        border: none !important;
                        overflow: visible !important;
                    }

                    .submissions-table-head {
                        display: none !important;
                    }

                    .submissions-table-stack {
                        gap: 10px !important;
                    }

                    .submissions-table-row {
                        display: flex !important;
                        flex-direction: column !important;
                        grid-template-columns: none !important;
                        padding: 16px 18px !important;
                        gap: 10px !important;
                        align-items: stretch !important;
                        border: 1px solid rgba(255,255,255,0.08) !important;
                        border-radius: 12px !important;
                        background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015)) !important;
                    }

                    .submissions-row-mobile-head {
                        display: flex !important;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 10px;
                    }

                    .submissions-mobile-date {
                        display: grid;
                        gap: 3px;
                    }

                    .submissions-mobile-date-value {
                        font-size: 13px;
                        font-weight: 900;
                        color: #fff;
                        letter-spacing: 0.2px;
                    }

                    .submissions-mobile-date-sub {
                        font-size: 9px;
                        font-weight: 800;
                        letter-spacing: 1.1px;
                        color: #666;
                        text-transform: uppercase;
                    }

                    .submissions-date-cell,
                    .submissions-status-cell {
                        display: none !important;
                    }

                    .submissions-cell {
                        display: grid !important;
                        gap: 6px;
                        width: 100%;
                    }

                    .submissions-block-label {
                        display: block;
                        font-size: 9px;
                        font-weight: 800;
                        letter-spacing: 1.2px;
                        color: #666;
                        text-transform: uppercase;
                    }

                    .submissions-track-cell {
                        display: grid !important;
                        grid-template-columns: 38px minmax(0, 1fr);
                        gap: 10px !important;
                        align-items: center !important;
                        padding: 10px !important;
                        border-radius: 12px !important;
                        border: 1px solid rgba(255,255,255,0.06);
                        background: rgba(255,255,255,0.02);
                    }

                    .submissions-track-icon {
                        width: 38px !important;
                        height: 38px !important;
                    }

                    .submissions-track-title,
                    .submissions-artist-name {
                        white-space: normal !important;
                        overflow: visible !important;
                        text-overflow: initial !important;
                        line-height: 1.25 !important;
                    }

                    .submissions-artist-block {
                        padding: 10px 12px !important;
                        border-radius: 12px !important;
                        border: 1px solid rgba(255,255,255,0.06);
                        background: rgba(255,255,255,0.015);
                    }

                    .submissions-row-actions {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px !important;
                    }

                    .submissions-row-actions :global(a),
                    .submissions-row-actions :global(button) {
                        width: 100%;
                        justify-content: center;
                    }
                }

                @media (max-width: 520px) {
                    .submissions-filter-tabs {
                        grid-template-columns: 1fr;
                    }

                    .submissions-table-shell {
                        border-radius: 10px !important;
                    }

                    .submissions-table-row {
                        padding: 14px !important;
                        gap: 10px !important;
                    }

                    .submissions-row-mobile-head {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .submissions-track-cell {
                        grid-template-columns: 30px minmax(0, 1fr);
                        gap: 8px !important;
                        padding: 9px !important;
                    }

                    .submissions-track-icon {
                        width: 30px !important;
                        height: 30px !important;
                        border-radius: 7px !important;
                    }

                    .submissions-track-title,
                    .submissions-artist-name {
                        font-size: 12px !important;
                    }

                    .submissions-artist-secondary {
                        white-space: normal;
                        overflow: visible;
                        text-overflow: initial;
                    }

                    .submissions-row-actions {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            <div className="submissions-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div className="submissions-filter-tabs" style={{ display: 'flex', gap: '8px', background: 'var(--glass)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {availableTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="submissions-filter-btn"
                            style={{
                                ...btnStyle,
                                background: selectedTab === tab ? 'var(--accent)' : 'transparent',
                                border: 'none',
                                color: selectedTab === tab ? '#000' : '#888',
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
                            {tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
                <div className="submissions-toolbar-search" style={{ position: 'relative' }}>
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

            <div className="submissions-table-shell" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div className="submissions-table-head" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 3fr 1.5fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>DATE</div>
                    <div>ARTIST</div>
                    <div>TRACK / GENRE</div>
                    <div>STATUS</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div className="submissions-table-stack" style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredDemos.map((demo, idx) => (
                        (() => {
                            const artistName = demo.artist?.stageName || demo.artist?.email || 'UNKNOWN';
                            const artistSecondary = demo.artist?.stageName && demo.artist?.email ? demo.artist.email : '';
                            const formattedDate = formatSubmissionDate(demo.createdAt);
                            const compactDate = formatSubmissionDate(demo.createdAt, { month: 'short', day: 'numeric' });
                            const genreLabel = demo.genre?.toUpperCase() || 'NO GENRE';
                            const reviewerLabel = demo.reviewedBy ? demo.reviewedBy.split('@')[0].toUpperCase() : '';

                            return (
                        <motion.div
                            key={demo.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="table-row-hover submissions-table-row"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 2fr 3fr 1.5fr 1fr',
                                padding: '20px 24px',
                                borderBottom: idx === filteredDemos.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.15s ease',
                                gap: '15px',
                                cursor: 'pointer'
                            }}
                        >
                            <div className="submissions-row-mobile-head">
                                <div className="submissions-mobile-date">
                                    <div className="submissions-mobile-date-sub">Submitted</div>
                                    <div className="submissions-mobile-date-value">{compactDate}</div>
                                </div>
                                {renderStatusBadge(demo.status)}
                            </div>

                            <div className="submissions-cell submissions-date-cell" data-label="DATE" style={{ fontSize: '11px', color: '#888', fontWeight: '800' }}>
                                {formattedDate}
                            </div>

                            <div className="submissions-cell submissions-artist-block" data-label="ARTIST">
                                <div className="submissions-block-label">Artist</div>
                                <div className="submissions-artist-name" style={{ fontSize: '13px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>
                                    {artistName}
                                </div>
                                {artistSecondary && <div className="submissions-artist-secondary">{artistSecondary}</div>}
                            </div>

                            <div className="submissions-cell submissions-track-cell" data-label="TRACK / GENRE" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="submissions-track-icon" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                    <PlayCircle size={16} color="var(--accent)" />
                                </div>
                                <div className="submissions-track-copy">
                                    <div className="submissions-block-label">Track</div>
                                    <div className="submissions-track-title" style={{ fontSize: '13px', fontWeight: '900', color: '#eaeaea', letterSpacing: '0.5px', marginBottom: '4px' }}>{demo.title}</div>
                                    <div className="submissions-genre-chip">{genreLabel}</div>
                                </div>
                            </div>

                            <div className="submissions-cell submissions-status-cell" data-label="STATUS">
                                {renderStatusBadge(demo.status)}
                                {reviewerLabel && (
                                    <div style={{ fontSize: '8px', color: '#555', marginTop: '6px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                        BY {reviewerLabel}
                                    </div>
                                )}
                            </div>

                            <div className="submissions-cell submissions-row-actions" data-label="ACTIONS" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <Link
                                    href={`/dashboard/demo/${demo.id}`}
                                    style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', color: '#000', background: 'var(--accent)', border: 'none', textDecoration: 'none', height: 'auto', display: 'flex', alignItems: 'center', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}
                                >
                                    REVIEW
                                </Link>
                                {canDelete && (
                                    <button onClick={() => onDelete(demo.id)} style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', color: '#ff4444', height: 'auto', borderRadius: '6px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', fontWeight: '950', letterSpacing: '1px', cursor: 'pointer' }}>
                                        DEL
                                    </button>
                                )}
                            </div>
                        </motion.div>
                            );
                        })()
                    ))}

                    {filteredDemos.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Search size={20} color="#444" />
                            </div>
                            <div style={{ color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                                NO {selectedTab.toUpperCase()} SUBMISSIONS FOUND
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
