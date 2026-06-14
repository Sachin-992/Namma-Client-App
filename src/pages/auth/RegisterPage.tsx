import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoSquare from "@/assets/logo-square.jpg";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSquare} alt="Namma Client" className="h-20 w-20 rounded-2xl object-cover shadow-lg mb-5" />
          <h1 className="text-2xl font-bold text-foreground">{t("auth.createAccount")}</h1>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-border rounded-2xl p-7 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.fullName")}</label>
              <input {...register("fullName")} type="text" placeholder="Arun Kumar" className="form-input" />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.emailAddress")}</label>
              <input {...register("email")} type="email" placeholder="name@company.com" className="form-input" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.password")}</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="••••••••" className="form-input pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.confirmPassword")}</label>
              <input {...register("confirmPassword")} type="password" placeholder="••••••••" className="form-input" />
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 text-sm mt-2">
              {loading ? "Creating account..." : t("auth.register")}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">{t("auth.signInLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
