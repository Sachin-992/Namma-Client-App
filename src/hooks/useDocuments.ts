import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Document } from "@/types";
import { storageService, STORAGE_BUCKETS } from "@/services/storageService";

export function useDocuments() {
  const { profile } = useAuth();

  return useQuery<Document[]>({
    queryKey: ["documents", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      const { data, error } = await (supabase.from("documents") as any)
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

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      name,
      clientId,
      projectId,
    }: {
      file: File;
      name: string;
      clientId: string;
      projectId?: string | null;
    }) => {
      if (!profile?.org_id || !profile?.id) throw new Error("Unauthenticated");

      // 1. Upload file using storageService to 'client-documents' bucket
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.org_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      await storageService.uploadClientDocument(filePath, file);

      // 2. Insert record in documents table
      const fileTypeMap: Record<string, "pdf" | "jpg" | "png" | "docx"> = {
        pdf: "pdf",
        jpg: "jpg",
        jpeg: "jpg",
        png: "png",
        docx: "docx",
        doc: "docx",
      };

      const docType = fileTypeMap[fileExt?.toLowerCase() || ""] || "pdf";

      const { data, error: dbError } = await (supabase.from("documents") as any)
        .insert({
          org_id: profile.org_id,
          project_id: projectId || null,
          client_id: clientId,
          name: name,
          file_path: filePath,
          file_type: docType,
          file_size: file.size,
          uploaded_by: profile.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", profile?.org_id] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // 1. Delete from storage using storageService
      try {
        await storageService.deleteFile(STORAGE_BUCKETS.CLIENT_DOCUMENTS, filePath);
      } catch (storageError) {
        console.error("Error deleting from storage:", storageError);
      }

      // 2. Delete from database
      const { error: dbError } = await (supabase.from("documents") as any)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", profile?.org_id] });
    },
  });
}

export function useDocumentUrl(filePath: string) {
  return useQuery<string>({
    queryKey: ["document-url", filePath],
    queryFn: async () => {
      // Generate signed URL using storageService
      return await storageService.getSignedUrl(STORAGE_BUCKETS.CLIENT_DOCUMENTS, filePath, 60 * 15);
    },
    enabled: !!filePath,
  });
}

