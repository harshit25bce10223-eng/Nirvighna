import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipient_email, recipient_name, alert_type, context } = await req.json()

    if (!recipient_email || !recipient_name || !alert_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient_email, recipient_name, alert_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build email content based on alert type
    let subject = ''
    let htmlBody = ''

    switch (alert_type) {
      case 'medical_alert':
        subject = `🚨 Medical Alert - ${context.patientName || 'Pilgrim'}`
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Medical Alert</h1>
            </div>
            <div style="background: #fff5f5; border-left: 4px solid #DC143C; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Patient Name:</strong> ${context.patientName || 'N/A'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Location:</strong> ${context.location || 'N/A'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Condition:</strong> ${context.condition || 'N/A'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Blood Group:</strong> ${context.bloodGroup || 'N/A'}</p>
              <p style="margin: 0; color: #333;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Please contact the temple medical team immediately if you can assist.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated alert from Nirvighna Pilgrim Safety System.</p>
          </div>
        `
        break

      case 'gate_info':
        subject = `📍 Gate Information - ${context.gateNumber || 'Gate'}`
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: #8B0000; margin: 0; font-size: 24px;">📍 Gate Information</h1>
            </div>
            <div style="background: #fff9e6; border-left: 4px solid #FFD700; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Gate Number:</strong> ${context.gateNumber || 'N/A'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Status:</strong> ${context.status || 'N/A'}</p>
              <p style="margin: 0; color: #333;"><strong>Instructions:</strong> ${context.instructions || 'Proceed to the assigned gate for darshan.'}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This is an automated notification from Nirvighna Pilgrim Safety System.</p>
          </div>
        `
        break

      case 'ropeway_halt':
        subject = `⚠️ Ropeway Service Alert`
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Ropeway Service Alert</h1>
            </div>
            <div style="background: #fff0f0; border-left: 4px solid #FF6B6B; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Status:</strong> ${context.status || 'Service Halted'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Reason:</strong> ${context.reason || 'N/A'}</p>
              <p style="margin: 0; color: #333;"><strong>Expected Resume:</strong> ${context.expectedResume || 'N/A'}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Alternative routes are available. Please follow staff instructions.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated alert from Nirvighna Pilgrim Safety System.</p>
          </div>
        `
        break

      case 'boat_reroute':
        subject = `🚢 Ferry Service Alert - Bet Dwarka`
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚢 Ferry Service Alert</h1>
            </div>
            <div style="background: #e8f4f8; border-left: 4px solid #3498DB; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Status:</strong> ${context.status || 'Service Modified'}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Tide Status:</strong> ${context.tideStatus || 'N/A'}</p>
              <p style="margin: 0; color: #333;"><strong>Alternative Route:</strong> ${context.alternativeRoute || 'Please check with ferry staff'}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Ferry schedules may be affected by tide conditions. Check with staff for updated timings.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated alert from Nirvighna Pilgrim Safety System.</p>
          </div>
        `
        break

      default:
        subject = 'Nirvighna Alert'
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="color: #333;">You have received an alert from Nirvighna Pilgrim Safety System.</p>
          </div>
        `
    }

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nirvighna <alerts@onboarding.resend.dev>',
        to: recipient_email,
        subject: subject,
        html: htmlBody,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log successful email send
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    await supabase.from('email_logs').insert({
      recipient_email,
      alert_type,
      status: 'sent',
      sent_at: new Date().toISOString(),
      context
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sendAlertEmail function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
