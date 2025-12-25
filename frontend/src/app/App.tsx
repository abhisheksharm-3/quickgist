import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/pages/home/HomePage';
import { CreateGistPage } from '@/pages/create-gist/CreateGistPage';
import { ViewGistPage } from '@/pages/view-gist/ViewGistPage';
import { MyGistsPage } from '@/pages/my-gists/MyGistsPage';
import { FaqPage } from '@/pages/faq/FaqPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
        </>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <RootLayout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create" element={<CreateGistPage />} />
                    <Route path="/view/:id" element={<ViewGistPage />} />
                    <Route path="/my-gists" element={<ProtectedRoute><MyGistsPage /></ProtectedRoute>} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />
                </Routes>
            </RootLayout>
        </BrowserRouter>
    );
}
