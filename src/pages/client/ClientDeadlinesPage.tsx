import { Clock, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { cn, formatDate } from "@/utils";

export default function ClientDeadlinesPage() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Extract and combine all milestones from all projects
  const allMilestones = (projects || []).flatMap((proj) => {
    return (proj.milestones || []).map((m) => ({
      ...m,
      projectName: proj.name,
    }));
  });

  // Sort milestones chronologically by due date (nulls at the end)
  const sortedMilestones = allMilestones.sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  // Get status text and style for milestones
  const getMilestoneStatus = (completed: boolean, dueDate: string | null) => {
    if (completed) {
      return { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 };
    }
    if (!dueDate) {
      return { label: "Scheduled", class: "bg-slate-50 text-slate-500 border-slate-200", icon: Calendar };
    }

    const isOverdue = new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
    if (isOverdue) {
      return { label: "Overdue", class: "bg-rose-50 text-rose-700 border-rose-100 font-bold", icon: AlertTriangle };
    }
    return { label: "On Track", class: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Deadlines & Milestones</h1>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Track deliverables, calendar timelines, and completion status.</p>
      </div>

      {sortedMilestones.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-3xl text-left">
          {/* Vertical Timeline */}
          <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-8 py-2">
            {sortedMilestones.map((m) => {
              const status = getMilestoneStatus(m.completed, m.due_date);
              const Icon = status.icon;

              return (
                <div key={m.id} className="relative group">
                  {/* Timeline Point */}
                  <div className={cn(
                    "absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center border bg-white shadow-sm transition-all",
                    m.completed ? "border-emerald-500 text-emerald-600" : "border-slate-200 text-slate-400"
                  )}>
                    <Icon size={12} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                          {m.projectName}
                        </span>
                        <h4 className={cn(
                          "text-sm font-extrabold text-slate-800",
                          m.completed && "line-through opacity-55"
                        )}>
                          {m.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider",
                          status.class
                        )}>
                          {status.label}
                        </span>

                        <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {m.due_date ? formatDate(m.due_date) : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
          <Clock size={48} className="mx-auto text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Milestones Set</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Upcoming schedules, milestones, and deliverable deadlines will be shown here.
          </p>
        </div>
      )}
    </div>
  );
}
