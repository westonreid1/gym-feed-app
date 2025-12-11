import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, message } = await request.json();

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { error: "OneSignal not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Subscribed Users"],
        headings: { en: title },
        contents: { en: message },
        url: process.env.NEXT_PUBLIC_SITE_URL || "/",
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



