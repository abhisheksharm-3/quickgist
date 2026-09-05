/** The route table. */
import { Route, Routes } from 'react-router';
import { AboutRoute } from '@/components/about/AboutRoute';
import { SignInRoute } from '@/components/auth/SignInRoute';
import { SignUpRoute } from '@/components/auth/SignUpRoute';
import { AppFrame } from '@/components/chrome/AppFrame';
import { EditorRoute } from '@/components/editor/EditorRoute';
import { AuthorRoute } from '@/components/explore/AuthorRoute';
import { ExploreRoute } from '@/components/explore/ExploreRoute';
import { MeRoute } from '@/components/explore/MeRoute';
import { GistRoute } from '@/components/gist/GistRoute';
import { HistoryRoute } from '@/components/history/HistoryRoute';
import { NotFoundPage } from '@/components/NotFoundPage';

export function App() {
  return (
    <AppFrame>
      <Routes>
        <Route path="/" element={<EditorRoute />} />
        <Route path="/g/:slug" element={<GistRoute />} />
        <Route path="/g/:slug/edit" element={<EditorRoute />} />
        <Route path="/g/:slug/history" element={<HistoryRoute />} />
        <Route path="/explore" element={<ExploreRoute />} />
        <Route path="/about" element={<AboutRoute />} />
        <Route path="/sign-in" element={<SignInRoute />} />
        <Route path="/sign-up" element={<SignUpRoute />} />
        <Route path="/u/:handle" element={<AuthorRoute />} />
        <Route path="/me" element={<MeRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppFrame>
  );
}
