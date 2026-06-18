import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { User, Shield, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { toast } from "sonner";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  language: z.enum(["en", "ta"]),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ClientProfilePage() {
  const { profile, resetPassword, refreshProfile } = useAuth();
  const { i18n } = useTranslation();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      language: (profile?.language as "en" | "ta") || "en",
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    if (!profile?.id) return;
    setProfileLoading(true);
    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({
          full_name: data.fullName,
          language: data.language,
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      // Update i18next language
      i18n.changeLanguage(data.language);
      
      await refreshProfile();
      toast.success("Profile settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile settings");
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    const { error } = await resetPassword(data.password);
    setPasswordLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Security password updated successfully!");
      resetPasswordForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">My Profile Settings</h1>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Control your profile specifications and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider mb-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-primary" />
            General Settings
          </div>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                {...registerProfile("fullName")}
                type="text"
                className="form-input"
                placeholder="Anjali Sharma"
              />
              {profileErrors.fullName && (
                <p className="text-xs text-destructive mt-1">{profileErrors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Language</label>
              <select
                {...registerProfile("language")}
                className="form-input cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
              {profileErrors.language && (
                <p className="text-xs text-destructive mt-1">{profileErrors.language.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="py-2.5 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {profileLoading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        {/* Security Password Change */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider mb-2 border-b border-slate-100 pb-3">
            <Shield size={16} className="text-primary" />
            Security & Credentials
          </div>

          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <input
                {...registerPassword("password")}
                type="password"
                className="form-input"
                placeholder="••••••••"
              />
              {passwordErrors.password && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <input
                {...registerPassword("confirmPassword")}
                type="password"
                className="form-input"
                placeholder="••••••••"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="py-2.5 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
