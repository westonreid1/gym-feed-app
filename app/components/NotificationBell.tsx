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
        getTags: () => Promise<Record<string, string>>;
      };
    };
    OneSignalDeferred?: Array<(OneSignal: Window['OneSignal']) => void>;
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
    console.log("🔔 NotificationBell: Starting toggle, businessId:", businessId);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await window.OneSignal.User.PushSubscription.optOut();
        
        // Remove business tags when unsubscribing
        if (businessId) {
          try {
            await window.OneSignal.User.removeTag("business_id");
            await window.OneSignal.User.removeTag("business_slug");
            console.log("🔔 Tags removed");
          } catch (tagErr) {
            console.error("🔔 Failed to remove tags:", tagErr);
          }
        }
        
        setIsSubscribed(false);
        console.log("🔔 Unsubscribed successfully");
      } else {
        // Subscribe
        console.log("🔔 Requesting permission...");
        await window.OneSignal.Notifications.requestPermission();
        
        console.log("🔔 Opting in...");
        await window.OneSignal.User.PushSubscription.optIn();
        
        // Wait a moment for subscription to fully register
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Tag user with business ID so we can filter notifications
        if (businessId || businessSlug) {
          console.log("🔔 Adding tags...", { businessId, businessSlug });
          try {
            // Try adding tags one at a time for better reliability
            if (businessId) {
              await window.OneSignal.User.addTag("business_id", businessId);
              console.log("🔔 Added business_id tag");
            }
            if (businessSlug) {
              await window.OneSignal.User.addTag("business_slug", businessSlug);
              console.log("🔔 Added business_slug tag");
            }
            
            // Verify tags were set
            if (window.OneSignal.User.getTags) {
              const tags = await window.OneSignal.User.getTags();
              console.log("🔔 Current tags:", tags);
            }
          } catch (tagErr) {
            console.error("🔔 Failed to add tags:", tagErr);
          }
        } else {
          console.warn("🔔 No businessId or businessSlug provided to NotificationBell!");
        }
        
        setIsSubscribed(true);
        console.log("🔔 Subscribed successfully");
      }
    } catch (err) {
      console.error("🔔 Notification toggle failed:", err);
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
