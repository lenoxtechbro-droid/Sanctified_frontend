import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronDown, ChevronUp, Phone, Mail } from "lucide-react";

export function Sidebar() {
  const { profile, role, signOut } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);

  const contactInfo = {
    phone: "0103087732",
    email: "Pastordnjoroge@gmail.com"
  };

  // For mobile: show collapsed by default with just profile info
  // User can click arrow to expand and see all content

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className={`rounded-xl border p-4 shadow-sm ${
        isDark 
          ? "border-gray-700 bg-gray-800" 
          : "border-navy/10 bg-white"
      }`}>
        {/* Mobile Collapsible Header - Always visible */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-full ${
            isDark ? "bg-gray-700" : "bg-navy/10"
          }`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-lg font-semibold ${
                isDark ? "text-gray-300" : "text-navy"
              }`}>
                {profile?.full_name?.[0] ?? profile?.email?.[0] ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate font-semibold ${
              isDark ? "text-gray-100" : "text-navy-dark"
            }`}>
              {profile?.full_name ?? "Guest"}
            </p>
            <p className={`truncate text-sm ${
              isDark ? "text-gray-400" : "text-navy/70"
            }`}>
              {profile?.email ?? (
                <Link to="/login" className="font-medium text-gold hover:underline">
                  Sign in
                </Link>
              )}
            </p>
            {role === "premium" || role === "admin" ? (
              <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-gold">
                <span aria-hidden>👑</span> Premium Member
              </p>
            ) : null}
          </div>
          
          {/* Dropdown Toggle Button - Only visible on mobile */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex md:hidden items-center justify-center w-8 h-8 rounded-full transition-colors ${
              isDark 
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                : "bg-navy/10 text-navy hover:bg-navy/20"
            }`}
            whileTap={{ scale: 0.95 }}
            aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Collapsible Content - Animated */}
        <AnimatePresence mode="wait">
          {/* On desktop, always show. On mobile, show based on isExpanded */}
          <motion.div
            key="content"
            initial={false}
            animate={{ 
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Nav */}
            <nav className="space-y-0.5">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/library"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                  }`}
                >
                  <span aria-hidden>📚</span> My Library
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/favorites"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                  }`}
                >
                  <span aria-hidden>♥</span> Favorites
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/trending"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                  }`}
                >
                  <span aria-hidden>↑</span> Trending
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/settings"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                  }`}
                >
                  <span aria-hidden>⚙</span> Settings
                </Link>
              </motion.div>
              {role === "admin" && (
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isDark 
                        ? "text-red-400 hover:bg-gray-700" 
                        : "text-red-700 hover:bg-red-50"
                    }`}
                  >
                    <span aria-hidden>🛡</span> Admin Dashboard
                  </Link>
                </motion.div>
              )}
              {(role === "listener" || !profile) && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/checkout?mode=subscriber"
                    className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gold px-3 py-2 text-sm font-medium text-white hover:bg-gold-dark"
                  >
                    Upgrade to Premium
                  </Link>
                </motion.div>
              )}
              <motion.button
                onClick={signOut}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}
              >
                Logout
              </motion.button>
            </nav>

            {/* Contact Details - Mobile */}
            <div className={`mt-4 pt-4 border-t ${
              isDark ? "border-gray-700" : "border-navy/10"
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                isDark ? "text-gray-500" : "text-navy/50"
              }`}>Contact Us</p>
              <a 
                href={`tel:${contactInfo.phone}`}
                className={`flex items-center gap-2 text-sm hover:text-gold transition-colors py-1 ${
                  isDark ? "text-gray-400" : "text-navy"
                }`}
              >
                <Phone className="w-4 h-4" />
                {contactInfo.phone}
              </a>
              <a 
                href={`mailto:${contactInfo.email}`}
                className={`flex items-center gap-2 text-sm hover:text-gold transition-colors py-1 ${
                  isDark ? "text-gray-400" : "text-navy"
                }`}
              >
                <Mail className="w-4 h-4" />
                {contactInfo.email}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Desktop: Always show content (hidden on mobile, visible on md+) */}
        <div className="hidden md:block">
          {/* Nav */}
          <nav className="space-y-0.5">
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/library"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                }`}
              >
                <span aria-hidden>📚</span> My Library
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/favorites"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                }`}
              >
                <span aria-hidden>♥</span> Favorites
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/trending"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                }`}
              >
                <span aria-hidden>↑</span> Trending
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/settings"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isDark ? "text-gray-300 hover:bg-gray-700" : "text-navy hover:bg-navy/5"
                }`}
              >
                <span aria-hidden>⚙</span> Settings
              </Link>
            </motion.div>
            {role === "admin" && (
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    isDark 
                      ? "text-red-400 hover:bg-gray-700" 
                      : "text-red-700 hover:bg-red-50"
                  }`}
                >
                  <span aria-hidden>🛡</span> Admin Dashboard
                </Link>
              </motion.div>
            )}
            {(role === "listener" || !profile) && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/checkout?mode=subscriber"
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gold px-3 py-2 text-sm font-medium text-white hover:bg-gold-dark"
                >
                  Upgrade to Premium
                </Link>
              </motion.div>
            )}
            <motion.button
              onClick={signOut}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                isDark 
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                  : "border-navy/20 text-navy hover:bg-navy/5"
              }`}
            >
              Logout
            </motion.button>
          </nav>

          {/* Contact Details - Desktop */}
          <div className={`mt-4 pt-4 border-t ${
            isDark ? "border-gray-700" : "border-navy/10"
          }`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
              isDark ? "text-gray-500" : "text-navy/50"
            }`}>Contact Us</p>
            <a 
              href={`tel:${contactInfo.phone}`}
              className={`flex items-center gap-2 text-sm hover:text-gold transition-colors py-1 ${
                isDark ? "text-gray-400" : "text-navy"
              }`}
            >
              <Phone className="w-4 h-4" />
              {contactInfo.phone}
            </a>
            <a 
              href={`mailto:${contactInfo.email}`}
              className={`flex items-center gap-2 text-sm hover:text-gold transition-colors py-1 ${
                isDark ? "text-gray-400" : "text-navy"
              }`}
            >
              <Mail className="w-4 h-4" />
              {contactInfo.email}
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
