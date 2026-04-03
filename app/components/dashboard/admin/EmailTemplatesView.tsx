"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Plus, Edit2, Trash2, Eye, RefreshCw, Power, Database } from "lucide-react";
import {
    Button,
    Card,
    Chip,
    Input,
    Label,
    Switch,
    Table,
    TextArea,
    TextField,
} from "@heroui/react";
import { useToast } from "@/app/components/ToastContext";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";

const FIELD_CLASS = "dash-input";

interface EmailTemplate {
    id: string;
    slug: string;
    name: string;
    subject: string;
    body: string;
    variables: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function parseVariables(variables: string | null): string[] {
    if (!variables) return [];
    try {
        const parsed = JSON.parse(variables);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function extractVariablesFromBody(body: string): string[] {
    const matches = body.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const unique = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
    return unique;
}

const SAMPLE_VARIABLES: Record<string, string> = {
    verificationLink: "https://example.com/verify?token=abc123",
    loginLink: "https://example.com/login",
    resetLink: "https://example.com/reset?token=xyz789",
    artistName: "John Doe",
    trackTitle: "Midnight Dreams",
    releaseTitle: "Midnight Dreams EP",
    amount: "1,250.00",
    period: "Q1 2026",
    subject: "Important Announcement",
    message: "This is a sample broadcast message content.",
    reason: "The track needs additional mastering work before release.",
    requestId: "REQ-001",
    type: "change_request",
    content: "Your request has been reviewed and we have some updates.",
    status: "approved",
    adminNote: "Everything looks good. Proceeding with the release.",
    userName: "Jane Smith",
};

export default function EmailTemplatesView() {
    const { showToast, showConfirm } = useToast() as any;
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | "new" | null>(null);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        subject: "",
        body: "",
        variables: "",
        active: true,
    });
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/email-templates");
            if (!res.ok) throw new Error("Failed to fetch templates");
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (error: any) {
            showToast(error.message || "Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleEdit = (template: EmailTemplate | null = null) => {
        if (template) {
            setEditing(template.id);
            setForm({
                name: template.name,
                slug: template.slug,
                subject: template.subject,
                body: template.body,
                variables: template.variables || "[]",
                active: template.active,
            });
            setSlugManuallyEdited(true);
        } else {
            setEditing("new");
            setForm({ name: "", slug: "", subject: "", body: "", variables: "[]", active: true });
            setSlugManuallyEdited(false);
        }
        setPreviewHtml(null);
        setPreviewing(false);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.slug.trim() || !form.subject.trim() || !form.body.trim()) {
            showToast("Name, slug, subject, and body are required", "warning");
            return;
        }

        // Auto-detect variables from body
        const detectedVars = extractVariablesFromBody(form.body + " " + form.subject);
        const variablesJson = JSON.stringify(detectedVars);

        setSaving(true);
        try {
            if (editing === "new") {
                const res = await fetch("/api/admin/email-templates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        slug: form.slug,
                        name: form.name,
                        subject: form.subject,
                        body: form.body,
                        variables: variablesJson,
                        active: form.active,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to create template");
                }
                showToast("Template created", "success");
            } else {
                const res = await fetch("/api/admin/email-templates", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editing,
                        slug: form.slug,
                        name: form.name,
                        subject: form.subject,
                        body: form.body,
                        variables: variablesJson,
                        active: form.active,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to update template");
                }
                showToast("Template updated", "success");
            }
            setEditing(null);
            setPreviewHtml(null);
            setPreviewing(false);
            await fetchTemplates();
        } catch (error: any) {
            showToast(error.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "DELETE TEMPLATE?",
            "This will permanently remove this email template. Continue?",
            async () => {
                try {
                    const res = await fetch(`/api/admin/email-templates?id=${id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Delete failed");
                    showToast("Template deleted", "success");
                    await fetchTemplates();
                } catch (error: any) {
                    showToast(error.message || "Delete failed", "error");
                }
            },
        );
    };

    const handlePreview = () => {
        let rendered = form.body;
        let renderedSubject = form.subject;
        const detectedVars = extractVariablesFromBody(form.body + " " + form.subject);

        for (const varName of detectedVars) {
            const sampleValue = SAMPLE_VARIABLES[varName] || `[${varName}]`;
            const regex = new RegExp(`\\{\\{${varName}\\}\\}`, "g");
            rendered = rendered.replace(regex, sampleValue);
            renderedSubject = renderedSubject.replace(regex, sampleValue);
        }

        setPreviewHtml(rendered);
        setPreviewing(true);
    };

    const handleSeedDefaults = async () => {
        setSeeding(true);
        try {
            const res = await fetch("/api/admin/email-templates/seed", { method: "POST" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Seed failed");
            }
            showToast("Default templates seeded", "success");
            await fetchTemplates();
        } catch (error: any) {
            showToast(error.message || "Seed failed", "error");
        } finally {
            setSeeding(false);
        }
    };

    const toggleActive = async (template: EmailTemplate) => {
        try {
            const res = await fetch("/api/admin/email-templates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: template.id, active: !template.active }),
            });
            if (!res.ok) throw new Error("Update failed");
            await fetchTemplates();
        } catch (error: any) {
            showToast(error.message || "Update failed", "error");
        }
    };

    const detectedVars = extractVariablesFromBody(form.body + " " + form.subject);

    if (loading) {
        return <DashboardLoader label="EMAIL TEMPLATES" subLabel="Loading templates..." />;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-[16px] font-black tracking-[0.18em] uppercase text-foreground">
                        Email Templates
                    </h2>
                    <p className="mt-1 text-[11px] text-muted">
                        Manage email templates with variable placeholders. Customise the HTML sent to artists.
                    </p>
                </div>
                {!editing && (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="secondary" size="sm" onPress={handleSeedDefaults} isDisabled={seeding}>
                            <Database size={14} />
                            {seeding ? "SEEDING..." : "SEED DEFAULTS"}
                        </Button>
                        <Button variant="primary" size="sm" onPress={() => handleEdit()}>
                            <Plus size={14} />
                            NEW TEMPLATE
                        </Button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {editing ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card variant="default" className="border-default/15">
                            <Card.Content className="relative flex flex-col gap-6 p-6">
                                {saving && <DashboardLoader overlay label="SAVING" />}

                                {/* Name + Slug */}
                                <div className="grid grid-cols-2 gap-4">
                                    <TextField
                                        fullWidth
                                        value={form.name}
                                        onChange={(val) => {
                                            setForm((f) => ({
                                                ...f,
                                                name: val,
                                                slug: slugManuallyEdited ? f.slug : slugify(val),
                                            }));
                                        }}
                                    >
                                        <Label className="dash-label">Template Name</Label>
                                        <Input
                                            placeholder="e.g. Demo Approval"
                                            className={FIELD_CLASS}
                                            variant="secondary"
                                        />
                                    </TextField>
                                    <TextField
                                        fullWidth
                                        value={form.slug}
                                        onChange={(val) => {
                                            setSlugManuallyEdited(true);
                                            setForm((f) => ({ ...f, slug: val }));
                                        }}
                                    >
                                        <Label className="dash-label">Slug (unique identifier)</Label>
                                        <Input
                                            placeholder="e.g. demo-approval"
                                            className={FIELD_CLASS}
                                            variant="secondary"
                                        />
                                    </TextField>
                                </div>

                                {/* Subject */}
                                <TextField
                                    fullWidth
                                    value={form.subject}
                                    onChange={(val) => setForm((f) => ({ ...f, subject: val }))}
                                >
                                    <Label className="dash-label">Subject Line</Label>
                                    <Input
                                        placeholder='e.g. Your Demo "{{trackTitle}}" Has Been Approved'
                                        className={FIELD_CLASS}
                                        variant="secondary"
                                    />
                                </TextField>

                                {/* Active toggle */}
                                <div className="flex items-center">
                                    <div
                                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 ${form.active ? "border-green-500/20 bg-green-500/5" : "border-default/10 bg-default/5"}`}
                                    >
                                        <span
                                            className={`text-[11px] font-black uppercase tracking-widest ${form.active ? "text-green-400" : "text-muted"}`}
                                        >
                                            {form.active ? "Active" : "Inactive (fallback to hardcoded)"}
                                        </span>
                                        <Switch
                                            isSelected={form.active}
                                            onChange={(isSelected) =>
                                                setForm((f) => ({ ...f, active: isSelected }))
                                            }
                                        >
                                            <Switch.Control>
                                                <Switch.Thumb />
                                            </Switch.Control>
                                        </Switch>
                                    </div>
                                </div>

                                {/* Body */}
                                <TextField
                                    fullWidth
                                    value={form.body}
                                    onChange={(val) => setForm((f) => ({ ...f, body: val }))}
                                >
                                    <Label className="dash-label">HTML Body</Label>
                                    <TextArea
                                        className={`${FIELD_CLASS} min-h-64 resize-y font-mono text-[12px]`}
                                        placeholder="Paste your HTML email template here..."
                                        variant="secondary"
                                    />
                                </TextField>

                                {/* Detected variables */}
                                {detectedVars.length > 0 && (
                                    <Card variant="secondary" className="border-default/8">
                                        <Card.Content className="flex flex-wrap items-center gap-2 p-4">
                                            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted mr-2">
                                                Detected Variables
                                            </span>
                                            {detectedVars.map((v) => (
                                                <Chip key={v} variant="secondary" size="sm">
                                                    {`{{${v}}}`}
                                                </Chip>
                                            ))}
                                        </Card.Content>
                                    </Card>
                                )}

                                {/* Preview */}
                                {previewing && previewHtml && (
                                    <Card variant="secondary" className="border-default/8 overflow-hidden">
                                        <Card.Content className="p-0">
                                            <div className="flex items-center justify-between border-b border-default/10 px-4 py-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                                                    Preview (with sample data)
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onPress={() => {
                                                        setPreviewing(false);
                                                        setPreviewHtml(null);
                                                    }}
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="w-full border-0"
                                                style={{ height: "500px", background: "#fff" }}
                                                title="Email Preview"
                                                sandbox="allow-same-origin"
                                            />
                                        </Card.Content>
                                    </Card>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 border-t border-default/10 pt-5">
                                    <Button variant="primary" onPress={handleSave} isDisabled={saving}>
                                        {editing === "new" ? "Create Template" : "Save Changes"}
                                    </Button>
                                    <Button variant="secondary" onPress={handlePreview}>
                                        <Eye size={14} />
                                        Preview
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onPress={() => {
                                            setEditing(null);
                                            setPreviewing(false);
                                            setPreviewHtml(null);
                                        }}
                                    >
                                        Discard
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                    >
                        {templates.length === 0 ? (
                            <Card variant="default" className="border-default/10">
                                <Card.Content className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                    <Mail size={32} className="text-muted/40" />
                                    <p className="text-[12px] text-muted">
                                        No email templates yet. Click &quot;SEED DEFAULTS&quot; to import hardcoded
                                        templates, or &quot;NEW TEMPLATE&quot; to create one.
                                    </p>
                                </Card.Content>
                            </Card>
                        ) : (
                            <Table aria-label="Email Templates">
                                <Table.ScrollContainer>
                                    <Table.Content className="min-w-[700px]">
                                        <Table.Header>
                                            <Table.Column isRowHeader className="w-[200px]">TEMPLATE</Table.Column>
                                            <Table.Column className="w-[220px]">SUBJECT</Table.Column>
                                            <Table.Column>VARIABLES</Table.Column>
                                            <Table.Column className="w-[90px]">STATUS</Table.Column>
                                            <Table.Column className="w-[90px]">UPDATED</Table.Column>
                                            <Table.Column className="w-[120px] text-right">ACTIONS</Table.Column>
                                        </Table.Header>
                                        <Table.Body>
                                            {templates.map((template) => {
                                                const vars = parseVariables(template.variables);
                                                return (
                                                    <Table.Row key={template.id} className={!template.active ? "opacity-50" : ""}>
                                                        <Table.Cell>
                                                            <div className="flex items-center gap-2.5">
                                                                <Mail size={14} className="text-muted shrink-0" />
                                                                <div className="min-w-0">
                                                                    <div className="text-[12px] font-bold text-foreground truncate">{template.name}</div>
                                                                    <div className="text-[9px] font-bold tracking-wider text-muted uppercase">{template.slug}</div>
                                                                </div>
                                                            </div>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <span className="text-[11px] text-muted truncate block max-w-[200px]">{template.subject}</span>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {vars.slice(0, 3).map((v) => (
                                                                    <Chip key={v} variant="secondary" size="sm">{v}</Chip>
                                                                ))}
                                                                {vars.length > 3 && (
                                                                    <span className="text-[9px] text-muted font-bold">+{vars.length - 3}</span>
                                                                )}
                                                            </div>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Chip size="sm" variant="soft" color={template.active ? "success" : "default"}>
                                                                <Chip.Label>{template.active ? "ACTIVE" : "OFF"}</Chip.Label>
                                                            </Chip>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <span className="text-[10px] text-muted">{new Date(template.updatedAt).toLocaleDateString()}</span>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button size="sm" variant="ghost" isIconOnly aria-label={template.active ? "Deactivate" : "Activate"} onPress={() => toggleActive(template)}>
                                                                    <Power size={13} className={template.active ? "text-green-400" : ""} />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" isIconOnly aria-label="Edit" onPress={() => handleEdit(template)}>
                                                                    <Edit2 size={13} />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" isIconOnly aria-label="Delete" onPress={() => handleDelete(template.id)} className="text-red-400">
                                                                    <Trash2 size={13} />
                                                                </Button>
                                                            </div>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            })}
                                        </Table.Body>
                                    </Table.Content>
                                </Table.ScrollContainer>
                            </Table>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
