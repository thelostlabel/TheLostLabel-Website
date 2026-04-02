"use client";
import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Button, Input, Table, Chip, Card, ProgressBar, Label, Tooltip } from '@heroui/react';
import ExportButtons from '@/app/components/dashboard/primitives/ExportButtons';
import type { ExportColumn } from '@/app/components/dashboard/lib/export-utils';
import AdvancedFilter, { type FilterField } from '@/app/components/dashboard/primitives/AdvancedFilter';
import { applyFilters, countActiveFilters, type FilterFieldConfig } from '@/app/components/dashboard/lib/filter-utils';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

interface EarningRelease {
    name?: string;
    /** fallback title sometimes present on the contract itself */
    title?: string;
}

interface EarningUser {
    stageName?: string;
    fullName?: string;
}

interface EarningContract {
    release?: EarningRelease;
    /** title may be present directly on the contract */
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
    /** release object if joined */
    release?: { name?: string };
    /** flat title fallback */
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
// Aggregation types
// ---------------------------------------------------------------------------

interface SpendByRelease {
    name: string;
    spend: number;
    revenue: number;
}

interface SpendBySource {
    source: string;
    spend: number;
    streams: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
    {
        key: 'search',
        label: 'SEARCH',
        type: 'text',
        placeholder: 'Search by artist, release or period...',
    },
    {
        key: 'period',
        label: 'PERIOD',
        type: 'daterange',
    },
    {
        key: 'source',
        label: 'SOURCE',
        type: 'select',
        options: EARNINGS_SOURCE_OPTIONS,
    },
    {
        key: 'grossAmount',
        label: 'GROSS AMOUNT ($)',
        type: 'number-range',
    },
];

const EARNINGS_FILTER_CONFIGS: FilterFieldConfig[] = [
    {
        key: 'search',
        type: 'text',
        searchFields: [
            'contract.release.name',
            'contract.title',
            'contract.user.stageName',
            'contract.user.fullName',
            'contract.primaryArtistName',
            'period',
        ],
    },
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

export default function EarningsView({ earnings, contracts, onRefresh }: EarningsViewProps) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(DEFAULT_EARNINGS_FILTERS);

    const [form, setForm] = useState<EarningForm>(defaultForm());

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const activeFilterCount = useMemo(() => countActiveFilters(advancedFilters), [advancedFilters]);

    const filteredEarnings = useMemo<Earning[]>(() => {
        // First apply quick search bar
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
        // Then apply advanced filters
        return applyFilters(result, advancedFilters, EARNINGS_FILTER_CONFIGS);
    }, [earnings, debouncedSearch, advancedFilters]);

    const handleAdd = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/earnings/${editingId}` : '/api/earnings';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
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
        } catch (e) {
            console.error(e);
            showToast("Error saving earning", "error");
        } finally { setSaving(false); }
    };

    const handleEdit = (earning: Earning): void => {
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

    const handleDelete = (id: string): void => {
        showConfirm(
            "DELETE RECORD?",
            "Are you sure you want to delete this earning record? This cannot be undone.",
            async () => {
                try {
                    const res = await fetch(`/api/earnings/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Failed to delete", "error");
                    }
                } catch (e) { showToast("Error deleting", "error"); }
            }
        );
    };

    const totalGross = earnings.reduce((sum, e) => sum + (e.grossAmount || 0), 0);
    const totalArtist = earnings.reduce((sum, e) => sum + (e.artistAmount || 0), 0);
    const totalLabel = earnings.reduce((sum, e) => sum + (e.labelAmount || 0), 0);
    const totalExpense = earnings.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
    const spendRatio = totalGross ? Math.round((totalExpense / totalGross) * 100) : 0;
    const artistRatio = totalGross ? Math.round((totalArtist / totalGross) * 100) : 0;
    const labelRatio = totalGross ? Math.round((totalLabel / totalGross) * 100) : 0;
    const trackedSources = new Set(earnings.map((e) => String(e.source || 'spotify').toUpperCase())).size;

    const formatCurrency = (value: number | string | undefined): string =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(Number(value || 0));

    const spendByRelease: SpendByRelease[] = Object.values(
        earnings.reduce<Record<string, SpendByRelease>>((acc, e) => {
            const key = e.contract?.release?.name || 'Unknown';
            acc[key] = acc[key] || { name: key, spend: 0, revenue: 0 };
            acc[key].spend += e.expenseAmount || 0;
            acc[key].revenue += e.labelAmount || 0;
            return acc;
        }, {})
    ).sort((a, b) => b.spend - a.spend).slice(0, 5);

    const spendBySource: SpendBySource[] = Object.values(
        earnings.reduce<Record<string, SpendBySource>>((acc, e) => {
            const key = (e.source || 'OTHER').toUpperCase();
            acc[key] = acc[key] || { source: key, spend: 0, streams: 0 };
            acc[key].spend += e.expenseAmount || 0;
            acc[key].streams += e.streams || 0;
            return acc;
        }, {})
    ).sort((a, b) => b.spend - a.spend).slice(0, 6);

    interface StatCard {
        key: string;
        eyebrow: string;
        title: string;
        description: string;
        value: string;
        footnote: string;
        accent?: boolean;
    }

    const statCards: StatCard[] = [
        {
            key: 'gross',
            eyebrow: 'TOPLINE',
            title: 'Gross Revenue',
            description: `${earnings.length} earning records across ${contracts.length} contracts`,
            value: formatCurrency(totalGross),
            footnote: 'All reported royalty income before deductions',
        },
        {
            key: 'spend',
            eyebrow: 'COST',
            title: 'Ad Spend / Expenses',
            description: `${spendRatio}% of gross allocated to acquisition or costs`,
            value: formatCurrency(totalExpense),
            footnote: `${trackedSources} tracked source${trackedSources === 1 ? '' : 's'}`,
        },
        {
            key: 'artist',
            eyebrow: 'DISTRIBUTION',
            title: 'Artist Payouts',
            description: `${artistRatio}% of gross distributed to artists`,
            value: formatCurrency(totalArtist),
            footnote: 'Calculated from contract artist shares',
        },
        {
            key: 'label',
            eyebrow: 'NET',
            title: 'Label Net Earnings',
            description: `${labelRatio}% of gross retained after spend`,
            value: formatCurrency(totalLabel),
            footnote: 'Label share net of recorded expenses',
            accent: true,
        },
    ];

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

    return (
        <div className="flex flex-col gap-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.key} variant={stat.accent ? 'secondary' : 'default'}>
                        <Card.Header className="gap-1 p-4 pb-2">
                            <Card.Description className="text-[9px] font-black tracking-[0.18em] uppercase text-muted">
                                {stat.eyebrow}
                            </Card.Description>
                            <Card.Title className="text-sm font-black tracking-wide">
                                {stat.title}
                            </Card.Title>
                            <Card.Description className="text-[11px] leading-5 text-muted">
                                {stat.description}
                            </Card.Description>
                        </Card.Header>
                        <Card.Content className="px-4 pb-3">
                            <div className={`text-2xl font-black tracking-tight ${stat.accent ? 'text-accent' : 'text-foreground'}`}>
                                {stat.value}
                            </div>
                        </Card.Content>
                        <Card.Footer className="px-4 pt-0 pb-4">
                            <span className="text-[10px] font-semibold text-muted">
                                {stat.footnote}
                            </span>
                        </Card.Footer>
                    </Card>
                ))}
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <Card.Header>
                        <Card.Title>TOP RELEASES BY AD SPEND</Card.Title>
                        <span className="text-[9px] text-muted font-black ml-auto">TOP 5</span>
                    </Card.Header>
                    <Card.Content className="flex flex-col gap-3">
                        {spendByRelease.map((r, i) => {
                            const pct = totalExpense ? Math.round((r.spend / totalExpense) * 100) : 0;
                            return (
                                <Card key={i} variant="secondary">
                                    <Card.Content className="gap-3 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <Card.Title className="text-xs font-black tracking-wide">
                                                {r.name.toUpperCase()}
                                            </Card.Title>
                                            <span className="text-sm font-black text-accent">
                                                ${r.spend.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-[9px] font-black text-muted">
                                            <span>REV: ${r.revenue.toLocaleString()}</span>
                                            <span>{pct}% OF SPEND</span>
                                        </div>

                                        <ProgressBar
                                            aria-label={`${r.name} ad spend share`}
                                            color="accent"
                                            size="sm"
                                            value={pct}
                                        >
                                            <Label className="sr-only">{r.name}</Label>
                                            <ProgressBar.Track className="h-1.5">
                                                <ProgressBar.Fill />
                                            </ProgressBar.Track>
                                        </ProgressBar>
                                    </Card.Content>
                                </Card>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div className="py-8 text-center text-muted text-xs font-black tracking-widest">NO SPEND DATA</div>
                        )}
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>SPEND BY SOURCE</Card.Title>
                        <span className="text-[9px] text-muted font-black ml-auto">TOP 6</span>
                    </Card.Header>
                    <Card.Content className="flex flex-col gap-2">
                        {spendBySource.map((s, i) => {
                            const pct = totalExpense ? Math.round((s.spend / totalExpense) * 100) : 0;
                            return (
                                <Card key={i} variant="secondary">
                                    <Card.Content className="gap-3 p-3">
                                        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_88px_48px]">
                                            <div className="font-black text-xs">{s.source}</div>
                                            <div className="text-accent font-black text-xs sm:text-right">
                                                ${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="text-[10px] font-black text-muted sm:text-right">{pct}%</div>
                                        </div>

                                        <ProgressBar
                                            aria-label={`${s.source} spend share`}
                                            color="accent"
                                            size="sm"
                                            value={pct}
                                        >
                                            <Label className="sr-only">{s.source}</Label>
                                            <ProgressBar.Track className="h-1">
                                                <ProgressBar.Fill />
                                            </ProgressBar.Track>
                                        </ProgressBar>
                                    </Card.Content>
                                </Card>
                            );
                        })}
                        {spendBySource.length === 0 && (
                            <div className="py-8 text-center text-muted text-xs font-black tracking-widest">NO SPEND DATA</div>
                        )}
                    </Card.Content>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center flex-wrap gap-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <Input
                        aria-label="Search earnings"
                        placeholder="SEARCH EARNINGS..."
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-9"
                        fullWidth
                    />
                </div>
                <ExportButtons
                    data={filteredEarnings}
                    columns={earningsExportColumns}
                    filename="earnings-export"
                    title="Earnings Report"
                />
                <Button
                    variant={showAdd && !editingId ? 'secondary' : 'primary'}
                    onPress={() => {
                        setEditingId(null);
                        setForm(defaultForm());
                        setShowAdd(!showAdd);
                    }}
                >
                    {showAdd && !editingId ? 'CANCEL ENTRY' : <><Plus size={14} /> ADD MANUAL EARNING</>}
                </Button>
            </div>
            <AdvancedFilter
                fields={EARNINGS_FILTER_FIELDS}
                values={advancedFilters}
                onChange={setAdvancedFilters}
                onReset={() => setAdvancedFilters(DEFAULT_EARNINGS_FILTERS)}
                activeFilterCount={activeFilterCount}
            />

            {/* Add/Edit Form */}
            {showAdd && (
                <div className="border border-border rounded-xl p-6">
                    <div className="text-xs font-black tracking-widest mb-4" style={{ color: editingId ? 'var(--accent)' : undefined }}>
                        {editingId ? 'EDITING EARNING RECORD' : 'NEW EARNING RECORD'}
                    </div>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] text-muted font-black tracking-widest block mb-2">CONTRACT (RELEASE + ARTIST)</label>
                            <select
                                value={form.contractId}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, contractId: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm text-foreground"
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
                                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm text-foreground"
                            >
                                <option value="spotify">Spotify</option>
                                <option value="apple">Apple Music</option>
                                <option value="youtube">YouTube</option>
                                <option value="ad_revenue">Ad Revenue (Meta/TikTok/etc)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-2.5 justify-end">
                            <Button type="button" variant="secondary" onPress={() => setShowAdd(false)}>CANCEL</Button>
                            <Button type="submit" variant="primary" isDisabled={saving}>
                                {saving ? 'SAVING...' : (editingId ? 'UPDATE RECORD' : 'ADD RECORD')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Earnings Table */}
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
                                            <span className="text-[10px] text-muted font-black">{e.contract?.user?.stageName || e.contract?.primaryArtistName}</span>
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
                                        <span className="text-xs text-muted font-black">{e.streams ? e.streams.toLocaleString() : '--'}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft">
                                            <Chip.Label>{(e.source || 'spotify').toUpperCase()}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Edit">
                                                <Button size="sm" variant="ghost" isIconOnly onPress={() => handleEdit(e)}><Edit size={14} /></Button>
                                            </Tooltip>
                                            <Tooltip content="Delete">
                                                <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:bg-danger/10" onPress={() => handleDelete(e.id)}><Trash2 size={14} /></Button>
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
