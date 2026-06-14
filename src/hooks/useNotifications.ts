import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AppNotification {
  id: string;
  org_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const QUERY_KEY = ["notifications"];

// Fetch all notifications for current user
export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<AppNotification[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!profile?.id) return [];
      try {
        const { data, error } = await (supabase.from("notifications") as any)
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(50);
        // If table doesn't exist yet, return empty gracefully
        if (error) {
          console.warn("Notifications table not ready:", error.message);
          return [];
        }
        return (data as AppNotification[]) || [];
      } catch {
        return [];
      }
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 30,
    retry: false, // Don't retry — table may not exist yet
  });

  const channelRef = useRef<any>(null);

  // Supabase Realtime subscription — instant updates on INSERT/UPDATE
  useEffect(() => {
    if (!profile?.id) return;
    // Guard: don't create a second subscription if one already exists
    if (channelRef.current) return;

    try {
      // ALL .on() calls must happen BEFORE .subscribe()
      const channel = supabase
        .channel(`notifications:${profile.id}:${Date.now()}`)
        .on(
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload: any) => {
            const newNotif = payload.new as AppNotification;
            queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (prev) =>
              prev ? [newNotif, ...prev] : [newNotif]
            );
          }
        )
        .on(
          "postgres_changes" as any,
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          }
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Notifications realtime subscription failed:", status);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn("Could not set up notifications realtime:", err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, queryClient]);

  return query;
}

// Unread count — used internally; TopBar uses useNotifications directly
export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return (notifications || []).filter((n) => !n.is_read).length;
}

// Mark a single notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (prev) =>
        (prev || []).map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    },
  });
}

// Mark ALL as read
export function useMarkAllRead() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (prev) =>
        (prev || []).map((n) => ({ ...n, is_read: true }))
      );
    },
  });
}

// Helper to create a notification (call from other mutations)
export async function createNotification(data: {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await (supabase.from("notifications") as any).insert({
      user_id: data.userId,
      org_id: data.orgId,
      type: data.type,
      title: data.title,
      message: data.message,
      entity_type: data.entityType || null,
      entity_id: data.entityId || null,
      is_read: false,
    });
  } catch {
    // Silently fail — notifications are non-critical
  }
}
