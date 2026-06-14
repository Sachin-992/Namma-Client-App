import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectClosure, useUpsertProjectClosure } from "@/hooks/useProjects";

export default function ProjectClosurePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: closure, isLoading } = useProjectClosure(id || "");
  const upsertMutation = useUpsertProjectClosure();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (closure) {
      setRating(closure.rating);
      setFeedback(closure.feedback || "");
      setTestimonial(closure.testimonial || "");
      setSummary(closure.summary || "");
      setSubmitted(true);
    }
  }, [closure]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please provide a rating."); return; }
    try {
      await upsertMutation.mutateAsync({
        project_id: id,
        rating,
        feedback: feedback || null,
        testimonial: testimonial || null,
        summary: summary || null,
      });
      setSubmitted(true);
      toast.success("Project closed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to close project.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={44} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("closure.thankYou")}</h2>
        <p className="text-muted-foreground text-sm mb-8">The project has been closed and feedback recorded.</p>
        <button onClick={() => navigate("/projects")} className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("closure.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("closure.subtitle")}</p>
      </div>

      <div className="space-y-5">
        {/* Completion Summary */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-3">{t("closure.summary")}</h2>
          <textarea
            rows={3}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            className="form-input resize-none"
            placeholder="Summarize what was delivered in this project..."
          />
        </div>

        {/* Rating */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">{t("closure.rating")}</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={`transition-colors ${star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </p>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-3">{t("closure.feedback")}</h2>
          <textarea
            rows={4}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="form-input resize-none"
            placeholder="How was your overall experience working with us?"
          />
        </div>

        {/* Testimonial */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-1">{t("closure.testimonial")}</h2>
          <p className="text-xs text-muted-foreground mb-3">Optional: May be shared publicly on our website</p>
          <textarea
            rows={3}
            value={testimonial}
            onChange={e => setTestimonial(e.target.value)}
            className="form-input resize-none"
            placeholder='"Working with Namma Client was an excellent experience..."'
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="flex-1 py-3 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={upsertMutation.isPending} className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60">
            {upsertMutation.isPending ? "Closing project..." : t("closure.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
