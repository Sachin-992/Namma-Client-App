import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  X,
  Image,
  FileCode2,
  Filter,
} from "lucide-react";
import { formatDate, formatFileSize, generateMeaningfulFilename } from "@/utils";
import { toast } from "sonner";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { storageService, STORAGE_BUCKETS } from "@/services/storageService";
import { DocumentPreviewModal } from "@/components/ui/DocumentPreviewModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTableRow } from "@/components/ui/SkeletonLoader";

type FileTypeFilter = "all" | "pdf" | "image" | "docx";

const fileTypeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50", label: "PDF" },
  png: { icon: Image, color: "text-blue-500", bg: "bg-blue-50", label: "PNG" },
  jpg: { icon: Image, color: "text-blue-500", bg: "bg-blue-50", label: "JPG" },
  jpeg: { icon: Image, color: "text-blue-500", bg: "bg-blue-50", label: "JPEG" },
  webp: { icon: Image, color: "text-sky-500", bg: "bg-sky-50", label: "WEBP" },
  docx: { icon: FileCode2, color: "text-indigo-500", bg: "bg-indigo-50", label: "DOCX" },
};

const filterTabs: { key: FileTypeFilter; label: string }[] = [
  { key: "all", label: "All Files" },
  { key: "pdf", label: "PDFs" },
  { key: "image", label: "Images" },
  { key: "docx", label: "Documents" },
];

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const { data: documents, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();

  const filtered = ((documents || []) as any[]).filter((d) => {
    const matchesSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      (d.client?.name?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const ft = d.file_type?.toLowerCase() || "";
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "pdf" && ft === "pdf") ||
      (typeFilter === "image" && ["png", "jpg", "jpeg", "webp"].includes(ft)) ||
      (typeFilter === "docx" && ft === "docx");

    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string, filePath: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc.mutateAsync({ id, filePath });
      toast.success("Document deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const signedUrl = await storageService.getSignedUrl(
        STORAGE_BUCKETS.CLIENT_DOCUMENTS,
        doc.file_path,
        60
      );
      if (signedUrl) {
        const filename = generateMeaningfulFilename(
          doc.client?.name,
          doc.project?.name,
          doc.file_type?.toUpperCase() || "Document",
          doc.created_at,
          doc.file_type
        );
        const res = await fetch(signedUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download file");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("documents.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("documents.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Upload size={16} />
          {t("documents.upload")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Type filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.key !== "all" && <Filter size={11} />}
              {tab.label}
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
            placeholder={t("documents.searchPlaceholder") || "Search documents or clients…"}
            className="form-input pl-8 pr-4 py-2 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden sm:table-cell">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Project</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden lg:table-cell">Size</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden lg:table-cell">Uploaded</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={6} />
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {search || typeFilter !== "all" ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No documents match your search.
                    </div>
                  ) : (
                    <EmptyState
                      variant="documents"
                      ctaLabel="Upload Document"
                      onCta={() => setShowUploadModal(true)}
                    />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const ftKey = doc.file_type?.toLowerCase() || "pdf";
                const cfg = fileTypeConfig[ftKey] ?? fileTypeConfig["pdf"];
                const Icon = cfg.icon;
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <Icon size={15} className={cfg.color} />
                        </div>
                        <div>
                          <span
                            className="text-sm font-medium text-foreground truncate max-w-[180px] block"
                            title={doc.name}
                          >
                            {doc.name}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {doc.client?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {doc.project?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.created_at, "MMM dd, yyyy")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Eye = Preview (NO download) */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        {/* Download = meaningful filename download */}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.file_path)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Count footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-accent/20">
            <span className="text-xs text-muted-foreground">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
    </div>
  );
}

export function UploadModal({ onClose }: { onClose: () => void }) {
  const { data: clients } = useClients();
  const uploadDoc = useUploadDocument();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const clientProjects = (clients as any[])?.find((c) => c.id === selectedClient)?.projects || [];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !file) {
      toast.error("Please select a client and a file");
      return;
    }
    setLoading(true);
    try {
      await uploadDoc.mutateAsync({
        file,
        name: file.name,
        clientId: selectedClient,
        projectId: selectedProject || null,
      });
      toast.success("Document uploaded successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-card-hover w-full max-w-[440px] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Upload Document</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Client *
            </label>
            <select
              required
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedProject("");
              }}
              className="form-input"
            >
              <option value="">Choose a client…</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Project (Optional)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="form-input"
              disabled={!selectedClient}
            >
              <option value="">All projects…</option>
              {clientProjects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              File *
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                className="sr-only"
                id="doc-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload size={20} className="mx-auto text-muted-foreground mb-2" />
                <span className="text-xs font-medium text-foreground block">
                  {file ? file.name : "Drag & drop or click to select"}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  PDF, PNG, JPG, WEBP, or DOCX (max 20MB)
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
