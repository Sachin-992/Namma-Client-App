import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Languages } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { toast } from "sonner";
import logoSquare from "@/assets/logo-square.jpg";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      setLoading(false);
      toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      let userRole = "admin";
      if (user) {
        const { data: prof } = await (supabase.from("profiles") as any)
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.role) {
          userRole = prof.role;
        }
      }
      setLoading(false);
      toast.success("Welcome back!");
      if (userRole === "client") {
        navigate("/client/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ta" : "en");
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex flex-col">
      {/* Language Toggle */}
      <div className="flex justify-end p-5">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-border rounded-full text-sm font-medium text-foreground hover:bg-white transition-colors shadow-sm"
        >
          <Languages size={16} className="text-primary" />
          {i18n.language === "en" ? "English / தமிழ்" : "தமிழ் / English"}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={logoSquare} alt="Namma Client" className="h-20 w-20 rounded-2xl object-cover shadow-lg mb-5" />
            <h1 className="text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.accessDashboard")}</p>
          </div>

          {/* Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-border rounded-2xl p-7 shadow-card">
            {/* Google Button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-gray-50 transition-all hover:shadow-sm disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Redirecting..." : t("auth.continueWithGoogle")}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium tracking-widest">{t("auth.orEmail")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t("auth.emailAddress")}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  className="form-input"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">{t("auth.password")}</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 text-sm mt-2"
              >
                {loading ? "Signing in..." : t("auth.signIn")}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                {t("auth.requestAccess")}
              </Link>
            </p>
          </div>

          {/* Footer links */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/privacy" className="hover:underline">{t("auth.privacyPolicy")}</Link>
            {" • "}
            <Link to="/terms" className="hover:underline">{t("auth.termsOfService")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
