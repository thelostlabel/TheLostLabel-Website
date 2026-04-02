"use client";
import { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input } from '@heroui/react';
import { getFilterLabel } from '@/app/components/dashboard/lib/filter-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'daterange' | 'number-range';
    options?: Array<{ id: string; label: string }>;
    placeholder?: string;
}

export interface AdvancedFilterProps {
    fields: FilterField[];
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    onReset: () => void;
    activeFilterCount?: number;
}

// ---------------------------------------------------------------------------
// Field renderers
// ---------------------------------------------------------------------------

function TextFilterField({
    field,
    value,
    onFieldChange,
}: {
    field: FilterField;
    value: string;
    onFieldChange: (key: string, value: unknown) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-muted font-black tracking-widest">{field.label}</label>
            <Input
                aria-label={field.label}
                placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
                value={value || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange(field.key, e.target.value)}
                fullWidth
            />
        </div>
    );
}

function SelectFilterField({
    field,
    value,
    onFieldChange,
}: {
    field: FilterField;
    value: string;
    onFieldChange: (key: string, value: unknown) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-muted font-black tracking-widest">{field.label}</label>
            <select
                value={value || 'all'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onFieldChange(field.key, e.target.value === 'all' ? '' : e.target.value)
                }
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
                <option value="all">ALL</option>
                {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function DateFilterField({
    field,
    value,
    onFieldChange,
}: {
    field: FilterField;
    value: string;
    onFieldChange: (key: string, value: unknown) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-muted font-black tracking-widest">{field.label}</label>
            <input
                type="date"
                aria-label={field.label}
                value={value || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange(field.key, e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
        </div>
    );
}

function DateRangeFilterField({
    field,
    value,
    onFieldChange,
}: {
    field: FilterField;
    value: { start?: string; end?: string };
    onFieldChange: (key: string, value: unknown) => void;
}) {
    const current = value || { start: '', end: '' };
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-muted font-black tracking-widest">{field.label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    aria-label={`${field.label} start`}
                    value={current.start || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onFieldChange(field.key, { ...current, start: e.target.value })
                    }
                    className="flex-1 px-2.5 py-2.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[10px] font-black text-muted">&mdash;</span>
                <input
                    type="date"
                    aria-label={`${field.label} end`}
                    value={current.end || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onFieldChange(field.key, { ...current, end: e.target.value })
                    }
                    className="flex-1 px-2.5 py-2.5 bg-surface border border-border rounded-lg text-xs font-black text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>
        </div>
    );
}

function NumberRangeFilterField({
    field,
    value,
    onFieldChange,
}: {
    field: FilterField;
    value: { min?: string; max?: string };
    onFieldChange: (key: string, value: unknown) => void;
}) {
    const current = value || { min: '', max: '' };
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-muted font-black tracking-widest">{field.label}</label>
            <div className="flex items-center gap-2">
                <Input
                    aria-label={`${field.label} min`}
                    type="number"
                    placeholder={field.placeholder || 'Min'}
                    value={current.min || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onFieldChange(field.key, { ...current, min: e.target.value })
                    }
                    fullWidth
                />
                <span className="text-[10px] font-black text-muted">&mdash;</span>
                <Input
                    aria-label={`${field.label} max`}
                    type="number"
                    placeholder="Max"
                    value={current.max || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onFieldChange(field.key, { ...current, max: e.target.value })
                    }
                    fullWidth
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdvancedFilter({
    fields,
    values,
    onChange,
    onReset,
    activeFilterCount = 0,
}: AdvancedFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleFieldChange = useCallback(
        (key: string, value: unknown) => {
            onChange({ ...values, [key]: value });
        },
        [values, onChange],
    );

    const handleRemoveFilter = useCallback(
        (key: string) => {
            const field = fields.find((f) => f.key === key);
            if (!field) return;
            const next = { ...values };
            if (field.type === 'daterange') {
                next[key] = { start: '', end: '' };
            } else if (field.type === 'number-range') {
                next[key] = { min: '', max: '' };
            } else {
                next[key] = '';
            }
            onChange(next);
        },
        [values, fields, onChange],
    );

    const activeChips = useMemo(() => {
        const chips: Array<{ key: string; label: string }> = [];
        for (const field of fields) {
            const val = values[field.key];
            const label = getFilterLabel(field.key, val, field.label, field.options);
            if (label) chips.push({ key: field.key, label });
        }
        return chips;
    }, [fields, values]);

    const renderField = (field: FilterField) => {
        switch (field.type) {
            case 'text':
                return <TextFilterField field={field} value={values[field.key]} onFieldChange={handleFieldChange} />;
            case 'select':
                return <SelectFilterField field={field} value={values[field.key]} onFieldChange={handleFieldChange} />;
            case 'date':
                return <DateFilterField field={field} value={values[field.key]} onFieldChange={handleFieldChange} />;
            case 'daterange':
                return <DateRangeFilterField field={field} value={values[field.key]} onFieldChange={handleFieldChange} />;
            case 'number-range':
                return <NumberRangeFilterField field={field} value={values[field.key]} onFieldChange={handleFieldChange} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Toggle button + active filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant={isOpen ? 'secondary' : 'ghost'}
                    size="sm"
                    onPress={() => setIsOpen(!isOpen)}
                    className="gap-1.5"
                >
                    <SlidersHorizontal size={14} />
                    <span className="text-[10px] font-black tracking-widest">FILTERS</span>
                    {activeFilterCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center size-5 rounded-full bg-accent text-background text-[9px] font-black">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>

                {/* Active filter chips */}
                {activeChips.map((chip) => (
                    <span key={chip.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
                        <span className="text-[9px] font-black tracking-wider text-accent">
                            {chip.label.toUpperCase()}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleRemoveFilter(chip.key)}
                            className="inline-flex items-center justify-center size-3.5 rounded-full hover:bg-accent/20 text-accent transition-colors"
                            aria-label={`Remove ${chip.label} filter`}
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}

                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onPress={onReset}
                        className="text-[10px] font-black tracking-widest text-muted hover:text-foreground"
                    >
                        CLEAR ALL
                    </Button>
                )}
            </div>

            {/* Collapsible filter panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border border-border rounded-xl p-5 bg-surface/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {fields.map((field) => (
                                    <div key={field.key}>{renderField(field)}</div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onPress={onReset}
                                    className="text-[10px] font-black tracking-widest"
                                >
                                    <X size={12} />
                                    RESET
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onPress={() => setIsOpen(false)}
                                    className="text-[10px] font-black tracking-widest"
                                >
                                    DONE
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
