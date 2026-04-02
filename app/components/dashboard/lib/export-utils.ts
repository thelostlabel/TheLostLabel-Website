import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportColumn {
    key: string;
    label: string;
    format?: (val: any) => string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveValue(obj: any, key: string): any {
    return key.split('.').reduce((acc, part) => acc?.[part], obj);
}

function cellText(row: any, col: ExportColumn): string {
    const raw = resolveValue(row, col.key);
    if (col.format) return col.format(raw);
    if (raw == null) return '';
    if (typeof raw === 'number') return raw.toLocaleString();
    if (raw instanceof Date) return raw.toLocaleDateString();
    return String(raw);
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export function exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
    const BOM = '\uFEFF';
    const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const text = cellText(row, col).replace(/"/g, '""');
            return `"${text}"`;
        }).join(',')
    );
    const csv = BOM + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

// ---------------------------------------------------------------------------
// PDF Export
// ---------------------------------------------------------------------------

export async function exportToPDF(
    data: any[],
    columns: ExportColumn[],
    filename: string,
    title: string,
) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const PAGE_WIDTH = 842; // A4 landscape width
    const PAGE_HEIGHT = 595; // A4 landscape height
    const MARGIN = 40;
    const HEADER_HEIGHT = 14;
    const ROW_HEIGHT = 18;
    const FONT_SIZE = 8;
    const HEADER_FONT_SIZE = 8;
    const TITLE_FONT_SIZE = 14;

    const usableWidth = PAGE_WIDTH - MARGIN * 2;
    const colWidth = usableWidth / columns.length;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    // Title
    page.drawText(title, { x: MARGIN, y, size: TITLE_FONT_SIZE, font: fontBold, color: rgb(0, 0, 0) });
    y -= 10;

    // Date
    page.drawText(`Exported: ${new Date().toLocaleDateString()}`, {
        x: MARGIN, y, size: 7, font, color: rgb(0.5, 0.5, 0.5),
    });
    y -= 20;

    const drawHeaderRow = () => {
        // Header background
        page.drawRectangle({
            x: MARGIN, y: y - 4, width: usableWidth, height: HEADER_HEIGHT + 4,
            color: rgb(0.92, 0.92, 0.92),
        });
        columns.forEach((col, i) => {
            page.drawText(col.label.toUpperCase(), {
                x: MARGIN + i * colWidth + 4, y: y, size: HEADER_FONT_SIZE, font: fontBold, color: rgb(0.2, 0.2, 0.2),
            });
        });
        y -= ROW_HEIGHT;
    };

    drawHeaderRow();

    for (const row of data) {
        if (y < MARGIN + ROW_HEIGHT) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
            drawHeaderRow();
        }

        columns.forEach((col, i) => {
            let text = cellText(row, col);
            // Truncate long text to fit column
            const maxChars = Math.floor(colWidth / (FONT_SIZE * 0.5));
            if (text.length > maxChars) text = text.slice(0, maxChars - 1) + '…';

            page.drawText(text, {
                x: MARGIN + i * colWidth + 4, y, size: FONT_SIZE, font, color: rgb(0.1, 0.1, 0.1),
            });
        });

        // Row separator
        page.drawLine({
            start: { x: MARGIN, y: y - 4 },
            end: { x: MARGIN + usableWidth, y: y - 4 },
            thickness: 0.5,
            color: rgb(0.88, 0.88, 0.88),
        });

        y -= ROW_HEIGHT;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    triggerDownload(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
