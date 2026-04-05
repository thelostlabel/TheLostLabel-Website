"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import {
  Plus, Send, Download, Trash2, X, FileText, ArrowLeft,
  GripVertical, ChevronUp, ChevronDown, AlertCircle, Bell,
  Eye, CheckCircle, Clock, DollarSign, FileDown, Edit2,
  Ban, CreditCard,
} from "lucide-react";
import { useToast } from "@/app/components/ToastContext";
import {
  Button, Card, Checkbox, Chip, Table, SearchField, TextField, TextArea, Input, Select, ListBox, Label,
} from "@heroui/react";
import DashboardModal from "@/app/components/dashboard/primitives/DashboardModal";
import { dashboardRequestJson, getDashboardErrorMessage } from "@/app/components/dashboard/lib/dashboard-request";
import { ACTION_BUTTON } from "@/app/components/dashboard/lib/action-styles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceStatus = "draft" | "pending" | "viewed" | "completed" | "paid" | "overdue" | "cancelled";

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  recipientEmail: string;
  recipientName: string | null;
  amount: number;
  currency: string;
  description: string | null;
  formFields: string;
  formData: string | null;
  status: InvoiceStatus;
  pdfUrl: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  resendCount: number;
  lastResendAt: string | null;
  viewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  creator?: { id: string; fullName: string | null; email: string };
  user?: { id: string; fullName: string | null; stageName: string | null; email: string } | null;
}

interface InvoiceSummary {
  total: number;
  totalAmount: number;
  pending: number;
  pendingAmount: number;
  completed: number;
  completedAmount: number;
  paid: number;
  paidAmount: number;
  overdue: number;
  overdueAmount: number;
}

interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<InvoiceStatus, { color: "default" | "warning" | "success" | "danger" | "primary" | "secondary"; label: string }> = {
  draft: { color: "default", label: "DRAFT" },
  pending: { color: "warning", label: "PENDING" },
  viewed: { color: "primary", label: "VIEWED" },
  completed: { color: "success", label: "SUBMITTED" },
  paid: { color: "success", label: "PAID" },
  overdue: { color: "danger", label: "OVERDUE" },
  cancelled: { color: "default", label: "CANCELLED" },
};

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "viewed", label: "Viewed" },
  { key: "completed", label: "Submitted" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "draft", label: "Draft" },
  { key: "cancelled", label: "Cancelled" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "TRY", symbol: "₺" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
  { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "CHF" },
  { code: "SEK", symbol: "kr" },
];

const DEFAULT_FORM_FIELDS: FormFieldDef[] = [
  { key: "fullName", label: "Full Name / Company Name", type: "text", required: true },
  { key: "address", label: "Street Address", type: "textarea", required: true },
  { key: "city", label: "City", type: "text", required: true },
  { key: "postalCode", label: "Postal / ZIP Code", type: "text", required: true },
  { key: "country", label: "Country", type: "text", required: true },
  { key: "taxId", label: "Tax ID / VAT Number", type: "text", required: false },
  { key: "phone", label: "Phone Number", type: "text", required: false },
  { key: "bankDetails", label: "Bank / Payment Details (IBAN, etc.)", type: "textarea", required: false },
];

