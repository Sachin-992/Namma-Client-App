import { useState } from "react";
import { FolderKanban, Calendar, Clock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/utils";

export default function ClientProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [expandedProj, setExpandedProj] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedProj(expandedProj === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">My Projects</h1>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">View timeline timelines, progression, and milestone deliverables.</p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {projects.map((proj) => {
            const isExpanded = expandedProj === proj.id;
            const completedMilestonesCount = (proj.milestones || []).filter((m) => m.completed).length;
            const totalMilestonesCount = (proj.milestones || []).length;

            return (
              <div 
                key={proj.id} 
                className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:shadow-md"
              >
                {/* Main Card Header */}
                <div 
                  onClick={() => toggleExpand(proj.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <h3 className="text-base font-black text-slate-800 tracking-tight">{proj.name}</h3>
                    </div>
                    {proj.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{proj.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                    {/* Completion Pct */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>PROGRESS</span>
                        <span className="text-slate-800 ml-2">{proj.completion_pct}%</span>
                      </div>
                      <div className="w-32 h-2 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{proj.delivery_date || "Not set"}</span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/40 space-y-6">
                    {/* Description Details */}
                    {proj.description && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Scope / Overview</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 p-4 rounded-2xl">
                          {proj.description}
                        </p>
                      </div>
                    )}

                    {/* Milestones / Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Deliverables</h4>
                        <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {completedMilestonesCount} / {totalMilestonesCount} Done
                        </span>
                      </div>

                      {proj.milestones && proj.milestones.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {proj.milestones.map((m) => (
                            <div 
                              key={m.id}
                              className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3"
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center border",
                                m.completed ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-50 text-slate-300"
                              )}>
                                <CheckCircle2 size={13} />
                              </div>
                              <div className="truncate">
                                <p className={cn("text-xs font-bold text-slate-850 truncate", m.completed && "line-through opacity-50")}>
                                  {m.title}
                                </p>
                                {m.due_date && (
                                  <p className="text-[9px] text-slate-400 mt-0.5">Due: {m.due_date}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic">No milestones defined yet. The project team is mapping your deliverables.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
          <FolderKanban size={48} className="mx-auto text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your active projects will appear here once requirements are reviewed and initialized by the team.
          </p>
        </div>
      )}
    </div>
  );
}
