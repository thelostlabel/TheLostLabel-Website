"use client";
import { useState, useMemo } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Button, Card, Input, Table, Chip, Modal, TextArea, TextField, Label, Select, ListBox, Tooltip, SearchField } from '@heroui/react';
import ExportButtons from '@/app/components/dashboard/primitives/ExportButtons';
import type { ExportColumn } from '@/app/components/dashboard/lib/export-utils';
import { ACTION_BUTTON } from '@/app/components/dashboard/lib/action-styles';
import ArtistPicker from './contracts/ArtistPicker';
import DateRangeFilter, { DateRange, filterByDateRange } from '@/app/components/dashboard/primitives/DateRangeFilter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentStatus = 'completed' | 'pending' | 'failed';
type PaymentMethod = 'bank_transfer' | 'paypal' | 'wise' | 'crypto';

interface PaymentUser {
    id?: string;
    email?: string;
    stageName?: string;
    fullName?: string;
}

interface PaymentArtist {
    id?: string;
    name?: string;
    email?: string;
}

interface Payment {
    id: string;
    artistId?: string;
    userId?: string;
    amount: number | string;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    status: PaymentStatus;
    createdAt: string;
    artist?: PaymentArtist;
    user?: PaymentUser;
}

/** Artist shape as provided by the admin data hook – only the fields used here. */
interface ArtistOption {
    id: string;
    name: string;
    userId?: string;
    user?: { id?: string };
    [key: string]: unknown;
}

interface PaymentForm {
    artistId: string;
    userId: string;
    amount: string | number;
    method: string;
    reference: string;
    notes: string;
    status: string;
}

interface DecisionModalState {
    open: boolean;
    payment: Payment | null;
    status: PaymentStatus;
    note: string;
}

interface PaymentsViewProps {
    payments: Payment[];
    onRefresh: () => void;
    artists?: ArtistOption[];
}

interface PaymentMethodOption {
    id: PaymentMethod;
    label: string;
}

interface PaymentStatusOption {
    id: PaymentStatus;
    label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLOR_MAP: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
};

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'paypal', label: 'PayPal' },
    { id: 'wise', label: 'Wise' },
    { id: 'crypto', label: 'Crypto' },
];

