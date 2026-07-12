import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { AlertBox } from '@/components/ui/AlertBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { Settings } from '@/lib/api/types';

export default async function SettingsPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    let settings: Settings | null = null;
    let error = '';

    try {
        settings = await apiFetch<Settings>('/api/settings');
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load settings.';
    }

    return (
        <div>
            <PageHeader title="Settings" description="Profile, depot configuration, and notification preferences" />

            {error || !settings ? (
                <AlertBox>{error || 'Unable to load settings.'}</AlertBox>
            ) : (
                <SettingsForm settings={settings} user={user} />
            )}
        </div>
    );
}
