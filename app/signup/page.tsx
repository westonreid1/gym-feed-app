"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Zap, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Send magic link - after clicking, user will be redirected to /onboarding
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  // Success state - email sent
  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Check your email!</h1>
            <p className="text-muted text-lg mb-2">
              We sent a magic link to:
            </p>
            <p className="text-foreground font-medium text-lg mb-6">
              {email}
            </p>
            <p className="text-muted">
              Click the link in the email to sign in and set up your business.
            </p>
            
            <div className="mt-8 pt-8 border-t border-card-border">
              <p className="text-sm text-muted mb-4">
                Didn't receive the email?
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Try again with a different email
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <Link
          href="/login"
          className="text-muted hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-accent">Sign in</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-2xl font-bold">Create your StatusBoard</h1>
            <p className="text-muted mt-2">
              Enter your email to get started. No password needed!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-3 text-accent-red text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-card border border-card-border rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending link...</span>
                </>
              ) : (
                <span>Send me a magic link</span>
              )}
            </button>

            <p className="text-center text-sm text-muted">
              We'll send you a link to sign in instantly. No password required.
            </p>
          </form>

          {/* Features preview */}
          <div className="mt-12 pt-8 border-t border-card-border">
            <p className="text-sm text-muted text-center mb-4">
              What you'll get:
            </p>
            <ul className="space-y-3">
              {[
                "Real-time status board for your business",
                "Push notifications to your customers",
                "Custom URL (statusboard.app/your-business)",
                "Mobile-friendly dashboard",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-muted">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

