// ---------------------------------------------------------------------------
// Generic client-side filtering utilities for admin views
// ---------------------------------------------------------------------------

export interface FilterFieldConfig {
    key: string;
    type: 'text' | 'select' | 'date' | 'daterange' | 'number-range';
    /** For text search: list of dot-separated paths to search across */
    searchFields?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a dot-separated path on an object, e.g. "user.stageName" */
function getNestedValue(obj: unknown, path: string): unknown {
    let current: unknown = obj;
    for (const segment of path.split('.')) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[segment];
    }
    return current;
}

/** Parse a date string, supporting both ISO and YYYY-MM period formats */
function parseDate(raw: unknown): Date | null {
    if (raw == null) return null;
    const str = String(raw);
    const date = str.length === 7
        ? new Date(`${str}-01T00:00:00`)
        : new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

// ---------------------------------------------------------------------------
// Main filter function
// ---------------------------------------------------------------------------

export function applyFilters<T>(
    items: T[],
    filters: Record<string, unknown>,
    fieldConfigs: FilterFieldConfig[],
): T[] {
    // Build a lookup for quick access
    const configMap = new Map(fieldConfigs.map((c) => [c.key, c]));

    return items.filter((item) => {
        for (const [key, value] of Object.entries(filters)) {
            // Skip empty / null / undefined filters
            if (value == null || value === '' || value === 'all') continue;

            const config = configMap.get(key);
            if (!config) continue;

            switch (config.type) {
                case 'text': {
                    const needle = String(value).toLowerCase();
                    if (!needle) break;
                    const fields = config.searchFields ?? [key];
                    const matched = fields.some((path) => {
                        const v = getNestedValue(item, path);
                        return v != null && String(v).toLowerCase().includes(needle);
                    });
                    if (!matched) return false;
                    break;
                }

                case 'select': {
                    const target = String(value);
                    const actual = getNestedValue(item, key);
                    if (actual == null || String(actual) !== target) return false;
                    break;
                }

                case 'date': {
                    // value = ISO date string; match the item's date field to the same day
                    const filterDate = parseDate(value);
                    if (!filterDate) break;
                    const itemDate = parseDate(getNestedValue(item, key));
                    if (!itemDate) return false;
                    if (itemDate.toDateString() !== filterDate.toDateString()) return false;
                    break;
                }

                case 'daterange': {
                    const range = value as { start?: string | null; end?: string | null };
                    if (!range.start && !range.end) break;
                    const itemDate = parseDate(getNestedValue(item, key));
                    if (!itemDate) return false;
                    if (range.start) {
                        const start = parseDate(range.start);
                        if (start && itemDate < start) return false;
                    }
                    if (range.end) {
                        const end = parseDate(range.end);
                        if (end) {
                            const endOfDay = new Date(end);
                            endOfDay.setHours(23, 59, 59, 999);
                            if (itemDate > endOfDay) return false;
                        }
                    }
                    break;
                }

                case 'number-range': {
                    const range = value as { min?: number | string | null; max?: number | string | null };
                    if (range.min == null && range.max == null) break;
                    if (range.min === '' && range.max === '') break;
                    const raw = getNestedValue(item, key);
                    const num = Number(raw);
                    if (raw == null || isNaN(num)) return false;
                    if (range.min != null && range.min !== '' && num < Number(range.min)) return false;
                    if (range.max != null && range.max !== '' && num > Number(range.max)) return false;
                    break;
                }
            }
        }

        return true;
    });
}

// ---------------------------------------------------------------------------
// Count active filters (non-empty values)
// ---------------------------------------------------------------------------

export function countActiveFilters(filters: Record<string, unknown>): number {
    let count = 0;
    for (const value of Object.values(filters)) {
        if (value == null || value === '' || value === 'all') continue;
        if (typeof value === 'object') {
            const obj = value as Record<string, unknown>;
            // daterange: check start/end; number-range: check min/max
            const hasValue = Object.values(obj).some((v) => v != null && v !== '');
            if (hasValue) count++;
        } else {
            count++;
        }
    }
    return count;
}

/** Get a human-readable label for an active filter value */
export function getFilterLabel(
    key: string,
    value: unknown,
    fieldLabel: string,
    options?: Array<{ id: string; label: string }>,
): string | null {
    if (value == null || value === '' || value === 'all') return null;

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if ('start' in obj || 'end' in obj) {
            const parts: string[] = [];
            if (obj.start) parts.push(`from ${String(obj.start).slice(0, 10)}`);
            if (obj.end) parts.push(`to ${String(obj.end).slice(0, 10)}`);
            return parts.length > 0 ? `${fieldLabel}: ${parts.join(' ')}` : null;
        }
        if ('min' in obj || 'max' in obj) {
            const parts: string[] = [];
            if (obj.min != null && obj.min !== '') parts.push(`min ${obj.min}`);
            if (obj.max != null && obj.max !== '') parts.push(`max ${obj.max}`);
            return parts.length > 0 ? `${fieldLabel}: ${parts.join(' - ')}` : null;
        }
        return null;
    }

    if (options) {
        const opt = options.find((o) => o.id === String(value));
        if (opt) return `${fieldLabel}: ${opt.label}`;
    }

    return `${fieldLabel}: ${String(value)}`;
}
