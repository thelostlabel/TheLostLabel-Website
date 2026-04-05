"use client";

import { useState, useEffect, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cinematicAuthStyles } from "@/app/auth/cinematic-auth-styles";

type FormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
};

type InvoiceInfo = {
  id: string;
  invoiceNumber: string | null;
  recipientName: string | null;
  amount: number;
  currency: string;
  description: string | null;
  formFields: FormField[];
  status: string;
  tokenExpiry: string | null;
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function getDaysLeft(expiry: string | null): number | null {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL";

const invoiceStyles = `
  .inv-field { margin-bottom: 0; }
  .inv-field label {
    display: block;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .inv-field input,
  .inv-field textarea,
  .inv-field select {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255,255,255,0.025);
    border: 1.5px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    outline: none;
    transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
    box-sizing: border-box;
  }
  .inv-field textarea { resize: vertical; min-height: 80px; }
  .inv-field input::placeholder,
  .inv-field textarea::placeholder { color: rgba(255,255,255,0.12); }
  .inv-field input:hover, .inv-field textarea:hover, .inv-field select:hover {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.04);
  }
  .inv-field input:focus, .inv-field textarea:focus, .inv-field select:focus {
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.04);
    box-shadow: 0 0 0 4px rgba(255,255,255,0.03);
  }
  .inv-field.has-error input, .inv-field.has-error textarea, .inv-field.has-error select {
    border-color: rgba(255,80,80,0.4);
    box-shadow: 0 0 0 3px rgba(255,80,80,0.06);
  }
  .inv-field .field-error {
    font-size: 10px; color: rgba(255,100,100,0.8); margin-top: 6px; font-weight: 600;
  }
  .inv-field select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.3)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
  }
  .inv-field select option { background: #1a1a1a; color: #fff; }

  .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .inv-grid-full { grid-column: 1 / -1; }
  @media (max-width: 540px) { .inv-grid { grid-template-columns: 1fr; } }

  .inv-card {
    background: rgba(255,255,255,0.015);
    border: 1.5px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 32px;
    backdrop-filter: blur(12px);
  }
  @media (max-width: 540px) { .inv-card { padding: 24px 20px; } }

  .inv-summary {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 28px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .inv-summary::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  }

  .inv-section-label {
    font-size: 9px; font-weight: 800; letter-spacing: 3px;
    color: rgba(255,255,255,0.2); text-transform: uppercase;
    margin-bottom: 20px; display: flex; align-items: center; gap: 12px;
  }
  .inv-section-label::before {
    content: ''; width: 20px; height: 1.5px;
    background: rgba(255,255,255,0.12); border-radius: 1px;
  }
  .inv-divider {
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    margin: 20px 0;
  }

  .inv-brand { text-align: center; margin-bottom: 36px; }
  .inv-brand-name { font-size: 10px; font-weight: 800; letter-spacing: 7px; color: rgba(255,255,255,0.2); }
  .inv-brand-type { font-size: 8px; font-weight: 700; letter-spacing: 4px; color: rgba(255,255,255,0.1); margin-top: 6px; }

  .inv-submit {
    width: 100%; padding: 16px 24px;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 16px; color: #fff; font-family: inherit;
    font-size: 10px; font-weight: 800; letter-spacing: 3.5px;
    text-transform: uppercase; cursor: pointer;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); outline: none;
  }
  .inv-submit:hover:not(:disabled) {
    background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);
    box-shadow: 0 0 40px rgba(255,255,255,0.04); transform: translateY(-1px);
  }
  .inv-submit:active:not(:disabled) { transform: translateY(0); }
  .inv-submit:disabled { opacity: 0.35; cursor: not-allowed; }

  .inv-error {
    background: rgba(255,60,60,0.06); border: 1.5px solid rgba(255,60,60,0.15);
    border-radius: 14px; padding: 14px 18px; margin-bottom: 20px;
    font-size: 12px; color: rgba(255,120,120,0.9); text-align: center; font-weight: 500;
  }
  .inv-hint {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; background: rgba(255,255,255,0.012);
    border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; margin-bottom: 10px;
  }
  .inv-hint-icon { font-size: 15px; opacity: 0.25; flex-shrink: 0; }
  .inv-hint-text { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.55; }

  .inv-progress { display: flex; gap: 6px; margin-bottom: 32px; }
  .inv-progress-step {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.06); transition: background 0.4s;
  }
  .inv-progress-step.active { background: rgba(255,255,255,0.25); }
  .inv-progress-step.done { background: rgba(255,255,255,0.4); }

  .inv-notice {
    font-size: 10px; color: rgba(255,255,255,0.18); line-height: 1.8;
    text-align: center; margin-top: 14px; letter-spacing: 0.02em;
  }

  .inv-expiry {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 8px 16px; border-radius: 10px; margin-bottom: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .inv-expiry.ok { background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.04); }
  .inv-expiry.warn { background: rgba(255,180,0,0.06); color: rgba(255,180,0,0.7); border: 1px solid rgba(255,180,0,0.1); }
  .inv-expiry.danger { background: rgba(255,60,60,0.06); color: rgba(255,80,80,0.7); border: 1px solid rgba(255,60,60,0.1); }

  .inv-autosave {
    font-size: 9px; font-weight: 600; letter-spacing: 1px; color: rgba(255,255,255,0.15);
    text-align: center; margin-top: 8px;
  }
`;

const HALF_WIDTH_KEYS = new Set([
  "city", "postalCode", "postal_code", "zip", "zipCode", "zip_code",
  "country", "state", "province", "region",
  "phone", "phoneNumber", "phone_number",
  "taxId", "tax_id", "vatNumber", "vat_number", "taxNumber", "tax_number",
]);

function isHalfWidth(field: FormField): boolean {
  if (field.type === "textarea") return false;
  return HALF_WIDTH_KEYS.has(field.key);
}

export default function InvoiceFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<InvoiceInfo | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);

  const STORAGE_KEY = `invoice_form_${token}`;

  // Auto-save to localStorage
  const saveToStorage = useCallback((data: Record<string, string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAutoSaveMsg("Draft saved");
      setTimeout(() => setAutoSaveMsg(null), 2000);
    } catch { /* ignore */ }
  }, [STORAGE_KEY]);

  const loadFromStorage = useCallback((): Record<string, string> | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  }, [STORAGE_KEY]);

  const clearStorage = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [STORAGE_KEY]);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load invoice");
          return;
        }
        setInvoice(data.invoice);

        // Try to restore from localStorage first
        const savedData = loadFromStorage();
        const initial: Record<string, string> = {};
        for (const field of data.invoice.formFields) {
          initial[field.key] = savedData?.[field.key] || "";
        }
        setFormData(initial);

        if (savedData && Object.values(savedData).some((v) => v.trim())) {
          setAutoSaveMsg("Restored from draft");
          setTimeout(() => setAutoSaveMsg(null), 3000);
        }
      } catch {
        setError("Failed to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [token, loadFromStorage]);

  // Auto-save on change (debounced)
  useEffect(() => {
    if (!invoice || success) return;
    const hasData = Object.values(formData).some((v) => v.trim());
    if (!hasData) return;

    const timer = setTimeout(() => saveToStorage(formData), 1000);
    return () => clearTimeout(timer);
  }, [formData, invoice, success, saveToStorage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const allTouched: Record<string, boolean> = {};
    invoice.formFields.forEach((f) => { allTouched[f.key] = true; });
    setTouched(allTouched);

    for (const field of invoice.formFields) {
      if (field.required && (!formData[field.key] || !formData[field.key].trim())) {
        setError(`"${field.label}" is required`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        clearStorage();
      } else {
        setError(data.error || "Failed to submit");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const markTouched = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  const requiredFields = invoice?.formFields.filter((f) => f.required) || [];
  const optionalFields = invoice?.formFields.filter((f) => !f.required) || [];
  const totalFields = invoice?.formFields.length || 0;
  const filledFields = invoice?.formFields.filter((f) => formData[f.key]?.trim()).length || 0;
  const daysLeft = getDaysLeft(invoice?.tokenExpiry || null);

  const getFieldError = (field: FormField): string | null => {
    if (!touched[field.key]) return null;
    if (field.required && (!formData[field.key] || !formData[field.key].trim())) return "This field is required";
    return null;
  };

  const renderField = (field: FormField) => {
    const fieldError = getFieldError(field);
    return (
      <div key={field.key} className={`inv-field ${isHalfWidth(field) ? "" : "inv-grid-full"} ${fieldError ? "has-error" : ""}`}>
        <label>
          {field.label}
          {field.required && <span style={{ color: "rgba(255,100,100,0.5)", marginLeft: 4 }}>*</span>}
        </label>
        {field.type === "textarea" ? (
          <textarea placeholder={field.label} value={formData[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} onBlur={() => markTouched(field.key)} required={field.required} rows={3} />
        ) : field.type === "select" && field.options ? (
          <select value={formData[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} onBlur={() => markTouched(field.key)} required={field.required}>
            <option value="">Select {field.label}</option>
            {field.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        ) : (
          <input type="text" placeholder={field.label} value={formData[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} onBlur={() => markTouched(field.key)} required={field.required} />
        )}
        {fieldError && <div className="field-error">{fieldError}</div>}
      </div>
    );
  };

  return (
    <div className="ca-root ca-centered">
      <div className="ca-grid" />
      <style dangerouslySetInnerHTML={{ __html: cinematicAuthStyles }} />
      <style dangerouslySetInnerHTML={{ __html: invoiceStyles }} />

      <div className="ca-center" style={{ maxWidth: 580, width: "100%", padding: "48px 20px" }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,0.06)", borderTop: "2px solid rgba(255,255,255,0.3)", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
              <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg) } }" }} />
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "rgba(255,255,255,0.15)" }}>LOADING INVOICE...</div>
            </motion.div>
          ) : error && !invoice ? (
            <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="inv-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, opacity: 0.2, marginBottom: 20 }}>&#9888;</div>
                <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: 4, color: "rgba(255,120,120,0.7)", marginBottom: 12, textTransform: "uppercase" }}>
                  {error.includes("expired") ? "Link Expired" : error.includes("already") ? "Already Submitted" : error.includes("cancelled") ? "Cancelled" : "Invalid Link"}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>{error}</p>
              </div>
            </motion.div>
          ) : success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <div className="inv-card" style={{ textAlign: "center", padding: "48px 32px" }}>
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
                  style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32, color: "rgba(255,255,255,0.5)" }}>
                  &#10003;
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: 5, color: "rgba(255,255,255,0.4)", marginBottom: 14, textTransform: "uppercase" }}>Invoice Submitted</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
                    Thank you! Your billing information has been received. An official invoice document will be generated and sent to your email.
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 28 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.2)" }}>
                    &#128196; YOU CAN CLOSE THIS PAGE
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : invoice ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <div className="inv-brand">
                <div className="inv-brand-name">{SITE_NAME}</div>
                <div className="inv-brand-type">INVOICE FORM</div>
              </div>

              {/* Expiry timer */}
              {daysLeft !== null && (
                <div className={`inv-expiry ${daysLeft <= 3 ? "danger" : daysLeft <= 7 ? "warn" : "ok"}`}>
                  <span>&#9200;</span>
                  <span>{daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}</span>
                </div>
              )}

              {/* Progress */}
              <div className="inv-progress">
                {Array.from({ length: Math.min(totalFields, 8) }).map((_, i) => (
                  <div key={i} className={`inv-progress-step ${i < filledFields ? "done" : i === filledFields ? "active" : ""}`} />
                ))}
              </div>

              <div className="inv-card">
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  {invoice.invoiceNumber && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.15)", marginBottom: 10 }}>
                      {invoice.invoiceNumber}
                    </div>
                  )}
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 10 }}>Billing Information</h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
                    Please provide your official billing details to process the payment.
                  </p>
                </div>

                <div className="inv-summary">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Payment Amount</div>
                      {invoice.recipientName && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>To: {invoice.recipientName}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{formatCurrency(invoice.amount, invoice.currency)}</div>
                  </div>
                  {invoice.description && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 16, lineHeight: 1.7, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {invoice.description}
                    </div>
                  )}
                </div>

                <div className="inv-hint">
                  <span className="inv-hint-icon">&#128274;</span>
                  <span className="inv-hint-text">Your information is encrypted and used only for invoice generation.</span>
                </div>
                <div className="inv-hint" style={{ marginBottom: 28 }}>
                  <span className="inv-hint-icon">&#128196;</span>
                  <span className="inv-hint-text">Fields marked with <span style={{ color: "rgba(255,100,100,0.5)" }}>*</span> are required. Your progress is saved automatically.</span>
                </div>

                <form onSubmit={handleSubmit}>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} className="inv-error">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {requiredFields.length > 0 && (
                    <>
                      <div className="inv-section-label">Required Information</div>
                      <div className="inv-grid">{requiredFields.map(renderField)}</div>
                    </>
                  )}

                  {optionalFields.length > 0 && (
                    <>
                      <div className="inv-divider" />
                      <div className="inv-section-label">Additional Details</div>
                      <div className="inv-grid">{optionalFields.map(renderField)}</div>
                    </>
                  )}

                  <div className="inv-divider" style={{ marginTop: 12, marginBottom: 28 }} />

                  <button type="submit" disabled={submitting} className="inv-submit">
                    {submitting ? "SUBMITTING..." : "SUBMIT BILLING INFORMATION"}
                  </button>

                  {autoSaveMsg && (
                    <div className="inv-autosave">&#10003; {autoSaveMsg}</div>
                  )}

                  <div className="inv-notice">
                    By submitting this form, you confirm that the information provided is accurate and complete. This data will be used to generate an official invoice document.
                  </div>
                </form>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