const LABEL_CLS = "dash-label";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoicesView() {
  const { showToast, showConfirm } = useToast() as any;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  // Create form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formFields, setFormFields] = useState<FormFieldDef[]>([...DEFAULT_FORM_FIELDS]);
  const [sendEmail, setSendEmail] = useState(true);

  // New field state
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "textarea" | "select">("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // ------ Fetch ------
  const fetchInvoices = useCallback(async () => {
    try {
      const data = await dashboardRequestJson<{ invoices: Invoice[]; summary: InvoiceSummary }>("/api/admin/invoices", {
        context: "fetch invoices",
      });
      setInvoices(data.invoices || []);
      setSummary(data.summary || null);
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to load invoices"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ------ Filter ------
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.recipientEmail.toLowerCase().includes(q) ||
          (inv.recipientName || "").toLowerCase().includes(q) ||
          (inv.invoiceNumber || "").toLowerCase().includes(q) ||
          (inv.description || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [invoices, debouncedSearch, statusFilter]);

  // ------ Create ------
  const resetForm = () => {
    setRecipientEmail("");
    setRecipientName("");
    setAmount("");
    setCurrency("USD");
    setDescription("");
    setDueDate("");
    setNotes("");
    setFormFields([...DEFAULT_FORM_FIELDS]);
    setSendEmail(true);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
  };

  const handleCreate = async () => {
    if (!recipientEmail || !amount) {
      showToast("Email and amount are required", "warning");
      return;
    }
    if (formFields.length === 0) {
      showToast("At least one form field is required", "warning");
      return;
    }

    setSaving(true);
    try {
      await dashboardRequestJson("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          recipientName: recipientName || undefined,
          amount: parseFloat(amount),
          currency,
          description: description || undefined,
          formFields,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          sendEmail,
        }),
        context: "create invoice",
        retry: false,
      });
      showToast(sendEmail ? "Invoice created and email sent" : "Invoice saved as draft", "success");
      setShowCreate(false);
      resetForm();
      await fetchInvoices();
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to create invoice"), "error");
    } finally {
      setSaving(false);
    }
  };

  // ------ Form field management ------
  const addField = () => {
    if (!newFieldLabel.trim()) {
      showToast("Field label is required", "warning");
      return;
    }
    const key = newFieldLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (formFields.some((f) => f.key === key)) {
      showToast("A field with this key already exists", "warning");
      return;
    }
    setFormFields([...formFields, { key, label: newFieldLabel.trim(), type: newFieldType, required: newFieldRequired }]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
  };

  const removeField = (key: string) => setFormFields(formFields.filter((f) => f.key !== key));
  const moveField = (key: string, dir: -1 | 1) => {
    const idx = formFields.findIndex((f) => f.key === key);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= formFields.length) return;
    const next = [...formFields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFormFields(next);
  };
  const toggleFieldRequired = (key: string) => setFormFields(formFields.map((f) => f.key === key ? { ...f, required: !f.required } : f));

  // ------ Update status ------
  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    try {
      await dashboardRequestJson("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
        context: "update invoice",
        retry: false,
      });
      showToast(`Invoice marked as ${status}`, "success");
      await fetchInvoices();
      if (detailInvoice?.id === id) setDetailInvoice(null);
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Update failed"), "error");
    }
  };

  // ------ Resend ------
  const handleResend = async (id: string) => {
    try {
      await dashboardRequestJson(`/api/admin/invoices/${id}/resend`, {
        method: "POST",
        context: "resend invoice",
        retry: false,
      });
      showToast("Invoice email resent", "success");
      await fetchInvoices();
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to resend"), "error");
    }
  };

  // ------ Remind ------
  const handleRemind = async (id: string) => {
    try {
      await dashboardRequestJson(`/api/admin/invoices/${id}/remind`, {
        method: "POST",
        context: "send reminder",
        retry: false,
      });
      showToast("Reminder sent", "success");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to send reminder"), "error");
    }
  };

  // ------ Delete ------
  const handleDelete = (id: string) => {
    showConfirm("DELETE INVOICE?", "This action cannot be undone.", async () => {
      try {
        await dashboardRequestJson(`/api/admin/invoices/${id}`, {
          method: "DELETE",
          context: "delete invoice",
          retry: false,
        });
        showToast("Invoice deleted", "success");
        await fetchInvoices();
      } catch (error) {
        showToast(getDashboardErrorMessage(error, "Delete failed"), "error");
      }
    });
  };

  const handleDownloadPdf = (id: string) => window.open(`/api/admin/invoices/${id}/pdf`, "_blank");
  const handleExportCsv = () => window.open(`/api/admin/invoices/export?status=${statusFilter}`, "_blank");

  const formatCurrency = (amt: number, cur: string) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amt);
    } catch {
      return `${amt.toFixed(2)} ${cur}`;
    }
  };

  const canResend = (inv: Invoice) => ["pending", "viewed", "draft"].includes(inv.status);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted text-xs font-bold tracking-widest">
        LOADING INVOICES...
      </div>
    );
  }

  // ========================================================================
  // CREATE VIEW
  // ========================================================================
  if (showCreate) {
    const selectedCurrency = CURRENCIES.find((c) => c.code === currency);

    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => { setShowCreate(false); resetForm(); }}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-muted hover:text-foreground bg-transparent border-none cursor-pointer p-0 w-fit transition-colors"
        >
          <ArrowLeft size={14} /> Back to Invoices
        </button>

        <Card variant="default" className="border-default/15">
          <Card.Content className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-0.5 w-6 bg-foreground/30" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted m-0">Invoice System</p>
                <h2 className="text-sm font-black tracking-[0.14em] uppercase text-foreground mt-1">New Invoice</h2>
              </div>
            </div>
            <p className="text-[12px] text-muted leading-relaxed mb-6 max-w-xl">
              Fill in the payment details and form fields. The recipient will receive an email with a secure link to complete their billing information.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="flex flex-col gap-6">
              {/* Recipient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField name="recipientEmail" type="email" value={recipientEmail} onChange={(v: string) => setRecipientEmail(v)} isRequired fullWidth>
                  <Label className={LABEL_CLS}>Recipient Email *</Label>
                  <Input aria-label="Recipient email" placeholder="artist@example.com" className="dash-input" variant="secondary" />
                </TextField>
                <TextField name="recipientName" value={recipientName} onChange={(v: string) => setRecipientName(v)} fullWidth>
                  <Label className={LABEL_CLS}>Recipient Name</Label>
                  <Input aria-label="Recipient name" placeholder="John Doe" className="dash-input" variant="secondary" />
                </TextField>
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                <div>
                  <label className={LABEL_CLS}>Amount *</label>
                  <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="dash-input w-full" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Currency</label>
                  <Select aria-label="Currency" selectedKey={currency} onSelectionChange={(key: React.Key | null) => { if (key) setCurrency(String(key)); }}>
                    <Select.Trigger className="w-full">
                      <Select.Value>{selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.code}` : currency}</Select.Value>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CURRENCIES.map((c) => (
                          <ListBox.Item key={c.code} id={c.code} textValue={`${c.symbol} ${c.code}`}>
                            <span className="font-bold">{c.symbol}</span> <span className="text-muted">{c.code}</span>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>

              {/* Amount preview */}
              {amount && parseFloat(amount) > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-default/10 bg-foreground/[0.02]">
                  <span className="text-[10px] font-black tracking-wider text-muted">INVOICE TOTAL</span>
                  <span className="text-lg font-black text-foreground ml-auto">{formatCurrency(parseFloat(amount) || 0, currency)}</span>
                </div>
              )}

              {/* Due Date + Description */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                <div>
                  <label className={LABEL_CLS}>Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="dash-input w-full" />
                </div>
                <div>
                  <Label className={LABEL_CLS}>Description</Label>
                  <TextArea
                    aria-label="Description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Payment description — e.g. Q1 2026 Royalty Payment..."
                    fullWidth
                    className="dash-input resize-y min-h-[60px]"
                  />
                </div>
              </div>

              {/* Notes (internal) */}
              <div>
                <Label className={LABEL_CLS}>Internal Notes</Label>
                <TextArea
                  aria-label="Notes"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Internal notes (not visible to recipient)..."
                  fullWidth
                  className="dash-input resize-y min-h-[60px]"
                />
              </div>

              {/* Send email toggle */}
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${sendEmail ? "border-green-500/20 bg-green-500/5" : "border-default/10 bg-foreground/[0.02]"}`}>
                <div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${sendEmail ? "text-green-400" : "text-muted"}`}>
                    {sendEmail ? "Send email immediately" : "Save as draft (no email)"}
                  </span>
                  <p className="text-[10px] text-muted/60 mt-0.5">
                    {sendEmail ? "Recipient will receive an email with the invoice form link" : "You can send the email later"}
                  </p>
                </div>
                <Checkbox isSelected={sendEmail} onChange={(v: boolean) => setSendEmail(v)}>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                </Checkbox>
              </div>

              {/* Form Fields Section */}
              <div className="border-t border-default/10 pt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-0.5 w-5 bg-foreground/20" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Form Fields</span>
                  <span className="text-[10px] text-muted/50 ml-1">(Artist will fill these)</span>
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                  {formFields.map((field, idx) => (
                    <div key={field.key} className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-default/10 hover:border-default/20 transition-colors bg-foreground/[0.01]">
                      <GripVertical size={13} className="text-muted/30 shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[12px] font-bold text-foreground truncate">{field.label}</span>
                        <Chip size="sm" variant="secondary"><Chip.Label>{field.type}</Chip.Label></Chip>
                        {field.required && <span className="text-[9px] font-black text-red-400/70 tracking-wider shrink-0">REQ</span>}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MiniActionBtn icon={<AlertCircle size={11} />} onClick={() => toggleFieldRequired(field.key)} title={field.required ? "Make optional" : "Make required"} className={field.required ? "bg-red-500/10 text-red-400" : ""} />
                        <MiniActionBtn icon={<ChevronUp size={13} />} onClick={() => moveField(field.key, -1)} disabled={idx === 0} />
                        <MiniActionBtn icon={<ChevronDown size={13} />} onClick={() => moveField(field.key, 1)} disabled={idx === formFields.length - 1} />
                        <MiniActionBtn icon={<X size={13} />} onClick={() => removeField(field.key)} className="text-red-400 hover:bg-red-500/10" />
                      </div>
                    </div>
                  ))}
                  {formFields.length === 0 && (
                    <div className="py-8 text-center text-muted/40 text-[11px] font-bold tracking-wider rounded-xl border border-dashed border-default/15">
                      NO FIELDS — ADD AT LEAST ONE BELOW
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-dashed border-default/15 bg-foreground/[0.01]">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted/50 mb-3 block">Add New Field</span>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <TextField className="flex-1" name="newFieldLabel" value={newFieldLabel} onChange={(v: string) => setNewFieldLabel(v)} fullWidth>
                      <Label className={LABEL_CLS}>Field Label</Label>
                      <Input aria-label="New field label" placeholder="e.g. Tax ID, Company Name..." className="dash-input" variant="secondary" />
                    </TextField>
                    <Select aria-label="Field type" className="w-full sm:w-[140px]" selectedKey={newFieldType} onSelectionChange={(key: React.Key | null) => { if (key) setNewFieldType(key as "text" | "textarea" | "select"); }}>
                      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="text" textValue="Text">Text</ListBox.Item>
                          <ListBox.Item id="textarea" textValue="Textarea">Textarea</ListBox.Item>
                          <ListBox.Item id="select" textValue="Select">Select</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <Checkbox isSelected={newFieldRequired} onChange={(v: boolean) => setNewFieldRequired(v)}>
                      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                      <Checkbox.Content><Label className="text-[11px] text-muted">Required field</Label></Checkbox.Content>
                    </Checkbox>
                    <Button size="sm" variant="secondary" onPress={addField}><Plus size={14} /> ADD FIELD</Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-default/10 pt-5">
                <Button type="button" variant="secondary" className="min-w-32" onPress={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" variant="primary" className="min-w-40" isDisabled={saving || !recipientEmail || !amount}>
                  <Send size={14} />
                  {saving ? "Creating..." : sendEmail ? "Create & Send" : "Save Draft"}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // LIST VIEW
  // ========================================================================
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-black tracking-[0.18em] uppercase text-foreground m-0">Invoices</h2>
          <p className="text-[11px] text-muted mt-1">{invoices.length} total</p>
        </div>
        <div className="flex gap-2 items-center">
          <SearchField aria-label="Search invoices" value={searchTerm} onChange={setSearchTerm} className="w-[200px]" />
          <Button variant="secondary" size="sm" onPress={handleExportCsv}><FileDown size={14} /> CSV</Button>
          <Button variant="primary" size="sm" onPress={() => setShowCreate(true)}><Plus size={14} /> NEW</Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<FileText size={16} />} label="Total" count={summary.total} amount={summary.totalAmount} currency="USD" />
          <StatCard icon={<Clock size={16} />} label="Pending" count={summary.pending} amount={summary.pendingAmount} currency="USD" color="warning" />
          <StatCard icon={<CheckCircle size={16} />} label="Submitted" count={summary.completed} amount={summary.completedAmount} currency="USD" color="success" />
          <StatCard icon={<DollarSign size={16} />} label="Paid" count={summary.paid} amount={summary.paidAmount} currency="USD" color="success" />
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide whitespace-nowrap transition-colors border-none cursor-pointer ${
              statusFilter === f.key
                ? "bg-foreground text-background"
                : "bg-foreground/[0.04] text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table aria-label="Invoices">
        <Table.ScrollContainer>
          <Table.Content className="min-w-[800px]">
            <Table.Header>
              <Table.Column isRowHeader id="invoice" className="w-[100px]">INVOICE</Table.Column>
              <Table.Column id="recipient">RECIPIENT</Table.Column>
              <Table.Column id="amount">AMOUNT</Table.Column>
              <Table.Column id="status" className="w-[100px]">STATUS</Table.Column>
              <Table.Column id="due" className="w-[90px]">DUE</Table.Column>
              <Table.Column id="date" className="w-[90px]">CREATED</Table.Column>
              <Table.Column className="text-end w-[150px]" id="actions">ACTIONS</Table.Column>
            </Table.Header>
            <Table.Body
              items={filteredInvoices}
              renderEmptyState={() => (
                <div className="py-16 flex flex-col items-center gap-3">
                  <FileText size={28} className="text-muted/30" />
                  <p className="text-muted text-xs font-bold tracking-widest uppercase">
                    {debouncedSearch || statusFilter !== "all" ? "NO MATCHING INVOICES" : "NO INVOICES YET"}
                  </p>
                </div>
              )}
            >
              {(inv: Invoice) => (
                <Table.Row key={inv.id} id={inv.id}>
                  <Table.Cell>
                    <span className="text-[11px] font-black text-foreground/70">
                      {inv.invoiceNumber || `INV-${inv.id.slice(0, 6).toUpperCase()}`}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-bold text-foreground">{inv.recipientName || inv.recipientEmail}</span>
                      {inv.recipientName && <span className="text-[10px] text-muted">{inv.recipientEmail}</span>}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-[13px] font-black">{formatCurrency(inv.amount, inv.currency)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip color={STATUS_CONFIG[inv.status]?.color || "default"} size="sm" variant="soft">
                      <Chip.Label>{STATUS_CONFIG[inv.status]?.label || inv.status.toUpperCase()}</Chip.Label>
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    {inv.dueDate ? (
                      <span className={`text-[10px] font-bold ${new Date(inv.dueDate) < new Date() && inv.status !== "paid" && inv.status !== "completed" ? "text-red-400" : "text-muted"}`}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    ) : <span className="text-[10px] text-muted/30">—</span>}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-[10px] text-muted">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" isIconOnly onPress={() => setDetailInvoice(inv)} aria-label="View"><Eye size={14} /></Button>
                      {inv.status === "completed" || inv.status === "paid" ? (
                        <Button size="sm" variant="ghost" isIconOnly onPress={() => handleDownloadPdf(inv.id)} aria-label="PDF"><Download size={14} /></Button>
                      ) : null}
                      {canResend(inv) && (
                        <Button size="sm" variant="ghost" isIconOnly onPress={() => handleResend(inv.id)} aria-label="Resend"><Send size={14} /></Button>
                      )}
                      {canResend(inv) && (
                        <Button size="sm" variant="ghost" isIconOnly onPress={() => handleRemind(inv.id)} aria-label="Remind"><Bell size={14} /></Button>
                      )}
                      <Button {...(ACTION_BUTTON.delete as any)} isIconOnly onPress={() => handleDelete(inv.id)} aria-label="Delete"><Trash2 size={14} /></Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Detail Modal */}
      {detailInvoice && (
        <DashboardModal title="Invoice Details" width={560} onClose={() => setDetailInvoice(null)}>
          <div className="flex flex-col gap-5">
            {/* Amount header */}
            <div className="flex justify-between items-center p-5 rounded-2xl border border-default/10 bg-foreground/[0.02]">
              <div>
                <div className="text-[9px] font-black tracking-[0.2em] text-muted mb-1.5">INVOICE</div>
                <div className="text-base font-black text-foreground">
                  {detailInvoice.invoiceNumber || `INV-${detailInvoice.id.slice(0, 8).toUpperCase()}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black tracking-[0.2em] text-muted mb-1.5">AMOUNT</div>
                <div className="text-2xl font-black text-foreground">{formatCurrency(detailInvoice.amount, detailInvoice.currency)}</div>
              </div>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-2.5 text-sm">
              <DetailRow label="RECIPIENT" value={detailInvoice.recipientName || detailInvoice.recipientEmail} />
              {detailInvoice.recipientName && <DetailRow label="EMAIL" value={detailInvoice.recipientEmail} muted />}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tracking-wider text-muted">STATUS</span>
                <Chip color={STATUS_CONFIG[detailInvoice.status]?.color || "default"} size="sm" variant="soft">
                  <Chip.Label>{STATUS_CONFIG[detailInvoice.status]?.label || detailInvoice.status.toUpperCase()}</Chip.Label>
                </Chip>
              </div>
              <DetailRow label="CREATED" value={new Date(detailInvoice.createdAt).toLocaleString()} muted />
              {detailInvoice.dueDate && <DetailRow label="DUE DATE" value={new Date(detailInvoice.dueDate).toLocaleDateString()} muted />}
              {detailInvoice.viewedAt && <DetailRow label="VIEWED" value={new Date(detailInvoice.viewedAt).toLocaleString()} muted />}
              {detailInvoice.submittedAt && <DetailRow label="SUBMITTED" value={new Date(detailInvoice.submittedAt).toLocaleString()} muted />}
              {detailInvoice.paymentDate && <DetailRow label="PAID" value={new Date(detailInvoice.paymentDate).toLocaleString()} muted />}
              {detailInvoice.paymentMethod && <DetailRow label="PAY METHOD" value={detailInvoice.paymentMethod} muted />}
              {detailInvoice.paymentRef && <DetailRow label="PAY REF" value={detailInvoice.paymentRef} muted />}
              {detailInvoice.resendCount > 0 && <DetailRow label="RESENT" value={`${detailInvoice.resendCount}x`} muted />}
            </div>

            {detailInvoice.description && (
              <div className="p-4 rounded-xl border border-default/10 bg-foreground/[0.02]">
                <div className="text-[9px] font-black tracking-[0.2em] text-muted mb-2">DESCRIPTION</div>
                <div className="text-[13px] text-foreground/70 leading-relaxed">{detailInvoice.description}</div>
              </div>
            )}

            {detailInvoice.notes && (
              <div className="p-4 rounded-xl border border-default/10 bg-foreground/[0.02]">
                <div className="text-[9px] font-black tracking-[0.2em] text-muted mb-2">INTERNAL NOTES</div>
                <div className="text-[13px] text-foreground/70 leading-relaxed">{detailInvoice.notes}</div>
              </div>
            )}

            {/* Submitted data */}
            {detailInvoice.formData && (() => {
              let data: Record<string, string> = {};
              let fields: FormFieldDef[] = [];
              try { data = JSON.parse(detailInvoice.formData); fields = JSON.parse(detailInvoice.formFields); } catch { /* ignore */ }
              if (Object.keys(data).length === 0) return null;
              return (
                <div className="p-4 rounded-xl border border-default/10 bg-foreground/[0.02]">
                  <div className="text-[9px] font-black tracking-[0.2em] text-muted mb-3">SUBMITTED DATA</div>
                  <div className="flex flex-col gap-2">
                    {fields.map((field) => (
                      <div key={field.key} className="flex justify-between py-1.5 border-b border-default/6 last:border-0">
                        <span className="text-[11px] text-muted">{field.label}</span>
                        <span className="text-[12px] font-semibold text-foreground/80 max-w-[60%] text-right">{data[field.key] || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Status Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-default/10">
              {detailInvoice.status === "completed" && (
                <Button size="sm" variant="primary" onPress={() => updateInvoiceStatus(detailInvoice.id, "paid")}>
                  <CreditCard size={13} /> Mark Paid
                </Button>
              )}
              {canResend(detailInvoice) && (
                <>
                  <Button size="sm" variant="secondary" onPress={() => handleResend(detailInvoice.id)}><Send size={13} /> Resend</Button>
                  <Button size="sm" variant="secondary" onPress={() => handleRemind(detailInvoice.id)}><Bell size={13} /> Remind</Button>
                </>
              )}
              {detailInvoice.status !== "cancelled" && detailInvoice.status !== "paid" && (
                <Button size="sm" variant="ghost" className="text-red-400" onPress={() => updateInvoiceStatus(detailInvoice.id, "cancelled")}>
                  <Ban size={13} /> Cancel
                </Button>
              )}
              {(detailInvoice.status === "completed" || detailInvoice.status === "paid") && (
                <Button size="sm" variant="secondary" onPress={() => handleDownloadPdf(detailInvoice.id)}><Download size={13} /> PDF</Button>
              )}
              <Button size="sm" variant="secondary" className="ml-auto" onPress={() => setDetailInvoice(null)}>Close</Button>
            </div>
          </div>
        </DashboardModal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[10px] font-black tracking-wider text-muted">{label}</span>
      <span className={`text-[12px] ${muted ? "text-muted" : "font-semibold text-foreground/90"}`}>{value}</span>
    </div>
  );
}

function StatCard({ icon, label, count, amount, currency, color }: {
  icon: React.ReactNode; label: string; count: number; amount: number; currency: string; color?: string;
}) {
  const fmt = (amt: number) => {
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amt); }
    catch { return `${amt.toFixed(0)}`; }
  };
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-default/10 bg-foreground/[0.02]">
      <div className="flex items-center gap-2">
        <span className={`${color === "warning" ? "text-yellow-500" : color === "success" ? "text-green-500" : "text-muted"}`}>{icon}</span>
        <span className="text-[9px] font-black tracking-[0.18em] uppercase text-muted">{label}</span>
      </div>
      <div className="text-lg font-black text-foreground">{count}</div>
      <div className="text-[11px] text-muted">{fmt(amount)}</div>
    </div>
  );
}

function MiniActionBtn({ icon, onClick, disabled, title, className }: {
  icon: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-default bg-transparent border-none cursor-pointer ${className || ""}`}
    >
      {icon}
    </button>
  );
}
