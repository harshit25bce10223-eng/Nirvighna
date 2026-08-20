// Supabase Edge Function: send-emergency-email
// Isolates Resend API Secret from browser frontend JS bundles

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
    const { recipient_email, recipient_name, alert_type, context } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY secret environment variable missing");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Nirvighna Emergency <alerts@nirvighna.org>",
        to: recipient_email,
        subject: `🚨 NIRVIGHNA EMERGENCY ALERT: ${alert_type.toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 2px solid #E3A32A; border-radius: 10px;">
            <h2>Nirvighna Emergency Dispatch</h2>
            <p>Dear ${recipient_name || 'Pilgrim Family'},</p>
            <p>An emergency alert has been raised at ${context?.location || 'Sanctum Gate'}. First responders have been dispatched.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
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
