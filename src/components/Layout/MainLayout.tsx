import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { usePlayer } from "../../contexts/PlayerContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileMenu } from "./MobileMenu";
import { StickyPlayer } from "../StickyPlayer";

export function MainLayout() {
  const { nowPlaying, setNowPlaying } = usePlayer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-4 pb-24 md:flex-row md:px-6 md:py-6 md:pb-24 relative">
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
        <div className="order-first md:order-none">
          <Sidebar />
        </div>
      </main>
      <StickyPlayer nowPlaying={nowPlaying} onClear={() => setNowPlaying(null)} />
    </div>
  );
}
