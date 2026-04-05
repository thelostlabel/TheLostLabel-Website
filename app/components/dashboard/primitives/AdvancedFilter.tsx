"use client";
import { useState, useMemo, useCallback, useEffect, ChangeEvent } from 'react';
import { SlidersHorizontal, X, Save, Bookmark, Trash2 } from 'lucide-react';
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
    /** Unique key for storing filter presets in localStorage */
    presetKey?: string;
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

type FilterPreset = { name: string; values: Record<string, any> };

function useFilterPresets(presetKey?: string) {
    const storageKey = presetKey ? `filter-presets-${presetKey}` : null;
    const [presets, setPresets] = useState<FilterPreset[]>([]);

    useEffect(() => {
        if (!storageKey) return;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setPresets(JSON.parse(stored));
        } catch { /* ignore */ }
    }, [storageKey]);

    const save = useCallback((name: string, values: Record<string, any>) => {
        if (!storageKey) return;
        const next = [...presets.filter((p) => p.name !== name), { name, values }];
        setPresets(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
    }, [storageKey, presets]);

    const remove = useCallback((name: string) => {
        if (!storageKey) return;
        const next = presets.filter((p) => p.name !== name);
        setPresets(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
    }, [storageKey, presets]);

    return { presets, save, remove };
}

export default function AdvancedFilter({
    fields,
    values,
    onChange,
    onReset,
    activeFilterCount = 0,
    presetKey,
}: AdvancedFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [showPresetInput, setShowPresetInput] = useState(false);
    const { presets, save: savePreset, remove: removePreset } = useFilterPresets(presetKey);

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
                            {/* Filter presets */}
                            {presetKey && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {presets.map((preset) => (
                                            <span key={preset.name} className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onChange(preset.values)}
                                                    className="border-0 bg-transparent text-[9px] font-black tracking-wider text-foreground/60 hover:text-foreground cursor-pointer"
                                                >
                                                    <Bookmark size={10} className="inline mr-1" />
                                                    {preset.name.toUpperCase()}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removePreset(preset.name)}
                                                    className="border-0 bg-transparent text-white/20 hover:text-red-400 cursor-pointer p-0"
                                                    aria-label={`Delete preset ${preset.name}`}
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        {!showPresetInput ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onPress={() => setShowPresetInput(true)}
                                                className="text-[9px] font-black tracking-widest gap-1"
                                                isDisabled={activeFilterCount === 0}
                                            >
                                                <Save size={10} />
                                                SAVE PRESET
                                            </Button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={presetName}
                                                    onChange={(e) => setPresetName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && presetName.trim()) {
                                                            savePreset(presetName.trim(), values);
                                                            setPresetName('');
                                                            setShowPresetInput(false);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setShowPresetInput(false);
                                                            setPresetName('');
                                                        }
                                                    }}
                                                    placeholder="Preset name..."
                                                    className="h-7 w-28 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[10px] font-bold text-foreground outline-none"
                                                    autoFocus
                                                />
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onPress={() => {
                                                        if (presetName.trim()) {
                                                            savePreset(presetName.trim(), values);
                                                            setPresetName('');
                                                            setShowPresetInput(false);
                                                        }
                                                    }}
                                                    className="text-[9px] font-black h-7"
                                                >
                                                    SAVE
                                                </Button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

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
