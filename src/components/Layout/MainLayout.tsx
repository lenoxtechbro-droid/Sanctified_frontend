import { Outlet } from "react-router-dom";
import { usePlayer } from "../../contexts/PlayerContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StickyPlayer } from "../StickyPlayer";

export function MainLayout() {
  const { nowPlaying, setNowPlaying } = usePlayer();
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-4 pb-24 md:flex-row md:px-6 md:py-6 md:pb-24">
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
