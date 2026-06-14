import { cn } from "@/utils";
import {
  FileText,
  Receipt,
  StickyNote,
  Clock,
  CreditCard,
  ClipboardList,
  Users,
  FolderOpen,
  Bell,
  LucideIcon,
} from "lucide-react";

type EmptyStateVariant =
  | "documents"
  | "invoices"
  | "notes"
  | "deadlines"
  | "payments"
  | "requirements"
  | "clients"
  | "projects"
  | "notifications"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string; subtitle: string; gradient: string }
> = {
  documents: {
    icon: FileText,
    title: "No Documents Yet",
    subtitle: "Upload your first document to get started. PDFs, images and more are supported.",
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  invoices: {
    icon: Receipt,
    title: "No Invoices Yet",
    subtitle: "Create your first invoice to start billing clients professionally.",
    gradient: "from-violet-500/10 to-purple-500/10",
  },
  notes: {
    icon: StickyNote,
    title: "No Notes Found",
    subtitle: "Capture meeting notes, internal thoughts, or share updates with your team.",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  deadlines: {
    icon: Clock,
    title: "No Deadlines Found",
    subtitle: "All your project deadlines will appear here so you never miss a delivery.",
    gradient: "from-red-500/10 to-rose-500/10",
  },
  payments: {
    icon: CreditCard,
    title: "No Payments Recorded",
    subtitle: "Record payments against invoices to track your revenue and collection rate.",
    gradient: "from-emerald-500/10 to-green-500/10",
  },
  requirements: {
    icon: ClipboardList,
    title: "No Requirements Yet",
    subtitle: "Requirements submitted by clients will appear here for review and approval.",
    gradient: "from-sky-500/10 to-cyan-500/10",
  },
  clients: {
    icon: Users,
    title: "No Clients Yet",
    subtitle: "Add your first client to start managing projects and invoices.",
    gradient: "from-pink-500/10 to-rose-500/10",
  },
  projects: {
    icon: FolderOpen,
    title: "No Projects Yet",
    subtitle: "Create your first project to start tracking progress and milestones.",
    gradient: "from-violet-500/10 to-indigo-500/10",
  },
  notifications: {
    icon: Bell,
    title: "You're all caught up!",
    subtitle: "No new notifications. We'll let you know when something needs your attention.",
    gradient: "from-primary/10 to-primary/5",
  },
  generic: {
    icon: FolderOpen,
    title: "Nothing Here Yet",
    subtitle: "Data will appear here once it's added.",
    gradient: "from-muted/30 to-muted/10",
  },
};

export function EmptyState({
  variant = "generic",
  title,
  subtitle,
  ctaLabel,
  onCta,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br",
          config.gradient
        )}
      >
        <Icon size={36} className="text-primary/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-foreground mb-2">
        {title ?? config.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
        {subtitle ?? config.subtitle}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
