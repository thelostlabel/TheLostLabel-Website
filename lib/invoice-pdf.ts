import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";

import type { FormField, InvoiceDocumentLanguage } from "@/lib/invoice-schemas";

type InvoiceData = {
  invoiceId: string;
  recipientEmail: string;
  recipientName?: string | null;
  amount: number;
  currency: string;
  description?: string | null;
  formFields: FormField[];
  formData: Record<string, string>;
  createdAt: Date;
  submittedAt?: Date | null;
  dueDate?: Date | null;
  documentLanguage?: InvoiceDocumentLanguage | null;
};

type Copy = {
  invoiceTitle: string;
  officialDocument: string;
  invoiceNumber: string;
  issueDate: string;
  submissionDate: string;
  dueDate: string;
  billedBy: string;
  billedTo: string;
  description: string;
  amount: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentSummary: string;
  currency: string;
  status: string;
  submitted: string;
  pending: string;
  footerPrimary: string;
  footerSecondary: string;
  page: string;
  notProvided: string;
  invoicePayment: string;
};

const COPY: Record<InvoiceDocumentLanguage, Copy> = {
  en: {
    invoiceTitle: "INVOICE",
    officialDocument: "Official billing document",
    invoiceNumber: "Invoice Number",
    issueDate: "Issue Date",
    submissionDate: "Submission Date",
    dueDate: "Due Date",
    billedBy: "Billed By",
    billedTo: "Billed To",
    description: "Description",
    amount: "Amount",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    paymentSummary: "Payment Summary",
    currency: "Currency",
    status: "Status",
    submitted: "Submitted",
    pending: "Pending",
    footerPrimary: "This document was generated electronically and is valid without a signature.",
    footerSecondary: "Please retain this invoice for your accounting and tax records.",
    page: "Page",
    notProvided: "Not provided",
    invoicePayment: "Invoice payment",
  },
  tr: {
    invoiceTitle: "FATURA",
    officialDocument: "Resmi faturalandirma belgesi",
    invoiceNumber: "Fatura Numarasi",
    issueDate: "Duzenleme Tarihi",
    submissionDate: "Teslim Tarihi",
    dueDate: "Vade Tarihi",
    billedBy: "Duzenleyen",
    billedTo: "Alici",
    description: "Aciklama",
    amount: "Tutar",
    subtotal: "Ara Toplam",
    tax: "Vergi",
    total: "Genel Toplam",
    paymentSummary: "Odeme Ozeti",
    currency: "Para Birimi",
    status: "Durum",
    submitted: "Teslim Edildi",
    pending: "Bekleniyor",
    footerPrimary: "Bu belge elektronik olarak olusturulmustur ve imzasiz gecerlidir.",
    footerSecondary: "Lutfen bu faturayi muhasebe ve vergi kayitlariniz icin saklayin.",
    page: "Sayfa",
    notProvided: "Belirtilmedi",
    invoicePayment: "Fatura odemesi",
  },
};

const LABEL_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "The Lost Label";
const LABEL_URL = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/^https?:\/\//, "");

const COLOR_TEXT = rgb(0.11, 0.12, 0.14);
const COLOR_MUTED = rgb(0.43, 0.45, 0.49);
const COLOR_BORDER = rgb(0.86, 0.87, 0.89);
const COLOR_PANEL = rgb(0.97, 0.97, 0.975);
const COLOR_HEADER = rgb(0.14, 0.15, 0.17);
const COLOR_WHITE = rgb(1, 1, 1);

function getCopy(language?: InvoiceDocumentLanguage | null): Copy {
  return COPY[language === "tr" ? "tr" : "en"];
}

function formatDate(value: Date | string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function wrapText(text: string, maxWidth: number, font: PDFFontLike, size: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }

  lines.push(current);
  return lines;
}

type PDFFontLike = {
  widthOfTextAtSize(text: string, size: number): number;
};

