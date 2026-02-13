import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle } from './styles';

export default function CommunicationsView({ artists }) {
    const { showToast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendToAll, setSendToAll] = useState(true);
    const [selectedArtistIds, setSelectedArtistIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            showToast("Subject and message are required", "error");
            return;
        }

        if (!sendToAll && selectedArtistIds.length === 0) {
            showToast("Select at least one artist", "error");
            return;
        }

        setSending(true);
        setResults(null);
        try {
            const res = await fetch('/api/admin/communications/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    html: message.replace(/\n/g, '<br>'),
                    recipientIds: sendToAll ? null : selectedArtistIds,
                    sendToAll
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast(`Successfully sent ${data.successCount} emails`, "success");
                setResults(data);
                if (data.failureCount === 0) {
                    setSubject('');
                    setMessage('');
                    setSelectedArtistIds([]);
                }
            } else {
                showToast(data.error || "Failed to send emails", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("An error occurred while sending emails", "error");
        } finally {
            setSending(false);
        }
    };

    const toggleArtist = (id) => {
        setSelectedArtistIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const artistsWithEmail = useMemo(() => {
        return artists.filter(a => a.email || a.user?.email);
    }, [artists]);

    const filteredArtists = useMemo(() => {
        return artistsWithEmail.filter(a =>
            a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.email || a.user?.email)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [artistsWithEmail, searchTerm]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={glassStyle}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>COMPOSE_BROADCAST</h2>
                </div>
                <form onSubmit={handleSend} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: '900', color: '#444' }}>SUBJECT</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter subject..." style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: '900', color: '#444' }}>MESSAGE (PLACEHOLDER: {"{{name}}"})</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hello {{name}}..." style={{ ...inputStyle, minHeight: '250px' }} />
                    </div>
                    <button disabled={sending || !subject || !message} className="glow-button" style={{ width: '100%', padding: '15px', fontWeight: '900', letterSpacing: '2px', height: 'auto' }}>
                        {sending ? 'SENDING...' : 'SEND COMMUNICATIONS'}
                    </button>
                    {results && (
                        <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center' }}>
                            Last distribution: {results.successCount} sent, {results.failureCount} failed.
                        </div>
                    )}
                </form>

                <div style={{ padding: '0 25px 25px 25px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#444', marginBottom: '15px' }}>PREVIEW</div>
                    <div style={{
                        background: '#0d0e10',
                        border: '1px solid #1a1c1e',
                        borderRadius: '16px',
                        padding: '20px',
                        fontSize: '11px',
                        color: '#888',
                        lineHeight: '1.6'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>LOST.</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '10px', textTransform: 'uppercase', textAlign: 'center' }}>{subject || 'SUBJECT'}</div>
                        <div style={{ marginBottom: '15px' }}>Hello Artist,</div>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#fff',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {message || 'Your message will appear here...'}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '8px', color: '#444' }}>
                            © {new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={glassStyle}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>RECIPIENTS</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setSendToAll(true)} style={{ ...btnStyle, background: sendToAll ? 'var(--accent)' : 'transparent', color: sendToAll ? '#000' : '#444' }}>ALL</button>
                        <button onClick={() => setSendToAll(false)} style={{ ...btnStyle, background: !sendToAll ? 'var(--accent)' : 'transparent', color: !sendToAll ? '#000' : '#444' }}>SELECTIVE</button>
                    </div>
                </div>
                <div style={{ padding: '20px', maxHeight: '600px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {sendToAll ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: '10px', fontWeight: '800', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                            TARGETING ALL {artistsWithEmail.length} ARTISTS WITH EMAIL
                        </div>
                    ) : (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                                <input
                                    placeholder="Search artists..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: '35px', background: 'rgba(255,255,255,0.02)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setSelectedArtistIds(artistsWithEmail.map(a => a.id))}
                                    style={{ ...btnStyle, flex: 1, fontSize: '8px', padding: '6px' }}
                                >
                                    SELECT ALL
                                </button>
                                <button
                                    onClick={() => setSelectedArtistIds([])}
                                    style={{ ...btnStyle, flex: 1, fontSize: '8px', padding: '6px' }}
                                >
                                    DESELECT ALL
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                {filteredArtists.map(a => {
                                    const email = a.email || a.user?.email;
                                    const isSelected = selectedArtistIds.includes(a.id);
                                    return (
                                        <div key={a.id} onClick={() => toggleArtist(a.id)} style={{
                                            padding: '12px',
                                            background: isSelected ? 'rgba(245, 197, 66, 0.1)' : 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            border: `1px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
                                            cursor: 'pointer',
                                            transition: '0.2s',
                                            position: 'relative'
                                        }}>
                                            <div style={{ fontWeight: '800', color: isSelected ? 'var(--accent)' : '#fff', fontSize: '11px' }}>{a.name}</div>
                                            <div style={{ fontSize: '9px', color: '#555' }}>{email}</div>
                                            {isSelected && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }}><Check size={12} strokeWidth={3} /></div>}
                                        </div>
                                    );
                                })}
                                {filteredArtists.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: '10px', fontWeight: '800' }}>
                                        NO ARTISTS FOUND
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div >
    );
}
