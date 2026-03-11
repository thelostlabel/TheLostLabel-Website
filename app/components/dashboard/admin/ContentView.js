import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Target, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle } from './styles';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import {
    MANAGED_SITE_CONTENT_DEFINITIONS,
    getDefaultSiteContentEntry,
    getSiteContentPreview,
    parseFaqItems,
    parseJoinCommissionRows
} from '@/lib/site-content-data';


export default function ContentView({ content, onRefresh }) {
    const { showToast } = useToast();
    const [editing, setEditing] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [faqItems, setFaqItems] = useState([]); // Added for structured FAQ editing
    const [saving, setSaving] = useState(false);

    const contentTypes = MANAGED_SITE_CONTENT_DEFINITIONS;

    const handleEdit = (item, type = null) => {
        const key = item?.key || type?.key;
        const fallback = key ? getDefaultSiteContentEntry(key) : null;
        setEditing(key || null);
        setEditTitle(item?.title || type?.label || fallback?.title || '');
        const contentStr = item?.content || fallback?.content || '';
        setEditContent(contentStr);

        // Handle structured FAQ items
        if (key === 'faq') {
            setFaqItems(parseFaqItems(contentStr));
        } else if (key === 'join_commissions') {
            setFaqItems(parseJoinCommissionRows(contentStr));
        } else {
            setFaqItems([]);
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
    const jsonEditorKeys = new Set(['home_services', 'home_stats', 'home_partners', 'footer_links']);

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
                                        background: '#0E0E0E', // Neutral Deep Grey
                                        padding: '30px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border)',
                                        marginTop: '20px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {saving && <DashboardLoader overlay label="PUBLISHING" subLabel="Updating site content..." />}

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
                                                <div key={index} style={{ background: '#0E0E0E', padding: '20px', borderRadius: '15px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                                placeholder={
                                                    editing === 'join_genres'
                                                        ? "Enter genres separated by new lines or commas..."
                                                        : jsonEditorKeys.has(editing)
                                                            ? "Enter valid JSON..."
                                                            : "Enter document content..."
                                                }
                                                rows={editing === 'join_genres' ? 12 : jsonEditorKeys.has(editing) ? 18 : 15}
                                                style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid var(--border)', color: '#bbb', borderRadius: '12px', resize: 'vertical', fontSize: '13px', lineHeight: '1.6', outline: 'none' }}
                                            />
                                            <p style={{ fontSize: '10px', color: '#444', marginTop: '10px' }}>
                                                {editing === 'join_genres'
                                                    ? 'TIP: Use one genre per line or comma-separated values.'
                                                    : jsonEditorKeys.has(editing)
                                                        ? 'TIP: This field expects valid JSON.'
                                                        : 'TIP: Use double-enter for new paragraphs.'}
                                            </p>
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
                                <div style={{ background: '#0E0E0E', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>
                                                {item.updatedAt ? 'LIVE:' : 'DEFAULT:'}
                                            </span>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#444', fontWeight: '800' }}>
                                            {item.updatedAt ? `LAST UPDATED: ${new Date(item.updatedAt).toLocaleDateString()}` : 'USING SYSTEM DEFAULT'}
                                        </div>
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
                                        {(() => {
                                            const preview = getSiteContentPreview(type.key, item.content || getDefaultSiteContentEntry(type.key).content);
                                            return preview.length > 200 ? `${preview.substring(0, 200)}...` : preview;
                                        })()}
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
                                        {getSiteContentPreview(type.key, getDefaultSiteContentEntry(type.key).content)}
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
