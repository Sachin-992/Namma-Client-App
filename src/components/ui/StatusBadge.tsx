import { cn } from "@/utils";
import type { ClientStatus, ProjectStatus, InvoiceStatus, RequirementStatus } from "@/types";

type StatusType =
  | ClientStatus
  | ProjectStatus
  | InvoiceStatus
  | RequirementStatus
  | "on_track"
  | "delayed"
  | "completed"
  | "overdue"
  | "active"
  | "inactive"
  | "draft"
  | "sent"
  | "paid"
  | "pending"
  | "cancelled"
  | "on_hold";

const statusStyles: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  // Client statuses
  active: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  onboarding: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: "Onboarding" },
  inactive: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600", label: "Inactive" },

  // Project statuses
  on_hold: { dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", label: "On Hold" },
  cancelled: { dot: "bg-red-400", bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
  completed: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: "Completed" },

  // Invoice statuses
  draft: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  sent: { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", label: "Sent" },
  paid: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Paid" },
  overdue: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Overdue" },

  // Requirement statuses
  submitted: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: "Submitted" },
  reviewed: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Reviewed" },

  // Deadline statuses
  on_track: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "On Track" },
  delayed: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Delayed" },

  // Generic
  pending: { dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", label: "Pending" },
};

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "sm", showDot = true }: StatusBadgeProps) {
  const config = statusStyles[status] ?? {
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: status,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full capitalize",
        config.bg,
        config.text,
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
