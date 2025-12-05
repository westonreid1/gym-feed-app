"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  LogOut,
  Power,
  MessageSquare,
  Send,
  Loader2,
  Check,
  Home,
} from "lucide-react";
import Link from "next/link";

type GymStatus = {
  id: number;
  is_open: boolean;
  message: string;
};

export default function AdminPage() {
  const [status, setStatus] = useState<GymStatus | null>(null);
  const [message, setMessage] = useState("");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const router = useRouter();

  const fetchStatus = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("gym_status").select("*").single();
    if (data) {
      setStatus(data);
      setMessage(data.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function toggleGymStatus() {
    if (!status) return;
    setStatusLoading(true);

    const supabase = createClient();
    const newIsOpen = !status.is_open;

    const { error } = await supabase
      .from("gym_status")
      .update({ is_open: newIsOpen })
      .eq("id", status.id);

    if (!error) {
      setStatus({ ...status, is_open: newIsOpen });
    }
    setStatusLoading(false);
  }

  async function updateMessage() {
    if (!status) return;
    setStatusLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("gym_status")
      .update({ message })
      .eq("id", status.id);

    if (!error) {
      setStatus({ ...status, message });
    }
    setStatusLoading(false);
  }

  async function postWorkout() {
    if (!newPost.trim()) return;
    setPostLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("posts").insert({ content: newPost });

    if (!error) {
      setNewPost("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 2000);
    }
    setPostLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted">Manage your gym feed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              <Home className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-accent-red hover:border-accent-red transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Control */}
        <section className="rounded-2xl bg-card border border-card-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Power className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Status Control</h2>
              <p className="text-sm text-muted">Set gym open/closed status</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-medium">Gym Status</p>
              <p className={`text-sm ${status?.is_open ? "text-accent" : "text-accent-red"}`}>
                Currently {status?.is_open ? "Open" : "Closed"}
              </p>
            </div>
            <button
              onClick={toggleGymStatus}
              disabled={statusLoading}
              className={`toggle-switch ${status?.is_open ? "active" : ""}`}
              aria-label="Toggle gym status"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
              <MessageSquare className="w-4 h-4" />
              Status Message
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter status message..."
                className="flex-1 bg-background border border-card-border rounded-xl py-3 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={updateMessage}
                disabled={statusLoading || message === status?.message}
                className="bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-background font-semibold py-3 px-5 rounded-xl transition-all active:scale-[0.98]"
              >
                {statusLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Post Workout */}
        <section className="rounded-2xl bg-card border border-card-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Post Workout</h2>
              <p className="text-sm text-muted">Share today&apos;s workout with members</p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Enter today's workout..."
              rows={6}
              className="w-full bg-background border border-card-border rounded-xl py-4 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <button
              onClick={postWorkout}
              disabled={postLoading || !newPost.trim()}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {postLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : postSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Posted!</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Post Workout</span>
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

