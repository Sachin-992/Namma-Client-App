import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Client } from "@/types";

export function useClients() {
  const { profile } = useAuth();
  
  return useQuery<Client[]>({
    queryKey: ["clients", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      
      const { data, error } = await (supabase.from("clients") as any)
        .select(`
          *,
          projects (
            id,
            name,
            stage,
            project_tags (
              label,
              color
            )
          )
        `)
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.org_id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<Client, "id" | "org_id" | "created_at" | "created_by">) => {
      if (!profile?.org_id || !profile?.id) {
        throw new Error("User must belong to an organization.");
      }
      
      const { data, error } = await (supabase.from("clients") as any)
        .insert({
          ...client,
          org_id: profile.org_id,
          created_by: profile.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", profile?.org_id] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await (supabase.from("clients") as any)
        .update(client)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", profile?.org_id] });
      queryClient.invalidateQueries({ queryKey: ["client-detail"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("clients") as any)
        .delete()
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", profile?.org_id] });
    },
  });
}

export function useClientDetail(id: string) {
  return useQuery<Client>({
    queryKey: ["client-detail", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients") as any)
        .select(`
          *,
          projects (
            id,
            name,
            stage,
            completion_pct
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
