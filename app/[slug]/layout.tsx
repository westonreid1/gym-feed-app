import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, tagline, primary_color")
    .eq("slug", slug)
    .single();

  if (!business) {
    return {
      title: "Business Not Found",
    };
  }

  return {
    title: business.name,
    description: business.tagline || `Updates from ${business.name}`,
    manifest: `/${slug}/manifest.json`,
    themeColor: business.primary_color || "#22c55e",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: business.name,
    },
  };
}

export default function BusinessLayout({ children }: Props) {
  return <>{children}</>;
}

