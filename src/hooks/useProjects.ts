import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";
import type { Project, Milestone, ProjectTag } from "@/types";

export function useProjects(stageFilter?: string) {
  const { profile } = useAuth();

  return useQuery<Project[]>({
    queryKey: ["projects", profile?.org_id, stageFilter],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      let query = (supabase.from("projects") as any)
        .select(`
          *,
          client:clients(*),
          tags:project_tags(*),
          milestones:milestones(*)
        `)
        .eq("org_id", profile.org_id);

      if (stageFilter && stageFilter !== "all") {
        query = query.eq("stage", stageFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.org_id,
  });
}

export function useProjectDetail(id: string) {
  return useQuery<Project>({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("projects") as any)
        .select(`
          *,
          client:clients(*),
          tags:project_tags(*),
          milestones:milestones(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (
      project: any
    ) => {
      if (!profile?.org_id || !profile?.id) {
        throw new Error("User must belong to an organization.");
      }

      const { tags, ...projectData } = project;

      // Insert project
      const { data: newProject, error: projectError } = await (supabase.from("projects") as any)
        .insert({
          ...projectData,
          org_id: profile.org_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Insert tags if provided
      if (tags && tags.length > 0 && newProject) {
        const tagObjects = tags.map((t: string) => ({
          project_id: newProject.id,
          label: t,
          color: t === "UI" ? "#818CF8" : t === "DEV" ? "#34D399" : t === "SEO" ? "#FBBF24" : "#94A3B8",
        }));
        const { error: tagsError } = await (supabase.from("project_tags") as any).insert(tagObjects);
        if (tagsError) console.error("Error creating project tags:", tagsError);
      }

      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", profile?.org_id] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...project }: any) => {
      const { tags, ...projectData } = project;
      const { data, error } = await (supabase.from("projects") as any)
        .update(projectData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (tags) {
        // Delete old tags
        await (supabase.from("project_tags") as any).delete().eq("project_id", id);
        // Insert new ones
        if (tags.length > 0) {
          const tagObjects = tags.map((t: string) => ({
            project_id: id,
            label: t,
            color: t === "UI" ? "#818CF8" : t === "DEV" ? "#34D399" : t === "SEO" ? "#FBBF24" : "#94A3B8",
          }));
          const { error: tagsError } = await (supabase.from("project_tags") as any).insert(tagObjects);
          if (tagsError) console.error("Error updating project tags:", tagsError);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useToggleMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await (supabase.from("milestones") as any)
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useProjectClosure(projectId: string) {
  return useQuery<any>({
    queryKey: ["project-closure", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await (supabase.from("project_closure") as any)
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpsertProjectClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (closure: any) => {
      // 1. Upsert closure details
      const { data, error: closureError } = await (supabase.from("project_closure") as any)
        .upsert(closure)
        .select()
        .single();

      if (closureError) throw closureError;

      // 2. Mark project status and stage as completed, 100% completion pct
      const { error: projectError } = await (supabase.from("projects") as any)
        .update({
          stage: "completed",
          status: "completed",
          completion_pct: 100,
        })
        .eq("id", closure.project_id);

      if (projectError) throw projectError;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-closure", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
