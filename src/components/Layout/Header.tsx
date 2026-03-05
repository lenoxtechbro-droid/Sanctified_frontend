import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-navy-dark dark:text-white">
          <span className="text-xl font-semibold tracking-tight">Sanctified Church</span>
        </Link>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search sermons, podcasts..."
            className="hidden w-48 rounded-lg border border-navy/20 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm dark:text-white dark:placeholder-gray-400 sm:block"
          />
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            to="/articles"
            className="rounded-lg px-3 py-2 text-sm font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-white/10"
          >
            Articles
          </Link>
          <Link
            to="/giving"
            className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            Giving
          </Link>
          {/* Theme Toggle Button */}
          <motion.button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-white/10"
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