async function loadLogo(): Promise<Uint8Array | null> {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buf = await readFile(logoPath);
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const language = data.documentLanguage === "tr" ? "tr" : "en";
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const copy = getCopy(language);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const pageWidth = page.getWidth();
  const rightEdge = pageWidth - margin;
  const contentWidth = rightEdge - margin;
  const leftColWidth = 250;
  const rightColX = margin + 290;
  const rightColWidth = rightEdge - rightColX;
  let y = 794;

  const drawRule = (yPos: number, thickness = 1) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: rightEdge, y: yPos },
      thickness,
      color: COLOR_BORDER,
    });
  };

  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    yPos: number,
    width: number,
  ): number => {
    page.drawText(label.toUpperCase(), {
      x,
      y: yPos,
      size: 8,
      font: fontBold,
      color: COLOR_MUTED,
    });

    const lines = wrapText(value || copy.notProvided, width, fontRegular, 10);
    let lineY = yPos - 15;
    lines.forEach((line, index) => {
      page.drawText(line, {
        x,
        y: lineY,
        size: index === 0 ? 10.5 : 10,
        font: index === 0 ? fontBold : fontRegular,
        color: COLOR_TEXT,
      });
      lineY -= 13;
    });

    return lineY - 6;
  };

  const drawBlockLines = (
    title: string,
    lines: string[],
    x: number,
    yPos: number,
    width: number,
  ): number => {
    page.drawText(title.toUpperCase(), {
      x,
      y: yPos,
      size: 8,
      font: fontBold,
      color: COLOR_MUTED,
    });

    let lineY = yPos - 15;
    lines.forEach((line, index) => {
      const wrapped = wrapText(line, width, fontRegular, 10);
      wrapped.forEach((wrappedLine, wrappedIndex) => {
        page.drawText(wrappedLine, {
          x,
          y: lineY,
          size: index === 0 && wrappedIndex === 0 ? 10.5 : 10,
          font: index === 0 && wrappedIndex === 0 ? fontBold : fontRegular,
          color: index === 0 && wrappedIndex === 0 ? COLOR_TEXT : COLOR_MUTED,
        });
        lineY -= 13;
      });
    });

    return lineY - 6;
  };

  page.drawRectangle({
    x: 0,
    y: 742,
    width: pageWidth,
    height: 100,
    color: COLOR_HEADER,
  });

  const logoBytes = await loadLogo();
  let logoImage;
  if (logoBytes) {
    try {
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {
      logoImage = undefined;
    }
  }

  if (logoImage) {
    const logoDims = logoImage.scale(0.085);
    page.drawImage(logoImage, {
      x: margin,
      y: 766,
      width: logoDims.width,
      height: logoDims.height,
    });
  }

  const brandX = logoImage ? margin + 64 : margin;
  page.drawText(LABEL_NAME.toUpperCase(), {
    x: brandX,
    y: 792,
    size: 12,
    font: fontBold,
    color: COLOR_WHITE,
  });
  page.drawText(LABEL_URL, {
    x: brandX,
    y: 777,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.82, 0.85),
  });
  page.drawText(copy.officialDocument.toUpperCase(), {
    x: brandX,
    y: 762,
    size: 8,
    font: fontRegular,
    color: rgb(0.72, 0.74, 0.78),
  });

  const titleSize = 24;
  const titleWidth = fontBold.widthOfTextAtSize(copy.invoiceTitle, titleSize);
  page.drawText(copy.invoiceTitle, {
    x: rightEdge - titleWidth,
    y: 786,
    size: titleSize,
    font: fontBold,
    color: COLOR_WHITE,
  });

  const displayId = data.invoiceId.startsWith("INV-") ? data.invoiceId : `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  const subTitleWidth = fontRegular.widthOfTextAtSize(displayId, 10);
  page.drawText(displayId, {
    x: rightEdge - subTitleWidth,
    y: 768,
    size: 10,
    font: fontRegular,
    color: rgb(0.82, 0.84, 0.88),
  });

  y = 710;

  page.drawRectangle({
    x: margin,
    y: y - 60,
    width: contentWidth,
    height: 72,
    color: COLOR_PANEL,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  const amountLabelWidth = fontBold.widthOfTextAtSize(copy.amount.toUpperCase(), 8);
  page.drawText(copy.amount.toUpperCase(), {
    x: rightEdge - amountLabelWidth - 16,
    y: y - 4,
    size: 8,
    font: fontBold,
    color: COLOR_MUTED,
  });

  const amountText = formatCurrency(data.amount, data.currency, locale);
  const amountWidth = fontBold.widthOfTextAtSize(amountText, 20);
  page.drawText(amountText, {
    x: rightEdge - amountWidth - 16,
    y: y - 28,
    size: 20,
    font: fontBold,
    color: COLOR_TEXT,
  });

  let metaLeftY = y - 4;
  metaLeftY = drawLabelValue(copy.invoiceNumber, displayId, margin + 16, metaLeftY, 180);
  metaLeftY = drawLabelValue(copy.issueDate, formatDate(data.createdAt, locale), margin + 16, metaLeftY, 180);
  if (data.submittedAt) {
    metaLeftY = drawLabelValue(copy.submissionDate, formatDate(data.submittedAt, locale), margin + 16, metaLeftY, 180);
  }
  if (data.dueDate) {
    metaLeftY = drawLabelValue(copy.dueDate, formatDate(data.dueDate, locale), margin + 16, metaLeftY, 180);
  }

  y = Math.min(metaLeftY, y - 78);
  drawRule(y);
  y -= 24;

  const recipientLines = data.formFields
    .map((field) => data.formData[field.key]?.trim())
    .filter((value): value is string => Boolean(value));

  const buyerLines = recipientLines.length > 0
    ? recipientLines
    : [data.recipientName || data.recipientEmail];

  const sellerLines = [LABEL_NAME, LABEL_URL];

  const sellerEndY = drawBlockLines(copy.billedBy, sellerLines, margin, y, leftColWidth);
  const buyerEndY = drawBlockLines(copy.billedTo, buyerLines.slice(0, 10), rightColX, y, rightColWidth);

  y = Math.min(sellerEndY, buyerEndY);
  drawRule(y);
  y -= 26;

  page.drawText(copy.description.toUpperCase(), {
    x: margin + 12,
    y,
    size: 8,
    font: fontBold,
    color: COLOR_MUTED,
  });
  const amountHeaderWidth = fontBold.widthOfTextAtSize(copy.amount.toUpperCase(), 8);
  page.drawText(copy.amount.toUpperCase(), {
    x: rightEdge - amountHeaderWidth - 12,
    y,
    size: 8,
    font: fontBold,
    color: COLOR_MUTED,
  });

  page.drawRectangle({
    x: margin,
    y: y - 10,
    width: contentWidth,
    height: 26,
    color: COLOR_PANEL,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  y -= 28;

  const descriptionLines = wrapText(data.description || copy.invoicePayment, contentWidth - 130, fontRegular, 10);
  let descY = y;
  descriptionLines.forEach((line, index) => {
    page.drawText(line, {
      x: margin + 12,
      y: descY,
      size: 10,
      font: index === 0 ? fontBold : fontRegular,
      color: COLOR_TEXT,
    });
    descY -= 13;
  });

  const amountValueWidth = fontBold.widthOfTextAtSize(amountText, 10);
  page.drawText(amountText, {
    x: rightEdge - amountValueWidth - 12,
    y,
    size: 10,
    font: fontBold,
    color: COLOR_TEXT,
  });

  y = Math.min(descY, y - 16);
  drawRule(y + 6);
  y -= 10;

  const taxText = formatCurrency(0, data.currency, locale);
  const summaryRows = [
    { label: copy.subtotal, value: amountText, bold: false },
    { label: copy.tax, value: taxText, bold: false },
    { label: copy.total, value: amountText, bold: true },
  ];

  summaryRows.forEach((row, index) => {
    if (row.bold) {
      page.drawRectangle({
        x: rightColX,
        y: y - 7,
        width: rightColWidth,
        height: 24,
        color: COLOR_PANEL,
        borderColor: COLOR_BORDER,
        borderWidth: 1,
      });
    }

    page.drawText(row.label.toUpperCase(), {
      x: rightColX + 10,
      y,
      size: row.bold ? 9 : 8.5,
      font: row.bold ? fontBold : fontRegular,
      color: row.bold ? COLOR_TEXT : COLOR_MUTED,
    });

    const valueFont = row.bold ? fontBold : fontRegular;
    const valueSize = row.bold ? 11 : 9.5;
    const valueWidth = valueFont.widthOfTextAtSize(row.value, valueSize);
    page.drawText(row.value, {
      x: rightEdge - valueWidth - 10,
      y: row.bold ? y - 1 : y,
      size: valueSize,
      font: valueFont,
      color: COLOR_TEXT,
    });

    y -= row.bold ? 30 : 18;
  });

  y -= 4;
  drawRule(y + 10);
  y -= 18;

  page.drawText(copy.paymentSummary.toUpperCase(), {
    x: margin,
    y,
    size: 8,
    font: fontBold,
    color: COLOR_MUTED,
  });
  y -= 18;

  const statusText = data.submittedAt ? copy.submitted : copy.pending;
  const paymentRows = [
    `${copy.currency}: ${data.currency}`,
    `${copy.status}: ${statusText}`,
  ];

  paymentRows.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: COLOR_TEXT,
    });
    y -= 14;
  });

  drawRule(72);
  page.drawText(copy.footerPrimary, {
    x: margin,
    y: 54,
    size: 7.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });
  page.drawText(copy.footerSecondary, {
    x: margin,
    y: 42,
    size: 7.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  const pageText = `${copy.page} 1/1`;
  const pageWidthText = fontRegular.widthOfTextAtSize(pageText, 7.5);
  page.drawText(pageText, {
    x: rightEdge - pageWidthText,
    y: 42,
    size: 7.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
