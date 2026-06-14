import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  List,
  LayoutGrid,
  ChevronRight,
  Flame,
  Timer,
} from "lucide-react";
import { daysRemaining, formatDate } from "@/utils";
import { cn } from "@/utils";
import type { DeadlineStatus } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { EmptyState } from "@/components/ui/EmptyState";

type UrgencyGroup = "overdue" | "today" | "this_week" | "upcoming" | "completed";
type ViewMode = "list" | "columns";

const urgencyConfig: Record<
  UrgencyGroup,
  { label: string; icon: any; border: string; bg: string; text: string; dotColor: string }
> = {
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    dotColor: "bg-red-500",
  },
  today: {
    label: "Due Today",
    icon: Flame,
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dotColor: "bg-orange-500",
  },
  this_week: {
    label: "This Week",
    icon: Timer,
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dotColor: "bg-yellow-500",
  },
  upcoming: {
    label: "Upcoming",
    icon: TrendingUp,
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dotColor: "bg-emerald-500",
  },
};

function getUrgencyGroup(project: any): UrgencyGroup {
  if (project.status === "completed" || project.completion_pct === 100) return "completed";
  if (!project.delivery_date) return "upcoming";
  const days = daysRemaining(project.delivery_date);
  if (days === null) return "upcoming";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "this_week";
  return "upcoming";
}

interface DeadlineCardProps {
  project: any;
  urgency: UrgencyGroup;
}

function DeadlineCard({ project, urgency }: DeadlineCardProps) {
  const cfg = urgencyConfig[urgency];
  const Icon = cfg.icon;
  const days = project.delivery_date ? daysRemaining(project.delivery_date) : null;
  const isOverdue = days !== null && days < 0;
  const milestones = project.milestones || [];
  const done = milestones.filter((m: any) => m.completed).length;

  return (
    <div
      className={cn(
        "bg-card border border-border border-l-4 rounded-xl shadow-card hover:shadow-card-hover transition-all p-4 group",
        cfg.border
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {project.client?.name}
            {project.client?.company ? ` · ${project.client.company}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0",
            cfg.bg,
            cfg.text
          )}
        >
          <Icon size={10} />
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-muted-foreground">{done}/{milestones.length} milestones</span>
          <span className="font-semibold text-foreground">{project.completion_pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              urgency === "overdue" ? "bg-red-500" : urgency === "today" ? "bg-orange-500" : "bg-primary"
            )}
            style={{ width: `${project.completion_pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={11} />
          {project.delivery_date
            ? formatDate(project.delivery_date, "MMM dd, yyyy")
            : "No deadline"}
        </div>

        {/* Days remaining badge */}
        {days !== null ? (
          <div
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-lg",
              isOverdue
                ? "bg-red-100 text-red-700"
                : days === 0
                ? "bg-orange-100 text-orange-700"
                : days <= 7
                ? "bg-yellow-100 text-yellow-700"
                : "bg-accent text-foreground"
            )}
          >
            {isOverdue
              ? `${Math.abs(days)}d overdue`
              : days === 0
              ? "Due today"
              : `${days} days left`}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No date</span>
        )}
      </div>
    </div>
  );
}

export default function DeadlinesPage() {
  const { t } = useTranslation();
  const { data: projects, isLoading } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeGroup, setActiveGroup] = useState<UrgencyGroup | "all">("all");

  const allProjects = (projects || []).filter(
    (p) => p.status === "active" || p.status === "on_hold" || p.status === "completed"
  );

  // Group projects by urgency
  const grouped = allProjects.reduce<Record<UrgencyGroup, any[]>>(
    (acc, p) => {
      const g = getUrgencyGroup(p);
      acc[g].push({ ...p, urgencyGroup: g });
      return acc;
    },
    { overdue: [], today: [], this_week: [], upcoming: [], completed: [] }
  );

  const groupOrder: UrgencyGroup[] = ["overdue", "today", "this_week", "upcoming", "completed"];

  const filteredProjects =
    activeGroup === "all"
      ? allProjects.map((p) => ({ ...p, urgencyGroup: getUrgencyGroup(p) }))
      : grouped[activeGroup].map((p) => ({ ...p, urgencyGroup: activeGroup }));

  // Stats
  const stats = {
    overdue: grouped.overdue.length,
    today: grouped.today.length,
    this_week: grouped.this_week.length,
    upcoming: grouped.upcoming.length,
    completed: grouped.completed.length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted-foreground/10 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse bg-muted-foreground/10 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse bg-muted-foreground/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("deadlines.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("deadlines.subtitle")}</p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-accent rounded-xl p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List size={13} /> List
          </button>
          <button
            onClick={() => setViewMode("columns")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "columns"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid size={13} /> Columns
          </button>
        </div>
      </div>

      {/* Urgency summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(["all", ...groupOrder] as const).map((group) => {
          if (group === "all") {
            return (
              <button
                key="all"
                onClick={() => setActiveGroup("all")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer",
                  activeGroup === "all"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                <p className="text-xs text-muted-foreground font-medium">All</p>
                <p className="text-lg font-bold text-foreground">{allProjects.length}</p>
              </button>
            );
          }
          const cfg = urgencyConfig[group];
          const count = stats[group];
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                activeGroup === group
                  ? `border-current ${cfg.bg}`
                  : "border-border bg-card hover:bg-accent"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                <p className={cn("text-xs font-medium", activeGroup === group ? cfg.text : "text-muted-foreground")}>
                  {cfg.label}
                </p>
              </div>
              <p className={cn("text-lg font-bold", activeGroup === group ? cfg.text : "text-foreground")}>
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {allProjects.length === 0 && (
        <EmptyState variant="deadlines" />
      )}

      {/* List view */}
      {viewMode === "list" && filteredProjects.length > 0 && (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <DeadlineCard key={project.id} project={project} urgency={project.urgencyGroup} />
          ))}
        </div>
      )}

      {/* Column view */}
      {viewMode === "columns" && allProjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {groupOrder.map((group) => {
            const cfg = urgencyConfig[group];
            const items = grouped[group];
            return (
              <div key={group} className="space-y-3">
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", cfg.bg)}>
                  <div className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                  <span className={cn("text-xs font-bold", cfg.text)}>{cfg.label}</span>
                  <span className={cn("ml-auto text-xs font-bold", cfg.text)}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">None</p>
                  </div>
                ) : (
                  items.map((p) => (
                    <DeadlineCard key={p.id} project={p} urgency={group} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
