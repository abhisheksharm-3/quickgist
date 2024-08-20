import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import HomePage from "./views/HomePage";
import CreatePage from "./views/CreatePage";
import ViewPage from "./views/ViewPage";
import MyGistsPage from "./views/MyGistsPage";
import FAQPage from "./views/FAQPage";
import ProfilePage from "./views/ProfilePage";
import SignInPage from "./views/SignIn";
import SignUpPage from "./views/SignUp";

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <>
    <SignedIn>{element}</SignedIn>
    <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
  </>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <main className="">
      {children}
    </main>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/view/:id" element={<ViewPage />} />
          <Route path="/my-gists" element={<ProtectedRoute element={<MyGistsPage />} />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;