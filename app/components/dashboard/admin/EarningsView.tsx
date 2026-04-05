"use client";
import { useState, useMemo, FormEvent, ChangeEvent } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Button, Input, Table, Chip, Card, Meter, Label, Separator, SearchField } from '@heroui/react';
import ExportButtons from '@/app/components/dashboard/primitives/ExportButtons';
import type { ExportColumn } from '@/app/components/dashboard/lib/export-utils';
import AdvancedFilter, { type FilterField } from '@/app/components/dashboard/primitives/AdvancedFilter';
import { applyFilters, countActiveFilters, type FilterFieldConfig } from '@/app/components/dashboard/lib/filter-utils';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

interface EarningRelease {
    name?: string;
    title?: string;
}

interface EarningUser {
    stageName?: string;
    fullName?: string;
}

interface EarningContract {
    release?: EarningRelease;
    title?: string;
    user?: EarningUser;
    primaryArtistName?: string;
}

export interface Earning {
    id: string;
    contractId: string;
    period: string;
    grossAmount: number;
    expenseAmount?: number;
    artistAmount?: number;
    labelAmount?: number;
    streams?: number;
    source?: string;
    contract?: EarningContract;
}

interface ContractArtist {
    name?: string;
}

export interface Contract {
    id: string;
    release?: { name?: string };
    title?: string;
    artist?: ContractArtist;
    user?: EarningUser;
    primaryArtistName?: string;
}

