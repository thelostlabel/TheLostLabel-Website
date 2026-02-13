import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

function RequestComments({ request }) {
    const requestId = request.id;
    const { data: session } = useSession();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchComments();
    }, [requestId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            const data = await res.json();
            if (res.ok) {
                setComments([...comments, data]);
                setNewComment('');
            }
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    if (loading) return <div style={{ fontSize: '11px', color: '#444' }}>LOADING COMMENTS...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div ref={scrollRef} style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' }}>
                {/* Initial Request Description */}
                <div style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '20px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#666', letterSpacing: '1px' }}>
                            INITIAL_REQUEST
                        </span>
                        <span style={{ fontSize: '8px', color: '#444' }}>{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#aaa', fontStyle: 'italic' }}>{request.details}</div>
                </div>

                {comments.map(c => {
                    const isMe = c.userId === session?.user?.id;
                    const isStaff = c.user?.role === 'admin' || c.user?.role === 'a&r';

                    return (
                        <div key={c.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            background: isMe ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '20px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: isStaff ? 'var(--accent)' : '#fff', letterSpacing: '1px' }}>
                                    {c.user?.stageName?.toUpperCase() || c.user?.email?.toUpperCase()} {isStaff ? '[STAFF]' : '[ARTIST]'}
                                </span>
                                <span style={{ fontSize: '8px', color: '#444' }}>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ccc' }}>{c.content}</div>
                        </div>
                    );
                })}
                {comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#333', fontSize: '10px', fontWeight: '800', letterSpacing: '2px' }}>NO REPLIES YET</div>
                )}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type your message to the artist..."
                    style={{ flex: 1, padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                />
                <button
                    disabled={sending || !newComment.trim()}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '0 25px', height: 'auto' }}
                >
                    {sending ? '...' : 'SEND'}
                </button>
            </form>
        </div>
    );
}

