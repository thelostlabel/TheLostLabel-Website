"use client";
import { useEffect } from "react";

/**
 * Syncs database-driven settings/features into the client-side global state and CSS variables.
 */
export default function BrandHydrator({ dbConfig }) {
    useEffect(() => {
        if (!dbConfig) return;

        // Sync features into global window variable for hasFeature() to find
        if (dbConfig.features) {
            window.__BRAND_DYNAMIC_FEATURES = dbConfig.features;
        }

        // Sync theme colors into CSS variables
        if (dbConfig.theme) {
            const root = document.documentElement;
            const theme = dbConfig.theme;

            if (theme.primaryColor) root.style.setProperty("--primary", theme.primaryColor);
            if (theme.bgColor) root.style.setProperty("--bg", theme.bgColor);
            if (theme.accentColor) root.style.setProperty("--accent", theme.accentColor);
            if (theme.surfaceColor) root.style.setProperty("--bg-surface", theme.surfaceColor);
            if (theme.borderColor) root.style.setProperty("--border", theme.borderColor);

            // Re-derive light/dim variants
            if (theme.primaryColor) {
                root.style.setProperty("--primary-dim", theme.primaryColor + "22");
                root.style.setProperty("--primary-faint", theme.primaryColor + "12");
                root.style.setProperty("--primary-glow", theme.primaryColor + "55");
            }
        }
    }, [dbConfig]);

    return null;
}
