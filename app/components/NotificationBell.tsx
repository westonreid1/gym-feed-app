"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface OneSignalType {
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
}

type OneSignalWindow = Window & {
  OneSignalDeferred?: Array<(OneSignal: OneSignalType) => void>;
};

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if OneSignal is loaded and get subscription status
    const checkSubscription = () => {
      if (typeof window === "undefined") return;
      
      const win = window as OneSignalWindow;
      win.OneSignalDeferred = win.OneSignalDeferred || [];
      win.OneSignalDeferred.push((OneSignal) => {
        setIsSubscribed(OneSignal.User.PushSubscription.optedIn);
        setIsLoading(false);
      });
    };

    // Wait a bit for OneSignal to initialize
    const timer = setTimeout(checkSubscription, 1000);
    
    // Also check if push is supported
    if (!("Notification" in window)) {
      setIsSupported(false);
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, []);

  async function handleToggle() {
    if (typeof window === "undefined") return;
    setIsLoading(true);

    const win = window as OneSignalWindow;
    win.OneSignalDeferred = win.OneSignalDeferred || [];
    win.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (isSubscribed) {
          await OneSignal.User.PushSubscription.optOut();
          setIsSubscribed(false);
        } else {
          await OneSignal.Notifications.requestPermission();
          await OneSignal.User.PushSubscription.optIn();
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error("Notification toggle failed:", err);
      }
      setIsLoading(false);
    });
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
