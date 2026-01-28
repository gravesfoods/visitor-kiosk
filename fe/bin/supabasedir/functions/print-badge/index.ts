// supabase/functions/print-badge/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BadgeData {
  first_name: string;
  last_name: string;
  full_name: string;
  reason_for_visit: string;
  host_name: string;
  host_email?: string;
  timestamp: string;
  photo: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("print-badge function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const badgeData: BadgeData = await req.json();
    console.log("Badge data received:", {
      ...badgeData,
      photo: badgeData.photo ? "[base64 image]" : "no photo",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store visitor log in database
    const { data: visitorLog, error: insertError } = await supabase
      .from("visitor_logs")
      .insert({
        first_name: badgeData.first_name,
        last_name: badgeData.last_name,
        full_name: badgeData.full_name,
        reason_for_visit: badgeData.reason_for_visit,
        host_name: badgeData.host_name || "WALK-IN",
        host_email: badgeData.host_email || null,
        photo_url: badgeData.photo, // Store base64 directly for now
        badge_printed: true,
        check_in_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting visitor log:", insertError);
      throw new Error("Failed to save visitor log");
    }

    console.log("Visitor log saved:", visitorLog.id);

    // TODO: Integrate with actual Dymo printer API
    // This is a stub that simulates successful printing
    // Replace with actual Dymo SDK integration:
    // 
    // const dymoResponse = await fetch('http://localhost:41951/DYMO/DLS/Printing/PrintLabel', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     printerName: 'DYMO LabelWriter 450',
    //     labelXml: generateLabelXml(badgeData),
    //   }),
    // });

    // Simulate print delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Send notification email to host if host has email
    if (badgeData.host_email) {
      try {
        const notifyResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              visitor_name: badgeData.full_name,
              host_email: badgeData.host_email,
              host_name: badgeData.host_name,
              reason: badgeData.reason_for_visit,
              check_in_time: badgeData.timestamp,
            }),
          }
        );

        if (notifyResponse.ok) {
          // Update notification_sent status
          await supabase
            .from("visitor_logs")
            .update({ notification_sent: true })
            .eq("id", visitorLog.id);
          console.log("Host notification sent successfully");
        }
      } catch (notifyError) {
        console.error("Failed to send host notification:", notifyError);
        // Don't fail the whole request if notification fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Badge printed successfully",
        visitor_id: visitorLog.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in print-badge function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to print badge",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
