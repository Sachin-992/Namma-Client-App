import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Edit, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PROJECT_STAGES } from "@/constants";
import { cn } from "@/utils";
import type { ProjectStage } from "@/types";
import { useProjectDetail, useToggleMilestone } from "@/hooks/useProjects";
import { toast } from "sonner";
import AddProjectModal from "./AddProjectModal";

const STAGES_ORDER: ProjectStage[] = [
  "requirements", "planning", "design", "development", "testing", "deployment", "completed"
];

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: project, isLoading } = useProjectDetail(id || "");
  const toggleMilestone = useToggleMilestone();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Project not found.
      </div>
    );
  }

  const currentStageIdx = STAGES_ORDER.indexOf(project.stage);
  const milestones = project.milestones || [];
  const completedMilestones = milestones.filter(m => m.completed).length;

  const handleMilestoneClick = async (milestoneId: string, currentCompleted: boolean) => {
    try {
      await toggleMilestone.mutateAsync({ id: milestoneId, completed: !currentCompleted });
      toast.success("Milestone status updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update milestone");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.client?.name} {project.client?.company ? `• ${project.client.company}` : ""}
            </p>
            {project.description && (
              <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent transition-colors cursor-pointer"
            >
              <Edit size={14} /> Edit
            </button>
            <button
              onClick={() => navigate(`/projects/${project.id}/closure`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Flag size={14} /> Close Project
            </button>
          </div>
        </div>

        {/* Key dates */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span>Start: <span className="font-semibold text-foreground">{project.start_date || "—"}</span></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} className="text-orange-500" />
            <span>Deadline: <span className="font-semibold text-foreground">{project.delivery_date || "—"}</span></span>
          </div>
        </div>
      </div>

      {/* Stage tracker */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6 mb-5">
        <h2 className="text-sm font-bold text-foreground mb-5">Project Stage</h2>
        <div className="flex items-center gap-0">
          {STAGES_ORDER.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isActive = idx === currentStageIdx;
            const stageInfo = PROJECT_STAGES.find(s => s.key === stage);
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all",
                    isCompleted && "bg-primary text-white",
                    isActive && "bg-white border-2 border-primary text-primary ring-4 ring-primary/20",
                    !isCompleted && !isActive && "bg-border text-muted-foreground"
                  )}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className={cn(
                    "text-[9px] font-semibold text-center leading-tight",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {stageInfo?.label ?? stage}
                  </span>
                </div>
                {idx < STAGES_ORDER.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-1 mt-[-14px]",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Milestones */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">Milestones</h2>
          <div className="space-y-1">
            {milestones.length > 0 ? (
              milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMilestoneClick(m.id, m.completed)}
                  className="flex items-start gap-3 w-full text-left hover:bg-accent/40 p-2 rounded-xl transition-all cursor-pointer"
                >
                  {m.completed ? (
                    <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-border mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium text-foreground",
                      m.completed && "line-through opacity-60"
                    )}>
                      {m.title}
                    </p>
                    {m.due_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(m.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No milestones defined for this project.</p>
            )}
          </div>
        </div>

        {/* Completion */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">Completion</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - project.completion_pct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{project.completion_pct}%</span>
                <span className="text-xs text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completed Milestones</span>
              <span className="font-semibold">{completedMilestones}/{milestones.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current Stage</span>
              <span className="font-semibold capitalize">{project.stage}</span>
            </div>
          </div>
        </div>
      </div>
      {isEditOpen && (
        <AddProjectModal
          onClose={() => setIsEditOpen(false)}
          editData={{
            id: project.id,
            name: project.name,
            client_id: project.client_id,
            description: project.description || "",
            stage: project.stage,
            status: project.status,
            start_date: project.start_date || "",
            delivery_date: project.delivery_date || "",
            completion_pct: project.completion_pct || 0,
            tags: project.tags?.map((t: any) => t.label) || [],
          }}
        />
      )}
    </div>
  );
}
