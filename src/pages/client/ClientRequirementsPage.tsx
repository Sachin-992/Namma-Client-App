import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, FileText, ExternalLink, MessageSquare, AlertCircle } from "lucide-react";
import { useRequirements } from "@/hooks/useRequirements";
import { cn, formatDate } from "@/utils";

export default function ClientRequirementsPage() {
  const navigate = useNavigate();
  const { data: requirements, isLoading } = useRequirements();
  const [selectedReq, setSelectedReq] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string, reviewNotes?: string) => {
    if (status === "reviewed") {
      return { label: "Approved", class: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
    if (status === "draft") {
      return reviewNotes
        ? { label: "Changes Requested", class: "bg-red-50 text-red-700 border-red-100" }
        : { label: "Draft", class: "bg-slate-50 text-slate-600 border-slate-200" };
    }
    return { label: "Submitted", class: "bg-blue-50 text-blue-700 border-blue-100" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">My Requirements</h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Collect, submit, and review project requirements checklist.</p>
        </div>
        <button
          onClick={() => navigate("/requirements/wizard")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
        >
          <Plus size={16} />
          New Requirement
        </button>
      </div>

      {requirements && requirements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {requirements.map((req) => {
            const sd = (req.step_data || {}) as any;
            const badge = getStatusBadge(req.status, sd.reviewNotes);
            const isDraft = req.status === "draft";

            return (
              <div 
                key={req.id} 
                className="bg-white border border-slate-200 hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer"
                onClick={() => {
                  if (isDraft) {
                    navigate(`/requirements/wizard`);
                  } else {
                    setSelectedReq(req);
                  }
                }}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={cn("px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-wider", badge.class)}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-sm truncate leading-snug">
                    {sd.businessName || "Draft Project Requirements"}
                  </h3>
                  
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 capitalize">
                    Type: <span className="text-slate-700">{sd.projectType || "Not Specified"}</span>
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>
                    Created: {formatDate(req.created_at)}
                  </span>
                  <span className="text-primary hover:underline font-extrabold">
                    {isDraft ? "Edit Draft" : "View Details"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
          <ClipboardList size={48} className="mx-auto text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Requirements Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-6">
            You haven't submitted any project requirements yet. Start the onboarding wizard to outline your project.
          </p>
          <button
            onClick={() => navigate("/requirements/wizard")}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Launch Onboarding Wizard
          </button>
        </div>
      )}

      {/* Details Slide-over Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedReq(null)} />
          
          <div className="relative bg-white border-l border-slate-200 w-full max-w-md h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-in-right text-left">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-850">
                  {selectedReq.step_data?.businessName || "Project Requirements"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submitted Details</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <Plus className="rotate-45" size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-500 font-medium">
              {/* Type */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Type</span>
                <span className="text-slate-800 font-extrabold inline-block mt-1 capitalize">
                  {selectedReq.step_data?.projectType || "Not set"}
                </span>
              </div>

              {/* Business description */}
              {selectedReq.step_data?.businessDescription && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Company Pitch / Overview</span>
                  <p className="text-slate-650 leading-relaxed bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-normal">
                    {selectedReq.step_data.businessDescription}
                  </p>
                </div>
              )}

              {/* Goals */}
              {selectedReq.step_data?.goals && selectedReq.step_data.goals.length > 0 && selectedReq.step_data.goals[0] && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Key Goals</span>
                  <ul className="space-y-1.5">
                    {selectedReq.step_data.goals.map((g: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* References */}
              {selectedReq.step_data?.references && selectedReq.step_data.references.length > 0 && selectedReq.step_data.references[0] && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">References / Competitors</span>
                  <ul className="space-y-1.5">
                    {selectedReq.step_data.references.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-primary hover:underline">
                        <ExternalLink size={12} />
                        <a href={r} target="_blank" rel="noreferrer" className="truncate">{r}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification Feedback */}
              {selectedReq.step_data?.reviewNotes && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1 mb-1">
                    <MessageSquare size={13} /> Reviewer Feedback
                  </h4>
                  <p className="font-normal leading-relaxed">{selectedReq.step_data.reviewNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
              <button
                onClick={() => setSelectedReq(null)}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
