import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./views/HomePage";
import CreatePage from "./views/CreatePage";
import ViewPage from "./views/ViewPage";
import MyGistsPage from "./views/MyGistsPage";
import FAQPage from "./views/FAQPage";
import ProfilePage from "./views/ProfilePage";

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col justify-center min-h-screen w-screen">

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/view/:id" element={<ViewPage />} />
            <Route path="/my-gists" element={<MyGistsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>

    </BrowserRouter>
  );
};

export default App;