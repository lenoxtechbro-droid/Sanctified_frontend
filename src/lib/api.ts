/** Backend API client (FastAPI). */
const API_BASE = "/api";

export type CheckoutMode = "offering" | "subscriber";

export interface CreateCheckoutSessionRequest {
  mode: CheckoutMode;
  success_url: string;
  cancel_url: string;
  customer_email?: string | null;
  metadata_user_id?: string | null;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  session_id?: string | null;
}

export async function createCheckoutSession(
  body: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Checkout failed");
  }
  return res.json();
}

export type DonationPaymentMethod = "mpesa" | "card";

export interface InitializePaymentRequest {
  user_id: string;
  email: string;
  amount: number;
  currency?: "KES" | "NGN" | "GHS" | "USD";
  category: "Tithe" | "Offering" | "Thanksgiving" | "Building Fund";
  payment_method: DonationPaymentMethod;
  phone?: string;
  reference_hint?: string | null;
}

export interface InitializePaymentResponse {
  payment_method: DonationPaymentMethod;
  reference: string;
  status: "pending" | "success" | "failed";
  authorization_url?: string | null;
  message?: string | null;
}

export async function initializeDonationPayment(
  body: InitializePaymentRequest
): Promise<InitializePaymentResponse> {
  const res = await fetch(`${API_BASE}/initialize-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Could not start payment");
  }
  return res.json();
}
