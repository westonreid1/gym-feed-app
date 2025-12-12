"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

// Declare OneSignal on window - matching OneSignal Web SDK v16
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
        removeTags: (keys: string[]) => Promise<void>;
      };
    };
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
    const OneSignal = window.OneSignal;
    
    if (!OneSignal) {
      console.error("🔔 OneSignal not loaded");
      return;
    }

    setIsLoading(true);
    console.log("🔔 Starting toggle, businessId:", businessId, "businessSlug:", businessSlug);

    try {
      if (isSubscribed) {
        // Unsubscribe
        console.log("🔔 Opting out...");
        await OneSignal.User.PushSubscription.optOut();
        
        // Remove tags
        if (businessId) {
          try {
            console.log("🔔 Removing tags...");
            await OneSignal.User.removeTags(["business_id", "business_slug"]);
            console.log("🔔 Tags removed");
          } catch (e) {
            console.error("🔔 Failed to remove tags:", e);
          }
        }
        
        setIsSubscribed(false);
        console.log("🔔 Unsubscribed");
      } else {
        // Subscribe
        console.log("🔔 Requesting permission...");
        await OneSignal.Notifications.requestPermission();
        
        console.log("🔔 Opting in...");
        await OneSignal.User.PushSubscription.optIn();
        
        // Add tags - wait a bit for subscription to register
        if (businessId || businessSlug) {
          // Small delay to ensure subscription is registered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const tags: Record<string, string> = {};
          if (businessId) tags["business_id"] = businessId;
          if (businessSlug) tags["business_slug"] = businessSlug;
          
          console.log("🔔 Adding tags:", tags);
          
          try {
            await OneSignal.User.addTags(tags);
            console.log("🔔 Tags added successfully!");
          } catch (e) {
            console.error("🔔 addTags failed:", e);
            
            // Fallback: try adding one at a time
            console.log("🔔 Trying individual addTag calls...");
            try {
              if (businessId) {
                await OneSignal.User.addTag("business_id", businessId);
                console.log("🔔 business_id tag added");
              }
              if (businessSlug) {
                await OneSignal.User.addTag("business_slug", businessSlug);
                console.log("🔔 business_slug tag added");
              }
            } catch (e2) {
              console.error("🔔 Individual addTag also failed:", e2);
            }
          }
        } else {
          console.warn("🔔 No businessId or businessSlug provided!");
        }
        
        setIsSubscribed(true);
        console.log("🔔 Subscribed");
      }
    } catch (err) {
      console.error("🔔 Toggle failed:", err);
    }

    setIsLoading(false);
  }

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
