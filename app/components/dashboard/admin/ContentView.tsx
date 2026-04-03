import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Target, DollarSign, FileText, PencilLine, Sparkles } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { useToast } from '@/app/components/ToastContext';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import {
    MANAGED_SITE_CONTENT_DEFINITIONS,
    getDefaultSiteContentEntry,
    getSiteContentPreview,
    parseFaqItems,
    parseJoinCommissionRows,
    type SiteContentKey,
    type SiteContentRecord,
    type FaqItem,
    type CommissionRow,
} from '@/lib/site-content-data';

// ─── CSS class constants ────────────────────────────────────────────────────

const FIELD_LABEL = 'mb-2 block text-[10px] font-black uppercase tracking-[0.18em] ds-text-label';
const FIELD_INPUT = 'w-full rounded-xl border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] px-3.5 py-3 text-[13px] ds-text outline-none transition focus:border-[var(--ds-item-border-hover)] focus:bg-[var(--ds-item-bg-hover)]';
const FIELD_TEXTAREA = `${FIELD_INPUT} min-h-[140px] resize-y leading-[1.6]`;
const SECTION_CARD = 'ds-glass p-5 sm:p-6';
const SUBCARD = 'ds-item rounded-[18px] p-4';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Union of the two structured list item shapes used in the FAQ / commission editors. */
type StructuredItem = FaqItem | CommissionRow;

