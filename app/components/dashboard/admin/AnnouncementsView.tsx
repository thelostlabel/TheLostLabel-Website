import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Edit2, Plus, Power, Trash2 } from 'lucide-react';
import {
    Button,
    Card,
    Input,
    Label,
    Switch,
    TextArea,
    TextField,
} from '@heroui/react';
import { useToast } from '@/app/components/ToastContext';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import { DashboardAnnouncement } from '../types';

const FIELD_CLASS = 'dash-input';

interface AnnouncementsViewProps {
    announcements: DashboardAnnouncement[];
    onRefresh: () => void;
}

export default function AnnouncementsView({ announcements = [], onRefresh }: AnnouncementsViewProps) {
    const { showToast, showConfirm } = useToast() as any;
    const [editing, setEditing] = useState<string | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        content: '',
        type: 'feature',
        active: true,
        linkUrl: '',
        linkText: 'Learn more',
    });

    const handleEdit = (item: DashboardAnnouncement | null = null) => {
        if (item) {
            setEditing(item.id);
            setForm({
                title: item.title,
                content: item.content,
                type: item.type || 'feature',
                active: item.active ?? true,
                linkUrl: item.linkUrl || '',
                linkText: item.linkText || 'Learn more',
            });
        } else {
            setEditing('new');
            setForm({ title: '', content: '', type: 'feature', active: true, linkUrl: '', linkText: 'Learn more' });
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            showToast('Title and content are required', 'warning');
            return;
        }
        setSaving(true);
        try {
            const body = { ...form, id: editing === 'new' ? undefined : editing };
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save');
            showToast(editing === 'new' ? 'Announcement created' : 'Announcement updated', 'success');
            setEditing(null);
            onRefresh();
        } catch (error: any) {
            showToast(error.message || 'Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        showConfirm(
            'DELETE ANNOUNCEMENT?',
            'This will permanently remove this announcement. Continue?',
            async () => {
                try {
                    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Delete failed');
                    showToast('Announcement deleted', 'success');
                    onRefresh();
                } catch (error: any) {
                    showToast(error.message || 'Delete failed', 'error');
                }
            },
        );
    };

    const toggleActive = async (item: DashboardAnnouncement) => {
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, active: !item.active }),
            });
            if (!res.ok) throw new Error('Update failed');
            onRefresh();
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        }
    };

    const TYPE_LABELS: Record<string, string> = {
        feature: 'NEW FEATURE',
        update: 'PLATFORM UPDATE',
        important: 'IMPORTANT NOTICE',
        maintenance: 'MAINTENANCE',
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-black tracking-[0.18em] uppercase text-foreground">
                        Feature Announcements
                    </h2>
                    <p className="mt-1 text-[11px] text-muted">
                        Announce new site features and updates to your users.
                    </p>
                </div>
                {!editing && (
                    <Button variant="primary" onPress={() => handleEdit()}>
                        <Plus size={14} />
                        NEW ANNOUNCEMENT
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {editing ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card variant="default" className="border-default/15">
                            <Card.Content className="relative flex flex-col gap-6 p-6">
                                {saving && <DashboardLoader overlay label="PUBLISHING" />}

                                {/* Title */}
                                <TextField
                                    fullWidth
                                    value={form.title}
                                    onChange={(val) => setForm({ ...form, title: val })}
                                >
                                    <Label className="dash-label">
                                        Announcement Title
                                    </Label>
                                    <Input placeholder="e.g. New Advanced Studio Player" className={FIELD_CLASS} variant="secondary" />
                                </TextField>

                                {/* Type + Active row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                                            Type
                                        </span>
                                        <select
                                            value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                            className={FIELD_CLASS}
                                        >
                                            {Object.entries(TYPE_LABELS).map(([val, lbl]) => (
                                                <option key={val} value={val}>{lbl}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <div className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 ${form.active ? 'border-green-500/20 bg-green-500/5' : 'border-default/10 bg-default/5'}`}>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${form.active ? 'text-green-400' : 'text-muted'}`}>
                                                {form.active ? 'Active & Visible' : 'Inactive (Hidden)'}
                                            </span>
                                            <Switch
                                                isSelected={form.active}
                                                onChange={(isSelected) => setForm({ ...form, active: isSelected })}
                                            >
                                                <Switch.Control>
                                                    <Switch.Thumb />
                                                </Switch.Control>
                                            </Switch>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <TextField
                                    fullWidth
                                    value={form.content}
                                    onChange={(val) => setForm({ ...form, content: val })}
                                >
                                    <Label className="dash-label">
                                        Content
                                    </Label>
                                    <TextArea
                                        className={`${FIELD_CLASS} min-h-28 resize-y`}
                                        placeholder="What's new? Describe the feature or update..."
                                        variant="secondary"
                                    />
                                </TextField>

                                {/* Link fields */}
                                <Card variant="secondary" className="border-default/8">
                                    <Card.Content className="grid grid-cols-2 gap-4 p-4">
                                        <TextField
                                            fullWidth
                                            value={form.linkUrl}
                                            onChange={(val) => setForm({ ...form, linkUrl: val })}
                                        >
                                            <Label className="dash-label">
                                                Link URL (Optional)
                                            </Label>
                                            <Input type="url" placeholder="https://..." className={FIELD_CLASS} variant="secondary" />
                                        </TextField>
                                        <TextField
                                            fullWidth
                                            value={form.linkText}
                                            onChange={(val) => setForm({ ...form, linkText: val })}
                                        >
                                            <Label className="dash-label">
                                                Button Text
                                            </Label>
                                            <Input placeholder="Learn more" className={FIELD_CLASS} variant="secondary" />
                                        </TextField>
                                    </Card.Content>
                                </Card>

                                {/* Actions */}
                                <div className="flex gap-3 border-t border-default/10 pt-5">
                                    <Button variant="primary" onPress={handleSave} isDisabled={saving}>
                                        {editing === 'new' ? 'Create Announcement' : 'Save Changes'}
                                    </Button>
                                    <Button variant="secondary" onPress={() => setEditing(null)}>
                                        Discard
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                    >
                        {announcements.length === 0 ? (
                            <Card variant="default" className="border-default/10">
                                <Card.Content className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                    <Bell size={32} className="text-muted/40" />
                                    <p className="text-[12px] text-muted">
                                        No announcements yet. Click &quot;NEW ANNOUNCEMENT&quot; to create one.
                                    </p>
                                </Card.Content>
                            </Card>
                        ) : (
                            announcements.map((item: DashboardAnnouncement) => (
                                <Card
                                    key={item.id}
                                    variant="default"
                                    className={`border-default/10 transition-opacity ${!item.active ? 'opacity-50' : ''}`}
                                    style={{ borderLeft: `2px solid ${item.active ? 'var(--color-accent)' : 'transparent'}` }}
                                >
                                    <Card.Content className="flex items-center justify-between gap-4 p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-default/8 text-(--color-accent)">
                                                <Bell size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="text-[13px] font-black text-foreground">
                                                        {item.title}
                                                    </h3>
                                                    <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-default/8 text-muted">
                                                        {(item.type || 'FEATURE').toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="mt-1 max-w-120 truncate text-[11px] text-muted">
                                                    {item.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onPress={() => toggleActive(item)}
                                                aria-label={item.active ? 'Deactivate' : 'Activate'}
                                                className={item.active ? 'text-green-400' : 'text-muted'}
                                            >
                                                <Power size={13} />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onPress={() => handleEdit(item)}
                                            >
                                                <Edit2 size={13} />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onPress={() => handleDelete(item.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
