import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Target, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle } from './styles';

export default function ContentView({ content, onRefresh }) {
    const { showToast } = useToast();
    const [editing, setEditing] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [faqItems, setFaqItems] = useState([]); // Added for structured FAQ editing
    const [saving, setSaving] = useState(false);

    const contentTypes = [
        { key: 'faq', label: 'FAQ / Sıkça Sorulan Sorular' },
        { key: 'join_genres', label: 'Join Us: Accepted Genres' },
        { key: 'join_commissions', label: 'Join Us: Commission Table' },
        { key: 'terms', label: 'Terms of Service' },
        { key: 'privacy', label: 'Privacy Policy' },
        { key: 'commission_rules', label: 'Commission Rules / Komisyon Kuralları' }
    ];

    const DEFAULT_CONTENT = {
        faq: JSON.stringify([
            { q: "How do I submit a demo?", a: "Register as an artist, access your portal, and use the 'NEW SUBMISSION' button. You can now upload multiple files (Master, Lyrics, etc.) directly." },
            { q: "How can I track my distribution?", a: "Once signed, our A&R team will provide updates through the portal. You can use the 'CHANGE REQUEST' system to manage revisions or metadata updates for your releases." },
            { q: "How do royalties and payments work?", a: "Royalties from Spotify, Apple Music, and other DSPs are calculated monthly. You can view your detailed revenue breakdown in the 'EARNINGS' tab and request withdrawals once the $50 threshold is met." },
            { q: "What about legal contracts?", a: "All signing contracts are generated digitally. You can view, download, and track the status of your contracts in the 'CONTRACTS' section of your Artist Dashboard." },
            { q: "Do you offer Spotify sync?", a: "Yes. Our system automatically syncs with your Spotify Artist profile to fetch the latest release data and update your portal metrics." }
        ]),
        join_genres: "House (Deep House / Slap House / G-House)\nPop\nPhonk\nHardstyle\nHyperTechno\nGaming Music (Midtempo, D&B, Trap, Future Bass)\nReggaeton\nOther",
        join_commissions: JSON.stringify([
            { released: "Yes", listeners: "0 – 250K", commission: "$25 or 1% royalties" },
            { released: "Yes", listeners: "250K – 750K", commission: "$50 or 2.5% royalties" },
            { released: "Yes", listeners: "750K+", commission: "$75 or 5% royalties" },
            { released: "No", listeners: "0 – 250K", commission: "$25 or 5% royalties" },
            { released: "No", listeners: "250K – 500K", commission: "$50 or 5% royalties" },
            { released: "No", listeners: "500K – 1M", commission: "$75 or 5% royalties" },
            { released: "No", listeners: "1M+", commission: "$100 or 7.5% royalties" }
        ]),
        commission_rules: "1. Only high-quality original demos are accepted.\n2. No uncleared samples or copyrighted material.\n3. Commissions are paid out 30 days after the track is signed and processed.\n4. We reserve the right to decline any submission for any reason.",
        terms: "1. ARTIST ELIGIBILITY: By registering with LOST MUSIC GROUP, you affirm that you are at least 18 years of age (or have legal guardian consent) and possess the full authority to enter into a distribution agreement for the musical works you submit.\n\n2. DEMO SUBMISSIONS & CONTENT STANDARDS: Submitting a demo does not guarantee a release. You represent that all submissions are 100% original works. Use of uncleared samples, stolen tracks, or fraudulent content will result in immediate account termination and potential legal action.\n\n3. GLOBAL DISTRIBUTION RIGHTS: Upon formal acceptance and contract execution, you grant LOST MUSIC GROUP the exclusive, sub-licensable right to distribute, promote, and monetize your content across over 50 global Digital Service Providers (DSPs), including Spotify, Apple Music, and Amazon.\n\n4. ROYALTIES & PAYMENTS: Royalties are calculated based on net revenue received from DSPs. Payouts are made quarterly (every 3 months) via Bank Transfer or PayPal. The minimum payout threshold is $50.00 USD. Undistributed earnings remain in your account until the threshold is met.\n\n5. INTELLECTUAL PROPERTY: The \"LOST.\" trademark, logos, and website infrastructure remain the sole property of LOST MUSIC GROUP. Artists retain ownership of their compositions unless otherwise specified in a separate, written Recording or Publishing Agreement.",
        privacy: "1. DATA COLLECTION: We collect personal identifiers (name, email, stage name), financial information for royalty processing, and musical content submitted through our portal. We also collect technical data such as IP addresses and browser cookies to improve your user experience and for security purposes.\n\n2. PURPOSE OF DATA USAGE: Your data is used exclusively to manage your artist profile, evaluate demo submissions, facilitate contract execution, and process royalty payments. We may also use your contact information to provide critical system updates or A&R feedback.\n\n3. DATA PROTECTION & DISCLOSURE: We implement professional-grade encryption (Bcrypt for passwords, SSL/TLS for data in transit) to safeguard your information. We do not sell your data. Disclosure only occurs to trusted third-party partners (e.g., DSPs, payment processors) necessary to fulfill our distribution and payment obligations.\n\n4. YOUR RIGHTS (GDPR/CCPA): You have the right to access, correct, or request the deletion of your personal data at any time. You may also request a copy of the data we hold about you. For such inquiries, please contact our data compliance team through the Support portal."
    };

    const handleEdit = (item, type = null) => {
        const key = item?.key || type?.key;
        setEditing(key || null);
        setEditTitle(item?.title || type?.label || '');
        const contentStr = item?.content || DEFAULT_CONTENT[key] || '';
        setEditContent(contentStr);

        // Handle structured FAQ items
        if (key === 'faq' || key === 'join_commissions') {
            try {
                const parsed = contentStr ? JSON.parse(contentStr) : [];
                setFaqItems(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setFaqItems([]);
            }
        }
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            let finalContent = editContent;
            if (editing === 'faq' || editing === 'join_commissions') {
                finalContent = JSON.stringify(faqItems);
            }

            await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: editing, title: editTitle, content: finalContent })
            });
            setEditing(null);
            onRefresh();
            showToast("Content updated successfully", "success");
        } catch (e) { console.error(e); showToast('Save failed', "error"); }
        finally { setSaving(false); }
    };

    const addFaqItem = () => setFaqItems([...faqItems, { q: '', a: '' }]);
    const removeFaqItem = (index) => setFaqItems(faqItems.filter((_, i) => i !== index));
    const updateFaqItem = (index, field, value) => {
        const newItems = [...faqItems];
        newItems[index][field] = value;
        setFaqItems(newItems);
    };

    const getContent = (key) => content.find(c => c.key === key);

    return (
        <div>
            <p style={{ color: '#666', fontSize: '11px', marginBottom: '30px' }}>
                Edit site content like FAQ and Commission rules. Changes are saved immediately.
            </p>

            <div style={{ display: 'grid', gap: '20px' }}>
                {contentTypes.map(type => {
                    const item = getContent(type.key);
                    const isEditing = editing === type.key;

                    return (
                        <div key={type.key} style={{ ...glassStyle, padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--accent)' }}>
                                        {type.key === 'faq' ? <MessageSquare size={16} /> :
                                            type.key.includes('join') ? <Target size={16} /> :
                                                type.key.includes('commission') ? <DollarSign size={16} /> : <FileText size={16} />}
                                    </div>
                                    <h3 style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1px' }}>{type.label.toUpperCase()}</h3>
                                </div>
                                {!isEditing && (
                                    <button onClick={() => handleEdit(item, type)} style={{ ...btnStyle, color: 'var(--accent)', background: 'rgba(255,102,0,0.05)', padding: '8px 20px', borderRadius: '12px' }}>
                                        {item ? 'EDIT CONTENT' : 'CUSTOMIZE'}
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.01)',
                                        padding: '30px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border)',
                                        marginTop: '20px'
                                    }}
                                >
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px', marginBottom: '8px' }}>DISPLAY TITLE</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Section Title..."
                                            style={{ width: '100%', padding: '12px 15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '10px', fontSize: '12px', outline: 'none' }}
                                        />
                                    </div>

                                    {editing === 'faq' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px' }}>FAQ BUILDER</label>
                                            {faqItems.map((item, index) => (
                                                <div key={index} style={{ background: 'var(--glass)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900' }}>QUESTION {index + 1}</span>
                                                        <button onClick={() => removeFaqItem(index)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '9px', padding: '5px 10px', borderRadius: '6px' }}>REMOVE</button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.q}
                                                        onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                                                        placeholder="The question..."
                                                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                                                    />
                                                    <textarea
                                                        value={item.a}
                                                        onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                                                        placeholder="The answer..."
                                                        rows={3}
                                                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid var(--border)', color: '#888', borderRadius: '8px', resize: 'vertical', fontSize: '12px', outline: 'none' }}
                                                    />
                                                </div>
                                            ))}
                                            <button onClick={addFaqItem} style={{ ...btnStyle, alignSelf: 'flex-start', border: '1px dashed rgba(255,255,255,0.1)', width: '100%', padding: '15px' }}>+ ADD NEW QUESTION</button>
                                        </div>
                                    ) : editing === 'join_commissions' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px' }}>COMMISSION ROWS</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 40px', gap: '10px', padding: '0 10px', fontSize: '9px', color: '#333' }}>
                                                <span>RELEASED</span>
                                                <span>LISTENERS RANGE</span>
                                                <span>RATE/AMOUNT</span>
                                                <span></span>
                                            </div>
                                            {faqItems.map((item, index) => (
                                                <div key={index} style={{ background: 'var(--glass)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                                                    <select
                                                        value={item.released || 'No'}
                                                        onChange={(e) => updateFaqItem(index, 'released', e.target.value)}
                                                        style={{ padding: '10px', background: '#000', border: '1px solid var(--border)', color: '#fff', fontSize: '11px', borderRadius: '8px', outline: 'none' }}
                                                    >
                                                        <option value="Yes">YES</option>
                                                        <option value="No">NO</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={item.listeners || ''}
                                                        onChange={(e) => updateFaqItem(index, 'listeners', e.target.value)}
                                                        placeholder="e.g. 100K - 500K"
                                                        style={{ padding: '10px', background: '#000', border: '1px solid var(--border)', color: '#fff', fontSize: '11px', borderRadius: '8px', outline: 'none' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.commission || ''}
                                                        onChange={(e) => updateFaqItem(index, 'commission', e.target.value)}
                                                        placeholder="e.g. 5% Royalties"
                                                        style={{ padding: '10px', background: '#000', border: '1px solid var(--border)', color: '#fff', fontSize: '11px', borderRadius: '8px', outline: 'none' }}
                                                    />
                                                    <button onClick={() => removeFaqItem(index)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px', fontWeight: '900' }}>×</button>
                                                </div>
                                            ))}
                                            <button onClick={() => setFaqItems([...faqItems, { released: 'No', listeners: '', commission: '' }])} style={{ ...btnStyle, alignSelf: 'flex-start', border: '1px dashed rgba(255,255,255,0.1)', width: '100%', padding: '12px' }}>+ ADD NEW ROW</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px', marginBottom: '8px' }}>CONTENT EDITOR</label>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                placeholder={editing === 'join_genres' ? "Enter genres separated by new lines or commas..." : "Enter document content..."}
                                                rows={editing === 'join_genres' ? 12 : 15}
                                                style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid var(--border)', color: '#bbb', borderRadius: '12px', resize: 'vertical', fontSize: '13px', lineHeight: '1.6', outline: 'none' }}
                                            />
                                            <p style={{ fontSize: '10px', color: '#444', marginTop: '10px' }}>TIP: Use double-enter for new paragraphs.</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                        <button onClick={handleSave} disabled={saving} className="glow-button" style={{ padding: '12px 35px', borderRadius: '12px', fontSize: '11px', height: 'auto' }}>
                                            {saving ? 'PUBLISHING...' : 'SAVE & PUBLISH'}
                                        </button>
                                        <button onClick={() => setEditing(null)} style={{ ...btnStyle, padding: '12px 25px', borderRadius: '12px', background: 'var(--glass)' }}>DISCARD</button>
                                    </div>
                                </motion.div>
                            ) : item ? (
                                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>LIVE:</span> {item.title}
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#444', fontWeight: '800' }}>LAST UPDATED: {new Date(item.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        background: 'rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        color: '#555',
                                        maxHeight: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '11px', color: '#444' }}>
                                    <p style={{ marginBottom: '10px' }}>Site using system defaults. Use &quot;CUSTOMIZE&quot; to override with your own content.</p>
                                    <div style={{
                                        padding: '15px',
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        maxHeight: '100px',
                                        overflow: 'hidden',
                                        opacity: 0.5,
                                        fontSize: '10px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {(() => {
                                            const def = DEFAULT_CONTENT[type.key];
                                            if (!def) return 'No preview available.';
                                            try {
                                                const parsed = JSON.parse(def);
                                                if (Array.isArray(parsed)) {
                                                    if (type.key === 'faq') return parsed.map((f, i) => `Q: ${f.q}`).join('\n');
                                                    if (type.key === 'join_commissions') return parsed.map((c, i) => `${c.listeners}: ${c.commission}`).join('\n');
                                                }
                                                return def;
                                            } catch (e) { return def; }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
