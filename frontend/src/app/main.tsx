import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Providers } from './providers';
import { App } from './App';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Providers>
            <App />
            <Toaster richColors position="bottom-right" />
        </Providers>
    </StrictMode>,
);