interface EarningsViewProps {
    earnings: Earning[];
    contracts: Contract[];
    onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Internal form state
// ---------------------------------------------------------------------------

interface EarningForm {
    contractId: string;
    period: string;
    grossAmount: string;
    expenseAmount: string;
    streams: string;
    source: string;
}

const defaultForm = (): EarningForm => ({
    contractId: '',
    period: new Date().toISOString().slice(0, 7),
    grossAmount: '',
    expenseAmount: '',
    streams: '',
    source: 'spotify',
});

// ---------------------------------------------------------------------------
// Advanced filter configuration
// ---------------------------------------------------------------------------

const EARNINGS_SOURCE_OPTIONS: { id: string; label: string }[] = [
    { id: 'spotify',    label: 'SPOTIFY' },
    { id: 'apple',      label: 'APPLE MUSIC' },
    { id: 'youtube',    label: 'YOUTUBE' },
    { id: 'ad_revenue', label: 'AD REVENUE' },
    { id: 'other',      label: 'OTHER' },
];

const EARNINGS_FILTER_FIELDS: FilterField[] = [
    { key: 'search', label: 'SEARCH', type: 'text', placeholder: 'Search by artist, release or period...' },
    { key: 'period', label: 'PERIOD', type: 'daterange' },
    { key: 'source', label: 'SOURCE', type: 'select', options: EARNINGS_SOURCE_OPTIONS },
    { key: 'grossAmount', label: 'GROSS AMOUNT ($)', type: 'number-range' },
];

const EARNINGS_FILTER_CONFIGS: FilterFieldConfig[] = [
    { key: 'search', type: 'text', searchFields: ['contract.release.name', 'contract.title', 'contract.user.stageName', 'contract.user.fullName', 'contract.primaryArtistName', 'period'] },
    { key: 'period', type: 'daterange' },
    { key: 'source', type: 'select' },
    { key: 'grossAmount', type: 'number-range' },
];

const DEFAULT_EARNINGS_FILTERS: Record<string, any> = {
    search: '',
    period: { start: '', end: '' },
    source: '',
    grossAmount: { min: '', max: '' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EarningsView({ earnings, contracts, onRefresh }: EarningsViewProps) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(DEFAULT_EARNINGS_FILTERS);
    const [form, setForm] = useState<EarningForm>(defaultForm());

    const activeFilterCount = useMemo(() => countActiveFilters(advancedFilters), [advancedFilters]);

    const filteredEarnings = useMemo<Earning[]>(() => {
        let result = earnings;
        if (debouncedSearch) {
            const needle = debouncedSearch.toLowerCase();
            result = result.filter(e =>
                e.contract?.release?.name?.toLowerCase().includes(needle) ||
                e.contract?.user?.stageName?.toLowerCase().includes(needle) ||
                e.contract?.user?.fullName?.toLowerCase().includes(needle) ||
                e.period?.toLowerCase().includes(needle) ||
                e.source?.toLowerCase().includes(needle)
            );
        }
        return applyFilters(result, advancedFilters, EARNINGS_FILTER_CONFIGS);
    }, [earnings, debouncedSearch, advancedFilters]);

    // --- Handlers ---

    const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/earnings/${editingId}` : '/api/earnings';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) {
                setShowAdd(false);
                setEditingId(null);
                setForm(defaultForm());
                showToast(editingId ? "Earning record updated" : "Earning record added", "success");
                onRefresh();
            } else {
                const data: { error?: string } = await res.json();
                showToast(data.error || "Failed to save earning", "error");
            }
        } catch {
            showToast("Error saving earning", "error");
        } finally { setSaving(false); }
    };

    const handleEdit = (earning: Earning) => {
        setEditingId(earning.id);
        setForm({
            contractId: earning.contractId,
            period: earning.period,
            grossAmount: String(earning.grossAmount),
            expenseAmount: earning.expenseAmount != null ? String(earning.expenseAmount) : '',
            streams: earning.streams != null ? String(earning.streams) : '',
            source: earning.source || 'spotify'
        });
        setShowAdd(true);
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "DELETE RECORD?",
            "Are you sure you want to delete this earning record? This cannot be undone.",
            async () => {
                try {
                    const res = await fetch(`/api/earnings/${id}`, { method: 'DELETE' });
                    if (res.ok) { showToast("Record deleted", "success"); onRefresh(); }
                    else { showToast("Failed to delete", "error"); }
                } catch { showToast("Error deleting", "error"); }
            }
        );
    };

    // --- Aggregations ---

    const totalGross = earnings.reduce((s, e) => s + (e.grossAmount || 0), 0);
    const totalArtist = earnings.reduce((s, e) => s + (e.artistAmount || 0), 0);
    const totalLabel = earnings.reduce((s, e) => s + (e.labelAmount || 0), 0);
    const totalExpense = earnings.reduce((s, e) => s + (e.expenseAmount || 0), 0);
    const artistPct = totalGross ? Math.round((totalArtist / totalGross) * 100) : 0;
    const labelPct = totalGross ? Math.round((totalLabel / totalGross) * 100) : 0;
    const expensePct = totalGross ? Math.round((totalExpense / totalGross) * 100) : 0;

    const fmt = (v: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

    const spendByRelease = useMemo(() =>
        Object.values(
            earnings.reduce<Record<string, { name: string; spend: number; revenue: number }>>((acc, e) => {
                const key = e.contract?.release?.name || 'Unknown';
                acc[key] = acc[key] || { name: key, spend: 0, revenue: 0 };
                acc[key].spend += e.expenseAmount || 0;
                acc[key].revenue += e.labelAmount || 0;
                return acc;
            }, {})
        ).sort((a, b) => b.spend - a.spend).slice(0, 5),
    [earnings]);

    const spendBySource = useMemo(() =>
        Object.values(
            earnings.reduce<Record<string, { source: string; spend: number; streams: number }>>((acc, e) => {
                const key = (e.source || 'OTHER').toUpperCase();
                acc[key] = acc[key] || { source: key, spend: 0, streams: 0 };
                acc[key].spend += e.expenseAmount || 0;
                acc[key].streams += e.streams || 0;
                return acc;
            }, {})
        ).sort((a, b) => b.spend - a.spend).slice(0, 6),
    [earnings]);

    // --- Export ---

    const earningsExportColumns: ExportColumn[] = [
        { key: 'period', label: 'Period' },
        { key: 'contract.user.stageName', label: 'Artist', format: (v) => v || 'Unknown' },
        { key: 'contract.release.name', label: 'Release', format: (v) => v || 'Untitled' },
        { key: 'grossAmount', label: 'Gross Amount', format: (v) => `$${Number(v || 0).toLocaleString()}` },
        { key: 'expenseAmount', label: 'Expense', format: (v) => `$${Number(v || 0).toLocaleString()}` },
        { key: 'artistAmount', label: 'Artist Amount', format: (v) => `$${Number(v || 0).toLocaleString()}` },
        { key: 'labelAmount', label: 'Label Amount', format: (v) => `$${Number(v || 0).toLocaleString()}` },
        { key: 'streams', label: 'Streams', format: (v) => v ? Number(v).toLocaleString() : '--' },
        { key: 'source', label: 'Source', format: (v) => (v || 'spotify').toUpperCase() },
    ];

    const STAT_ICON_CLASS = "size-4 text-muted";

    return (
        <div className="flex flex-col gap-6">

            {/* ── KPI Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                    <Card.Content className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-[0.16em] text-muted uppercase">Gross Revenue</span>
                            <DollarSign className={STAT_ICON_CLASS} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">{fmt(totalGross)}</span>
                        <span className="text-[10px] text-muted">{earnings.length} records · {contracts.length} contracts</span>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Content className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-[0.16em] text-muted uppercase">Expenses</span>
                            <TrendingUp className={STAT_ICON_CLASS} />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-danger">{fmt(totalExpense)}</span>
                        <Meter aria-label="Expense ratio" value={expensePct} color="danger" size="sm">
                            <Meter.Track className="h-1">
                                <Meter.Fill />
                            </Meter.Track>
                        </Meter>
                        <span className="text-[10px] text-muted">{expensePct}% of gross</span>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Content className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-[0.16em] text-muted uppercase">Artist Payouts</span>
                            <Users className={STAT_ICON_CLASS} />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-success">{fmt(totalArtist)}</span>
                        <Meter aria-label="Artist ratio" value={artistPct} color="success" size="sm">
                            <Meter.Track className="h-1">
                                <Meter.Fill />
                            </Meter.Track>
                        </Meter>
                        <span className="text-[10px] text-muted">{artistPct}% of gross</span>
                    </Card.Content>
                </Card>

                <Card variant="secondary">
                    <Card.Content className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-[0.16em] text-muted uppercase">Label Net</span>
                            <BarChart3 className={STAT_ICON_CLASS} />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-accent">{fmt(totalLabel)}</span>
                        <Meter aria-label="Label ratio" value={labelPct} color="accent" size="sm">
                            <Meter.Track className="h-1">
                                <Meter.Fill />
                            </Meter.Track>
                        </Meter>
                        <span className="text-[10px] text-muted">{labelPct}% of gross</span>
                    </Card.Content>
                </Card>
            </div>

            {/* ── Analytics ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spend by Release */}
                <Card>
                    <Card.Header className="flex-row items-center justify-between">
                        <Card.Title className="text-xs font-black tracking-widest uppercase">Top Releases by Ad Spend</Card.Title>
                        <Chip size="sm" variant="soft"><Chip.Label>TOP 5</Chip.Label></Chip>
                    </Card.Header>
                    <Separator />
                    <Card.Content className="flex flex-col gap-2.5 p-4">
                        {spendByRelease.length === 0 ? (
                            <div className="py-10 text-center text-muted text-[10px] font-black tracking-widest">NO SPEND DATA</div>
                        ) : spendByRelease.map((r, i) => {
                            const pct = totalExpense ? Math.round((r.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold truncate">{r.name}</span>
                                        <span className="text-xs font-black text-accent shrink-0">${r.spend.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-muted font-semibold">
                                        <span>REV: ${r.revenue.toLocaleString()}</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <Meter aria-label={`${r.name} share`} value={pct} color="accent" size="sm">
                                        <Meter.Track className="h-1">
                                            <Meter.Fill />
                                        </Meter.Track>
                                    </Meter>
                                </div>
                            );
                        })}
                    </Card.Content>
                </Card>

                {/* Spend by Source */}
                <Card>
                    <Card.Header className="flex-row items-center justify-between">
                        <Card.Title className="text-xs font-black tracking-widest uppercase">Spend by Source</Card.Title>
                        <Chip size="sm" variant="soft"><Chip.Label>TOP 6</Chip.Label></Chip>
                    </Card.Header>
                    <Separator />
                    <Card.Content className="flex flex-col gap-2.5 p-4">
                        {spendBySource.length === 0 ? (
                            <div className="py-10 text-center text-muted text-[10px] font-black tracking-widest">NO SPEND DATA</div>
                        ) : spendBySource.map((s, i) => {
                            const pct = totalExpense ? Math.round((s.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold">{s.source}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-accent">${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            <span className="text-[10px] font-semibold text-muted w-8 text-right">{pct}%</span>
                                        </div>
                                    </div>
                                    <Meter aria-label={`${s.source} share`} value={pct} color="accent" size="sm">
                                        <Meter.Track className="h-1">
                                            <Meter.Fill />
                                        </Meter.Track>
                                    </Meter>
                                </div>
                            );
                        })}
                    </Card.Content>
                </Card>
            </div>

            <Separator />

            {/* ── Toolbar ── */}
            <div className="flex items-center flex-wrap gap-3">
                <SearchField
                    aria-label="Search earnings"
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="flex-1 min-w-[180px] max-w-xs"
                >
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Search earnings..." />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>
                <AdvancedFilter
                    fields={EARNINGS_FILTER_FIELDS}
                    values={advancedFilters}
                    onChange={setAdvancedFilters}
                    onReset={() => setAdvancedFilters(DEFAULT_EARNINGS_FILTERS)}
                    activeFilterCount={activeFilterCount}
                />
                <div className="flex items-center gap-2 ml-auto">
                    <ExportButtons
                        data={filteredEarnings}
                        columns={earningsExportColumns}
                        filename="earnings-export"
                        title="Earnings Report"
                    />
                    <Button
                        variant={showAdd && !editingId ? 'secondary' : 'primary'}
                        onPress={() => { setEditingId(null); setForm(defaultForm()); setShowAdd(!showAdd); }}
                    >
                        {showAdd && !editingId ? 'CANCEL' : <><Plus size={14} /> ADD EARNING</>}
                    </Button>
                </div>
            </div>

            {/* ── Add/Edit Form ── */}
            {showAdd && (
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xs font-black tracking-widest" style={{ color: editingId ? 'var(--accent)' : undefined }}>
                            {editingId ? 'EDITING EARNING RECORD' : 'NEW EARNING RECORD'}
                        </Card.Title>
                    </Card.Header>
                    <Separator />
                    <Card.Content className="p-4">
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">CONTRACT (RELEASE + ARTIST)</label>
                                <select
                                    value={form.contractId}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, contractId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground"
                                >
                                    <option value="">Select Contract...</option>
                                    {contracts.map((c) => {
                                        const releaseName = c.release?.name || c.title || 'Untitled Release';
                                        const artistName = c.artist?.name || c.user?.stageName || c.user?.fullName || c.primaryArtistName || 'Unknown Artist';
                                        return <option key={c.id} value={c.id}>{releaseName} - {artistName}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">PERIOD (YYYY-MM)</label>
                                <Input aria-label="Period" type="month" value={form.period} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, period: e.target.value })} required fullWidth />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">GROSS AMOUNT ($)</label>
                                <Input aria-label="Gross amount" type="number" step="0.01" required value={form.grossAmount} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, grossAmount: e.target.value })} fullWidth />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">AD SPEND / EXPENSES ($)</label>
                                <Input aria-label="Expense amount" type="number" step="0.01" value={form.expenseAmount} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, expenseAmount: e.target.value })} fullWidth />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">STREAMS (OPTIONAL)</label>
                                <Input aria-label="Streams" type="number" value={form.streams} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, streams: e.target.value })} fullWidth />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2">SOURCE</label>
                                <select
                                    value={form.source}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, source: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground"
                                >
                                    <option value="spotify">Spotify</option>
                                    <option value="apple">Apple Music</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="ad_revenue">Ad Revenue (Meta/TikTok/etc)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex gap-2 justify-end pt-2">
                                <Button type="button" variant="secondary" onPress={() => setShowAdd(false)}>CANCEL</Button>
                                <Button type="submit" variant="primary" isDisabled={saving}>
                                    {saving ? 'SAVING...' : (editingId ? 'UPDATE' : 'ADD RECORD')}
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            )}

            {/* ���─ Earnings Table ── */}
            <Table aria-label="Earnings Table">
                <Table.ScrollContainer>
                    <Table.Content className="min-w-[900px]" selectionMode="none">
                        <Table.Header>
                            <Table.Column isRowHeader id="period">PERIOD</Table.Column>
                            <Table.Column id="release">RELEASE / ARTIST</Table.Column>
                            <Table.Column id="gross">GROSS</Table.Column>
                            <Table.Column id="expenses">EXPENSES</Table.Column>
                            <Table.Column id="artistpay">ARTIST PAY</Table.Column>
                            <Table.Column id="streams">STREAMS</Table.Column>
                            <Table.Column id="source">SOURCE</Table.Column>
                            <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={filteredEarnings}
                            renderEmptyState={() => (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <p className="text-muted text-xs font-bold tracking-widest uppercase">NO RECORD FOUND</p>
                                </div>
                            )}
                        >
                            {(e: Earning) => (
                                <Table.Row key={e.id} id={e.id}>
                                    <Table.Cell>
                                        <span className="text-xs text-muted font-black">{e.period}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black">{e.contract?.release?.name || e.contract?.title || 'Untitled'}</span>
                                            <span className="text-[10px] text-muted font-semibold">{e.contract?.user?.stageName || e.contract?.primaryArtistName}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs font-black">${(e.grossAmount || 0).toLocaleString()}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs font-black text-danger">${(e.expenseAmount || 0).toLocaleString()}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft" color="success">
                                            <Chip.Label>${(e.artistAmount || 0).toLocaleString()}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs text-muted font-semibold">{e.streams ? e.streams.toLocaleString() : '--'}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft">
                                            <Chip.Label>{(e.source || 'spotify').toUpperCase()}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="sm" variant="ghost" isIconOnly aria-label="Edit" onPress={() => handleEdit(e)}><Edit size={14} /></Button>
                                            <Button size="sm" variant="ghost" isIconOnly aria-label="Delete" className="text-danger hover:bg-danger/10" onPress={() => handleDelete(e.id)}><Trash2 size={14} /></Button>
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
