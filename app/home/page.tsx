"use client";

import Link from "next/link";
import {
  Dumbbell,
  Scissors,
  Truck,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Bell,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Updates",
    description:
      "Customers see status changes instantly. No refreshing needed.",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description:
      "Send instant alerts when you open, close, or have special announcements.",
  },
  {
    icon: Shield,
    title: "Simple & Secure",
    description:
      "Your data is yours. Industry-standard security with Supabase.",
  },
  {
    icon: BarChart3,
    title: "Easy Dashboard",
    description:
      "Manage everything from one clean interface. No tech skills needed.",
  },
];

const BUSINESS_TYPES = [
  { icon: Dumbbell, name: "Gyms", color: "#22c55e" },
  { icon: Scissors, name: "Barber Shops", color: "#3b82f6" },
  { icon: Truck, name: "Food Trucks", color: "#f59e0b" },
  { icon: Sparkles, name: "Salons", color: "#ec4899" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight">StatusBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted hover:text-foreground transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-accent hover:bg-accent/90 text-background font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Real-time status updates for your business</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Let customers know{" "}
            <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
              you&apos;re open
            </span>
          </h1>
          
          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            A dead-simple status board for gyms, barber shops, food trucks, and
            any business that needs to broadcast their availability in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-background font-semibold py-4 px-8 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
            >
              <span>Create Your Board</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/hayes-training"
              className="w-full sm:w-auto bg-card hover:bg-card/80 border border-card-border text-foreground font-semibold py-4 px-8 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
            >
              <span>See Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-16 px-6 border-t border-card-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted text-sm uppercase tracking-wider mb-8">
            Perfect for
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {BUSINESS_TYPES.map((type) => (
              <div
                key={type.name}
                className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-5 py-3"
              >
                <type.icon className="w-5 h-5" style={{ color: type.color }} />
                <span className="font-medium">{type.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-5 py-3 text-muted">
              <span className="font-medium">+ More</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Built for small business owners who want to keep customers informed
              without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-card-border rounded-2xl p-8 hover:border-accent/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Up and running in 2 minutes
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Create your account",
                description:
                  "Sign up with your email. No credit card required to start.",
              },
              {
                step: "2",
                title: "Customize your board",
                description:
                  "Set your business name, choose your URL slug, and pick your colors.",
              },
              {
                step: "3",
                title: "Share with customers",
                description:
                  "Give customers your unique link. They'll always know when you're open.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-full bg-accent text-background font-bold text-xl flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple pricing
          </h2>
          <p className="text-muted text-lg mb-10">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="bg-card border border-card-border rounded-2xl p-8">
            <div className="text-5xl font-bold mb-2">Free</div>
            <p className="text-muted mb-8">to get started</p>
            
            <ul className="space-y-4 text-left mb-8">
              {[
                "Unlimited status updates",
                "Real-time updates",
                "Custom URL slug",
                "Mobile-friendly board",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full bg-accent hover:bg-accent/90 text-background font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-card-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold">StatusBoard</span>
          </div>
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} StatusBoard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
