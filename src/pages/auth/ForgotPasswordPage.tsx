import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logoSquare from "@/assets/logo-square.jpg";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await forgotPassword(data.email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSquare} alt="Namma Client" className="h-20 w-20 rounded-2xl object-cover shadow-lg mb-5" />
          <h1 className="text-2xl font-bold text-foreground">{t("auth.forgotPasswordTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">{t("auth.forgotPasswordDesc")}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-border rounded-2xl p-7 shadow-card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-sm text-foreground font-medium">{t("auth.checkEmail")}</p>
              <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.emailAddress")}</label>
                <input {...register("email")} type="email" placeholder="name@company.com" className="form-input" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 text-sm">
                {loading ? "Sending..." : t("auth.sendResetLink")}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
