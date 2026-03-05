import { motion } from "framer-motion";
import { Moon, Sun, Phone, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const contactInfo = {
    phone: "0103087732",
    email: "Pastordnjoroge@gmail.com"
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-navy dark:bg-gray-800 text-white p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Theme Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks</p>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${theme === "light" ? "bg-yellow-100" : "bg-navy/20"}`}>
                  {theme === "light" ? (
                    <Sun className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <Moon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-navy-dark dark:text-white">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {theme === "light" ? "Light mode" : "Dark mode"}
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={toggleTheme}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  theme === "light" ? "bg-gray-200" : "bg-navy"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                  animate={{ left: theme === "light" ? "4px" : "32px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {theme === "light" ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-navy" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Contact Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Contact Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get in touch with us</p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Phone */}
            <motion.a
              href={`tel:${contactInfo.phone}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-navy/5 dark:bg-white/5 hover:bg-navy/10 dark:hover:bg-white/10 transition-colors"
            >
              <div className="p-3 rounded-xl bg-navy/10 dark:bg-white/10">
                <Phone className="w-6 h-6 text-navy dark:text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Call us</p>
                <p className="font-semibold text-navy-dark dark:text-white">{contactInfo.phone}</p>
              </div>
              <span className="text-2xl">📞</span>
            </motion.a>

            {/* Email */}
            <motion.a
              href={`mailto:${contactInfo.email}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-navy/5 dark:bg-white/5 hover:bg-navy/10 dark:hover:bg-white/10 transition-colors"
            >
              <div className="p-3 rounded-xl bg-navy/10 dark:bg-white/10">
                <Mail className="w-6 h-6 text-navy dark:text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email us</p>
                <p className="font-semibold text-navy-dark dark:text-white">{contactInfo.email}</p>
              </div>
              <span className="text-2xl">✉️</span>
            </motion.a>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center"
        >
          <p className="text-lg font-bold text-navy-dark dark:text-white">Sanctified Church</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">© 2024 Sanctified Player. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
}
