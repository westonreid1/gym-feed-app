import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { title, message, businessId } = await request.json();

    // If businessId is provided, verify the user owns this business (or is staff)
    if (businessId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if owner
        const { data: business } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("id", businessId)
          .eq("owner_id", user.id)
          .maybeSingle();

        // If not owner, check if staff
        if (!business) {
          const { data: member } = await supabase
            .from("business_members")
            .select("id")
            .eq("business_id", businessId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!member) {
            return NextResponse.json(
              { error: "Unauthorized - not your business" },
              { status: 403 }
            );
          }
        }
      }
    }

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { error: "OneSignal not configured" },
        { status: 500 }
      );
    }

    // Build the notification payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationPayload: Record<string, any> = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },
      url: process.env.NEXT_PUBLIC_SITE_URL || "/",
    };

    // BACKWARDS COMPATIBLE: For Hayes Training (first business), also send to legacy users
    // Legacy users = subscribers who don't have any business_id tag (from before multi-tenant)
    const HAYES_TRAINING_ID = "7a074731-74ef-4d30-a50e-400496d9642f";
    
    if (businessId === HAYES_TRAINING_ID) {
      // Send to: users tagged with this business_id OR users with no business_id tag (legacy)
      notificationPayload.filters = [
        { field: "tag", key: "business_id", relation: "=", value: businessId },
        { operator: "OR" },
        { field: "tag", key: "business_id", relation: "not_exists" }
      ];
    } else if (businessId) {
      // New businesses: only send to users tagged with this business_id
      notificationPayload.filters = [
        { field: "tag", key: "business_id", relation: "=", value: businessId }
      ];
    } else {
      // No businessId provided: legacy fallback to all
      notificationPayload.included_segments = ["Total Subscriptions"];
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OneSignal error:", data);
      return NextResponse.json(
        { error: "Failed to send notification", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, recipients: data.recipients });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
