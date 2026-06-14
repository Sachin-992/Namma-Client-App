import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  gst: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "onboarding", "inactive"]),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  editData?: Partial<FormData & { id: string }>;
}

export default function AddClientModal({ onClose, editData }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "active",
      ...editData,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (editData?.id) {
        await updateClient.mutateAsync({ id: editData.id, ...data });
        toast.success(t("clients.clientUpdated"));
      } else {
        await createClient.mutateAsync({ ...data, avatar_url: null } as any);
        toast.success(t("clients.clientAdded"));
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save client details");
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
            {editData ? t("clients.editClient") : t("clients.addClient")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.name")} *</label>
              <input {...register("name")} className="form-input" placeholder="Anjali Sharma" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.company")}</label>
              <input {...register("company")} className="form-input" placeholder="Vortex Media" />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.email")} *</label>
              <input {...register("email")} type="email" className="form-input" placeholder="client@company.com" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.phone")}</label>
              <input {...register("phone")} className="form-input" placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.address")}</label>
            <input {...register("address")} className="form-input" placeholder="123 Main St, Chennai" />
          </div>

          {/* GST */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.gstOptional")}</label>
            <input {...register("gst")} className="form-input" placeholder="22AAAAA0000A1Z5" />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.status")}</label>
            <select {...register("status")} className="form-input">
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("clients.notes")}</label>
            <textarea
              {...register("notes")}
              rows={3}
              className="form-input resize-none"
              placeholder="Any internal notes about this client..."
            />
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
              {loading ? "Saving..." : (editData ? t("common.save") : t("clients.addClient"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
