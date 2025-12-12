"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dumbbell, ExternalLink, Calendar } from "lucide-react";
import NotificationBell from "./components/NotificationBell";

type GymStatus = {
  id: number;
  is_open: boolean;
  message: string;
};

type Post = {
  id: number;
  content: string;
  created_at: string;
};

export default function Home() {
  const [status, setStatus] = useState<GymStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: statusData } = await supabase
        .from("status")
        .select("*")
        .single();

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      setStatus(statusData);
      setPosts(postsData || []);
      setLoading(false);
    }

    fetchData();

    const statusChannel = supabase
      .channel("status_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status" },
        (payload) => {
          setStatus(payload.new as GymStatus);
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel("posts_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(postsChannel);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Hayes Training</h1>
              <p className="text-xs text-muted">Daily Workouts</p>
            </div>
          </div>
          <NotificationBell 
            businessId="7a074731-74ef-4d30-a50e-400496d9642f" 
            businessSlug="hayes-training" 
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {loading ? (
          <div className="mt-6 rounded-2xl bg-card border border-card-border p-6 animate-pulse">
            <div className="h-6 bg-card-border rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-card-border rounded w-2/3"></div>
          </div>
        ) : (
          <div
            className={`mt-6 rounded-2xl p-6 status-pulse ${
              status?.is_open
                ? "bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30"
                : "bg-gradient-to-br from-accent-red/20 to-accent-red/5 border border-accent-red/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  status?.is_open ? "bg-accent" : "bg-accent-red"
                }`}
              ></div>
              <span
                className={`text-xl font-bold ${
                  status?.is_open ? "text-accent" : "text-accent-red"
                }`}
              >
                {status?.is_open ? "Gym Open" : "Gym Closed"}
              </span>
            </div>
            <p className="text-foreground/80 text-lg">
              {status?.message || "No status message"}
            </p>
          </div>
        )}

        <a
          href="https://hayestrainingsystems.com/subscribe/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-background font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
        >
          <span className="text-lg">Sign Up</span>
          <ExternalLink className="w-5 h-5" />
        </a>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Workout Feed
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-card-border p-5 animate-pulse"
                >
                  <div className="h-4 bg-card-border rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-card-border rounded w-full"></div>
                    <div className="h-4 bg-card-border rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl bg-card border border-card-border p-8 text-center">
              <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted text-lg">No workouts posted yet</p>
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
    </div>
  );
}
