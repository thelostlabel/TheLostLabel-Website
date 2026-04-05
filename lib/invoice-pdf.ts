import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";

import type { FormField } from "@/lib/invoice-schemas";

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
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateShort(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().slice(0, 10);
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const LABEL_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "The Lost Label";
const LABEL_URL = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/^https?:\/\//, "");

// Colors
const BLACK = rgb(0.06, 0.06, 0.06);
const DARK = rgb(0.15, 0.15, 0.15);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.65, 0.65, 0.65);
const FAINT = rgb(0.85, 0.85, 0.85);
const ACCENT = rgb(0.13, 0.13, 0.13);
const WHITE = rgb(1, 1, 1);

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
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 595;
  const rightEdge = pageWidth - margin;
  let y = 800;

  // ── Helper functions ──
  const drawLine = (yPos: number, thickness = 0.5, color = FAINT) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: rightEdge, y: yPos },
      thickness,
      color,
    });
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color = rgb(0.97, 0.97, 0.97)) => {
    page.drawRectangle({ x, y: yPos, width: w, height: h, color });
  };

  // =========================================================================
  // HEADER — Logo + Company info + INVOICE title
  // =========================================================================
  const logoBytes = await loadLogo();
  let logoImage;
  if (logoBytes) {
    try {
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch { /* ignore */ }
  }

  // Dark header band
  drawRect(0, y - 10, pageWidth, 70, ACCENT);

  if (logoImage) {
    const logoDims = logoImage.scale(0.07);
    page.drawImage(logoImage, {
      x: margin,
      y: y - 5,
      width: logoDims.width,
      height: logoDims.height,
    });
    // Company name next to logo
    page.drawText(LABEL_NAME.toUpperCase(), {
      x: margin + logoDims.width + 10,
      y: y + 10,
      size: 12,
      font: fontBold,
      color: WHITE,
    });
    page.drawText(LABEL_URL, {
      x: margin + logoDims.width + 10,
      y: y - 4,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6),
    });
  } else {
    page.drawText(LABEL_NAME.toUpperCase(), {
      x: margin,
      y: y + 10,
      size: 14,
      font: fontBold,
      color: WHITE,
    });
    page.drawText(LABEL_URL, {
      x: margin,
      y: y - 6,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  // INVOICE title — right side of header
  const invTitle = "INVOICE";
  const titleSize = 26;
  const titleWidth = fontBold.widthOfTextAtSize(invTitle, titleSize);
  page.drawText(invTitle, {
    x: rightEdge - titleWidth,
    y: y + 6,
    size: titleSize,
    font: fontBold,
    color: WHITE,
  });

  y -= 50;

  // =========================================================================
  // INVOICE META — Two columns
  // =========================================================================
  y -= 20;

  const colLeftX = margin;
  const colRightX = margin + 300;

  // Invoice number
  page.drawText("INVOICE NUMBER", { x: colLeftX, y, size: 7, font: fontBold, color: GRAY });
  y -= 14;
  const displayId = data.invoiceId.startsWith("INV-") ? data.invoiceId : `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  page.drawText(displayId, { x: colLeftX, y, size: 12, font: fontBold, color: BLACK });
  y -= 22;

  // Date issued
  page.drawText("DATE ISSUED", { x: colLeftX, y, size: 7, font: fontBold, color: GRAY });
  y -= 13;
  page.drawText(formatDate(data.createdAt), { x: colLeftX, y, size: 10, font: fontRegular, color: DARK });
  y -= 18;

  // Date submitted
  if (data.submittedAt) {
    page.drawText("DATE SUBMITTED", { x: colLeftX, y, size: 7, font: fontBold, color: GRAY });
    y -= 13;
    page.drawText(formatDate(data.submittedAt), { x: colLeftX, y, size: 10, font: fontRegular, color: DARK });
    y -= 18;
  }

  // Due date
  if (data.dueDate) {
    page.drawText("DUE DATE", { x: colLeftX, y, size: 7, font: fontBold, color: GRAY });
    y -= 13;
    page.drawText(formatDate(data.dueDate), { x: colLeftX, y, size: 10, font: fontRegular, color: DARK });
    y -= 18;
  }

  const afterLeftCol = y;

  // Right column — Amount box
  y = 730 - 20;
  // Amount background box
  drawRect(colRightX - 10, y - 45, rightEdge - colRightX + 10, 65, rgb(0.96, 0.96, 0.96));
  page.drawText("AMOUNT DUE", { x: colRightX, y, size: 7, font: fontBold, color: GRAY });
  y -= 20;
  const amountStr = formatCurrency(data.amount, data.currency);
  page.drawText(amountStr, { x: colRightX, y, size: 24, font: fontBold, color: BLACK });
  y -= 18;
  page.drawText(data.currency, { x: colRightX, y, size: 9, font: fontRegular, color: LIGHT_GRAY });

  y = Math.min(afterLeftCol, y) - 14;
  drawLine(y + 4, 1, FAINT);
  y -= 20;

  // =========================================================================
  // BILL FROM / BILL TO
  // =========================================================================
  const fromToY = y;

  // BILL FROM
  page.drawText("BILL FROM", { x: colLeftX, y, size: 7, font: fontBold, color: GRAY });
  y -= 16;
  page.drawText(LABEL_NAME, { x: colLeftX, y, size: 11, font: fontBold, color: BLACK });
  y -= 14;
  page.drawText(LABEL_URL, { x: colLeftX, y, size: 9, font: fontRegular, color: LIGHT_GRAY });
  const afterFrom = y - 10;

  // BILL TO
  y = fromToY;
  page.drawText("BILL TO", { x: colRightX, y, size: 7, font: fontBold, color: GRAY });
  y -= 16;

  // Render recipient info from form data
  const recipientLines: string[] = [];
  for (const field of data.formFields) {
    const value = data.formData[field.key];
    if (value && value.trim()) {
      recipientLines.push(value.trim());
    }
  }
  if (recipientLines.length === 0) {
    recipientLines.push(data.recipientName || data.recipientEmail);
  }

  for (let i = 0; i < Math.min(recipientLines.length, 8); i++) {
    const line = recipientLines[i];
    const isFirst = i === 0;
    page.drawText(line, {
      x: colRightX, y,
      size: isFirst ? 11 : 9,
      font: isFirst ? fontBold : fontRegular,
      color: isFirst ? BLACK : GRAY,
    });
    y -= isFirst ? 16 : 13;
  }

  y = Math.min(afterFrom, y) - 10;
  drawLine(y + 4, 0.5, FAINT);
  y -= 24;

  // =========================================================================
  // LINE ITEMS TABLE
  // =========================================================================

  // Table header background
  drawRect(margin, y - 4, rightEdge - margin, 20, rgb(0.94, 0.94, 0.94));

  page.drawText("DESCRIPTION", { x: margin + 8, y, size: 8, font: fontBold, color: DARK });
  const amtLabel = "AMOUNT";
  const amtLabelWidth = fontBold.widthOfTextAtSize(amtLabel, 8);
  page.drawText(amtLabel, { x: rightEdge - amtLabelWidth - 8, y, size: 8, font: fontBold, color: DARK });
  y -= 22;

  // Line item
  const descText = data.description || "Invoice payment";
  page.drawText(descText, { x: margin + 8, y, size: 10, font: fontRegular, color: BLACK });
  const amtValueWidth = fontRegular.widthOfTextAtSize(amountStr, 10);
  page.drawText(amountStr, { x: rightEdge - amtValueWidth - 8, y, size: 10, font: fontRegular, color: BLACK });
  y -= 20;

  drawLine(y + 6, 0.5, FAINT);
  y -= 8;

  // Subtotal
  page.drawText("Subtotal", { x: margin + 8, y, size: 9, font: fontRegular, color: GRAY });
  const subWidth = fontRegular.widthOfTextAtSize(amountStr, 9);
  page.drawText(amountStr, { x: rightEdge - subWidth - 8, y, size: 9, font: fontRegular, color: GRAY });
  y -= 16;

  // Tax
  page.drawText("Tax", { x: margin + 8, y, size: 9, font: fontRegular, color: GRAY });
  const taxStr = formatCurrency(0, data.currency);
  const taxWidth = fontRegular.widthOfTextAtSize(taxStr, 9);
  page.drawText(taxStr, { x: rightEdge - taxWidth - 8, y, size: 9, font: fontRegular, color: GRAY });
  y -= 18;

  drawLine(y + 6, 1, DARK);
  y -= 6;

  // Total row — bold highlight
  drawRect(margin, y - 8, rightEdge - margin, 26, rgb(0.94, 0.94, 0.94));
  page.drawText("TOTAL", { x: margin + 8, y, size: 11, font: fontBold, color: BLACK });
  const totalWidth = fontBold.widthOfTextAtSize(amountStr, 13);
  page.drawText(amountStr, { x: rightEdge - totalWidth - 8, y - 1, size: 13, font: fontBold, color: BLACK });
  y -= 36;

  // =========================================================================
  // PAYMENT INFO
  // =========================================================================
  if (y > 180) {
    drawLine(y + 6, 0.5, FAINT);
    y -= 14;

    page.drawText("PAYMENT INFORMATION", { x: margin, y, size: 7, font: fontBold, color: GRAY });
    y -= 16;
    page.drawText(`Currency: ${data.currency}`, { x: margin, y, size: 9, font: fontRegular, color: DARK });
    y -= 13;
    page.drawText(`Status: ${data.submittedAt ? "Submitted" : "Pending"}`, { x: margin, y, size: 9, font: fontRegular, color: DARK });
    y -= 30;
  }

  // =========================================================================
  // FOOTER
  // =========================================================================
  // Footer line
  drawLine(65, 0.5, FAINT);

  // Footer text
  const footerLines = [
    `This invoice was generated on ${formatDateShort(new Date())} by ${LABEL_NAME}.`,
    "Please retain this document for your records.",
  ];
  let footerY = 52;
  for (const line of footerLines) {
    page.drawText(line, { x: margin, y: footerY, size: 7, font: fontRegular, color: LIGHT_GRAY });
    footerY -= 10;
  }

  // Page number
  const pageNumText = "Page 1 of 1";
  const pageNumWidth = fontRegular.widthOfTextAtSize(pageNumText, 7);
  page.drawText(pageNumText, {
    x: rightEdge - pageNumWidth,
    y: 32,
    size: 7,
    font: fontRegular,
    color: LIGHT_GRAY,
  });

  // Logo watermark in footer (small)
  if (logoImage) {
    const wmDims = logoImage.scale(0.035);
    page.drawImage(logoImage, {
      x: rightEdge - wmDims.width,
      y: 42,
      width: wmDims.width,
      height: wmDims.height,
      opacity: 0.08,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
