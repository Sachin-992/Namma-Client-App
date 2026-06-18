import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileText,
  Receipt,
  CreditCard,
  Clock,
  User,
  LogOut,
  Languages,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils";

import logoWide from "@/assets/logo-wide.png";
import logoSquare from "@/assets/logo-square.jpg";

interface ClientSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const clientNavItems = [
  { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { label: "My Projects", href: "/client/projects", icon: FolderKanban },
  { label: "My Requirements", href: "/client/requirements", icon: ClipboardList },
  { label: "My Documents", href: "/client/documents", icon: FileText },
  { label: "My Invoices", href: "/client/invoices", icon: Receipt },
  { label: "My Payments", href: "/client/payments", icon: CreditCard },
  { label: "Deadlines", href: "/client/deadlines", icon: Clock },
  { label: "Profile", href: "/client/profile", icon: User },
];

export function ClientSidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: ClientSidebarProps) {
  const { i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const next = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const showCollapsed = isCollapsed && !isMobileOpen;

  return (
    <aside
      className={cn(
        "bg-card border-r border-border flex flex-col shadow-sidebar flex-shrink-0 transition-all duration-300 z-50 h-full",
        "fixed inset-y-0 left-0 md:static transform md:transform-none",
        isMobileOpen ? "translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0",
        showCollapsed ? "md:w-[76px]" : "md:w-[240px]"
      )}
    >
      {/* Logo area */}
      <div className={cn("px-5 py-5 border-b border-border flex items-center justify-between", showCollapsed ? "md:px-3" : "px-5")}>
        <div className="flex items-center justify-center flex-1">
          {showCollapsed ? (
            <img src={logoSquare} alt="Namma Client" className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/10" />
          ) : (
            <img src={logoWide} alt="Namma Client" className="h-12 w-auto object-contain" />
          )}
        </div>
        
        {/* Mobile close drawer button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground p-1 hover:bg-accent rounded-lg transition-colors cursor-pointer"
          title="Close Menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation menu list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {clientNavItems.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "sidebar-link",
                isActive && "active",
                showCollapsed && "md:justify-center md:px-0"
              )
            }
            title={showCollapsed ? label : undefined}
          >
            <Icon size={18} className={showCollapsed ? "mx-auto" : ""} />
            <span className={cn(showCollapsed && "md:hidden", "transition-all duration-150")}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom utilities section */}
      <div className="px-3 pb-5 space-y-1 border-t border-border pt-4 mt-auto">
        {/* Toggle Expand/Collapse manual desktop button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden md:flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer",
            showCollapsed ? "justify-center px-0" : "justify-between"
          )}
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span className={cn(showCollapsed && "hidden")}>
              Collapse Menu
            </span>
          </div>
        </button>

        {/* Language switcher button */}
        <button
          onClick={toggleLanguage}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-accent border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-pointer",
            showCollapsed && "md:justify-center md:px-0"
          )}
          title={showCollapsed ? (i18n.language === "en" ? "தமிழ்" : "English") : undefined}
        >
          <Languages size={14} className={showCollapsed ? "mx-auto" : ""} />
          <span className={cn(showCollapsed && "md:hidden")}>
            {i18n.language === "en" ? "English / தமிழ்" : "தமிழ் / English"}
          </span>
        </button>

        {/* Logout button */}
        <button
          onClick={handleSignOut}
          className={cn(
            "sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer",
            showCollapsed && "md:justify-center md:px-0"
          )}
          title={showCollapsed ? "Logout" : undefined}
        >
          <LogOut size={18} className={showCollapsed ? "mx-auto" : ""} />
          <span className={cn(showCollapsed && "md:hidden")}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
