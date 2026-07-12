'use client';

import { PrimaryButton } from '@/components/ui/PrimaryButton';

function getToken(): string | undefined {
    return document.cookie
        .split('; ')
        .find((c) => c.startsWith('accessToken='))
        ?.split('=')[1];
}

async function downloadExport(format: 'csv' | 'pdf') {
    const token = getToken();
    const res = await fetch(`/api/reports/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = format === 'pdf' ? 'transitops_fleet_report.pdf' : 'transitops_fleet_report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
}

export function ExportButtons() {
    return (
        <div className="flex gap-2">
            <PrimaryButton variant="ghost" size="sm" onClick={() => downloadExport('csv')}>
                Export CSV
            </PrimaryButton>
            <PrimaryButton variant="ghost" size="sm" onClick={() => downloadExport('pdf')}>
                Export PDF
            </PrimaryButton>
        </div>
    );
}
