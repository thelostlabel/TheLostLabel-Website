import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import { useToast } from "@/app/components/ToastContext";
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from "./styles";

const EMPTY_CONFIG = {
    enabled: false,
    outboxEnabled: true,
    publicBaseUrl: "http://localhost:3000",
    oauthClientId: "",
    oauthClientSecret: "",
    oauthRedirectUri: "",
    internalToken: "",
    internalSigningSecret: "",
    defaultGuildId: "",
    supportChannelId: "",
    eventsChannelId: "",
    roleMap: { admin: "", "a&r": "", artist: "" },
    botRuntime: {
        personality: "helpful",
        visionAi: false,
        smartHelper: true,
        smartHelperMode: "questions_only",
        smartHelperKeywords: ["nasil yaparim", "hata aliyorum", "yardim", "help"],
        smartHelperBlockedKeywords: [],
        smartHelperRequireQuestion: true,
        agentMode: false
    }
};

const toCsv = (list) => (Array.isArray(list) ? list.join(", ") : "");
const fromCsv = (value) => String(value || "").split(",").map((i) => i.trim()).filter(Boolean);

function StatCard({ title, value, sub }) {
    return (
        <div style={{ ...glassStyle, padding: "18px" }}>
            <p style={{ margin: 0, fontSize: "10px", letterSpacing: "1.4px", fontWeight: 900, color: "#7a7a7a" }}>{title}</p>
            <p style={{ margin: "8px 0 0", fontSize: "26px", fontWeight: 900, color: "#fff" }}>{value}</p>
            {sub ? <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8f8f8f" }}>{sub}</p> : null}
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)"
        }}>
            <span style={{ fontSize: "11px", letterSpacing: "1px", fontWeight: 900, color: "#d4d4d4" }}>{label}</span>
            <input type="checkbox" checked={Boolean(checked)} onChange={onChange} style={{ accentColor: "#fff" }} />
        </label>
    );
}

