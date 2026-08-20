// Supabase Edge Function: create-razorpay-order
// Isolates Razorpay Secret Key from browser frontend JS bundles

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { amount, currency = "INR", receipt, booking_id } = await req.json();

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret environment variables missing on server");
    }

    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt,
        notes: {
          booking_id: booking_id || receipt || "bk_demo_123"
        }
      }),
    });

    const order = await res.json();

    return new Response(JSON.stringify(order), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: res.status,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 400,
    });
  }
});
