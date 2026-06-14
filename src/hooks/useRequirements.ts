import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Requirement, RequirementStepData } from "@/types";

export function useClientInfo() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-client", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      // Find the client record matching user email
      const { data, error } = await (supabase.from("clients") as any)
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });
}

export function useRequirements() {
  const { profile } = useAuth();
  const { data: clientInfo } = useClientInfo();

  return useQuery<Requirement[]>({
    queryKey: ["requirements", profile?.org_id, clientInfo?.id],
    queryFn: async () => {
      if (profile?.role === "admin" || profile?.role === "team_member") {
        // Admins see all requirements for their org
        // Join with clients to filter by organization
        const { data, error } = await (supabase.from("requirements") as any)
          .select(`
            *,
            client:clients(*)
          `);

        if (error) throw error;
        
        // Filter in frontend for org_id
        return (data || []).filter((r: any) => r.client?.org_id === profile.org_id);
      } else {
        // Clients only see their own requirements
        if (!clientInfo?.id) return [];
        const { data, error } = await (supabase.from("requirements") as any)
          .select("*")
          .eq("client_id", clientInfo.id);

        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!profile,
  });
}

export function useRequirementDraft() {
  const { data: clientInfo } = useClientInfo();

  return useQuery<Requirement | null>({
    queryKey: ["requirement-draft", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return null;

      const { data, error } = await (supabase.from("requirements") as any)
        .select("*")
        .eq("client_id", clientInfo.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clientInfo?.id,
  });
}

export function useSaveRequirementDraft() {
  const queryClient = useQueryClient();
  const { data: clientInfo } = useClientInfo();

  return useMutation({
    mutationFn: async ({ id, stepData }: { id?: string; stepData: RequirementStepData }) => {
      if (!clientInfo?.id) throw new Error("Client record not found for this email.");

      const payload: any = {
        client_id: clientInfo.id,
        step_data: stepData,
        status: "draft",
      };

      if (id) {
        payload.id = id;
      }

      const { data, error } = await (supabase.from("requirements") as any)
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-draft", clientInfo?.id] });
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });
}

export function useSubmitRequirement() {
  const queryClient = useQueryClient();
  const { data: clientInfo } = useClientInfo();

  return useMutation({
    mutationFn: async ({ id, stepData }: { id?: string; stepData: RequirementStepData }) => {
      if (!clientInfo?.id) throw new Error("Client record not found for this email.");

      const payload: any = {
        client_id: clientInfo.id,
        step_data: stepData,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      };

      if (id) {
        payload.id = id;
      }

      const { data, error } = await (supabase.from("requirements") as any)
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-draft", clientInfo?.id] });
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });
}
