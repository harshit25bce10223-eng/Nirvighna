// Supabase Edge Function: create-razorpay-refund
// Initiates Razorpay Refund for Cancelled Paid Bookings

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
    const { payment_id, amount, booking_id } = await req.json();

    if (!payment_id) {
      throw new Error("Missing payment_id for refund request");
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      // Mock fallback response for offline development
      return new Response(JSON.stringify({
        refund_id: `rfnd_mock_${Date.now()}`,
        payment_id,
        amount: Math.round(amount * 100),
        status: "processed"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      });
    }

    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;

    const res = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Amount in paise
        notes: {
          booking_id,
          reason: "Pilgrim initiated cancellation"
        }
      }),
    });

    const refundData = await res.json();

    return new Response(JSON.stringify(refundData), {
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
