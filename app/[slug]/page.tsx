"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  Music,
  Store,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import Link from "next/link";
import type { Business, Status, Post } from "@/types/database";

// Icon mapping for different business types
const BUSINESS_ICONS: Record<string, React.ElementType> = {
  gym: Dumbbell,
  barber: Scissors,
  food_truck: Truck,
  salon: Sparkles,
  studio: Music,
  default: Store,
};

function getBusinessIcon(type: string) {
  return BUSINESS_ICONS[type] || BUSINESS_ICONS.default;
}

export default function BusinessPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const supabase = createClient();

    async function fetchData() {
      // Fetch business by slug
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (businessError || !businessData) {
        setError("Business not found");
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      // Fetch status for this business
      const { data: statusData } = await supabase
        .from("status")
        .select("*")
        .eq("business_id", businessData.id)
        .single();

      setStatus(statusData);

      // Fetch posts for this business (newest first)
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    }

    fetchData();

    // Subscribe to real-time updates after we have the business ID
    // We'll set this up in a separate effect once business is loaded
  }, [slug]);

  // Real-time subscriptions (separate effect to wait for business.id)
  useEffect(() => {
    if (!business?.id) return;

    const supabase = createClient();

    const statusChannel = supabase
      .channel(`status_${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "status",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setStatus(payload.new as Status);
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`posts_${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Post) : p))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [business?.id]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  // Apply custom accent color from business settings
  const accentColor = business?.primary_color || "#22c55e";
  const BusinessIcon = business ? getBusinessIcon(business.type) : Dumbbell;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Error state (business not found)
  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-accent-red" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
          <p className="text-muted mb-8">
            The business you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-card border border-card-border hover:border-accent/30 text-foreground font-medium py-3 px-6 rounded-xl transition-all"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Custom CSS variable for accent color */}
      <style jsx global>{`
        :root {
          --accent-dynamic: ${accentColor};
        }
      `}</style>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}33` }}
              >
                <BusinessIcon className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight">{business.name}</h1>
              <p className="text-xs text-muted">{business.tagline || "Updates"}</p>
            </div>
          </div>
          <NotificationBell businessId={business.id} businessSlug={business.slug} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Status Banner */}
        <div
          className={`mt-6 rounded-2xl p-6 status-pulse ${
            status?.is_open
              ? "bg-gradient-to-br border"
              : "bg-gradient-to-br from-accent-red/20 to-accent-red/5 border border-accent-red/30"
          }`}
          style={
            status?.is_open
              ? {
                  background: `linear-gradient(to bottom right, ${accentColor}33, ${accentColor}0D)`,
                  borderColor: `${accentColor}4D`,
                }
              : undefined
          }
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: status?.is_open ? accentColor : "#ef4444",
              }}
            ></div>
            <span
              className="text-xl font-bold"
              style={{ color: status?.is_open ? accentColor : "#ef4444" }}
            >
              {status?.is_open ? "Open" : "Closed"}
            </span>
          </div>
          <p className="text-foreground/80 text-lg">
            {status?.message || "No status message"}
          </p>
        </div>

        {/* External Link Button */}
        {business.external_link && (
          <a
            href={business.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full flex items-center justify-center gap-2 text-background font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-lg">
              {business.external_link_text || "Learn More"}
            </span>
            <ExternalLink className="w-5 h-5" />
          </a>
        )}

        {/* Posts Feed */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Feed
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl bg-card border border-card-border p-8 text-center">
              <BusinessIcon className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted text-lg">No updates posted yet</p>
              <p className="text-muted/60 text-sm mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="card-animate rounded-2xl bg-card border border-card-border p-5 hover:border-card-border/80 transition-colors"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 text-muted text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <time>{formatDate(post.created_at)}</time>
                  </div>
                  <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Powered by footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center bg-background/80 backdrop-blur-xl border-t border-card-border">
        <Link href="/" className="text-xs text-muted hover:text-foreground transition-colors">
          Powered by StatusBoard
        </Link>
      </footer>
    </div>
  );
}

