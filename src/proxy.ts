import { type NextRequest, NextResponse } from 'next/server';
import { getDefaultRoute } from '@/lib/constants';

const PROTECTED_PREFIXES = [
    '/dashboard',
    '/fleet',
    '/drivers',
    '/trips',
    '/maintenance',
    '/fuel-expenses',
    '/analytics',
    '/settings',
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('accessToken')?.value;
    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isProtected && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (pathname === '/login' && token) {
        const userCookie = request.cookies.get('transitops_user')?.value;
        let destination = '/dashboard';
        if (userCookie) {
            try {
                const user = JSON.parse(decodeURIComponent(userCookie)) as { role?: string };
                if (user.role) destination = getDefaultRoute(user.role);
            } catch {
                // keep default
            }
        }
        return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
