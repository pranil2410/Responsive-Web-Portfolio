import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import RecruiterPage from "./pages/RecruiterPage";
import AdminPage from "./pages/AdminPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/role/:roleId" element={<ProfilePage />} />
            <Route path="/recruiter" element={<RecruiterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Catch-all redirect to landing */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
