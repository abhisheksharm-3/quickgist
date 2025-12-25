import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';

type RootLayoutPropsType = {
    children: ReactNode;
};

export function RootLayout({ children }: RootLayoutPropsType) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PageHeader />
            <main className="flex-1">{children}</main>
            <PageFooter />
        </div>
    );
}
