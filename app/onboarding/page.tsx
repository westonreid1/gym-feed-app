"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  Music,
  Coffee,
  ShoppingBag,
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { BUSINESS_PRESETS, getBusinessPreset } from "@/types/database";

const ICONS: Record<string, React.ElementType> = {
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  Music,
  Coffee,
  ShoppingBag,
  Store,
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [businessType, setBusinessType] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22c55e");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const preset = businessType ? getBusinessPreset(businessType) : null;

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleTypeSelect(type: string) {
    setBusinessType(type);
    const preset = getBusinessPreset(type);
    setPrimaryColor(preset.color);
    setTagline(preset.tagline);
  }

  function handleNameChange(name: string) {
    setBusinessName(name);
    setSlug(generateSlug(name));
  }

  async function handleCreateAccount() {
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        setError("This URL is already taken. Please go back and choose another.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: businessName,
          slug: slug,
          type: businessType,
          tagline: tagline,
          primary_color: primaryColor,
          owner_id: authData.user.id,
        })
        .select()
        .single();

      if (businessError) {
        console.error("Business creation error:", businessError);
        setError("Failed to create business. Please try again.");
        setLoading(false);
        return;
      }

      await supabase.from("status").insert({
        business_id: business.id,
        is_open: false,
        message: preset?.defaultStatusMessage || "Welcome! Update your status here.",
      });

      router.push("/dashboard");

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold">StatusBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-muted hover:text-foreground transition-colors text-sm">Already have an account? Sign in</a>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${s <= step ? "bg-accent" : "bg-card-border"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">What type of business?</h1>
              <p className="text-muted text-lg">This helps us set up the perfect template for you.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BUSINESS_PRESETS.map((preset) => {
                const Icon = ICONS[preset.icon] || Store;
                return (
                  <button
                    key={preset.value}
                    onClick={() => handleTypeSelect(preset.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${businessType === preset.value ? "border-accent bg-accent/10" : "border-card-border bg-card hover:border-accent/30"}`}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${preset.color}20` }}>
                      <Icon className="w-7 h-7" style={{ color: preset.color }} />
                    </div>
                    <span className={`font-medium text-center ${businessType === preset.value ? "text-foreground" : "text-muted"}`}>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!businessType}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-background font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Tell us about your business</h1>
              <p className="text-muted text-lg">This info will appear on your public status board.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Joe's Barber Shop"
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-4 text-foreground text-lg placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Your URL</label>
                <div className="flex items-center bg-card border border-card-border rounded-xl overflow-hidden">
                  <span className="px-4 py-4 text-muted bg-card-border/30">statusboard.app/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="joes-barber"
                    className="flex-1 bg-transparent py-4 pr-4 text-foreground text-lg placeholder:text-muted/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Tagline (optional)</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={preset?.tagline || "A short description"}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-card border border-card-border hover:border-accent/30 text-foreground font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!businessName.trim() || !slug.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-background font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Customize your look</h1>
              <p className="text-muted text-lg">Choose your accent color. You can change this anytime.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-4">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                {["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#0891b2", "#78350f"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className="w-12 h-12 rounded-xl transition-transform hover:scale-110"
                    style={{ backgroundColor: color, boxShadow: primaryColor === color ? `0 0 0 3px var(--background), 0 0 0 5px ${color}` : "none" }}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-card-border"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-card-border overflow-hidden">
              <div className="bg-card-border/30 px-4 py-2 text-xs text-muted">Preview</div>
              <div className="bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  {preset && (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      {(() => {
                        const Icon = ICONS[preset.icon] || Store;
                        return <Icon className="w-6 h-6" style={{ color: primaryColor }} />;
                      })()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{businessName || "Your Business"}</h3>
                    <p className="text-sm text-muted">{tagline || preset?.tagline}</p>
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="font-semibold" style={{ color: primaryColor }}>{preset?.statusOpenText || "Open"}</span>
                  </div>
                  <p className="text-foreground/70 mt-1">{preset?.defaultStatusMessage}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-card border border-card-border hover:border-accent/30 text-foreground font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-accent hover:bg-accent/90 text-background font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Create your account</h1>
              <p className="text-muted text-lg">Set up your login credentials to access your dashboard.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-card border border-card-border rounded-xl py-4 pl-12 pr-4 text-foreground text-lg placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-card border border-card-border rounded-xl py-4 pl-12 pr-12 text-foreground text-lg placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-card border border-card-border rounded-xl py-4 pl-12 pr-4 text-foreground text-lg placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-500">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 bg-card border border-card-border hover:border-accent/30 text-foreground font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-background font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
