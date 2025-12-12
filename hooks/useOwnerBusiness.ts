"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import type { Business, Status, Post } from "@/types/database";

type UseOwnerBusinessReturn = {
  user: User | null;
  business: Business | null;
  status: Status | null;
  posts: Post[];
  loading: boolean;
  error: string | null;
  // Actions
  updateStatus: (isOpen: boolean) => Promise<void>;
  updateStatusMessage: (message: string) => Promise<void>;
  createPost: (content: string) => Promise<Post | null>;
  updatePost: (id: number, content: string) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  updateBusiness: (updates: Partial<Business>) => Promise<void>;
  refetch: () => Promise<void>;
};

/**
 * Hook for business owners to manage their business
 * Use in dashboard pages: /dashboard
 */
export function useOwnerBusiness(): UseOwnerBusinessReturn {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      
      setUser(currentUser);

      // Fetch business owned by this user
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", currentUser.id)
        .single();

      if (businessError || !businessData) {
        // User doesn't have a business yet - this is OK for new users
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update business open/closed status
  const updateStatus = async (isOpen: boolean) => {
    if (!business || !status) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from("status")
      .update({ is_open: isOpen })
      .eq("id", status.id)
      .eq("business_id", business.id);

    if (!error) {
      setStatus({ ...status, is_open: isOpen });
    }
  };

  // Update status message
  const updateStatusMessage = async (message: string) => {
    if (!business || !status) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from("status")
      .update({ message })
      .eq("id", status.id)
      .eq("business_id", business.id);

    if (!error) {
      setStatus({ ...status, message });
    }
  };

  // Create a new post
  const createPost = async (content: string): Promise<Post | null> => {
    if (!business) return null;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .insert({ content, business_id: business.id })
      .select()
      .single();

    if (!error && data) {
      setPosts([data, ...posts]);
      return data;
    }
    return null;
  };

  // Update a post
  const updatePost = async (id: number, content: string) => {
    if (!business) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({ content })
      .eq("id", id)
      .eq("business_id", business.id);

    if (!error) {
      setPosts(posts.map((p) => (p.id === id ? { ...p, content } : p)));
    }
  };

  // Delete a post
  const deletePost = async (id: number) => {
    if (!business) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id);

    if (!error) {
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  // Update business details
  const updateBusiness = async (updates: Partial<Business>) => {
    if (!business) return;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", business.id)
      .eq("owner_id", user?.id)
      .select()
      .single();

    if (!error && data) {
      setBusiness(data);
    }
  };

  return {
    user,
    business,
    status,
    posts,
    loading,
    error,
    updateStatus,
    updateStatusMessage,
    createPost,
    updatePost,
    deletePost,
    updateBusiness,
    refetch: fetchData,
  };
}

