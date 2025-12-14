"use client";

import { useState } from "react";
import { AlertTriangle, CreditCard, Loader2, X, Zap } from "lucide-react";
import type { Business } from "@/types/database";

type SubscriptionBannerProps = {
  business: Business;
};

export default function SubscriptionBanner({ business }: SubscriptionBannerProps) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { subscription_status, trial_ends_at } = business;

  // Calculate days remaining in trial
  const trialDaysLeft = trial_ends_at
    ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Determine if we should show a banner
  const isTrialing = subscription_status === "trialing";
  const isTrialEnding = isTrialing && trialDaysLeft <= 3;
  const isTrialExpired = isTrialing && trialDaysLeft <= 0;
  const isPastDue = subscription_status === "past_due";
  const isCanceled = subscription_status === "canceled";
  const isActive = subscription_status === "active";

  // Don't show banner for active subscriptions or if dismissed
  if (isActive || (dismissed && !isTrialExpired && !isPastDue && !isCanceled)) {
    return null;
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to start checkout:", error);
    }
    setLoading(false);
  }

  async function handleManageSubscription() {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open portal:", error);
    }
    setLoading(false);
  }

  // Trial expired or canceled - must pay
  if (isTrialExpired || isCanceled) {
    return (
      <div className="bg-accent-red/10 border border-accent-red/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-accent-red">
              {isCanceled ? "Subscription Canceled" : "Trial Expired"}
            </p>
            <p className="text-sm text-muted mt-1">
              {isCanceled
                ? "Your subscription has been canceled. Subscribe to continue using all features."
                : "Your free trial has ended. Subscribe to continue using StatusBoard."}
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-accent-red hover:bg-accent-red/90 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Subscribe</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Past due - payment failed
  if (isPastDue) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-500">Payment Failed</p>
            <p className="text-sm text-muted mt-1">
              We couldn't process your payment. Please update your payment method to avoid service interruption.
            </p>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-500/90 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Update Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Trial ending soon
  if (isTrialEnding) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-500">
              Trial ending {trialDaysLeft === 0 ? "today" : trialDaysLeft === 1 ? "tomorrow" : `in ${trialDaysLeft} days`}
            </p>
            <p className="text-sm text-muted mt-1">
              Subscribe now to keep your status board running without interruption.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-500/90 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Subscribe - $49/mo</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Normal trial period
  if (isTrialing && trialDaysLeft > 3) {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-accent">
              {trialDaysLeft} days left in your free trial
            </p>
            <p className="text-sm text-muted mt-1">
              You're on the free trial. Subscribe anytime to lock in your account.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-background font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Subscribe - $49/mo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


