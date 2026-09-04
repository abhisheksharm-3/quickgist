/** The route table. */
import { Route, Routes } from 'react-router';
import { AboutRoute } from '@/about/AboutRoute';
import { SignInRoute } from '@/auth/SignInRoute';
import { SignUpRoute } from '@/auth/SignUpRoute';
import { AppFrame } from '@/chrome/AppFrame';
import { EditorRoute } from '@/editor/EditorRoute';
import { AuthorRoute } from '@/explore/AuthorRoute';
import { ExploreRoute } from '@/explore/ExploreRoute';
import { MeRoute } from '@/explore/MeRoute';
import { GistRoute } from '@/gist/GistRoute';
import { HistoryRoute } from '@/history/HistoryRoute';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
