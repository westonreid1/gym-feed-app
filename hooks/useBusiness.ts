"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Business, Status, Post } from "@/types/database";

type UseBusinessOptions = {
  slug?: string; // Optional: override slug from URL params
};

type UseBusinessReturn = {
  business: Business | null;
  status: Status | null;
  posts: Post[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch business data by slug
 * Use in public pages: /[slug]
 */
export function useBusiness(options?: UseBusinessOptions): UseBusinessReturn {
  const params = useParams();
  const slug = options?.slug || (params?.slug as string);
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!slug) {
      setError("No business slug provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Fetch business by slug
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (businessError || !businessData) {
        setError("Business not found");
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      // Fetch status for this business
      const { data: statusData } = await supabase
        .from("status")
        .select("*")
        .eq("business_id", businessData.id)
        .single();

      setStatus(statusData);

      // Fetch posts for this business
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    } catch (err) {
      setError("Failed to load business data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!business?.id) return;

    const supabase = createClient();

    const statusChannel = supabase
      .channel(`status_${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "status",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setStatus(payload.new as Status);
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`posts_${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Post) : p))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [business?.id]);

  return { business, status, posts, loading, error, refetch: fetchData };
}

