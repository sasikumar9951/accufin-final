'use client';

import { SessionProvider } from 'next-auth/react';
import { IdleTimeout } from '@/components/IdleTimeout';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SessionProvider>
            <IdleTimeout>
                {children}
            </IdleTimeout>
        </SessionProvider>
    );
}
