"use client";
import { useState } from 'react';
import { Edit, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Button, Input, Table, Chip, Modal, Tooltip } from '@heroui/react';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string;
    enabled: boolean;
    config?: string;
}

interface WebhookForm {
    name: string;
    url: string;
    events: string;
    enabled: boolean;
    config: string;
}

interface EventOption {
    value: string;
    label: string;
}

interface WebhooksViewProps {
    webhooks: Webhook[];
    onRefresh: () => void;
}

export default function WebhooksView({ webhooks, onRefresh }: WebhooksViewProps) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState<boolean>(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [form, setForm] = useState<WebhookForm>({ name: '', url: '', events: '', enabled: true, config: '' });
    const [saving, setSaving] = useState<boolean>(false);

    const eventOptions: EventOption[] = [
        { value: 'new_track', label: 'New Track Released' },
        { value: 'playlist_update', label: 'Playlist Update' },
        { value: 'demo_submit', label: 'Demo Submitted' },
        { value: 'demo_approved', label: 'Demo Approved' },
        { value: 'demo_rejected', label: 'Demo Rejected' },
    ];

    const resetForm = (): void => {
        setForm({ name: '', url: '', events: '', enabled: true, config: '' });
        setShowAdd(false);
        setEditingWebhook(null);
    };

    const handleSave = async (): Promise<void> => {
        setSaving(true);
        try {
            let res: Response;
            if (editingWebhook) {
                res = await fetch('/api/admin/webhooks', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingWebhook.id, ...form })
                });
            } else {
                res = await fetch('/api/admin/webhooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }
            if (!res.ok) {
                const data: { error?: string } = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Save failed');
            }
            resetForm();
            showToast("Webhook configuration saved", "success");
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast((e as Error).message || 'Save failed', "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string): void => {
        showConfirm(
            "DELETE WEBHOOK?",
            "Are you sure you want to delete this webhook? It will stop receiving events immediately.",
            async () => {
                try {
                    const res = await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const data: { error?: string } = await res.json().catch(() => ({}));
                        throw new Error(data.error || 'Delete failed');
                    }
                    showToast("Webhook deleted", "success");
                    onRefresh();
                } catch (e) {
                    console.error(e);
                    showToast((e as Error).message || "Delete failed", "error");
                }
            }
        );
    };

    const handleToggle = async (webhook: Webhook): Promise<void> => {
        try {
            const res = await fetch('/api/admin/webhooks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: webhook.id, enabled: !webhook.enabled })
            });
            if (!res.ok) {
                const data: { error?: string } = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Toggle failed');
            }
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast((e as Error).message || 'Toggle failed', "error");
        }
    };

    const testWebhook = async (webhookId: string): Promise<void> => {
        try {
            const res = await fetch('/api/webhook/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookId })
            });
            const data: { error?: string } = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Test failed');
            showToast('Test webhook sent!', "success");
        } catch (e) {
            showToast((e as Error).message || 'Test failed', "error");
        }
    };

    const isModalOpen: boolean = showAdd || !!editingWebhook;

    return (
        <div className="flex flex-col gap-6">
            <Modal isOpen={isModalOpen} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
                <Modal.Backdrop />
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-lg relative">
                        {saving && <DashboardLoader overlay label="PROCESSING" subLabel="Updating webhook config..." />}
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-black tracking-widest uppercase">
                                {editingWebhook ? 'EDIT_WEBHOOK' : 'ADD_NEW_WEBHOOK'}
                            </span>
                            <Button isIconOnly size="sm" variant="ghost" onPress={resetForm}>×</Button>
                        </div>
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="text-[9px] text-muted font-black tracking-widest block mb-2">WEBHOOK_NAME</label>
                                <Input
                                    aria-label="Webhook name"
                                    placeholder="e.g., Discord Notifications"
                                    value={form.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                                    fullWidth
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-muted font-black tracking-widest block mb-2">ENDPOINT_URL</label>
                                <Input
                                    aria-label="Endpoint URL"
                                    type="url"
                                    placeholder="https://discord.com/api/webhooks/..."
                                    value={form.url}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, url: e.target.value })}
                                    fullWidth
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-muted font-black tracking-widest block mb-2">SUBSCRIBE_EVENTS</label>
                                <div className="flex flex-wrap gap-2 bg-surface p-3 rounded-lg border border-border">
                                    {eventOptions.map((opt: EventOption) => {
                                        const isSelected = form.events.includes(opt.value);
                                        return (
                                            <Button
                                                key={opt.value}
                                                size="sm"
                                                variant={isSelected ? 'primary' : 'ghost'}
                                                onPress={() => {
                                                    const currentEvents: string[] = form.events ? form.events.split(',').filter((e: string) => e) : [];
                                                    if (isSelected) {
                                                        setForm({ ...form, events: currentEvents.filter((e: string) => e !== opt.value).join(',') });
                                                    } else {
                                                        setForm({ ...form, events: [...currentEvents, opt.value].join(',') });
                                                    }
                                                }}
                                            >
                                                {opt.label.toUpperCase()}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            {form.events?.includes('playlist_update') && (
                                <div>
                                    <label className="text-[9px] text-muted font-black tracking-widest block mb-2">TARGET_PLAYLIST_ID</label>
                                    <Input
                                        aria-label="Target playlist ID"
                                        placeholder="Spotify Playlist ID"
                                        value={form.config ? JSON.parse(form.config).playlistId || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const currentConfig: Record<string, string> = form.config ? JSON.parse(form.config) : {};
                                            setForm({ ...form, config: JSON.stringify({ ...currentConfig, playlistId: e.target.value }) });
                                        }}
                                        fullWidth
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-8">
                            <Button
                                variant="primary"
                                className="flex-[2]"
                                onPress={handleSave}
                                isDisabled={saving || !form.name || !form.url}
                            >
                                {saving ? 'PROCESSING...' : (editingWebhook ? 'UPDATE_WEBHOOK' : 'CREATE_WEBHOOK')}
                            </Button>
                            <Button variant="secondary" className="flex-1" onPress={resetForm}>
                                CANCEL
                            </Button>
                        </div>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal>

            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xs font-black tracking-widest m-0">AUTOMATION_WEBHOOKS</h3>
                    <p className="text-[9px] text-muted mt-1 font-bold">NOTIFY DISCORD OR OTHER SERVICES ON SYSTEM EVENTS</p>
                </div>
                <Button variant="primary" onPress={() => setShowAdd(true)}>+ NEW_WEBHOOK</Button>
            </div>

            <Table aria-label="Webhooks Table">
                <Table.ScrollContainer>
                    <Table.Content className="min-w-[600px]" selectionMode="none">
                        <Table.Header>
                            <Table.Column isRowHeader id="name">NAME / ENDPOINT</Table.Column>
                            <Table.Column id="subscriptions">SUBSCRIPTIONS</Table.Column>
                            <Table.Column id="status">STATUS</Table.Column>
                            <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={webhooks}
                            renderEmptyState={() => (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <p className="text-muted text-xs font-bold tracking-widest uppercase">NO_WEBHOOKS_CONFIGURED</p>
                                </div>
                            )}
                        >
                            {(webhook: Webhook) => (
                                <Table.Row key={webhook.id} id={webhook.id}>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black">{webhook.name}</span>
                                            <span className="text-[9px] text-muted font-semibold">{webhook.url.substring(0, 60)}...</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {webhook.events?.split(',').filter((e: string) => e).map((event: string) => (
                                                <Chip key={event} size="sm" variant="soft">
                                                    <Chip.Label>{event.toUpperCase()}</Chip.Label>
                                                </Chip>
                                            ))}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Button
                                            size="sm"
                                            variant={webhook.enabled ? 'secondary' : 'ghost'}
                                            onPress={() => handleToggle(webhook)}
                                        >
                                            <Chip size="sm" variant="soft" color={webhook.enabled ? 'success' : 'default'}>
                                                <Chip.Label>{webhook.enabled ? 'ACTIVE' : 'DISABLED'}</Chip.Label>
                                            </Chip>
                                        </Button>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Test">
                                                <Button size="sm" variant="ghost" isIconOnly onPress={() => testWebhook(webhook.id)}><Zap size={14} /></Button>
                                            </Tooltip>
                                            <Tooltip content="Edit">
                                                <Button size="sm" variant="ghost" isIconOnly onPress={() => {
                                                    setEditingWebhook(webhook);
                                                    setForm({
                                                        name: webhook.name,
                                                        url: webhook.url,
                                                        events: webhook.events,
                                                        enabled: webhook.enabled,
                                                        config: webhook.config || ''
                                                    });
                                                }}><Edit size={14} /></Button>
                                            </Tooltip>
                                            <Tooltip content="Delete">
                                                <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:bg-danger/10" onPress={() => handleDelete(webhook.id)}><Trash2 size={14} /></Button>
                                            </Tooltip>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        </div>
    );
}