export default function DiscordBridgeView({ data, onRefresh }) {
    const { showToast } = useToast();
    const [config, setConfig] = useState(EMPTY_CONFIG);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!data?.config) return;
        setConfig({
            ...EMPTY_CONFIG,
            ...data.config,
            roleMap: { ...EMPTY_CONFIG.roleMap, ...(data.config.roleMap || {}) },
            botRuntime: { ...EMPTY_CONFIG.botRuntime, ...(data.config.botRuntime || {}) }
        });
    }, [data]);

    const snapshot = data?.snapshot || {};
    const linkedUsers = snapshot?.linkedUsers || [];

    const statusLabel = useMemo(() => {
        if (!config.enabled) return "DISABLED";
        if (!config.internalToken || !config.internalSigningSecret) return "MISSING INTERNAL AUTH";
        if (!config.oauthClientId || !config.oauthClientSecret) return "MISSING OAUTH";
        return "READY";
    }, [config]);

    const saveConfig = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/discord-bridge", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config })
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to save configuration.");
            showToast("Discord bridge settings saved", "success");
            onRefresh?.();
        } catch (error) {
            showToast(error.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const panelTitleStyle = { margin: 0, fontSize: "10px", letterSpacing: "2px", fontWeight: 900, color: "#6f6f6f" };
    const panelLabelStyle = { margin: "0 0 10px", fontSize: "11px", letterSpacing: "1.3px", fontWeight: 900, color: "#b9b9b9" };

    return (
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ ...glassStyle, padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                    <p style={panelTitleStyle}>DISCORD BRIDGE CONTROL</p>
                    <h2 style={{ margin: "8px 0 0", fontSize: "22px", color: "#fff", fontWeight: 900, letterSpacing: "0.5px" }}>OAuth2 + Internal API + Runtime</h2>
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#909090", fontWeight: 700 }}>STATUS: {statusLabel}</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => onRefresh?.()} style={btnStyle}>
                        <RefreshCcw size={14} /> REFRESH
                    </button>
                    <button type="button" onClick={saveConfig} disabled={saving} style={{ ...btnStyle, background: "#fff", color: "#000", borderColor: "#fff", opacity: saving ? 0.65 : 1 }}>
                        <Save size={14} /> {saving ? "SAVING..." : "SAVE"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                <StatCard title="LINKED ACCOUNTS" value={snapshot?.counters?.linkedAccounts || 0} />
                <StatCard title="PENDING EVENTS" value={snapshot?.counters?.pendingOutbox || 0} sub="Outbox queue" />
                <StatCard title="ROLE SYNC QUEUE" value={snapshot?.counters?.pendingRoleSync || 0} />
                <StatCard title="BRIDGE" value={config.enabled ? "ON" : "OFF"} sub={config.outboxEnabled ? "Outbox active" : "Outbox disabled"} />
            </div>

            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))" }}>
                <section style={{ ...glassStyle, padding: "16px" }}>
                    <p style={panelLabelStyle}>CORE</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        <Toggle label="Bridge Enabled" checked={config.enabled} onChange={(e) => setConfig((p) => ({ ...p, enabled: e.target.checked }))} />
                        <Toggle label="Event Outbox Enabled" checked={config.outboxEnabled} onChange={(e) => setConfig((p) => ({ ...p, outboxEnabled: e.target.checked }))} />
                        <input style={inputStyle} placeholder="Public Base URL" value={config.publicBaseUrl || ""} onChange={(e) => setConfig((p) => ({ ...p, publicBaseUrl: e.target.value }))} />
                    </div>
                </section>

                <section style={{ ...glassStyle, padding: "16px" }}>
                    <p style={panelLabelStyle}>OAUTH2</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        <input style={inputStyle} placeholder="Discord Client ID" value={config.oauthClientId || ""} onChange={(e) => setConfig((p) => ({ ...p, oauthClientId: e.target.value }))} />
                        <input style={inputStyle} placeholder="Discord Client Secret" value={config.oauthClientSecret || ""} onChange={(e) => setConfig((p) => ({ ...p, oauthClientSecret: e.target.value }))} />
                        <input style={inputStyle} placeholder="OAuth Redirect URI" value={config.oauthRedirectUri || ""} onChange={(e) => setConfig((p) => ({ ...p, oauthRedirectUri: e.target.value }))} />
                    </div>
                </section>

                <section style={{ ...glassStyle, padding: "16px" }}>
                    <p style={panelLabelStyle}>INTERNAL API</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        <input style={inputStyle} placeholder="BOT_INTERNAL_TOKEN" value={config.internalToken || ""} onChange={(e) => setConfig((p) => ({ ...p, internalToken: e.target.value }))} />
                        <input style={inputStyle} placeholder="BOT_INTERNAL_SIGNING_SECRET" value={config.internalSigningSecret || ""} onChange={(e) => setConfig((p) => ({ ...p, internalSigningSecret: e.target.value }))} />
                        <input style={inputStyle} placeholder="Default Guild ID" value={config.defaultGuildId || ""} onChange={(e) => setConfig((p) => ({ ...p, defaultGuildId: e.target.value }))} />
                    </div>
                </section>

                <section style={{ ...glassStyle, padding: "16px" }}>
                    <p style={panelLabelStyle}>CHANNELS + ROLE MAP</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        <input style={inputStyle} placeholder="Events Channel ID" value={config.eventsChannelId || ""} onChange={(e) => setConfig((p) => ({ ...p, eventsChannelId: e.target.value }))} />
                        <input style={inputStyle} placeholder="Support Channel ID" value={config.supportChannelId || ""} onChange={(e) => setConfig((p) => ({ ...p, supportChannelId: e.target.value }))} />
                        <input style={inputStyle} placeholder="Role ID: admin" value={config.roleMap?.admin || ""} onChange={(e) => setConfig((p) => ({ ...p, roleMap: { ...p.roleMap, admin: e.target.value } }))} />
                        <input style={inputStyle} placeholder="Role ID: a&r" value={config.roleMap?.["a&r"] || ""} onChange={(e) => setConfig((p) => ({ ...p, roleMap: { ...p.roleMap, "a&r": e.target.value } }))} />
                        <input style={inputStyle} placeholder="Role ID: artist" value={config.roleMap?.artist || ""} onChange={(e) => setConfig((p) => ({ ...p, roleMap: { ...p.roleMap, artist: e.target.value } }))} />
                    </div>
                </section>

                <section style={{ ...glassStyle, padding: "16px", gridColumn: "1 / -1" }}>
                    <p style={panelLabelStyle}>BOT AI RUNTIME</p>
                    <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
                        <Toggle label="Agent Mode" checked={config.botRuntime?.agentMode} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, agentMode: e.target.checked } }))} />
                        <Toggle label="Vision AI" checked={config.botRuntime?.visionAi} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, visionAi: e.target.checked } }))} />
                        <Toggle label="Smart Helper" checked={config.botRuntime?.smartHelper} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, smartHelper: e.target.checked } }))} />
                        <Toggle label="Require Question Signal" checked={config.botRuntime?.smartHelperRequireQuestion} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, smartHelperRequireQuestion: e.target.checked } }))} />

                        <select style={inputStyle} value={config.botRuntime?.personality || "helpful"} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, personality: e.target.value } }))}>
                            <option value="helpful">helpful</option>
                            <option value="serious">serious</option>
                            <option value="robot">robot</option>
                        </select>
                        <select style={inputStyle} value={config.botRuntime?.smartHelperMode || "questions_only"} onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, smartHelperMode: e.target.value } }))}>
                            <option value="questions_only">questions_only</option>
                            <option value="keyword_only">keyword_only</option>
                            <option value="all_messages">all_messages</option>
                        </select>
                    </div>
                    <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                        <input
                            style={inputStyle}
                            placeholder="Smart helper keywords (comma separated)"
                            value={toCsv(config.botRuntime?.smartHelperKeywords)}
                            onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, smartHelperKeywords: fromCsv(e.target.value) } }))}
                        />
                        <input
                            style={inputStyle}
                            placeholder="Smart helper blocked keywords (comma separated)"
                            value={toCsv(config.botRuntime?.smartHelperBlockedKeywords)}
                            onChange={(e) => setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, smartHelperBlockedKeywords: fromCsv(e.target.value) } }))}
                        />
                    </div>
                </section>
            </div>

            <div style={{ ...glassStyle }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontSize: "10px", letterSpacing: "1.6px", fontWeight: 900, color: "#7a7a7a" }}>
                    LINKED ACCOUNTS
                </div>
                <div style={{ overflowX: "auto", maxHeight: "360px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>USER</th>
                                <th style={thStyle}>DISCORD</th>
                                <th style={thStyle}>ROLE</th>
                                <th style={thStyle}>LINKED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedUsers.map((row) => (
                                <tr key={`${row.user_id}:${row.discord_user_id}`}>
                                    <td style={tdStyle}>{row.stageName || row.email}</td>
                                    <td style={tdStyle}>{row.discord_username || row.discord_user_id}</td>
                                    <td style={{ ...tdStyle, textTransform: "uppercase" }}>{row.role}</td>
                                    <td style={tdStyle}>{new Date(row.linked_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {linkedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ ...tdStyle, color: "#777", textAlign: "center" }}>No linked accounts yet.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
