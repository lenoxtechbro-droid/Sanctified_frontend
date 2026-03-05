import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MainLayout } from "./components/Layout/MainLayout";
import { HomePage } from "./pages/HomePage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LoginPage } from "./pages/LoginPage";
import { GivingPage } from "./pages/GivingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ArticlePage } from "./pages/ArticlePage";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-10 text-center text-navy/70 dark:text-white/70">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sign-in" element={<LoginPage />} />
              <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<HomePage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="giving" element={<GivingPage />} />
                <Route path="articles" element={<HomePage />} />
                <Route path="articles/:id" element={<ArticlePage />} />
                <Route path="sermons" element={<HomePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
