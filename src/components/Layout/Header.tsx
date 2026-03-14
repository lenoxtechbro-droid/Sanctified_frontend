import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun, Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Desktop search
  const [desktopQuery, setDesktopQuery] = useState("");

  // Mobile search overlay
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleDesktopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = desktopQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = mobileQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setMobileSearchOpen(false);
      setMobileQuery("");
    }
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 100);
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur ${
      isDark
        ? "border-gray-700 bg-gray-900/95"
        : "border-navy/10 bg-white/95"
    }`}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className={`flex items-center gap-2 ${isDark ? "text-white" : "text-navy-dark"}`}>
          <span className="text-xl font-semibold tracking-tight">Sanctified Church</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Desktop search input */}
          <form onSubmit={handleDesktopSubmit} className="hidden sm:flex items-center relative">
            <Search className={`absolute left-3 w-4 h-4 pointer-events-none ${isDark ? "text-gray-400" : "text-navy/40"}`} />
            <input
              type="search"
              value={desktopQuery}
              onChange={(e) => setDesktopQuery(e.target.value)}
              placeholder="Search sermons, podcasts…"
              className={`w-48 rounded-lg border pl-9 pr-3 py-1.5 text-sm outline-none transition-all focus:w-64 focus:ring-2 focus:ring-gold/50 ${
                isDark
                  ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-gold/50"
                  : "border-navy/20 bg-gray-50 text-navy-dark placeholder-navy/40 focus:border-gold/50"
              }`}
            />
          </form>

          {/* Mobile search icon */}
          <motion.button
            className={`sm:hidden p-2 rounded-lg ${isDark ? "text-gray-200 hover:bg-white/10" : "text-navy hover:bg-navy/5"}`}
            whileTap={{ scale: 0.95 }}
            aria-label="Search"
            onClick={openMobileSearch}
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {/* Nav links — desktop only */}
          <Link
            to="/"
            className={`hidden sm:block rounded-lg px-3 py-2 text-sm font-medium ${isDark ? "text-gray-200 hover:bg-white/10" : "text-navy hover:bg-navy/5"}`}
          >
            Home
          </Link>
          <Link
            to="/articles"
            className={`hidden sm:block rounded-lg px-3 py-2 text-sm font-medium ${isDark ? "text-gray-200 hover:bg-white/10" : "text-navy hover:bg-navy/5"}`}
          >
            Articles
          </Link>
          <Link
            to="/giving"
            className="hidden sm:block rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            Giving
          </Link>

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className={`rounded-lg p-2 ${isDark ? "text-gray-200 hover:bg-white/10" : "text-navy hover:bg-navy/5"}`}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* Hamburger — mobile only */}
          <motion.button
            className={`sm:hidden p-2 rounded-lg ${isDark ? "text-gray-200 hover:bg-white/10" : "text-navy hover:bg-navy/5"}`}
            whileTap={{ scale: 0.95 }}
            aria-label="Open navigation menu"
            onClick={onMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Mobile search bar — slides down below header */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden border-t sm:hidden ${isDark ? "border-gray-700 bg-gray-900" : "border-navy/10 bg-white"}`}
          >
            <form
              onSubmit={handleMobileSubmit}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Search className={`w-5 h-5 shrink-0 ${isDark ? "text-gray-400" : "text-navy/40"}`} />
              <input
                ref={mobileInputRef}
                type="search"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder="Search sermons, podcasts, articles…"
                className={`flex-1 bg-transparent py-2 outline-none text-sm ${
                  isDark ? "text-white placeholder-gray-500" : "text-navy-dark placeholder-navy/40"
                }`}
              />
              <button
                type="button"
                onClick={() => { setMobileSearchOpen(false); setMobileQuery(""); }}
                className={`p-1 rounded ${isDark ? "text-gray-400 hover:text-white" : "text-navy/50 hover:text-navy"}`}
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