interface ContentViewProps {
    content: SiteContentRecord[];
    onRefresh: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getContentIcon(key: SiteContentKey): React.ReactElement {
    if (key === 'faq') return <MessageSquare size={16} />;
    if (key.includes('join')) return <Target size={16} />;
    if (key.includes('commission')) return <DollarSign size={16} />;
    return <FileText size={16} />;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContentView({ content, onRefresh }: ContentViewProps): React.ReactElement {
    const { showToast } = useToast();
    const [editing, setEditing] = useState<SiteContentKey | null>(null);
    const [editTitle, setEditTitle] = useState<string>('');
    const [editContent, setEditContent] = useState<string>('');
    const [faqItems, setFaqItems] = useState<StructuredItem[]>([]);
    const [saving, setSaving] = useState<boolean>(false);

    const contentTypes = MANAGED_SITE_CONTENT_DEFINITIONS;
    const jsonEditorKeys = new Set<SiteContentKey>(['home_services', 'home_stats', 'home_partners', 'footer_links']);

    const handleEdit = (item: SiteContentRecord | undefined, type: { key: SiteContentKey; label: string } | null = null): void => {
        const key = item?.key || type?.key;
        const fallback = key ? getDefaultSiteContentEntry(key) : null;
        setEditing(key ?? null);
        setEditTitle(item?.title || type?.label || fallback?.title || '');
        const contentStr = item?.content || fallback?.content || '';
        setEditContent(contentStr);

        if (key === 'faq') {
            setFaqItems(parseFaqItems(contentStr));
        } else if (key === 'join_commissions') {
            setFaqItems(parseJoinCommissionRows(contentStr));
        } else {
            setFaqItems([]);
        }
    };

    const handleSave = async (): Promise<void> => {
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
            showToast('Content updated successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addFaqItem = (): void => setFaqItems([...faqItems, { q: '', a: '' } satisfies FaqItem]);
    const removeFaqItem = (index: number): void => setFaqItems(faqItems.filter((_, i) => i !== index));
    const updateFaqItem = (index: number, field: string, value: string): void => {
        const newItems = [...faqItems] as Array<Record<string, string>>;
        newItems[index][field] = value;
        setFaqItems(newItems as StructuredItem[]);
    };

    const getContent = (key: SiteContentKey): SiteContentRecord | undefined => content.find((c) => c.key === key);

    return (
        <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
                <p className="text-[12px] font-semibold leading-relaxed ds-text-muted">
                    Edit homepage blocks, FAQ answers, join rules, and structured content from one place.
                    Drafts are reviewed inline and publishing writes directly to the live site dataset.
                </p>
            </div>

            <div className="grid gap-4">
                {contentTypes.map((type) => {
                    const item = getContent(type.key);
                    const isEditing = editing === type.key;
                    const preview = getSiteContentPreview(type.key, item?.content || getDefaultSiteContentEntry(type.key).content);

                    return (
                        <Card key={type.key} variant="default" className={SECTION_CARD}>
                            <Card.Header className="flex items-start justify-between gap-4 p-0">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="ds-item grid h-11 w-11 shrink-0 place-items-center rounded-2xl ds-text-muted">
                                        {getContentIcon(type.key)}
                                    </div>
                                    <div className="min-w-0">
                                        <Card.Title className="truncate text-[12px] font-black uppercase tracking-[0.18em] ds-text">
                                            {type.label}
                                        </Card.Title>
                                        <Card.Description className="mt-1 text-[11px] font-semibold ds-text-faint">
                                            {item?.updatedAt ? `Updated ${new Date(item.updatedAt).toLocaleDateString()}` : 'Using system defaults'}
                                        </Card.Description>
                                    </div>
                                </div>

                                {!isEditing ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shrink-0"
                                        onPress={() => handleEdit(item, type)}
                                    >
                                        <PencilLine size={14} />
                                        {item ? 'Edit Content' : 'Customize'}
                                    </Button>
                                ) : null}
                            </Card.Header>

                            <Card.Content className="mt-4 p-0">
                                {isEditing ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative flex flex-col gap-5 rounded-[22px] border border-[var(--ds-item-border)] bg-[linear-gradient(180deg,var(--ds-item-bg-hover),var(--ds-item-bg))] p-5 sm:p-6"
                                    >
                                        {saving ? <DashboardLoader overlay label="PUBLISHING" subLabel="Updating site content..." /> : null}

                                        <div>
                                            <label className={FIELD_LABEL}>Display Title</label>
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Section title..."
                                                className={FIELD_INPUT}
                                            />
                                        </div>

                                        {editing === 'faq' ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className={FIELD_LABEL}>FAQ Builder</label>
                                                    <span className="text-[11px] font-semibold ds-text-faint">{faqItems.length} item{faqItems.length !== 1 ? 's' : ''}</span>
                                                </div>

                                                {(faqItems as FaqItem[]).map((item, index) => (
                                                    <div key={index} className={`${SUBCARD} flex flex-col gap-3`}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] ds-text-sub">
                                                                Question {index + 1}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-danger"
                                                                onPress={() => removeFaqItem(index)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={item.q}
                                                            onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                                                            placeholder="The question..."
                                                            className={FIELD_INPUT}
                                                        />
                                                        <textarea
                                                            value={item.a}
                                                            onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                                                            placeholder="The answer..."
                                                            rows={4}
                                                            className={`${FIELD_TEXTAREA} min-h-[120px]`}
                                                        />
                                                    </div>
                                                ))}

                                                <Button variant="outline" onPress={addFaqItem}>
                                                    <Sparkles size={14} />
                                                    Add New Question
                                                </Button>
                                            </div>
                                        ) : editing === 'join_commissions' ? (
                                            <div className="flex flex-col gap-4">
                                                <label className={FIELD_LABEL}>Commission Rows</label>

                                                <div className="hidden grid-cols-[90px_1fr_1fr_44px] gap-3 px-1 text-[10px] font-black uppercase tracking-[0.14em] ds-text-label sm:grid">
                                                    <span>Released</span>
                                                    <span>Listeners</span>
                                                    <span>Rate</span>
                                                    <span />
                                                </div>

                                                {(faqItems as CommissionRow[]).map((item, index) => (
                                                    <div key={index} className={`${SUBCARD} grid gap-3 sm:grid-cols-[90px_1fr_1fr_44px] sm:items-center`}>
                                                        <select
                                                            value={item.released || 'No'}
                                                            onChange={(e) => updateFaqItem(index, 'released', e.target.value)}
                                                            className={FIELD_INPUT}
                                                        >
                                                            <option value="Yes">YES</option>
                                                            <option value="No">NO</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={item.listeners || ''}
                                                            onChange={(e) => updateFaqItem(index, 'listeners', e.target.value)}
                                                            placeholder="e.g. 100K - 500K"
                                                            className={FIELD_INPUT}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.commission || ''}
                                                            onChange={(e) => updateFaqItem(index, 'commission', e.target.value)}
                                                            placeholder="e.g. 5% Royalties"
                                                            className={FIELD_INPUT}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-danger sm:min-w-0"
                                                            onPress={() => removeFaqItem(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button
                                                    variant="outline"
                                                    onPress={() => setFaqItems([...faqItems, { released: 'No', listeners: '', commission: '' } satisfies CommissionRow])}
                                                >
                                                    <Sparkles size={14} />
                                                    Add New Row
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className={FIELD_LABEL}>Content Editor</label>
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    placeholder={
                                                        editing === 'join_genres'
                                                            ? 'Enter genres separated by new lines or commas...'
                                                            : editing && jsonEditorKeys.has(editing)
                                                                ? 'Enter valid JSON...'
                                                                : 'Enter document content...'
                                                    }
                                                    rows={editing === 'join_genres' ? 12 : editing && jsonEditorKeys.has(editing) ? 18 : 15}
                                                    className={FIELD_TEXTAREA}
                                                />
                                                <p className="mt-2 text-[11px] font-semibold ds-text-faint">
                                                    {editing === 'join_genres'
                                                        ? 'Tip: use one genre per line or comma-separated values.'
                                                        : editing && jsonEditorKeys.has(editing)
                                                            ? 'Tip: this field expects valid JSON.'
                                                            : 'Tip: use double-enter for new paragraphs.'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-3 border-t border-[var(--ds-divider)] pt-4">
                                            <Button
                                                variant="primary"
                                                onPress={handleSave}
                                                isDisabled={saving}
                                            >
                                                {saving ? 'Publishing...' : 'Save & Publish'}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onPress={() => setEditing(null)}
                                            >
                                                Discard
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : item ? (
                                    <div className={`${SUBCARD} flex flex-col gap-3`}>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="text-[12px] font-semibold ds-text-sub">
                                                <span className="mr-2 font-black uppercase tracking-[0.16em] text-(--color-accent)">
                                                    {item.updatedAt ? 'Live' : 'Default'}
                                                </span>
                                                {item.title}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.14em] ds-text-faint">
                                                {item.updatedAt ? `Last updated ${new Date(item.updatedAt).toLocaleDateString()}` : 'Using system default'}
                                            </div>
                                        </div>
                                        <div className="rounded-[14px] border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] px-4 py-3 text-[12px] leading-[1.6] ds-text-muted">
                                            {preview.length > 220 ? `${preview.substring(0, 220)}...` : preview}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${SUBCARD} flex flex-col gap-3`}>
                                        <p className="text-[12px] font-semibold ds-text-muted">
                                            Site is using system defaults. Choose <strong className="ds-text">Customize</strong> to override this block.
                                        </p>
                                        <div className="rounded-[14px] border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] px-4 py-3 text-[11px] leading-[1.65] ds-text-faint">
                                            {preview}
                                        </div>
                                    </div>
                                )}
                            </Card.Content>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
