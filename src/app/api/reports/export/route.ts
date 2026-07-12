// src/app/api/reports/export/route.ts - CSV/PDF Financial Export API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const format = searchParams.get('format') || 'csv';

            const vehicles = await prisma.vehicle.findMany({
                include: {
                    trips: true,
                    maintenanceLogs: true,
                    fuelLogs: true,
                    expenses: true,
                },
            });

            // Compute report data
            const rows = vehicles.map((v) => {
                const revenue = v.trips.reduce((sum, t) => sum + t.revenue, 0);
                const maintenance = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
                const fuel = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
                const toll = v.expenses.reduce((sum, e) => sum + e.toll, 0);
                const other = v.expenses.reduce((sum, e) => sum + e.other, 0);
                const totalExpenses = maintenance + fuel + toll + other;
                const netProfit = revenue - totalExpenses;
                const roi = v.cost > 0 ? `${((netProfit / v.cost) * 100).toFixed(2)}%` : '0.00%';

                return {
                    regNo: v.regNo,
                    name: v.name,
                    type: v.type,
                    status: v.status,
                    cost: v.cost,
                    revenue,
                    maintenance,
                    fuel,
                    tolls: toll,
                    other,
                    totalExpenses,
                    netProfit,
                    roi,
                };
            });

            if (format.toLowerCase() === 'pdf') {
                // Generate a simple, compliant PDF buffer from scratch
                // A basic PDF contains: header, catalog, pages, page, content stream, xref, and trailer.
                const pdfContent = generateSimplePDF(rows);

                return new NextResponse(new Uint8Array(pdfContent), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'attachment; filename="transitops_fleet_report.pdf"',
                    },
                });
            }

            // Default: Generate CSV
            let csv =
                'Registration No,Model,Type,Status,Acquisition Cost,Total Revenue,Maintenance Cost,Fuel Cost,Toll Cost,Other Cost,Total Expenses,Net Profit,ROI\n';
            rows.forEach((r) => {
                csv += `${r.regNo},${r.name},${r.type},${r.status},${r.cost},${r.revenue},${r.maintenance},${r.fuel},${r.tolls},${r.other},${r.totalExpenses},${r.netProfit},${r.roi}\n`;
            });

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="transitops_fleet_report.csv"',
                },
            });
        } catch (error: unknown) {
            console.error('Export Report Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Financial Analyst'],
);

interface ReportRow {
    regNo: string;
    name: string;
    status: string;
    revenue: number;
    totalExpenses: number;
    roi: string;
}

/**
 * Generates a valid minimal PDF buffer containing the fleet report text.
 */
function generateSimplePDF(rows: ReportRow[]): Buffer {
    let reportText = 'TRANSITOPS FLEET OPERATIONAL & ROI REPORT\n';
    reportText += '===========================================\n\n';
    reportText += 'Reg No     | Model      | Status    | Revenue  | Expenses | ROI\n';
    reportText += '---------------------------------------------------------------\n';

    rows.forEach((r) => {
        const reg = r.regNo.padEnd(10).substring(0, 10);
        const name = r.name.padEnd(10).substring(0, 10);
        const status = r.status.padEnd(9).substring(0, 9);
        const rev = String(r.revenue).padEnd(8).substring(0, 8);
        const exp = String(r.totalExpenses).padEnd(8).substring(0, 8);
        const roi = r.roi.padEnd(6);
        reportText += `${reg} | ${name} | ${status} | ${rev} | ${exp} | ${roi}\n`;
    });

    reportText += `\nGenerated on: ${new Date().toLocaleDateString()}\n`;

    // PDF content stream wrapping the text
    const textLines = reportText.split('\n');
    let streamContent = 'BT\n/F1 10 Tf\n12 TL\n50 750 Td\n';
    textLines.forEach((line) => {
        // Escape parentheses for PDF text syntax
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        streamContent += `(${escaped}) Tj T*\n`;
    });
    streamContent += 'ET';

    const streamLength = streamContent.length;

    // Minimal PDF assembly
    const pdf = [
        '%PDF-1.4',
        '1 0 obj',
        '<< /Type /Catalog /Pages 2 0 R >>',
        'endobj',
        '2 0 obj',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        'endobj',
        '3 0 obj',
        '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> /Contents 4 0 R /MediaBox [0 0 612 792] >>',
        'endobj',
        '4 0 obj',
        `<< /Length ${streamLength} >>`,
        'stream',
        streamContent,
        'endstream',
        'endobj',
        'xref',
        '0 5',
        '0000000000 65535 f ',
        '0000000009 00000 n ',
        '0000000058 00000 n ',
        '0000000115 00000 n ',
        '0000000288 00000 n ',
        'trailer',
        '<< /Size 5 /Root 1 0 R >>',
        'startxref',
        '370',
        '%%EOF',
    ];

    return Buffer.from(pdf.join('\n'), 'binary');
}
