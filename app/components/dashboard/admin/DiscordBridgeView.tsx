import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import { useToast } from "@/app/components/ToastContext";
import { Button, Card, Chip, Dropdown, Input, Label, Switch, Table, TextField } from "@heroui/react";

const INPUT_CLASS = "dash-input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RoleMap = {
    admin: string;
    "a&r": string;
    artist: string;
};

type BotRuntime = {
    personality: string;
    visionAi: boolean;
    smartHelper: boolean;
    smartHelperMode: string;
    smartHelperKeywords: string[];
    smartHelperBlockedKeywords: string[];
    smartHelperRequireQuestion: boolean;
    agentMode: boolean;
};

type DiscordConfig = {
    enabled: boolean;
    outboxEnabled: boolean;
    publicBaseUrl: string;
    oauthClientId: string;
    oauthRedirectUri: string;
    oauthClientSecretConfigured: boolean;
    internalTokenConfigured: boolean;
    internalSigningSecretConfigured: boolean;
    defaultGuildId: string;
    supportChannelId: string;
    eventsChannelId: string;
    roleMap: RoleMap;
    botRuntime: BotRuntime;
};

type SnapshotCounters = {
    linkedAccounts?: number;
    pendingOutbox?: number;
    pendingRoleSync?: number;
};

type LinkedUser = {
    user_id: string;
    discord_user_id: string;
    stageName?: string;
    email?: string;
    discord_username?: string;
    role?: string;
    linked_at: string;
};

type Snapshot = {
    counters?: SnapshotCounters;
    linkedUsers?: LinkedUser[];
};

type DiscordBridgeData = {
    config?: Partial<DiscordConfig>;
    snapshot?: Snapshot;
};

type StatusColor = "success" | "default" | "warning";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_CONFIG: DiscordConfig = {
    enabled: false,
    outboxEnabled: true,
    publicBaseUrl: "http://localhost:3000",
    oauthClientId: "",
    oauthRedirectUri: "",
    oauthClientSecretConfigured: false,
    internalTokenConfigured: false,
    internalSigningSecretConfigured: false,
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

const toCsv = (list: string[]): string => (Array.isArray(list) ? list.join(", ") : "");
const fromCsv = (value: string): string[] => String(value || "").split(",").map((i) => i.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
}

function StatCard({ title, value, sub }: StatCardProps) {
    return (
        <Card>
            <Card.Content className="p-4">
                <p className="text-[10px] font-black tracking-[1.4px] uppercase text-muted">{title}</p>
                <p className="mt-2 text-[26px] font-black leading-none text-foreground">{value}</p>
                {sub && <p className="mt-1 text-[11px] text-muted">{sub}</p>}
            </Card.Content>
        </Card>
    );
}

interface ToggleProps {
    label: string;
    isSelected: boolean | undefined;
    onChange: (value: boolean) => void;
}

function Toggle({ label, isSelected, onChange }: ToggleProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface">
            <span className="text-[11px] font-black tracking-widest text-foreground">{label}</span>
            <Switch isSelected={Boolean(isSelected)} onChange={onChange}>
                <Switch.Control><Switch.Thumb /></Switch.Control>
            </Switch>
        </div>
    );
}

interface SelectFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
}

