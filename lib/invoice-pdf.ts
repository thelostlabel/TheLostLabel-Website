import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const margin = 50;
  const pageWidth = 595;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;

  const black = rgb(0.07, 0.07, 0.07);
  const gray = rgb(0.42, 0.42, 0.42);
  const lightGray = rgb(0.75, 0.75, 0.75);
  const lineColor = rgb(0.88, 0.88, 0.88);

  const drawText = (text: string, opts: {
    size?: number; bold?: boolean; color?: ReturnType<typeof rgb>;
    gap?: number; x?: number; maxWidth?: number;
  } = {}) => {
    const size = opts.size || 10;
    const font = opts.bold ? fontBold : fontRegular;
    const color = opts.color || black;
    const x = opts.x ?? margin;
    const maxW = opts.maxWidth || contentWidth;

    const maxChars = Math.floor(maxW / (size * 0.48));
    const truncated = text.length > maxChars ? text.slice(0, maxChars - 3) + "..." : text;

    page.drawText(truncated, { x, y, size, font, color });
    y -= opts.gap || 16;
  };

  const drawRightText = (text: string, opts: {
    size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number;
  } = {}) => {
    const size = opts.size || 10;
    const font = opts.bold ? fontBold : fontRegular;
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightEdge - width, y, size, font, color: opts.color || black });
    y -= opts.gap || 16;
  };

  const drawLine = (yPos: number, thickness = 0.5) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: rightEdge, y: yPos },
      thickness,
      color: lineColor,
    });
  };

  const drawKeyValue = (key: string, value: string, opts?: { bold?: boolean }) => {
    const keyFont = fontRegular;
    const valFont = opts?.bold ? fontBold : fontRegular;
    page.drawText(key, { x: margin, y, size: 9, font: keyFont, color: gray });
    page.drawText(value, { x: margin + 140, y, size: 10, font: valFont, color: black });
    y -= 18;
  };

  // =========================================================================
  // HEADER
  // =========================================================================
  drawText(LABEL_NAME, { bold: true, size: 9, color: gray, gap: 6 });
  drawText(LABEL_URL, { size: 8, color: lightGray, gap: 20 });

  // Invoice title — right aligned
  const invTitle = "INVOICE";
  const titleFont = fontBold;
  const titleSize = 28;
  const titleWidth = titleFont.widthOfTextAtSize(invTitle, titleSize);
  page.drawText(invTitle, { x: rightEdge - titleWidth, y: y + 14, size: titleSize, font: titleFont, color: black });
  y -= 16;

  drawLine(y + 4, 1);
  y -= 16;

  // =========================================================================
  // INVOICE INFO (two columns)
  // =========================================================================
  const colLeftX = margin;
  const colRightX = margin + 280;
  const infoY = y;

  // Left column — invoice details
  page.drawText("INVOICE NO", { x: colLeftX, y, size: 8, font: fontRegular, color: gray });
  y -= 14;
  const displayId = data.invoiceId.startsWith("INV-") ? data.invoiceId : `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  page.drawText(displayId, { x: colLeftX, y, size: 11, font: fontBold, color: black });
  y -= 20;

  page.drawText("DATE ISSUED", { x: colLeftX, y, size: 8, font: fontRegular, color: gray });
  y -= 14;
  page.drawText(formatDate(data.createdAt), { x: colLeftX, y, size: 10, font: fontRegular, color: black });
  y -= 20;

  if (data.submittedAt) {
    page.drawText("DATE SUBMITTED", { x: colLeftX, y, size: 8, font: fontRegular, color: gray });
    y -= 14;
    page.drawText(formatDate(data.submittedAt), { x: colLeftX, y, size: 10, font: fontRegular, color: black });
    y -= 20;
  }

  if (data.dueDate) {
    page.drawText("DUE DATE", { x: colLeftX, y, size: 8, font: fontRegular, color: gray });
    y -= 14;
    page.drawText(formatDate(data.dueDate), { x: colLeftX, y, size: 10, font: fontRegular, color: black });
    y -= 20;
  }

  const afterLeftCol = y;

  // Right column — amount
  y = infoY;
  page.drawText("AMOUNT DUE", { x: colRightX, y, size: 8, font: fontRegular, color: gray });
  y -= 18;
  const amountStr = formatCurrency(data.amount, data.currency);
  page.drawText(amountStr, { x: colRightX, y, size: 22, font: fontBold, color: black });
  y -= 30;
  page.drawText(data.currency, { x: colRightX, y, size: 9, font: fontRegular, color: lightGray });

  y = Math.min(afterLeftCol, y) - 10;
  drawLine(y + 4);
  y -= 20;

  // =========================================================================
  // FROM / TO
  // =========================================================================
  const fromToY = y;

  // FROM (left)
  page.drawText("FROM", { x: colLeftX, y, size: 8, font: fontBold, color: gray });
  y -= 16;
  page.drawText(LABEL_NAME, { x: colLeftX, y, size: 10, font: fontBold, color: black });
  y -= 14;
  page.drawText(LABEL_URL, { x: colLeftX, y, size: 9, font: fontRegular, color: gray });

  const afterFrom = y - 10;

  // TO (right)
  y = fromToY;
  page.drawText("TO", { x: colRightX, y, size: 8, font: fontBold, color: gray });
  y -= 16;

  // Render form data as recipient info
  const recipientLines: string[] = [];
  for (const field of data.formFields) {
    const value = data.formData[field.key];
    if (value && value.trim()) {
      recipientLines.push(`${value.trim()}`);
    }
  }
  if (recipientLines.length === 0) {
    recipientLines.push(data.recipientName || data.recipientEmail);
  }

  for (const line of recipientLines.slice(0, 8)) {
    const isFirst = line === recipientLines[0];
    page.drawText(line, {
      x: colRightX, y,
      size: isFirst ? 10 : 9,
      font: isFirst ? fontBold : fontRegular,
      color: isFirst ? black : gray,
    });
    y -= isFirst ? 16 : 14;
  }

  y = Math.min(afterFrom, y) - 10;
  drawLine(y + 4);
  y -= 20;

  // =========================================================================
  // DESCRIPTION / LINE ITEMS
  // =========================================================================
  page.drawText("DESCRIPTION", { x: margin, y, size: 8, font: fontBold, color: gray });
  const amtLabel = "AMOUNT";
  const amtLabelWidth = fontBold.widthOfTextAtSize(amtLabel, 8);
  page.drawText(amtLabel, { x: rightEdge - amtLabelWidth, y, size: 8, font: fontBold, color: gray });
  y -= 14;
  drawLine(y + 4);
  y -= 14;

  const descText = data.description || "Invoice payment";
  page.drawText(descText, { x: margin, y, size: 10, font: fontRegular, color: black });
  const amtValueWidth = fontBold.widthOfTextAtSize(amountStr, 10);
  page.drawText(amountStr, { x: rightEdge - amtValueWidth, y, size: 10, font: fontBold, color: black });
  y -= 20;

  drawLine(y + 6);
  y -= 14;

  // Total row
  const totalLabel = "TOTAL";
  page.drawText(totalLabel, { x: margin, y, size: 10, font: fontBold, color: black });
  const totalWidth = fontBold.widthOfTextAtSize(amountStr, 12);
  page.drawText(amountStr, { x: rightEdge - totalWidth, y, size: 12, font: fontBold, color: black });
  y -= 24;

  drawLine(y + 8, 1.5);
  y -= 30;

  // =========================================================================
  // FOOTER NOTES
  // =========================================================================
  if (y > 120) {
    const footerLines = [
      "This invoice documents the payment agreement between the parties listed above.",
      "Please retain this document for your records.",
      `Generated on ${formatDateShort(new Date())} — ${LABEL_NAME}`,
    ];
    for (const line of footerLines) {
      page.drawText(line, { x: margin, y, size: 8, font: fontRegular, color: lightGray });
      y -= 12;
    }
  }

  // Page number
  page.drawText("Page 1 of 1", {
    x: rightEdge - fontRegular.widthOfTextAtSize("Page 1 of 1", 7),
    y: 30,
    size: 7,
    font: fontRegular,
    color: lightGray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
