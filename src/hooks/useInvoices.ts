import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Invoice, Payment } from "@/types";

export function useInvoices() {
  const { profile } = useAuth();

  return useQuery<Invoice[]>({
    queryKey: ["invoices", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      const { data, error } = await (supabase.from("invoices") as any)
        .select(`
          *,
          client:clients(*),
          project:projects(*)
        `)
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.org_id,
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("invoices") as any)
        .select(`
          *,
          client:clients(*),
          project:projects(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "org_id" | "created_at">) => {
      if (!profile?.org_id) throw new Error("User must belong to an organization.");

      const { data, error } = await (supabase.from("invoices") as any)
        .insert({
          ...invoice,
          org_id: profile.org_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", profile?.org_id] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, paid_at }: { id: string; status: Invoice["status"]; paid_at?: string | null }) => {
      const updateData: any = { status };
      if (paid_at !== undefined) updateData.paid_at = paid_at;

      const { data, error } = await (supabase.from("invoices") as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", profile?.org_id] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
    },
  });
}

export function usePayments() {
  const { profile } = useAuth();

  return useQuery<Payment[]>({
    queryKey: ["payments", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      const { data, error } = await (supabase.from("payments") as any)
        .select(`
          *,
          client:clients(*),
          invoice:invoices(*)
        `)
        .order("paid_at", { ascending: false });

      if (error) throw error;
      
      // Filter client-level records that belong to our org
      // Since payments doesn't directly store org_id, we can check client.org_id or filter on backend
      const filtered = (data || []).filter((p: any) => p.client?.org_id === profile.org_id);
      return filtered;
    },
    enabled: !!profile?.org_id,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, "id" | "paid_at">) => {
      const { data, error } = await (supabase.from("payments") as any)
        .insert({
          ...payment,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", profile?.org_id] });
      queryClient.invalidateQueries({ queryKey: ["invoices", profile?.org_id] });
    },
  });
}
