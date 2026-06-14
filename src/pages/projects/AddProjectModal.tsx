import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";

const schema = z.object({
  name: z.string().min(2, "Project name is required"),
  client_id: z.string().uuid("Please select a client"),
  description: z.string().optional(),
  stage: z.enum(["requirements", "planning", "design", "development", "testing", "deployment", "completed"]),
  status: z.enum(["active", "on_hold", "completed", "cancelled"]),
  start_date: z.string().optional(),
  delivery_date: z.string().optional(),
  completion_pct: z.coerce.number().min(0).max(100),
  tags: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  editData?: Partial<FormData & { id: string }>;
}

const AVAILABLE_TAGS = ["UI", "DEV", "SEO", "PR"];

export default function AddProjectModal({ onClose, editData }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: clients } = useClients();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      stage: "requirements",
      status: "active",
      completion_pct: 0,
      tags: [],
      ...editData,
    },
  });

  const selectedTags = watch("tags") || [];

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setValue("tags", selectedTags.filter((t: string) => t !== tag));
    } else {
      setValue("tags", [...selectedTags, tag]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Clean up empty date values
      const payload = {
        ...data,
        start_date: data.start_date || null,
        delivery_date: data.delivery_date || null,
      };

      if (editData?.id) {
        await updateProject.mutateAsync({ id: editData.id, ...payload } as any);
        toast.success("Project updated successfully!");
      } else {
        await createProject.mutateAsync(payload);
        toast.success("Project created successfully!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-card-hover w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">
            {editData ? "Edit Project" : "Create New Project"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.name")} *</label>
            <input {...register("name")} className="form-input" placeholder="E-Commerce Redesign" />
            {errors.name && <p className="text-xs text-destructive mt-1">{(errors.name as any).message}</p>}
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.client")} *</label>
            <select {...register("client_id")} className="form-input">
              <option value="">Select a client...</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company ? `(${client.company})` : ""}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="text-xs text-destructive mt-1">{(errors.client_id as any).message}</p>}
          </div>

          {/* Stage + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.stage")}</label>
              <select {...register("stage")} className="form-input">
                <option value="requirements">Requirements</option>
                <option value="planning">Planning</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="deployment">Deployment</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.status")}</label>
              <select {...register("status")} className="form-input">
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Start Date + Delivery Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.startDate")}</label>
              <input {...register("start_date")} type="date" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.deliveryDate")}</label>
              <input {...register("delivery_date")} type="date" className="form-input" />
            </div>
          </div>

          {/* Completion Percentage */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Completion Percentage (%)</label>
            <input
              type="number"
              {...register("completion_pct")}
              className="form-input"
              min="0"
              max="100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("projects.description")}</label>
            <textarea
              {...register("description")}
              rows={3}
              className="form-input resize-none"
              placeholder="Describe project details, objectives..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Project Tags</label>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? "Creating..." : (editData ? t("common.save") : "Create Project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