function SelectField({ value, onChange, options }: SelectFieldProps) {
    return (
        <Dropdown>
            <Button variant="secondary" size="md" className="w-full justify-between text-[12px] font-semibold">
                {value}
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu
                    selectionMode="single"
                    selectedKeys={new Set([value])}
                    onSelectionChange={(keys) => onChange(Array.from(keys as Set<string>)[0])}
                >
                    {options.map((v) => (
                        <Dropdown.Item key={v} id={v} textValue={v}>
                            <Label className="cursor-pointer text-[12px]">{v}</Label>
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
}

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
    return (
        <Card>
            <Card.Content className="flex flex-col gap-3 p-5">
                <p className="text-[10px] font-black tracking-[1.8px] uppercase text-muted mb-1">{title}</p>
                {children}
            </Card.Content>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DiscordBridgeViewProps {
    data: DiscordBridgeData;
    onRefresh?: () => void;
}

export default function DiscordBridgeView({ data, onRefresh }: DiscordBridgeViewProps) {
    const { showToast } = useToast();
    const [config, setConfig] = useState<DiscordConfig>(EMPTY_CONFIG);
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (!data?.config) return;
        setConfig({
            ...EMPTY_CONFIG,
            ...data.config,
            roleMap: { ...EMPTY_CONFIG.roleMap, ...(data.config.roleMap || {}) },
            botRuntime: { ...EMPTY_CONFIG.botRuntime, ...(data.config.botRuntime || {}) }
        });
    }, [data]);

    const snapshot: Snapshot = data?.snapshot || {};
    const linkedUsers: LinkedUser[] = snapshot?.linkedUsers || [];

    const statusLabel = useMemo((): string => {
        if (!config.enabled) return "DISABLED";
        if (!config.internalTokenConfigured || !config.internalSigningSecretConfigured) return "MISSING INTERNAL AUTH";
        if (!config.oauthClientId || !config.oauthClientSecretConfigured) return "MISSING OAUTH";
        return "READY";
    }, [config]);

    const statusColor: StatusColor = statusLabel === "READY" ? "success" : statusLabel === "DISABLED" ? "default" : "warning";

    const saveConfig = async (): Promise<void> => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/discord-bridge", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config })
            });
            const payload: { error?: string } = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to save configuration.");
            showToast("Discord bridge settings saved", "success");
            onRefresh?.();
        } catch (error) {
            showToast((error as Error).message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const set = <K extends keyof DiscordConfig>(key: K, val: DiscordConfig[K]): void =>
        setConfig((p) => ({ ...p, [key]: val }));
    const setBot = <K extends keyof BotRuntime>(key: K, val: BotRuntime[K]): void =>
        setConfig((p) => ({ ...p, botRuntime: { ...p.botRuntime, [key]: val } }));
    const setRole = (key: keyof RoleMap, val: string): void =>
        setConfig((p) => ({ ...p, roleMap: { ...p.roleMap, [key]: val } }));

    return (
        <div className="flex flex-col gap-5">

            {/* Header */}
            <Card>
                <Card.Content className="flex items-center justify-between gap-4 p-5 flex-wrap">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-black tracking-[2px] uppercase text-muted">Discord Bridge Control</p>
                        <h2 className="text-[20px] font-black text-foreground tracking-tight">OAuth2 + Internal API + Runtime</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-black text-muted">STATUS:</span>
                            <Chip size="sm" variant="soft" color={statusColor}>
                                <Chip.Label>{statusLabel}</Chip.Label>
                            </Chip>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onPress={() => onRefresh?.()}>
                            <RefreshCcw size={13} /> REFRESH
                        </Button>
                        <Button variant="primary" size="sm" onPress={saveConfig} isDisabled={saving}>
                            <Save size={13} /> {saving ? "SAVING..." : "SAVE"}
                        </Button>
                    </div>
                </Card.Content>
            </Card>

            {/* Stats */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                <StatCard title="LINKED ACCOUNTS" value={snapshot?.counters?.linkedAccounts || 0} />
                <StatCard title="PENDING EVENTS" value={snapshot?.counters?.pendingOutbox || 0} sub="Outbox queue" />
                <StatCard title="ROLE SYNC QUEUE" value={snapshot?.counters?.pendingRoleSync || 0} />
                <StatCard title="BRIDGE" value={config.enabled ? "ON" : "OFF"} sub={config.outboxEnabled ? "Outbox active" : "Outbox disabled"} />
            </div>

            {/* Config Panels */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))" }}>

                {/* Core */}
                <SectionCard title="Core">
                    <Toggle label="Bridge Enabled" isSelected={config.enabled} onChange={(v) => set("enabled", v)} />
                    <Toggle label="Event Outbox Enabled" isSelected={config.outboxEnabled} onChange={(v) => set("outboxEnabled", v)} />
                    <TextField fullWidth value={config.publicBaseUrl || ""} onChange={(v) => set("publicBaseUrl", v)}>
                        <Input placeholder="Public Base URL" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                </SectionCard>

                {/* OAuth2 */}
                <SectionCard title="OAuth2">
                    <TextField fullWidth value={config.oauthClientId || ""} onChange={(v) => set("oauthClientId", v)}>
                        <Input placeholder="Discord Client ID" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                    <TextField
                        fullWidth
                        isReadOnly
                        value={config.oauthClientSecretConfigured ? "Configured via environment" : "Missing: set DISCORD_CLIENT_SECRET"}
                    >
                        <Input
                            type="password"
                            className={`${INPUT_CLASS} cursor-not-allowed opacity-60`}
                            aria-label="Client secret status"
                            variant="secondary"
                        />
                    </TextField>
                    <TextField fullWidth value={config.oauthRedirectUri || ""} onChange={(v) => set("oauthRedirectUri", v)}>
                        <Input placeholder="OAuth Redirect URI" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                </SectionCard>

                {/* Internal API */}
                <SectionCard title="Internal API">
                    <TextField
                        fullWidth
                        isReadOnly
                        value={config.internalTokenConfigured ? "Configured via environment" : "Missing: set BOT_INTERNAL_TOKEN"}
                    >
                        <Input
                            type="password"
                            className={`${INPUT_CLASS} cursor-not-allowed opacity-60`}
                            aria-label="Internal token status"
                            variant="secondary"
                        />
                    </TextField>
                    <TextField
                        fullWidth
                        isReadOnly
                        value={config.internalSigningSecretConfigured ? "Configured via environment" : "Missing: set BOT_INTERNAL_SIGNING_SECRET"}
                    >
                        <Input
                            type="password"
                            className={`${INPUT_CLASS} cursor-not-allowed opacity-60`}
                            aria-label="Signing secret status"
                            variant="secondary"
                        />
                    </TextField>
                    <TextField fullWidth value={config.defaultGuildId || ""} onChange={(v) => set("defaultGuildId", v)}>
                        <Input placeholder="Default Guild ID" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                </SectionCard>

                {/* Channels + Role Map */}
                <SectionCard title="Channels + Role Map">
                    <TextField fullWidth value={config.eventsChannelId || ""} onChange={(v) => set("eventsChannelId", v)}>
                        <Input placeholder="Events Channel ID" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                    <TextField fullWidth value={config.supportChannelId || ""} onChange={(v) => set("supportChannelId", v)}>
                        <Input placeholder="Support Channel ID" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                    <TextField fullWidth value={config.roleMap?.admin || ""} onChange={(v) => setRole("admin", v)}>
                        <Input placeholder="Role ID: admin" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                    <TextField fullWidth value={config.roleMap?.["a&r"] || ""} onChange={(v) => setRole("a&r", v)}>
                        <Input placeholder="Role ID: a&r" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                    <TextField fullWidth value={config.roleMap?.artist || ""} onChange={(v) => setRole("artist", v)}>
                        <Input placeholder="Role ID: artist" className={INPUT_CLASS} variant="secondary" />
                    </TextField>
                </SectionCard>

                {/* Bot AI Runtime — full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                    <SectionCard title="Bot AI Runtime">
                        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
                            <Toggle label="Agent Mode" isSelected={config.botRuntime?.agentMode} onChange={(v) => setBot("agentMode", v)} />
                            <Toggle label="Vision AI" isSelected={config.botRuntime?.visionAi} onChange={(v) => setBot("visionAi", v)} />
                            <Toggle label="Smart Helper" isSelected={config.botRuntime?.smartHelper} onChange={(v) => setBot("smartHelper", v)} />
                            <Toggle label="Require Question Signal" isSelected={config.botRuntime?.smartHelperRequireQuestion} onChange={(v) => setBot("smartHelperRequireQuestion", v)} />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] font-black tracking-widest uppercase text-muted">Personality</Label>
                                <SelectField
                                    value={config.botRuntime?.personality || "helpful"}
                                    onChange={(v) => setBot("personality", v)}
                                    options={["helpful", "serious", "robot"]}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] font-black tracking-widest uppercase text-muted">Smart Helper Mode</Label>
                                <SelectField
                                    value={config.botRuntime?.smartHelperMode || "questions_only"}
                                    onChange={(v) => setBot("smartHelperMode", v)}
                                    options={["questions_only", "keyword_only", "all_messages"]}
                                />
                            </div>
                        </div>
                        <div className="grid gap-3 mt-1">
                            <TextField fullWidth value={toCsv(config.botRuntime?.smartHelperKeywords)} onChange={(v) => setBot("smartHelperKeywords", fromCsv(v))}>
                                <Input placeholder="Smart helper keywords (comma separated)" className={INPUT_CLASS} variant="secondary" />
                            </TextField>
                            <TextField fullWidth value={toCsv(config.botRuntime?.smartHelperBlockedKeywords)} onChange={(v) => setBot("smartHelperBlockedKeywords", fromCsv(v))}>
                                <Input placeholder="Smart helper blocked keywords (comma separated)" className={INPUT_CLASS} variant="secondary" />
                            </TextField>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Linked Accounts Table */}
            <Card>
                <Card.Header className="px-5 py-4 border-b border-border">
                    <p className="text-[10px] font-black tracking-[1.6px] uppercase text-muted">Linked Accounts</p>
                </Card.Header>
                <Table aria-label="Linked Discord Accounts">
                    <Table.ScrollContainer>
                        <Table.Content className="min-w-[620px]" selectionMode="none">
                            <Table.Header>
                                <Table.Column isRowHeader id="user">USER</Table.Column>
                                <Table.Column id="discord">DISCORD</Table.Column>
                                <Table.Column id="role">ROLE</Table.Column>
                                <Table.Column id="linked">LINKED</Table.Column>
                            </Table.Header>
                            <Table.Body
                                items={linkedUsers}
                                renderEmptyState={() => (
                                    <div className="py-12 text-center">
                                        <p className="text-[11px] font-black tracking-widest uppercase text-muted">No linked accounts yet.</p>
                                    </div>
                                )}
                            >
                                {(row: LinkedUser) => (
                                    <Table.Row key={`${row.user_id}:${row.discord_user_id}`} id={`${row.user_id}:${row.discord_user_id}`}>
                                        <Table.Cell>{row.stageName || row.email}</Table.Cell>
                                        <Table.Cell>{row.discord_username || row.discord_user_id}</Table.Cell>
                                        <Table.Cell>
                                            <Chip size="sm" variant="soft" color="default">
                                                <Chip.Label>{row.role?.toUpperCase()}</Chip.Label>
                                            </Chip>
                                        </Table.Cell>
                                        <Table.Cell>{new Date(row.linked_at).toLocaleString()}</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>
            </Card>

        </div>
    );
}
