"use client";
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { exportToCSV, type ExportColumn } from '@/app/components/dashboard/lib/export-utils';

interface ExportButtonsProps {
    data: any[];
    columns: ExportColumn[];
    filename: string;
    title: string;
}

export default function ExportButtons({ data, columns, filename, title }: ExportButtonsProps) {
    const disabled = data.length === 0;

    const handleAction = async (key: string | number) => {
        if (key === "csv") {
            try {
                exportToCSV(data, columns, filename);
            } catch (e) {
                console.error('CSV export failed:', e);
            }
        } else if (key === "pdf") {
            try {
                const { exportToPDF } = await import('@/app/components/dashboard/lib/export-utils');
                await exportToPDF(data, columns, filename, title);
            } catch (e) {
                console.error('PDF export failed:', e);
            }
        }
    };

    return (
        <Dropdown>
            <Button variant="secondary" size="sm" isDisabled={disabled}>
                <Download size={13} />
                EXPORT
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu onAction={handleAction}>
                    <Dropdown.Item id="csv" textValue="Export as CSV">
                        <FileSpreadsheet size={14} className="text-success" />
                        <Label>Export as CSV</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="pdf" textValue="Export as PDF">
                        <FileText size={14} className="text-danger" />
                        <Label>Export as PDF</Label>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
}
