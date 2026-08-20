// Supabase Edge Function: razorpay-webhook
// Secure Server-Side HMAC-SHA256 Webhook Verification & Idempotent Booking Confirmation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// HMAC-SHA256 Helper in Deno Web Crypto API
async function verifyHmacSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSig = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return computedSig.toLowerCase() === signature.trim().toLowerCase();
  } catch (e) {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
      },
    });
  }

  try {
    if (!RAZORPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Webhook server configuration is incomplete.");
      return new Response(JSON.stringify({ error: "Webhook server configuration is incomplete" }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawBody = await req.text();
    const razorpaySig = req.headers.get("x-razorpay-signature");

    if (!razorpaySig) {
      return new Response(JSON.stringify({ error: "Missing X-Razorpay-Signature header" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. HMAC-SHA256 Signature Verification
    const isValidSig = await verifyHmacSignature(rawBody, razorpaySig, RAZORPAY_WEBHOOK_SECRET);
    if (!isValidSig) {
      console.error("🚨 Webhook signature mismatch detected! Rejecting unverified payload.");
      return new Response(JSON.stringify({ error: "Invalid Razorpay HMAC signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Idempotency Check: Has this razorpay_event_id already been processed?
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id, status")
      .eq("razorpay_event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`ℹ️ Webhook Event ${eventId} already processed safely (Idempotent No-Op).`);
      return new Response(JSON.stringify({ status: "already_processed", event_id: eventId }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Process payment.captured event
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayPaymentId = paymentEntity.id || `pay_${Date.now()}`;
      const paidAmount = (paymentEntity.amount || 0) / 100; // Convert paise to INR
      const bookingId = paymentEntity.notes?.booking_id || paymentEntity.description;

      if (!bookingId) {
        throw new Error("Missing booking_id in Razorpay payment notes metadata");
      }

      // 3. Insert payment_events row
      await supabase.from("payment_events").insert({
        razorpay_event_id: eventId,
        razorpay_payment_id: razorpayPaymentId,
        booking_id: bookingId,
        amount: paidAmount,
        status: "paid",
        processed_at: new Date().toISOString()
      });

      // 4. Verify booking exists & expected amount matches paid amount exactly
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("id, total_amount, payment_status")
        .eq("id", bookingId)
        .single();

      if (bookingErr || !booking) {
        throw new Error(`Booking ${bookingId} not found in database`);
      }

      if (booking.total_amount && Math.abs(booking.total_amount - paidAmount) > 0.01) {
        console.error(`🚨 Payment Amount Mismatch! Booking expected ₹${booking.total_amount}, paid ₹${paidAmount}`);
        await supabase.from("payment_events").update({ status: "amount_mismatch_flagged" }).eq("razorpay_event_id", eventId);
        return new Response(JSON.stringify({ error: "Paid amount mismatch flagged for review" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 5. Authoritative Booking State Transition: Mark booking as paid
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      // Generate verified QR pass
      await supabase.from("qr_passes").insert({
        booking_id: bookingId,
        qr_value: `KV-PASS-${bookingId.slice(-6).toUpperCase()}`,
        scan_status: "active",
        created_at: new Date().toISOString()
      });

      console.log(`✓ Booking ${bookingId} successfully confirmed via verified Razorpay Webhook ${eventId}`);
    }

    return new Response(JSON.stringify({ success: true, event_id: eventId }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
