"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Check,
  Palette,
  Link as LinkIcon,
  Type,
  Store,
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  Music,
} from "lucide-react";
import Link from "next/link";
import type { Business } from "@/types/database";

const BUSINESS_TYPES = [
  { value: "gym", label: "Gym / Fitness", icon: Dumbbell },
  { value: "barber", label: "Barber Shop", icon: Scissors },
  { value: "food_truck", label: "Food Truck", icon: Truck },
  { value: "salon", label: "Salon / Spa", icon: Sparkles },
  { value: "studio", label: "Studio", icon: Music },
  { value: "other", label: "Other", icon: Store },
];

const PRESET_COLORS = [
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    type: "gym",
    primary_color: "#22c55e",
    external_link: "",
    external_link_text: "",
  });

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (!businessData) {
      router.push("/dashboard");
      return;
    }

    setBusiness(businessData);
    setFormData({
      name: businessData.name || "",
      tagline: businessData.tagline || "",
      type: businessData.type || "gym",
      primary_color: businessData.primary_color || "#22c55e",
      external_link: businessData.external_link || "",
      external_link_text: businessData.external_link_text || "",
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: formData.name,
        tagline: formData.tagline,
        type: formData.type,
        primary_color: formData.primary_color,
        external_link: formData.external_link || null,
        external_link_text: formData.external_link_text || null,
      })
      .eq("id", business.id);

    if (updateError) {
      setError("Failed to save settings. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Update local state
      setBusiness({
        ...business,
        ...formData,
      });
    }
    setSaving(false);
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
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-muted">Customize your board</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Business Name & Tagline */}
        <section className="rounded-2xl bg-card border border-card-border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">Business Info</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Tagline (optional)
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g., Daily Workouts, Fresh Cuts Daily"
              className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Your Public URL
            </label>
            <div className="flex items-center bg-background border border-card-border rounded-xl px-4 py-3 text-muted">
              <span>statusboard.app/{business?.slug}</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Contact support to change your URL
            </p>
          </div>
        </section>

        {/* Business Type */}
        <section className="rounded-2xl bg-card border border-card-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">Business Type</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  formData.type === type.value
                    ? "bg-accent/10 border-accent"
                    : "bg-background border-card-border hover:border-accent/30"
                }`}
              >
                <type.icon
                  className={`w-5 h-5 ${
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
        </section>

        {/* Accent Color */}
        <section className="rounded-2xl bg-card border border-card-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">Accent Color</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setFormData({ ...formData, primary_color: color })}
                className="w-10 h-10 rounded-xl transition-all"
                style={{
                  backgroundColor: color,
                  boxShadow: formData.primary_color === color 
                    ? `0 0 0 2px var(--card), 0 0 0 4px ${color}` 
                    : "none",
                }}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData({ ...formData, primary_color: e.target.value })
                }
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-card-border"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-xl bg-background border border-card-border">
            <p className="text-sm text-muted mb-2">Preview:</p>
            <button
              className="py-2 px-4 rounded-lg text-background font-medium text-sm"
              style={{ backgroundColor: formData.primary_color }}
            >
              Open for Business
            </button>
          </div>
        </section>

        {/* External Link */}
        <section className="rounded-2xl bg-card border border-card-border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Call-to-Action Link</h2>
              <p className="text-xs text-muted">Optional button on your public page</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Button URL
            </label>
            <input
              type="url"
              value={formData.external_link}
              onChange={(e) =>
                setFormData({ ...formData, external_link: e.target.value })
              }
              placeholder="https://example.com/book"
              className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={formData.external_link_text}
              onChange={(e) =>
                setFormData({ ...formData, external_link_text: e.target.value })
              }
              placeholder="Book Now, Sign Up, Order Online..."
              className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-3 text-accent-red text-sm">
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </main>
    </div>
  );
}