const PAYMENT_STATUS_OPTIONS: PaymentStatusOption[] = [
    { id: 'completed', label: 'Completed' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaymentsView({ payments, onRefresh, artists = [] }: PaymentsViewProps) {
    const { showToast, showConfirm } = useToast();
    const deletedUserEmail = 'deleted-user@system.local';
    const [showAdd, setShowAdd] = useState<boolean>(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
    const [form, setForm] = useState<PaymentForm>({
        artistId: '', userId: '', amount: '', method: 'bank_transfer',
        reference: '', notes: '', status: 'completed'
    });
    const [decisionModal, setDecisionModal] = useState<DecisionModalState>({
        open: false, payment: null, status: 'completed', note: ''
    });
    const [decisionSaving, setDecisionSaving] = useState<boolean>(false);

    const getPaymentRecipientLabel = (payment: Payment): string => {
        if (payment.artist?.name) return payment.artist.name;
        if (payment.user?.email === deletedUserEmail) return 'DELETED USER';
        if (payment.user?.stageName) return payment.user.stageName;
        if (payment.user?.fullName) return payment.user.fullName;
        if (payment.user?.email) return payment.user.email;
        return 'DELETED USER';
    };

    const getPaymentRecipientSubLabel = (payment: Payment): string => {
        if (payment.artist?.email) return payment.artist.email;
        if (payment.artist?.id) return `ARTIST ${payment.artist.id.slice(0, 8)}`;
        if (payment.user?.email === deletedUserEmail) return 'Archived payout record';
        if (payment.user?.email && payment.user?.stageName) return payment.user.email;
        if (payment.user?.fullName && payment.user?.email) return payment.user.email;
        return payment.userId ? `USER ${payment.userId.slice(0, 8)}` : 'User removed';
    };

    const filteredPayments = useMemo(() => {
        const searched = payments.filter(p =>
            getPaymentRecipientLabel(p).toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            getPaymentRecipientSubLabel(p).toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.reference?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        return filterByDateRange(searched, 'createdAt', dateRange);
    }, [payments, debouncedSearch, dateRange]);

    const statusLabel = (status: string): string => {
        if (status === 'failed') return 'REJECTED';
        return String(status || '').toUpperCase();
    };

    const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = '/api/payments';
            const method = editingPayment ? 'PATCH' : 'POST';
            const body: PaymentForm & { id?: string } = { ...form };
            if (editingPayment) body.id = editingPayment.id;
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingPayment(null);
                showToast(`Payment ${editingPayment ? 'updated' : 'recorded'} successfully`, "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save payment", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error saving payment", "error");
        } finally { setSaving(false); }
    };

    const openDecisionModal = (payment: Payment, status: PaymentStatus): void => {
        setDecisionModal({ open: true, payment, status, note: '' });
    };

    const handleDecisionSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!decisionModal.payment) return;
        setDecisionSaving(true);
        try {
            const res = await fetch('/api/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: decisionModal.payment.id, status: decisionModal.status, adminNote: decisionModal.note })
            });
            if (res.ok) {
                showToast(
                    decisionModal.status === 'completed'
                        ? "Payout approved and artist notified"
                        : "Payout rejected and artist notified",
                    "success"
                );
                setDecisionModal({ open: false, payment: null, status: 'completed', note: '' });
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Decision failed", "error");
            }
        } catch (e) {
            showToast("Error processing decision", "error");
        } finally { setDecisionSaving(false); }
    };

    const handleDeletePayment = async (id: string): Promise<void> => {
        showConfirm(
            "DELETE PAYMENT?",
            "Are you sure you want to delete this payment record?",
            async () => {
                try {
                    const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Payment record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Delete failed", "error");
                    }
                } catch (e) { showToast("Delete error", "error"); }
            }
        );
    };

    const paymentsExportColumns: ExportColumn[] = [
        { key: '_artist', label: 'Artist', format: () => '' },
        { key: 'amount', label: 'Amount', format: (v) => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { key: 'method', label: 'Method', format: (v) => (v || '').replace('_', ' ').toUpperCase() },
        { key: 'reference', label: 'Reference', format: (v) => v || '---' },
        { key: 'status', label: 'Status', format: (v) => v === 'failed' ? 'REJECTED' : (v || '').toUpperCase() },
        { key: 'createdAt', label: 'Date', format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    ];

    const paymentsExportData = filteredPayments.map(p => ({
        ...p,
        _artist: getPaymentRecipientLabel(p),
    }));

    return (
        <div className="flex flex-col gap-6">
            {/* Decision Modal */}
            <Modal
                isOpen={decisionModal.open}
                onOpenChange={(open: boolean) => { if (!open) setDecisionModal({ open: false, payment: null, status: 'completed', note: '' }); }}
            >
                <Modal.Backdrop />
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-lg">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-8 h-0.5 bg-accent" />
                            <h3 className="text-sm font-black tracking-widest m-0">
                                {decisionModal.status === 'completed' ? 'APPROVE PAYOUT REQUEST' : 'REJECT PAYOUT REQUEST'}
                            </h3>
                        </div>

                        {decisionModal.payment && (
                            <div className="flex justify-between items-center p-6 bg-surface border border-border rounded-xl mb-6">
                                <div>
                                    <div className="text-[10px] text-muted font-black tracking-widest mb-1.5">RECIPIENT</div>
                                    <div className="text-base font-black">{getPaymentRecipientLabel(decisionModal.payment)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-muted font-black tracking-widest mb-1.5">AMOUNT</div>
                                    <div className="text-2xl font-black text-accent">
                                        ${Number(decisionModal.payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {decisionModal.payment?.notes && (
                            <div className="bg-surface border border-border p-5 rounded-xl mb-6">
                                <div className="text-[10px] text-muted mb-2.5 font-black tracking-widest">ARTIST REQUEST NOTE</div>
                                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">&quot;{decisionModal.payment.notes}&quot;</div>
                            </div>
                        )}

                        <form onSubmit={handleDecisionSubmit} className="flex flex-col gap-6">
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2.5">ADMIN NOTE (WILL BE EMAILED TO ARTIST)</label>
                                <TextArea
                                    aria-label="Admin note"
                                    value={decisionModal.note}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDecisionModal((prev) => ({ ...prev, note: e.target.value }))}
                                    placeholder={decisionModal.status === 'completed' ? 'Optional: transfer timing/reference details...' : 'Optional: reason for rejection...'}
                                    fullWidth
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    {...(decisionModal.status === 'completed' ? ACTION_BUTTON.approve : ACTION_BUTTON.rejectSolid)}
                                    className={`flex-2 ${decisionModal.status === 'completed' ? (ACTION_BUTTON.approve as any).className ?? '' : ''}`}
                                    isDisabled={decisionSaving}
                                >
                                    {decisionSaving ? 'SENDING...' : decisionModal.status === 'completed' ? 'APPROVE & NOTIFY' : 'REJECT & NOTIFY'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onPress={() => setDecisionModal({ open: false, payment: null, status: 'completed', note: '' })}
                                >
                                    CANCEL
                                </Button>
                            </div>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal>

            {/* Toolbar */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <SearchField
                        aria-label="Search payments"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        className="flex-1 sm:max-w-xs"
                    >
                        <SearchField.Group>
                            <SearchField.SearchIcon />
                            <SearchField.Input placeholder="Search by artist or reference..." />
                            <SearchField.ClearButton />
                        </SearchField.Group>
                    </SearchField>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => {
                                if (!showAdd) {
                                    setForm({ artistId: '', userId: '', amount: '', method: 'bank_transfer', reference: '', notes: '', status: 'completed' });
                                    setEditingPayment(null);
                                }
                                setShowAdd(!showAdd);
                            }}
                        >
                            <Plus size={14} /> {showAdd ? 'CLOSE' : 'RECORD PAYOUT'}
                        </Button>
                        <ExportButtons
                            data={paymentsExportData}
                            columns={paymentsExportColumns}
                            filename="payments-export"
                            title="Payments Report"
                        />
                    </div>
                </div>
                <DateRangeFilter onChange={setDateRange} />
            </div>

            {/* Add/Edit Form */}
            {showAdd && (
                <Card variant="secondary" className="mx-auto w-full max-w-[940px] overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
                    <Card.Header className="flex flex-col gap-5 border-b border-white/6 px-6 py-6 md:px-7 md:py-6">
                        <div className="flex items-center gap-4">
                            <div className="h-0.5 w-8 bg-white/70" />
                            <div>
                                <p className="m-0 text-[10px] font-black uppercase tracking-[0.22em] text-muted">Payout Ledger</p>
                                <Card.Title className="mt-2 text-sm font-black tracking-[0.14em] uppercase">
                                    {editingPayment ? 'Edit Payment' : 'New Payment'}
                                </Card.Title>
                            </div>
                        </div>
                        <Card.Description className="max-w-xl text-[12px] font-semibold leading-relaxed text-white/48">
                            Record label payouts with a mapped recipient, settlement method, reference trail, and final status.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content className="px-6 py-6 md:px-7 md:py-7">
                        <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-12">
                            <div className="md:col-span-2 xl:col-span-5">
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Artist Recipient *
                                </Label>
                                <ArtistPicker
                                    artists={artists as any}
                                    value={form.artistId}
                                    placeholder="Select recipient..."
                                    onChange={(artist: ArtistOption) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            artistId: artist.id,
                                            userId: artist.user?.id || artist.userId || '',
                                        }));
                                    }}
                                    onClear={() => setForm((prev) => ({ ...prev, artistId: '', userId: '' }))}
                                />
                            </div>

                            <TextField
                                className="xl:col-span-3"
                                name="amount"
                                type="number"
                                value={String(form.amount ?? '')}
                                onChange={(value: string) => setForm((prev) => ({ ...prev, amount: value }))}
                                fullWidth
                                isRequired
                            >
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted whitespace-nowrap">
                                    Amount (USD) *
                                </Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[12px] font-black text-muted">$</span>
                                    <Input
                                        aria-label="Amount"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-7"
                                        fullWidth
                                    />
                                </div>
                            </TextField>

                            <div className="xl:col-span-4">
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Payment Method
                                </Label>
                                <Select
                                    aria-label="Payment method"
                                    className="w-full"
                                    selectedKey={form.method}
                                    onSelectionChange={(key: React.Key | null) => {
                                        if (key) setForm((prev) => ({ ...prev, method: String(key) }));
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox items={PAYMENT_METHOD_OPTIONS}>
                                            {(item: PaymentMethodOption) => (
                                                <ListBox.Item id={item.id} textValue={item.label}>
                                                    <span className="text-sm font-semibold">{item.label}</span>
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>

                            <TextField
                                className="xl:col-span-6"
                                name="reference"
                                value={form.reference}
                                onChange={(value: string) => setForm((prev) => ({ ...prev, reference: value }))}
                                fullWidth
                            >
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Reference ID
                                </Label>
                                <Input aria-label="Reference ID" placeholder="TXN ID / DEKONT NO" />
                            </TextField>

                            <div className="xl:col-span-6">
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Status
                                </Label>
                                <Select
                                    aria-label="Payment status"
                                    className="w-full"
                                    selectedKey={form.status}
                                    onSelectionChange={(key: React.Key | null) => {
                                        if (key) setForm((prev) => ({ ...prev, status: String(key) }));
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox items={PAYMENT_STATUS_OPTIONS}>
                                            {(item: PaymentStatusOption) => (
                                                <ListBox.Item id={item.id} textValue={item.label}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-sm font-semibold">{item.label}</span>
                                                        <Chip size="sm" variant="soft" color={STATUS_COLOR_MAP[item.id] || 'default'}>
                                                            <Chip.Label>{item.label.toUpperCase()}</Chip.Label>
                                                        </Chip>
                                                    </div>
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>

                            <div className="md:col-span-2 xl:col-span-12">
                                <Label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Internal Note
                                </Label>
                                <TextArea
                                    aria-label="Payment note"
                                    value={form.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional settlement details, routing info, or bookkeeping notes..."
                                    fullWidth
                                    rows={4}
                                />
                            </div>

                            <div className="mt-1 flex flex-wrap justify-end gap-3 border-t border-white/6 pt-5 md:col-span-2 xl:col-span-12">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="min-w-32"
                                    onPress={() => setShowAdd(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="min-w-40"
                                    isDisabled={saving || !form.artistId || !String(form.amount || '').trim()}
                                >
                                    {saving ? 'Saving...' : editingPayment ? 'Update Payment' : 'Record Payment'}
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            )}

            {/* Payments Table */}
            <Table aria-label="Payments Table">
                <Table.ScrollContainer>
                    <Table.Content
                        className="min-w-[900px]"
                        selectionMode="none"
                    >
                        <Table.Header>
                            <Table.Column isRowHeader id="date" className="w-[110px]">DATE</Table.Column>
                            <Table.Column id="recipient">RECIPIENT</Table.Column>
                            <Table.Column id="amount" className="w-[140px]">AMOUNT</Table.Column>
                            <Table.Column id="method" className="w-[130px]">METHOD</Table.Column>
                            <Table.Column id="reference" className="w-[140px]">REFERENCE</Table.Column>
                            <Table.Column id="status" className="w-[120px]">STATUS</Table.Column>
                            <Table.Column className="w-[100px] text-end" id="actions">ACTIONS</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={filteredPayments}
                            renderEmptyState={() => (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <p className="text-muted text-xs font-bold tracking-widest uppercase">NO PAYMENTS RECORDED</p>
                                </div>
                            )}
                        >
                            {(p: Payment) => (
                                <Table.Row key={p.id} id={p.id}>
                                    <Table.Cell>
                                        <span className="text-xs text-muted font-black">{new Date(p.createdAt).toLocaleDateString()}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black">{getPaymentRecipientLabel(p)}</span>
                                            <span className="text-[10px] text-muted font-black">{getPaymentRecipientSubLabel(p)}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm font-black">
                                            ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft">
                                            <Chip.Label>{p.method?.replace('_', ' ').toUpperCase()}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs text-muted font-mono">{p.reference || '---'}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft" color={STATUS_COLOR_MAP[p.status] || 'default'}>
                                            <Chip.Label>{statusLabel(p.status)}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center justify-end gap-1">
                                            {p.status === 'pending' && (
                                                <>
                                                    {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                                    <Tooltip content="Approve">
                                                        <Button {...ACTION_BUTTON.approve} isIconOnly onPress={() => openDecisionModal(p, 'completed')}><Check size={14} /></Button>
                                                    </Tooltip>
                                                    {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                                    <Tooltip content="Reject">
                                                        <Button {...ACTION_BUTTON.reject} isIconOnly onPress={() => openDecisionModal(p, 'failed')}><X size={14} /></Button>
                                                    </Tooltip>
                                                </>
                                            )}
                                            {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                                    <Tooltip content="Edit">
                                                <Button size="sm" variant="ghost" isIconOnly onPress={() => {
                                                    setEditingPayment(p);
                                                    setForm({
                                                        artistId: p.artistId || '', userId: p.userId || '',
                                                        amount: p.amount, method: p.method,
                                                        reference: p.reference || '', notes: p.notes || '', status: p.status
                                                    });
                                                    setShowAdd(true);
                                                }}><Edit size={14} /></Button>
                                            </Tooltip>
                                            {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                                    <Tooltip content="Delete">
                                                <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:bg-danger/10" onPress={() => handleDeletePayment(p.id)}><Trash2 size={14} /></Button>
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
