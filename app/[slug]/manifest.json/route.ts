import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch business details
  const { data: business } = await supabase
    .from("businesses")
    .select("name, primary_color, tagline")
    .eq("slug", slug)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const manifest = {
    name: business.name,
    short_name: business.name.length > 12 ? business.name.slice(0, 12) : business.name,
    description: business.tagline || `Updates from ${business.name}`,
    start_url: `/${slug}`,
    scope: `/${slug}`,
    display: "standalone",
    background_color: "#0c0c0c",
    theme_color: business.primary_color || "#22c55e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}

