import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Home, BookOpen, Gift, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { role } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="w-72 h-full bg-white dark:bg-gray-900 border-l border-navy/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-navy/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Menu</h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-navy/5 dark:hover:bg-gray-700 text-navy dark:text-gray-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg p-3 text-lg font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                <Home className="w-6 h-6" />
                Home
              </Link>
              <Link
                to="/articles"
                className="flex items-center gap-3 rounded-lg p-3 text-lg font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                <BookOpen className="w-6 h-6" />
                Articles
              </Link>
              <Link
                to="/giving"
                className="flex items-center gap-3 rounded-lg bg-gold p-3 text-lg font-semibold text-white hover:bg-gold-dark"
                onClick={onClose}
              >
                <Gift className="w-6 h-6" />
                Giving
              </Link>
              <Link
                to="/library"
                className="flex items-center gap-3 rounded-lg p-3 text-lg font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0 -3.332.477 -4.5 1.253" />
                </svg>
                Library
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-lg p-3 text-lg font-medium text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                <Settings className="w-6 h-6" />
                Settings
              </Link>
              {role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-lg p-3 text-lg font-medium bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={onClose}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Admin
                </Link>
              )}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
