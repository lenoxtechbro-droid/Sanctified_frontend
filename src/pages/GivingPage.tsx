import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { initializeDonationPayment, type DonationPaymentMethod } from "../lib/api";

type SupportedCurrency = "KES" | "NGN" | "GHS" | "USD";

const CATEGORIES = ["Tithe", "Offering", "Thanksgiving", "Building Fund"] as const;

type Category = (typeof CATEGORIES)[number];

export function GivingPage() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<Category>("Tithe");
  const [method, setMethod] = useState<DonationPaymentMethod | null>(null);
  const [cardCurrency, setCardCurrency] = useState<SupportedCurrency>("USD");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isDark = theme === "dark";

  const handleSubmit = async () => {
    if (!user || !profile) {
      setError("You must be signed in to give.");
      return;
    }
    setError(null);
    setMessage(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!method) {
      setError("Please choose a payment method.");
      return;
    }

    // Default: M-PESA donations are always in KES.
    let finalAmount = parsedAmount;
    let finalCurrency: SupportedCurrency = "KES";

    if (method === "card") {
      // For card, user chooses the currency Paystack should charge.
      finalCurrency = cardCurrency;
    }

    try {
      setSubmitting(true);
      const res = await initializeDonationPayment({
        user_id: profile.id,
        email: profile.email || user.email || "",
        amount: finalAmount,
        currency: finalCurrency,
        category,
        payment_method: method,
        phone: undefined,
      });

      if (res.authorization_url) {
        window.location.href = res.authorization_url;
        return;
      }

      setMessage(
        res.message ??
          "Your giving has been initialized. Please follow the payment instructions to complete it."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto max-w-2xl space-y-6 rounded-xl border p-6 shadow-sm ${
      isDark 
        ? "border-gray-700 bg-gray-800" 
        : "border-navy/10 bg-white"
    }`}>
      <header className="space-y-1 text-center">
        <h1 className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-navy-dark"}`}>
          Giving &amp; Offerings
        </h1>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-navy/70"}`}>
          Sow into the ministry through tithes, offerings, thanksgiving, and building fund.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-navy-dark"}`}>
          Category
        </h2>
        <select
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            isDark 
              ? "border-gray-600 bg-gray-700 text-gray-100" 
              : "border-navy/20"
          }`}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        <h2 className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-navy-dark"}`}>
          Choose payment method
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("mpesa")}
            className={`flex h-20 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
              method === "mpesa"
                ? "border-green-500 bg-green-50 text-green-700"
                : isDark
                  ? "border-gray-600 bg-gray-700 text-gray-200 hover:border-green-400 hover:bg-gray-600"
                  : "border-navy/15 bg-navy/3 text-navy hover:border-green-400 hover:bg-green-50"
            }`}
          >
            <span className="text-lg">📱</span>
            <span>M-PESA (Kenya)</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex h-20 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
              method === "card"
                ? "border-gold bg-gold/5 text-gold-dark"
                : isDark
                  ? "border-gray-600 bg-gray-700 text-gray-200 hover:border-gold hover:bg-gray-600"
                  : "border-navy/15 bg-navy/3 text-navy hover:border-gold hover:bg-gold/10"
            }`}
          >
            <span className="text-lg">💳</span>
            <span>Pay via Card</span>
          </button>
        </div>
        {method === "card" && (
          <div className="pt-2">
            <label className={`block text-xs font-medium ${isDark ? "text-gray-400" : "text-navy/80"}`}>
              Card currency
            </label>
            <select
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                isDark 
                  ? "border-gray-600 bg-gray-700 text-gray-100" 
                  : "border-navy/20"
              }`}
              value={cardCurrency}
              onChange={(e) => setCardCurrency(e.target.value as SupportedCurrency)}
            >
              <option value="USD">USD (US Dollar)</option>
              <option value="KES">KES (Kenyan Shilling)</option>
              <option value="NGN">NGN (Nigerian Naira)</option>
              <option value="GHS">GHS (Ghanaian Cedi)</option>
            </select>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-navy-dark"}`}>
          Amount ({method === "card" ? cardCurrency : "KES"})
        </h2>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
            isDark 
              ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
              : "border-navy/20"
          }`}
        />
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
          isDark 
            ? "bg-navy hover:bg-navy-light text-white" 
            : "bg-navy hover:bg-navy-dark text-white"
        }`}
      >
        {submitting ? "Processing..." : "Give Now"}
      </button>

      <p className={`text-center text-[11px] ${isDark ? "text-gray-500" : "text-navy/60"}`}>
        "God loves a cheerful giver." — 2 Corinthians 9:7
      </p>
    </div>
  );
}
