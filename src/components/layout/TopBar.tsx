import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Search,
  Languages,
  LogOut,
  Settings,
  Menu,
  CheckCheck,
  Users,
  FolderOpen,
  Receipt,
  FileText,
  ClipboardList,
  CreditCard,
  Clock,
  StickyNote,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, formatRelativeTime } from "@/utils";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
} from "@/hooks/useNotifications";
import { cn } from "@/utils";
import type { AppNotification } from "@/hooks/useNotifications";

interface TopBarProps {
  searchPlaceholder?: string;
  onToggleMobileMenu?: () => void;
}

// Icon per notification type
function NotifIcon({ type }: { type: string }) {
  const iconClass = "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0";

  if (type.includes("client"))
    return <div className={cn(iconClass, "bg-blue-50")}><Users size={14} className="text-blue-600" /></div>;
  if (type.includes("project"))
    return <div className={cn(iconClass, "bg-violet-50")}><FolderOpen size={14} className="text-violet-600" /></div>;
  if (type.includes("invoice"))
    return <div className={cn(iconClass, "bg-emerald-50")}><Receipt size={14} className="text-emerald-600" /></div>;
  if (type.includes("document"))
    return <div className={cn(iconClass, "bg-orange-50")}><FileText size={14} className="text-orange-600" /></div>;
  if (type.includes("requirement"))
    return <div className={cn(iconClass, "bg-sky-50")}><ClipboardList size={14} className="text-sky-600" /></div>;
  if (type.includes("payment"))
    return <div className={cn(iconClass, "bg-emerald-50")}><CreditCard size={14} className="text-emerald-600" /></div>;
  if (type.includes("deadline"))
    return <div className={cn(iconClass, "bg-red-50")}><Clock size={14} className="text-red-600" /></div>;
  if (type.includes("note"))
    return <div className={cn(iconClass, "bg-amber-50")}><StickyNote size={14} className="text-amber-600" /></div>;

  return <div className={cn(iconClass, "bg-primary/10")}><Bell size={14} className="text-primary" /></div>;
}

// Navigate to entity
function entityPath(notif: AppNotification): string | null {
  if (!notif.entity_id || !notif.entity_type) return null;
  const map: Record<string, string> = {
    client: `/clients/${notif.entity_id}`,
    project: `/projects/${notif.entity_id}`,
    invoice: `/invoices/${notif.entity_id}`,
    document: `/documents`,
    requirement: `/requirements`,
    payment: `/payments`,
  };
  return map[notif.entity_type] || null;
}

export function TopBar({ searchPlaceholder, onToggleMobileMenu }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  // Notifications — compute unread inline to avoid double subscription
  const { data: notifications } = useNotifications();
  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const toggleLanguage = () => {
    const next = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = getInitials(profile?.full_name ?? "Admin");

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead.mutateAsync(notif.id);
    }
    const path = entityPath(notif);
    if (path) {
      navigate(path);
      setShowNotifs(false);
    }
  };

  return (
    <header className="h-[64px] flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center flex-1 max-w-[320px]">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden flex items-center justify-center mr-3 text-muted-foreground hover:text-foreground cursor-pointer p-1.5 hover:bg-accent rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder ?? t("common.search") + " projects or clients…"}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowProfile(false);
            }}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
          >
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-card">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-2xl shadow-card-hover z-50 flex flex-col animate-scale-in overflow-hidden max-h-[520px]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutateAsync()}
                    disabled={markAllRead.isPending}
                    className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {!notifications || notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                      <Bell size={22} className="text-primary/40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">You're all caught up! 🎉</p>
                    <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                      No new notifications. We'll let you know when something happens.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors cursor-pointer",
                        !notif.is_read && "bg-primary/3"
                      )}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs leading-snug", !notif.is_read ? "font-semibold text-foreground" : "text-foreground font-medium")}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {formatRelativeTime(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          title="Toggle language"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
        >
          <Languages size={18} className="text-muted-foreground" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 ml-1 cursor-pointer"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ""}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold ring-2 ring-border">
                {initials}
              </div>
            )}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-card-hover z-50 py-2 animate-scale-in">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{profile?.full_name ?? "Admin"}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={() => { navigate("/settings"); setShowProfile(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside overlay */}
      {(showProfile || showNotifs) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowProfile(false); setShowNotifs(false); }}
        />
      )}
    </header>
  );
}
