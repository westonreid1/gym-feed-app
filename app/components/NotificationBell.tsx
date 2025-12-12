"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

// Declare OneSignal on window
declare global {
  interface Window {
    OneSignal?: {
      Notifications: {
        permission: boolean;
        requestPermission: () => Promise<void>;
      };
      User: {
        PushSubscription: {
          optedIn: boolean;
          optIn: () => Promise<void>;
          optOut: () => Promise<void>;
        };
        addTag: (key: string, value: string) => Promise<void>;
        removeTag: (key: string) => Promise<void>;
        addTags: (tags: Record<string, string>) => Promise<void>;
      };
    };
    OneSignalDeferred?: Array<(OneSignal: unknown) => void>;
  }
}

type NotificationBellProps = {
  businessId?: string;
  businessSlug?: string;
};

export default function NotificationBell({ businessId, businessSlug }: NotificationBellProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Wait for OneSignal to be ready, then check subscription
    const checkSubscription = () => {
      if (window.OneSignal?.User?.PushSubscription) {
        setIsSubscribed(window.OneSignal.User.PushSubscription.optedIn);
        setIsSupported(true);
        setIsLoading(false);
      } else {
        // OneSignal not ready yet, try again
        setTimeout(checkSubscription, 500);
      }
    };

    // Start checking after a delay to let OneSignal initialize
    const timer = setTimeout(checkSubscription, 1500);

    // Fallback: stop loading after 5 seconds, mark unsupported if OneSignal didn't load
    const fallback = setTimeout(() => {
      if (!window.OneSignal) {
        setIsSupported(false);
      }
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  async function handleToggle() {
    if (!window.OneSignal) {
      console.error("OneSignal not loaded");
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await window.OneSignal.User.PushSubscription.optOut();
        
        // Remove business tag when unsubscribing
        if (businessId) {
          await window.OneSignal.User.removeTag("business_id");
          await window.OneSignal.User.removeTag("business_slug");
        }
        
        setIsSubscribed(false);
      } else {
        // Subscribe
        await window.OneSignal.Notifications.requestPermission();
        await window.OneSignal.User.PushSubscription.optIn();
        
        // Tag user with business ID so we can filter notifications
        if (businessId || businessSlug) {
          const tags: Record<string, string> = {};
          if (businessId) tags.business_id = businessId;
          if (businessSlug) tags.business_slug = businessSlug;
          await window.OneSignal.User.addTags(tags);
        }
        
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
    }

    setIsLoading(false);
  }

  // Always show the bell - don't hide it
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !isSupported}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        !isSupported
          ? "bg-card border border-card-border text-muted/30"
          : isSubscribed
          ? "bg-accent/20 text-accent"
          : "bg-card border border-card-border text-muted hover:text-foreground"
      }`}
      title={!isSupported ? "Notifications not supported" : isSubscribed ? "Notifications enabled" : "Enable notifications"}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </button>
  );
}
