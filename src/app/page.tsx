import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api/server';
import { getDefaultRoute } from '@/lib/constants';

export default async function HomePage() {
    const user = await getSessionUser();
    if (user) {
        redirect(getDefaultRoute(user.role));
    }
    redirect('/login');
}
