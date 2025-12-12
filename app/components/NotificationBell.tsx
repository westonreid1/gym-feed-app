"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready (client-side)
    setIsReady(true);
    
    try {
      // Check if notifications are supported (don't check serviceWorker - OneSignal handles that)
      const notificationSupported = typeof window !== "undefined" && 
        "Notification" in window;
      
      setIsSupported(notificationSupported);
      
      if (!notificationSupported) {
        return;
      }

      // Check OneSignal subscription status
      const checkSubscription = () => {
        try {
          const win = window as Window & { OneSignalDeferred?: Array<(os: unknown) => void> };
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push((os: unknown) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const OneSignal = os as any;
              if (OneSignal?.User?.PushSubscription?.optedIn !== undefined) {
                setIsSubscribed(OneSignal.User.PushSubscription.optedIn);
              }
            } catch (e) {
              console.log("OneSignal check failed:", e);
            }
          });
        } catch (e) {
          console.log("OneSignal deferred failed:", e);
        }
      };

      const timer = setTimeout(checkSubscription, 1500);
      return () => clearTimeout(timer);
    } catch (e) {
      console.log("NotificationBell init error:", e);
    }
  }, []);

  async function handleToggle() {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const win = window as Window & { OneSignalDeferred?: Array<(os: unknown) => void> };
      win.OneSignalDeferred = win.OneSignalDeferred || [];
      win.OneSignalDeferred.push(async (os: unknown) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const OneSignal = os as any;
          if (isSubscribed) {
            await OneSignal.User.PushSubscription.optOut();
            setIsSubscribed(false);
          } else {
            await OneSignal.Notifications.requestPermission();
            await OneSignal.User.PushSubscription.optIn();
            setIsSubscribed(true);
          }
        } catch (err) {
          console.log("Notification toggle failed:", err);
        }
        setIsLoading(false);
      });
    } catch (e) {
      console.log("Toggle error:", e);
      setIsLoading(false);
    }
  }

  // Always render - never return null
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !isSupported}
      style={{ minWidth: 40, minHeight: 40 }}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        !isReady || !isSupported
          ? "bg-card border border-card-border text-muted/50"
          : isSubscribed
          ? "bg-accent/20 text-accent"
          : "bg-card border border-card-border text-muted hover:text-foreground"
      }`}
      title={
        !isSupported
          ? "Notifications not available"
          : isSubscribed
          ? "Notifications enabled"
          : "Enable notifications"
      }
      aria-label="Toggle notifications"
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
