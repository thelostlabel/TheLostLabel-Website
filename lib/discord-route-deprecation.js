const loggedRoutes = new Set();

export function logDeprecatedDiscordRoute(aliasPath, canonicalPath) {
    const key = `${aliasPath}:${canonicalPath}`;
    if (loggedRoutes.has(key)) return;
    loggedRoutes.add(key);
    console.warn(`[Discord API] Deprecated internal route used: ${aliasPath}. Use ${canonicalPath} instead.`);
}
