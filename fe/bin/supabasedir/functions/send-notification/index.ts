// supabase/functions/send-notification/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  visitor_name: string;
  host_email: string;
  host_name: string;
  reason: string;
  check_in_time: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);
    const data: NotificationRequest = await req.json();

    console.log("Sending notification to:", data.host_email);

    const emailResponse = await resend.emails.send({
      from: "Visitor Check-In <onboarding@resend.dev>",
      to: [data.host_email],
      subject: `Visitor Arrival: ${data.visitor_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { background: #6F73EE; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .visitor-name { font-size: 24px; font-weight: bold; color: #333; margin: 10px 0; }
            .detail { margin: 10px 0; }
            .label { font-weight: 600; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">📋 Visitor Arrival</h1>
            </div>
            <div class="content">
              <p>Hello ${data.host_name},</p>
              <p>You have a visitor waiting at reception:</p>
              
              <div class="visitor-name">${data.visitor_name}</div>
              
              <div class="detail">
                <span class="label">Reason for visit:</span>
                <span class="value">${data.reason}</span>
              </div>
              
              <div class="detail">
                <span class="label">Checked in at:</span>
                <span class="value">${data.check_in_time}</span>
              </div>
              
              <p style="margin-top: 20px;">Please head to reception to greet your visitor.</p>
            </div>
            <div class="footer">
              Sent by Visitor Check-In System
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