export default function RequestsView({ requests, onUpdateStatus }) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const [processing, setProcessing] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
            const matchesSearch =
                req.release?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                req.user?.stageName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                req.type?.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [requests, debouncedSearch, statusFilter]);

    useEffect(() => {
        if (selectedRequest) {
            setAdminNote(selectedRequest.adminNote || '');
        }
    }, [selectedRequest]);

    const handleUpdate = async (id, status, extra = {}) => {
        const statusVerb = status === 'reviewing' ? 'start reviewing' :
            status === 'processing' ? 'start processing' :
                status === 'completed' ? 'complete' :
                    status === 'needs_action' ? 'mark as needing action' : status;

        showConfirm(
            `${status.toUpperCase().replace('_', ' ')}?`,
            `Are you sure you want to ${statusVerb} this request? This will notify the user.`,
            async () => {
                setProcessing(id);
                try {
                    await onUpdateStatus(id, status, adminNote, extra.assignedToId);
                    showToast(`Request ${status}`, "success");
                    if (selectedRequest && selectedRequest.id === id) {
                        setSelectedRequest(prev => ({ ...prev, status, adminNote, ...extra }));
                    }
                } catch (e) {
                    showToast("Failed to update request", "error");
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return { bg: 'var(--status-accent-bg)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'approved': return { bg: 'var(--status-accent-bg)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'processing': return { bg: 'var(--status-info-bg)', border: 'var(--status-info)', color: 'var(--status-info)' };
            case 'reviewing': return { bg: 'var(--status-warning-bg)', border: 'var(--status-warning)', color: 'var(--status-warning)' };
            case 'needs_action': return { bg: 'rgba(255, 240, 0, 0.1)', border: '#fff000', color: '#fff000' };
            case 'rejected': return { bg: 'var(--status-error-bg)', border: 'var(--status-error)', color: 'var(--status-error)' };
            default: return { bg: 'var(--status-neutral-bg)', border: '#666', color: '#666' };
        }
    };

    if (selectedRequest) {
        return (
            <div style={{ ...glassStyle, minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>←</button>
                        <h3 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>REQUEST DETAILS</h3>
                    </div>
                    <div style={{
                        display: 'flex', gap: '10px'
                    }}>
                        {!selectedRequest.assignedToId && (
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, selectedRequest.status, { assignedToId: session?.user?.id })}
                                style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '5px 12px', fontSize: '9px', height: 'auto' }}
                            >
                                ASSIGN TO ME
                            </button>
                        )}
                        <div style={{
                            padding: '5px 12px',
                            background: getStatusStyles(selectedRequest.status).bg,
                            border: `1px solid ${getStatusStyles(selectedRequest.status).border}`,
                            color: getStatusStyles(selectedRequest.status).color,
                            fontSize: '11px', fontWeight: '800', letterSpacing: '1px'
                        }}>
                            {selectedRequest.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '40px' }}>
                    {/* LEFT COLUMN: RELEASE INFO */}
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                            {selectedRequest.release?.image && (
                                <NextImage src={selectedRequest.release.image?.startsWith('private/') ? `/api/files/release/${selectedRequest.release.id}` : selectedRequest.release.image} alt="Release" width={400} height={400} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>RELEASE NAME</label>
                            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px' }}>{selectedRequest.release?.name}</div>
                            <a href={selectedRequest.release?.spotifyUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent)' }}>OPEN IN SPOTIFY ↗</a>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>ARTIST / REQUESTER</label>
                            <div style={{ fontSize: '14px' }}>{selectedRequest.user?.stageName}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{selectedRequest.user?.email}</div>
                        </div>
                        {selectedRequest.assignedTo && (
                            <div>
                                <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>ASSIGNED STAFF</label>
                                <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{selectedRequest.assignedTo.stageName || selectedRequest.assignedTo.email}</div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: REQUEST DETAILS */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>REQUEST TYPE</label>
                            <div style={{ fontSize: '14px', background: '#222', padding: '10px 20px', borderRadius: '16px', display: 'inline-block', border: '1px solid var(--border)' }}>
                                {selectedRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>DESCRIPTION & FILES</label>
                            <div style={{
                                background: 'var(--surface-hover)',
                                padding: '20px',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                color: '#ddd',
                                minHeight: '120px'
                            }}>
                                {selectedRequest.details}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>ADMIN NOTE (VISIBLE TO ARTIST)</label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Status updates or rejection reason..."
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '13px',
                                    minHeight: '80px',
                                    borderRadius: '6px',
                                    outline: 'none focus:border-accent'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'reviewing')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(255, 170, 0, 0.1)', color: 'var(--status-warning)', borderColor: '#ffaa0030', height: 'auto' }}
                            >
                                REVIEWING
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'processing')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(0, 170, 255, 0.1)', color: 'var(--status-info)', borderColor: '#00aaff30', height: 'auto' }}
                            >
                                PROCESSING
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'needs_action')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(255, 240, 0, 0.1)', color: '#fff000', borderColor: '#fff00030', height: 'auto' }}
                            >
                                NEEDS ACTION
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'completed')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(245, 197, 66, 0.18)', color: 'var(--accent)', borderColor: 'var(--accent)30', height: 'auto' }}
                            >
                                COMPLETED
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'rejected')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, color: 'var(--status-error)', borderColor: '#ff444430', height: 'auto' }}
                            >
                                REJECT
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONVERSATION SECTION */}
                <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '10px', color: '#666', fontWeight: '800', marginBottom: '20px', letterSpacing: '2px' }}>CONVERSATION HISTORY</h4>
                    <RequestComments request={selectedRequest} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by release, artist or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, flex: 1, background: 'rgba(255,255,255,0.03)' }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ ...inputStyle, width: '150px', background: 'rgba(255,255,255,0.03)' }}
                >
                    <option value="all">ALL STATUS</option>
                    <option value="pending">PENDING</option>
                    <option value="reviewing">REVIEWING</option>
                    <option value="processing">PROCESSING</option>
                    <option value="needs_action">NEEDS ACTION</option>
                    <option value="completed">COMPLETED</option>
                    <option value="rejected">REJECTED</option>
                </select>
            </div>

            <div style={{ ...glassStyle, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>RELEASE / ARTIST</th>
                            <th style={thStyle}>TYPE</th>
                            <th style={thStyle}>DATE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>STAFF</th>
                            <th style={thStyle}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((req, i) => (
                            <motion.tr
                                key={req.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '35px', height: '35px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
                                            {req.release?.image && (
                                                <NextImage src={req.release.image?.startsWith('private/') ? `/api/files/release/${req.release.id}` : req.release.image} alt="" width={35} height={35} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{req.release?.name}</div>
                                            <div style={{ fontSize: '10px', color: '#666' }}>{req.user?.stageName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '10px', fontWeight: '800' }}>{req.type.toUpperCase()}</span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        letterSpacing: '0.5px',
                                        background: getStatusStyles(req.status).bg,
                                        border: `1px solid ${getStatusStyles(req.status).border}`,
                                        color: getStatusStyles(req.status).color
                                    }}>
                                        {req.status.toUpperCase()}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: req.assignedTo ? 'var(--accent)' : '#444' }}>
                                        {req.assignedTo?.stageName || req.assignedTo?.email || 'UNASSIGNED'}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        style={{ ...btnStyle, padding: '5px 15px', fontSize: '9px', borderRadius: '8px', height: 'auto' }}
                                    >
                                        MANAGE
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredRequests.length === 0 && (
                            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '50px', color: '#555' }}>NO REQUESTS FOUND</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
