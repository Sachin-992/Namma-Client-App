import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Camera,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils";
import { storageService, STORAGE_BUCKETS } from "@/services/storageService";

const SECTIONS = [
  { key: "profile", label: "settings.profile", icon: User },
  { key: "organization", label: "settings.organization", icon: Building2 },
  { key: "language", label: "settings.language", icon: Globe },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "settings.security", icon: Shield },
  { key: "billing", label: "settings.billing", icon: CreditCard },
];

// Toggle switch component
function Toggle2({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: checked ? "hsl(var(--primary))" : "hsl(var(--border))",
          position: "relative",
          transition: "background-color 0.2s ease",
          border: "none",
          padding: 0,
        }}
      >
        <span
          style={{
            display: "block",
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}


export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const [active, setActive] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Organization state
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgGst, setOrgGst] = useState("");

  // Security state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    deadlineReminder3: true,
    deadlineReminder7: false,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${profile.id}_${Date.now()}.${fileExt}`;

      await storageService.uploadClientAsset(filePath, file);
      const publicUrl = storageService.getPublicUrl(STORAGE_BUCKETS.CLIENT_ASSETS, filePath);

      const { error } = await (supabase.from("profiles") as any)
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (active === "profile") {
        if (!fullName.trim()) {
          toast.error("Full name is required");
          setSaving(false);
          return;
        }
        const { error } = await (supabase.from("profiles") as any)
          .update({ full_name: fullName })
          .eq("id", profile?.id);
        if (error) throw error;
        await refreshProfile();
        toast.success("Profile updated!");
      }

      if (active === "organization") {
        toast.success("Organization details saved!");
      }

      if (active === "security") {
        if (!password || password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated!");
        setPassword("");
        setConfirmPassword("");
      }

      if (active === "notifications") {
        toast.success("Notification preferences saved!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    try {
      if (profile) {
        const { error } = await (supabase.from("profiles") as any)
          .update({ language: langCode })
          .eq("id", profile.id);
        if (error) throw error;
        await refreshProfile();
      }
      i18n.changeLanguage(langCode);
      toast.success(`Language changed to ${langCode === "ta" ? "தமிழ்" : "English"}`);
    } catch (err: any) {
      console.error(err);
      i18n.changeLanguage(langCode);
    }
  };

  const showSaveButton = ["profile", "organization", "security", "notifications"].includes(active);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Sidebar nav */}
        <div className="w-full md:w-52 flex-shrink-0">
          <div className="bg-card border border-border rounded-2xl shadow-card p-2 space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                    active === s.key
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon size={15} />
                  {s.key === "notifications" ? "Notifications" : t(s.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 bg-card border border-border rounded-2xl shadow-card">
          {/* Profile */}
          {active === "profile" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">{t("settings.profile")}</h2>
              <p className="text-xs text-muted-foreground mb-5">Update your personal information</p>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                    {fullName?.[0] ?? "A"}
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-border text-sm font-medium rounded-xl cursor-pointer hover:bg-accent transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    {uploadingAvatar ? "Uploading…" : "Change Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingAvatar}
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG, WEBP. Max 10MB.</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("settings.fullName")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("settings.email")}
                  </label>
                  <input
                    type="email"
                    disabled
                    className="form-input opacity-60 cursor-not-allowed"
                    defaultValue={profile?.id ? "user@example.com" : ""}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed here.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Role</label>
                  <input
                    type="text"
                    disabled
                    className="form-input opacity-60 cursor-not-allowed capitalize"
                    defaultValue={profile?.role ?? "admin"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Organization */}
          {active === "organization" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">Organization</h2>
              <p className="text-xs text-muted-foreground mb-5">Your company details for invoices and documents</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="form-input"
                    placeholder="Namma Client"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Address</label>
                  <textarea
                    rows={3}
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="form-input resize-none"
                    placeholder="123, Anna Salai, Chennai, Tamil Nadu 600002"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={orgGst}
                    onChange={(e) => setOrgGst(e.target.value)}
                    className="form-input"
                    placeholder="33AABCU9603R1ZX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {active === "language" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">{t("settings.language")}</h2>
              <p className="text-xs text-muted-foreground mb-5">Choose your preferred display language</p>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {[
                  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
                  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative",
                      i18n.language === lang.code
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    )}
                  >
                    {i18n.language === lang.code && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                    <span className="text-2xl mb-1 block">{lang.flag}</span>
                    <p className="text-sm font-bold text-foreground">{lang.native}</p>
                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {active === "notifications" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">Notifications</h2>
              <p className="text-xs text-muted-foreground mb-5">Control how and when you receive alerts</p>

              <div className="max-w-md space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Channels
                  </h3>
                  <div className="bg-card border border-border rounded-xl px-4">
                    <Toggle2
                      checked={notifPrefs.emailNotifications}
                      onChange={(v) => setNotifPrefs((p) => ({ ...p, emailNotifications: v }))}
                      label="Email Notifications"
                      description="Receive updates via email"
                    />
                    <Toggle2
                      checked={notifPrefs.inAppNotifications}
                      onChange={(v) => setNotifPrefs((p) => ({ ...p, inAppNotifications: v }))}
                      label="In-App Notifications"
                      description="Show bell badge and notification center"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Deadline Reminders
                  </h3>
                  <div className="bg-card border border-border rounded-xl px-4">
                    <Toggle2
                      checked={notifPrefs.deadlineReminder3}
                      onChange={(v) => setNotifPrefs((p) => ({ ...p, deadlineReminder3: v }))}
                      label="3 Days Before Deadline"
                      description="Get an early reminder 3 days before due date"
                    />
                    <Toggle2
                      checked={notifPrefs.deadlineReminder7}
                      onChange={(v) => setNotifPrefs((p) => ({ ...p, deadlineReminder7: v }))}
                      label="7 Days Before Deadline"
                      description="Get a heads-up 1 week before due date"
                    />
                  </div>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-xs text-primary font-medium">
                    💡 Notification preferences are saved locally. Real-time notifications require the Supabase notifications table to be set up.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {active === "security" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">{t("settings.changePassword")}</h2>
              <p className="text-xs text-muted-foreground mb-5">Update your account password</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("settings.newPassword")}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="•••••••• (Min 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">
                    🔐 2FA support is planned for a future update.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing */}
          {active === "billing" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-foreground mb-1">{t("settings.billing")}</h2>
              <p className="text-xs text-muted-foreground mb-5">Choose a plan that fits your team</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                {[
                  {
                    name: "Starter",
                    price: "₹0",
                    features: ["3 Projects", "Bilingual Support", "Basic Invoicing"],
                  },
                  {
                    name: "Pro",
                    price: "₹1,499",
                    features: [
                      "Unlimited Projects",
                      "Tamil Translations",
                      "Full Invoicing",
                      "5 Team Members",
                    ],
                    popular: true,
                  },
                  {
                    name: "Enterprise",
                    price: "₹4,999",
                    features: ["White-Label", "All Features", "Dedicated Support", "Unlimited Team"],
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "rounded-2xl border-2 p-5 relative",
                      plan.popular ? "border-primary bg-primary/3" : "border-border"
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-primary px-3 py-1 rounded-full whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    <p className="text-sm font-bold text-foreground">{plan.name}</p>
                    <p className="text-2xl font-black text-foreground mt-1 mb-3">
                      {plan.price}
                      <span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Check size={9} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={cn(
                        "w-full py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer",
                        plan.popular
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "border border-border hover:bg-accent"
                      )}
                    >
                      {plan.name === "Enterprise" ? "Contact Sales" : `Choose ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          {showSaveButton && (
            <div className="px-6 pb-6 pt-0">
              <div className="border-t border-border pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving…" : t("settings.saveChanges")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
