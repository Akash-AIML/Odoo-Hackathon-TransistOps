import { cookies, headers } from 'next/headers';
import type { User } from './types';

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function getBaseUrl(): Promise<string> {
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:5050';
    const protocol = headerStore.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    return `${protocol}://${host}`;
}

export async function getSessionUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get('transitops_user')?.value;
    if (!raw) return null;
    try {
        return JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
        return null;
    }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const baseUrl = await getBaseUrl();

    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...init?.headers,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const body = (await response.json()) as { error?: string };
            if (body.error) message = body.error;
        } catch {
            // ignore parse errors
        }
        throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        return response as unknown as T;
    }

    return response.json() as Promise<T>;
}

export { ApiError };
