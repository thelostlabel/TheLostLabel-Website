export const BRAND_PRESETS = {
    lost: {
        name: "LOST",
        fullName: "THE LOST LABEL",
        tagline: "FOR THE UNFOUND.",
        primaryColor: "#ffffff",
        primaryLight: "#ffffff",
        primaryDim: "rgba(255, 255, 255, 0.15)",
        primaryFaint: "rgba(255, 255, 255, 0.08)",
        primaryGlow: "rgba(255, 255, 255, 0.35)",
        accentColor: "#e5e7eb",
        bgColor: "#050505",
        surfaceColor: "#0a0a0c",
        borderColor: "rgba(255, 255, 255, 0.08)",
        features: {
            demoSubmission: true,
            earningsTracking: true,
            contractManagement: true,
            artistSupport: true,
            socialIntegration: true,
            spotifySync: true
        }
    }
};

export const BRAND = BRAND_PRESETS.lost;
export const FEATURE_FLAGS = BRAND.features;

export function hasFeature(featureName) {
    if (typeof window !== "undefined" && window.__BRAND_DYNAMIC_FEATURES) {
        return Boolean(window.__BRAND_DYNAMIC_FEATURES[featureName]);
    }
    return Boolean(FEATURE_FLAGS[featureName]);
}

export function hydrateBrand(dbConfig) {
    if (!dbConfig) return BRAND;
    const dynamicFeatures = { ...BRAND.features, ...(dbConfig.features || {}) };
    return {
        ...BRAND,
        name: dbConfig.siteName || BRAND.name,
        fullName: dbConfig.siteName || BRAND.fullName,
        tagline: dbConfig.tagline || BRAND.tagline,
        supportEmail: dbConfig.supportEmail || BRAND.supportEmail,
        demoEmail: dbConfig.demoEmail || BRAND.demoEmail,
        features: dynamicFeatures,
        theme: dbConfig.theme || {},
        spotifyPlaylists: dbConfig.spotifyPlaylists || BRAND.spotifyPlaylists || [],
    };
}

export const BRAND_THEME_VARS = {
    "--primary": BRAND.primaryColor,
    "--primary-light": BRAND.primaryLight,
    "--primary-dim": BRAND.primaryDim,
    "--primary-faint": BRAND.primaryFaint,
    "--primary-glow": BRAND.primaryGlow,
    "--accent": BRAND.accentColor,
    "--bg": BRAND.bgColor,
    "--bg-surface": BRAND.surfaceColor,
    "--border": BRAND.borderColor,
};
