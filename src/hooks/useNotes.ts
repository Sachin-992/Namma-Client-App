import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Note } from "@/types";

export function useNotes() {
  const { profile } = useAuth();

  return useQuery<Note[]>({
    queryKey: ["notes", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      const { data, error } = await (supabase.from("notes") as any)
        .select(`
          *,
          author:profiles(*)
        `)
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.org_id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (note: Omit<Note, "id" | "org_id" | "created_at" | "created_by">) => {
      if (!profile?.org_id || !profile?.id) throw new Error("Unauthenticated");

      const { data, error } = await (supabase.from("notes") as any)
        .insert({
          ...note,
          org_id: profile.org_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.org_id] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...note }: Partial<Note> & { id: string }) => {
      const { data, error } = await (supabase.from("notes") as any)
        .update(note)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.org_id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notes") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.org_id] });
    },
  });
}
