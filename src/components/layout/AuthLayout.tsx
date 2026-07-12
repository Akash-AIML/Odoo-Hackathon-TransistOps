import { APP_NAME } from '@/lib/constants';

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden w-1/2 flex-col justify-center bg-zinc-200 px-16 lg:flex">
                <p className="text-3xl font-bold text-zinc-900">{APP_NAME}</p>
                <p className="mt-2 text-lg text-zinc-600">Smart Transport Operations Platform</p>
                <ul className="mt-8 space-y-3 text-zinc-700">
                    <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Real-time fleet health & utilization tracking
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Driver safety compliance & license monitoring
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Trip dispatch with capacity validation
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Fuel anomaly detection & ROI analytics
                    </li>
                </ul>
            </div>
            <div className="flex w-full flex-col justify-center bg-background px-8 lg:w-1/2 lg:px-16">
                {children}
            </div>
        </div>
    );
}
