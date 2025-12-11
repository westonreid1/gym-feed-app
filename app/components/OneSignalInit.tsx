"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: unknown) => void>;
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    // Load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: { init: (config: { appId: string; allowLocalhostAsSecureOrigin: boolean }) => Promise<void> }) => {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
        });
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector(
        'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}



