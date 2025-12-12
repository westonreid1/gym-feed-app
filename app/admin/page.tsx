"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Legacy admin page - redirects to the new /dashboard
 * This maintains backwards compatibility for existing bookmarks/links
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
        <p className="text-muted">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
