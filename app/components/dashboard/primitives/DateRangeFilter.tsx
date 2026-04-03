"use client";
import { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRange {
    start: Date | null;
    end: Date | null;
}

interface DateRangeFilterProps {
    onChange: (range: DateRange) => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Helper: filter an array by a date field against a range
// ---------------------------------------------------------------------------

export function filterByDateRange<T>(
    items: T[],
    dateKey: keyof T,
    range: DateRange,
): T[] {
    const { start, end } = range;
    if (!start && !end) return items;

    return items.filter((item) => {
        const raw = item[dateKey];
        if (raw == null) return false;

        // Support both ISO strings and "YYYY-MM" period strings
        const str = String(raw);
        const date = str.length === 7
            ? new Date(`${str}-01T00:00:00`)
            : new Date(str);

        if (isNaN(date.getTime())) return false;

        if (start && date < start) return false;
        if (end) {
            // Include the entire end day
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (date > endOfDay) return false;
        }

        return true;
    });
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

interface Preset {
    label: string;
    shortLabel: string;
    getRange: () => DateRange;
}

function buildPresets(): Preset[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
        {
            label: 'Last 7 days',
            shortLabel: '7D',
            getRange: () => {
                const start = new Date(today);
                start.setDate(start.getDate() - 7);
                return { start, end: today };
            },
        },
        {
            label: 'Last 30 days',
            shortLabel: '30D',
            getRange: () => {
                const start = new Date(today);
                start.setDate(start.getDate() - 30);
                return { start, end: today };
            },
        },
        {
            label: 'This month',
            shortLabel: 'MONTH',
            getRange: () => ({
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: today,
            }),
        },
        {
            label: 'Last month',
            shortLabel: 'PREV',
            getRange: () => ({
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0),
            }),
        },
        {
            label: 'This year',
            shortLabel: 'YEAR',
            getRange: () => ({
                start: new Date(now.getFullYear(), 0, 1),
                end: today,
            }),
        },
        {
            label: 'All time',
            shortLabel: 'ALL',
            getRange: () => ({ start: null, end: null }),
        },
    ];
}

// ---------------------------------------------------------------------------
// Format a Date as YYYY-MM-DD for the native date input
// ---------------------------------------------------------------------------

function toInputValue(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DateRangeFilter({ onChange, className = '' }: DateRangeFilterProps) {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [activePreset, setActivePreset] = useState<string>('ALL');
    const presets = buildPresets();

    const update = useCallback(
        (next: DateRange, presetLabel?: string) => {
            setRange(next);
            setActivePreset(presetLabel ?? '');
            onChange(next);
        },
        [onChange],
    );

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const next: DateRange = {
            start: val ? new Date(`${val}T00:00:00`) : null,
            end: range.end,
        };
        update(next);
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const next: DateRange = {
            start: range.start,
            end: val ? new Date(`${val}T00:00:00`) : null,
        };
        update(next);
    };

    const handlePresetChange = (keys: Set<string | number>) => {
        const key = [...keys][0] as string | undefined;
        if (!key) return;
        const preset = presets.find((p) => p.shortLabel === key);
        if (preset) update(preset.getRange(), preset.shortLabel);
    };

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted shrink-0" />
                <input
                    type="date"
                    aria-label="Start date"
                    value={toInputValue(range.start)}
                    onChange={handleStartChange}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[10px] font-black text-muted">&mdash;</span>
                <input
                    type="date"
                    aria-label="End date"
                    value={toInputValue(range.end)}
                    onChange={handleEndChange}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>
            <div className="overflow-x-auto">
                <ToggleButtonGroup
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([activePreset])}
                    onSelectionChange={handlePresetChange as (keys: Set<string | number>) => void}
                    size="sm"
                >
                    {presets.map((p, i) => (
                        <ToggleButton
                            key={p.shortLabel}
                            id={p.shortLabel}
                            aria-label={p.label}
                            className="text-[10px] font-black tracking-wide px-2 min-w-0"
                        >
                            {i > 0 && <ToggleButtonGroup.Separator />}
                            {p.shortLabel}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
        </div>
    );
}
