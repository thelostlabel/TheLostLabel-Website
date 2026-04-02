"use client";
import { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@heroui/react';

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
            shortLabel: '7d',
            getRange: () => {
                const start = new Date(today);
                start.setDate(start.getDate() - 7);
                return { start, end: today };
            },
        },
        {
            label: 'Last 30 days',
            shortLabel: '30d',
            getRange: () => {
                const start = new Date(today);
                start.setDate(start.getDate() - 30);
                return { start, end: today };
            },
        },
        {
            label: 'This month',
            shortLabel: 'Month',
            getRange: () => ({
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: today,
            }),
        },
        {
            label: 'Last month',
            shortLabel: 'Prev',
            getRange: () => ({
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0),
            }),
        },
        {
            label: 'This year',
            shortLabel: 'Year',
            getRange: () => ({
                start: new Date(now.getFullYear(), 0, 1),
                end: today,
            }),
        },
        {
            label: 'All time',
            shortLabel: 'All',
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
    const [activePreset, setActivePreset] = useState<string>('All');
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

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center gap-2 flex-wrap">
                <Calendar size={14} className="text-muted shrink-0" />
                <input
                    type="date"
                    aria-label="Start date"
                    value={toInputValue(range.start)}
                    onChange={handleStartChange}
                    className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[10px] font-black text-muted">&mdash;</span>
                <input
                    type="date"
                    aria-label="End date"
                    value={toInputValue(range.end)}
                    onChange={handleEndChange}
                    className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="flex items-center gap-1 ml-1">
                    {presets.map((p) => (
                        <Button
                            key={p.shortLabel}
                            size="sm"
                            variant={activePreset === p.shortLabel ? 'secondary' : 'ghost'}
                            onPress={() => update(p.getRange(), p.shortLabel)}
                            className="text-[10px] font-black tracking-wide px-2 min-w-0"
                        >
                            {p.shortLabel.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
