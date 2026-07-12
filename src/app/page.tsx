import { redirect } from 'next/navigation';
import { getDefaultRoute } from '@/lib/constants';
import { getSessionUser } from '@/lib/api/server';

export default async function HomePage() {
    const user = await getSessionUser();
    if (user) {
        redirect(getDefaultRoute(user.role));
    }
    redirect('/login');
}
