"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  Music,
  Store,
  LogOut,
  Power,
  MessageSquare,
  Send,
  Loader2,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  Calendar,
  Settings,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { Business, Status, Post } from "@/types/database";
import { User } from "@supabase/supabase-js";

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Get current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    // Fetch business owned by this user
    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", currentUser.id)
      .single();

    if (!businessData) {
      // User doesn't have a business - show onboarding
      setShowOnboarding(true);
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

    if (statusData) {
      setStatus(statusData);
      setMessage(statusData.message || "");
    }

    // Fetch posts for this business
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("business_id", businessData.id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function toggleStatus() {
    if (!status || !business) return;
    setStatusLoading(true);

    const supabase = createClient();
    const newIsOpen = !status.is_open;

    const { error } = await supabase
      .from("status")
      .update({ is_open: newIsOpen })
      .eq("id", status.id)
      .eq("business_id", business.id);

    if (!error) {
      setStatus({ ...status, is_open: newIsOpen });

      if (!newIsOpen) {
        await sendClosedNotification(message || `${business.name} is now closed`);
      }
    }
    setStatusLoading(false);
  }

  async function sendClosedNotification(statusMessage: string) {
    if (!business) return;
    try {
      await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `📢 ${business.name}`,
          message: statusMessage,
          businessId: business.id,
        }),
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  }

  async function updateMessage() {
    if (!status || !business) return;
    setStatusLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("status")
      .update({ message })
      .eq("id", status.id)
      .eq("business_id", business.id);

    if (!error) {
      setStatus({ ...status, message });
    }
    setStatusLoading(false);
  }

  async function createPost() {
    if (!newPost.trim() || !business) return;
    setPostLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("posts")
      .insert({ content: newPost, business_id: business.id })
      .select()
      .single();

    if (!error && data) {
      setPosts([data, ...posts]);
      setNewPost("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 2000);
    }
    setPostLoading(false);
  }

  async function updatePost() {
    if (!editingPost || !editContent.trim() || !business) return;
    setPostLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("posts")
      .update({ content: editContent })
      .eq("id", editingPost.id)
      .eq("business_id", business.id);

    if (!error) {
      setPosts(
        posts.map((p) =>
          p.id === editingPost.id ? { ...p, content: editContent } : p
        )
      );
      setEditingPost(null);
      setEditContent("");
    }
    setPostLoading(false);
  }

  async function deletePost(id: number) {
    if (!business) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id);

    if (!error) {
      setPosts(posts.filter((p) => p.id !== id));
    }
    setDeleteConfirm(null);
  }

  function startEditing(post: Post) {
    setEditingPost(post);
    setEditContent(post.content);
  }

  function cancelEditing() {
    setEditingPost(null);
    setEditContent("");
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Onboarding for new users without a business
  if (showOnboarding) {
    return <OnboardingFlow user={user} onComplete={fetchData} />;
  }

  const BusinessIcon = business ? getBusinessIcon(business.type) : Store;
  const accentColor = business?.primary_color || "#22c55e";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}33` }}
            >
              <BusinessIcon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted">{business?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${business?.slug}`}
              target="_blank"
              className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-colors"
              title="View Public Page"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-accent-red hover:border-accent-red transition-colors"
              title="Log Out"
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
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}1A` }}
            >
              <Power className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Status Control</h2>
              <p className="text-sm text-muted">Set open/closed status</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-medium">Status</p>
              <p
                className="text-sm"
                style={{ color: status?.is_open ? accentColor : "#ef4444" }}
              >
                Currently {status?.is_open ? "Open" : "Closed"}
              </p>
            </div>
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              className={`toggle-switch ${status?.is_open ? "active" : ""}`}
              style={
                status?.is_open
                  ? { backgroundColor: accentColor }
                  : undefined
              }
              aria-label="Toggle status"
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
                className="disabled:opacity-30 disabled:cursor-not-allowed text-background font-semibold py-3 px-5 rounded-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: accentColor }}
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

        {/* Create Post */}
        <section className="rounded-2xl bg-card border border-card-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}1A` }}
            >
              <BusinessIcon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">New Post</h2>
              <p className="text-sm text-muted">Share an update</p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening today?"
              rows={6}
              className="w-full bg-background border border-card-border rounded-xl py-4 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <button
              onClick={createPost}
              disabled={postLoading || !newPost.trim()}
              className="w-full disabled:opacity-30 disabled:cursor-not-allowed text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
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
                  <span>Post Update</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Existing Posts */}
        {posts.length > 0 && (
          <section className="rounded-2xl bg-card border border-card-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}1A` }}
              >
                <Calendar className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Recent Posts</h2>
                <p className="text-sm text-muted">Edit or delete posts</p>
              </div>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-background border border-card-border rounded-xl p-4"
                >
                  {editingPost?.id === post.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-accent transition-colors resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={updatePost}
                          disabled={postLoading || !editContent.trim()}
                          className="flex-1 disabled:opacity-30 text-background font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                          style={{ backgroundColor: accentColor }}
                        >
                          {postLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 rounded-xl border border-card-border text-muted hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : deleteConfirm === post.id ? (
                    // Delete confirmation
                    <div className="space-y-3">
                      <p className="text-accent-red font-medium">
                        Delete this post?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="flex-1 bg-accent-red hover:bg-accent-red/90 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 rounded-xl border border-card-border text-muted hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted">
                          {formatDate(post.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(post)}
                            className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(post.id)}
                            className="p-2 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// Onboarding Component for New Users
// ============================================================================

type OnboardingFlowProps = {
  user: User | null;
  onComplete: () => void;
};

function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "gym",
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const BUSINESS_TYPES = [
    { value: "gym", label: "Gym / Fitness", icon: Dumbbell },
    { value: "barber", label: "Barber Shop", icon: Scissors },
    { value: "food_truck", label: "Food Truck", icon: Truck },
    { value: "salon", label: "Salon / Spa", icon: Sparkles },
    { value: "studio", label: "Studio", icon: Music },
    { value: "other", label: "Other", icon: Store },
  ];

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleCreate() {
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Check if slug is available
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", formData.slug)
      .single();

    if (existing) {
      setError("This URL is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    // Create the business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        owner_id: user.id,
      })
      .select()
      .single();

    if (businessError || !business) {
      setError("Failed to create business. Please try again.");
      setLoading(false);
      return;
    }

    // Create initial status record
    await supabase.from("status").insert({
      business_id: business.id,
      is_open: false,
      message: "Welcome! Update your status here.",
    });

    setLoading(false);
    onComplete();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex justify-end">
        <button
          onClick={handleLogout}
          className="text-muted hover:text-foreground transition-colors text-sm"
        >
          Sign Out
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? "bg-accent" : "bg-card-border"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Create Your Board</h1>
                <p className="text-muted">
                  Let&apos;s set up your status board in 30 seconds.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="e.g., Joe's Barber Shop"
                    className="w-full bg-card border border-card-border rounded-xl py-4 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Your URL
                  </label>
                  <div className="flex items-center bg-card border border-card-border rounded-xl overflow-hidden">
                    <span className="px-4 text-muted text-sm">statusboard.app/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: generateSlug(e.target.value) })
                      }
                      placeholder="joes-barber"
                      className="flex-1 bg-transparent py-4 pr-4 text-foreground placeholder:text-muted/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim() || !formData.slug.trim()}
                className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">What type of business?</h1>
                <p className="text-muted">This helps us customize your board.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      formData.type === type.value
                        ? "bg-accent/10 border-accent"
                        : "bg-card border-card-border hover:border-accent/30"
                    }`}
                  >
                    <type.icon
                      className={`w-6 h-6 ${
                        formData.type === type.value ? "text-accent" : "text-muted"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        formData.type === type.value ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-3 text-accent-red text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-card border border-card-border hover:border-accent/30 text-foreground font-semibold py-4 px-6 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Board</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

