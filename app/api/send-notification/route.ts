import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { title, message, businessId } = await request.json();

    // If businessId is provided, verify the user owns this business
    if (businessId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: business } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("id", businessId)
          .eq("owner_id", user.id)
          .single();

        if (!business) {
          return NextResponse.json(
            { error: "Unauthorized - not your business" },
            { status: 403 }
          );
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

    // For multi-tenant, you might want to use tags or segments per business
    // For now, we'll keep the simple "Total Subscriptions" approach
    // In production, you'd want to segment notifications per business
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Total Subscriptions"],
        headings: { en: title },
        contents: { en: message },
        url: process.env.NEXT_PUBLIC_SITE_URL || "/",
        // For proper multi-tenant notifications, you'd use filters:
        // filters: [{ field: "tag", key: "business_id", relation: "=", value: businessId }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OneSignal error:", data);
      return NextResponse.json(
        { error: "Failed to send notification" },
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
