import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createCheckoutSession, type CheckoutMode } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mode = (searchParams.get("mode") ?? "subscriber") as CheckoutMode;
  const validMode = mode === "offering" || mode === "subscriber" ? mode : "subscriber";

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);
    const base = window.location.origin;
    try {
      const { url } = await createCheckoutSession({
        mode: validMode,
        success_url: `${base}/?checkout=success`,
        cancel_url: `${base}/checkout?mode=${validMode}`,
        customer_email: user?.email ?? undefined,
        metadata_user_id: user?.id ?? undefined,
      });
      if (url) window.location.href = url;
      else setError("No checkout URL returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const success = searchParams.get("checkout") === "success";
    if (success && profile) {
      // Refresh profile so role updates after webhook
      setTimeout(() => window.location.reload(), 2000);
    }
  }, [searchParams, profile]);

  if (searchParams.get("checkout") === "success") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-navy/10 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold text-navy-dark">Thank you</h1>
        <p className="mt-2 text-navy/70">Your payment was successful. Refreshing your account...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-navy/10 bg-white p-6">
      <h1 className="text-xl font-semibold text-navy-dark">
        {validMode === "subscriber" ? "Premium Subscription" : "Church Offering"}
      </h1>
      <p className="mt-2 text-sm text-navy/70">
        {validMode === "subscriber"
          ? "Get access to exclusive sermons, videos, and articles."
          : "One-time offering to support the church."}
      </p>
      {error && <p className="mt-2 text-sm text-sanctified-red">{error}</p>}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-gold py-2.5 font-medium text-white hover:bg-gold-dark disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Continue to payment"}
      </button>
    </div>
  );
}
