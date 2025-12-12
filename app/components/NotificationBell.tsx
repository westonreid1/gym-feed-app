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
      };
    };
    OneSignalDeferred?: Array<(OneSignal: unknown) => void>;
  }
}

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if push is supported
    if (!("Notification" in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    // Wait for OneSignal to be ready, then check subscription
    const checkSubscription = () => {
      if (window.OneSignal?.User?.PushSubscription) {
        setIsSubscribed(window.OneSignal.User.PushSubscription.optedIn);
        setIsLoading(false);
      } else {
        // OneSignal not ready yet, try again
        setTimeout(checkSubscription, 500);
      }
    };

    // Start checking after a delay to let OneSignal initialize
    const timer = setTimeout(checkSubscription, 1500);

    // Fallback: stop loading after 5 seconds
    const fallback = setTimeout(() => {
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
        await window.OneSignal.User.PushSubscription.optOut();
        setIsSubscribed(false);
      } else {
        await window.OneSignal.Notifications.requestPermission();
        await window.OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
    }

    setIsLoading(false);
  }

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        isSubscribed
          ? "bg-accent/20 text-accent"
          : "bg-card border border-card-border text-muted hover:text-foreground"
      }`}
      title={isSubscribed ? "Notifications enabled" : "Enable notifications"}
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
