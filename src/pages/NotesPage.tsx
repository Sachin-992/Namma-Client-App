import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Lock,
  Users,
  Coffee,
  Trash2,
  Pin,
  Search,
  X,
  Star,
  Edit3,
  StickyNote,
} from "lucide-react";
import { formatRelativeTime, getInitials } from "@/utils";
import { cn } from "@/utils";
import type { NoteType } from "@/types";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/useNotes";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonNoteCard } from "@/components/ui/SkeletonLoader";

const typeConfig: Record<NoteType, { label: string; icon: any; color: string; bg: string; accent: string }> = {
  internal: {
    label: "Internal",
    icon: Lock,
    color: "text-red-600",
    bg: "bg-red-50",
    accent: "border-l-red-400",
  },
  shared: {
    label: "Shared",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    accent: "border-l-blue-400",
  },
  meeting: {
    label: "Meeting",
    icon: Coffee,
    color: "text-amber-600",
    bg: "bg-amber-50",
    accent: "border-l-amber-400",
  },
};

const LOCAL_PINS_KEY = "namma_pinned_notes";

function getPinnedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PINS_KEY) || "[]");
  } catch {
    return [];
  }
}

function togglePin(id: string): string[] {
  const pins = getPinnedIds();
  const next = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id];
  localStorage.setItem(LOCAL_PINS_KEY, JSON.stringify(next));
  return next;
}

export default function NotesPage() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<NoteType | "all">("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>(getPinnedIds);

  const { data: notes, isLoading } = useNotes();
  const deleteNote = useDeleteNote();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteNote.mutateAsync(id);
      toast.success("Note deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete note");
    }
  };

  const handlePinToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = togglePin(id);
    setPinnedIds(next);
  };

  // Filter
  const allNotes = (notes || []).filter((n) => {
    const matchesType = activeType === "all" || n.type === activeType;
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const pinned = allNotes.filter((n) => pinnedIds.includes(n.id));
  const unpinned = allNotes.filter((n) => !pinnedIds.includes(n.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("notes.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("notes.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          {t("notes.addNote")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Type filters */}
        <div className="flex gap-1.5">
          {(["all", "internal", "shared", "meeting"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize cursor-pointer",
                activeType === type
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {type === "all" ? "All" : typeConfig[type as NoteType].label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="form-input pl-8 pr-4 py-2 w-full sm:w-60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonNoteCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allNotes.length === 0 && (
        <EmptyState
          variant="notes"
          ctaLabel="Add Note"
          onCta={() => setShowModal(true)}
        />
      )}

      {/* Pinned notes */}
      {!isLoading && pinned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={13} className="text-amber-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pinned
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned={true}
                onPin={handlePinToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {!isLoading && unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <StickyNote size={13} className="text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Notes
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned={false}
                onPin={handlePinToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add note modal */}
      {showModal && <AddNoteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

interface NoteCardProps {
  note: any;
  isPinned: boolean;
  onPin: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function NoteCard({ note, isPinned, onPin, onDelete }: NoteCardProps) {
  const cfg = typeConfig[note.type as NoteType];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "bg-card border border-border border-l-4 rounded-xl shadow-card hover:shadow-card-hover transition-all cursor-pointer group relative p-4",
        cfg.accent
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2.5">
        <h3 className="text-sm font-bold text-foreground leading-tight flex-1 mr-2 line-clamp-1">
          {note.title}
        </h3>
        <span
          className={cn(
            "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
            cfg.bg,
            cfg.color
          )}
        >
          <Icon size={9} />
          {cfg.label}
        </span>
      </div>

      {/* Content */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
        {note.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">
            {getInitials(note.author?.full_name || "?")}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(note.created_at)}
          </span>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => onPin(note.id, e)}
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
              isPinned
                ? "text-amber-500 hover:bg-amber-50"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
            )}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Star size={12} fill={isPinned ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => onDelete(note.id, e)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddNoteModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { data: clients } = useClients();
  const createNote = useCreateNote();
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "internal" as NoteType,
    client_id: "",
  });
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [form.content]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please enter a title and content");
      return;
    }
    setSaving(true);
    try {
      await createNote.mutateAsync({
        title: form.title,
        content: form.content,
        type: form.type,
        client_id: form.client_id || null,
        project_id: null,
      } as any);
      toast.success("Note saved!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    if (e.key === "Escape") onClose();
  };

  const cfg = typeConfig[form.type];
  const TypeIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card rounded-2xl shadow-card-hover w-full max-w-lg overflow-hidden animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        {/* Type accent bar */}
        <div className={cn("h-1 w-full", form.type === "internal" ? "bg-red-400" : form.type === "shared" ? "bg-blue-400" : "bg-amber-400")} />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", cfg.bg)}>
              <TypeIcon size={14} className={cfg.color} />
            </div>
            <h2 className="text-base font-bold text-foreground">New Note</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <input
            autoFocus
            type="text"
            placeholder="Note title…"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="form-input text-sm font-semibold"
          />

          {/* Type + Client row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NoteType }))}
                className="form-input"
              >
                <option value="internal">Internal</option>
                <option value="shared">Shared</option>
                <option value="meeting">Meeting Notes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Client (Optional)</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                className="form-input"
              >
                <option value="">No client</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Content</label>
            <textarea
              ref={textareaRef}
              placeholder="Write your note here…"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="form-input resize-none min-h-[120px] overflow-hidden"
              style={{ height: "auto" }}
            />
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="font-mono bg-accent px-1 rounded">Ctrl+Enter</span> to save quickly
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
