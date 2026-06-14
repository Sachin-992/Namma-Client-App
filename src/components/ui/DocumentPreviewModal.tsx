import { useState, useEffect } from "react";
import {
  X,
  Download,
  FileText,
  Image,
  FileCode2,
  ExternalLink,
  Loader2,
  Calendar,
  User,
  HardDrive,
} from "lucide-react";
import { formatDate, formatFileSize, generateMeaningfulFilename } from "@/utils";
import { storageService, STORAGE_BUCKETS } from "@/services/storageService";
import { toast } from "sonner";

interface DocForPreview {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface DocumentPreviewModalProps {
  doc: DocForPreview;
  onClose: () => void;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  webp: Image,
  docx: FileCode2,
};

export function DocumentPreviewModal({ doc, onClose }: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileType = doc.file_type?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(fileType);
  const isPdf = fileType === "pdf";
  const isDocx = fileType === "docx";

  const Icon = typeIcons[fileType] ?? FileText;

  useEffect(() => {
    let cancelled = false;
    async function loadUrl() {
      setLoading(true);
      setError(null);
      try {
        const url = await storageService.getSignedUrl(
          STORAGE_BUCKETS.CLIENT_DOCUMENTS,
          doc.file_path,
          300 // 5 minute signed URL
        );
        if (!cancelled) setSignedUrl(url);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUrl();
    return () => { cancelled = true; };
  }, [doc.file_path]);

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
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
    } catch {
      toast.error("Failed to download file");
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-card-hover w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">{doc.name}</h2>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {doc.client?.name && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User size={10} />
                  {doc.client.name}
                </span>
              )}
              {doc.project?.name && (
                <span className="text-[11px] text-muted-foreground">
                  · {doc.project.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar size={10} />
                {formatDate(doc.created_at, "MMM dd, yyyy")}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <HardDrive size={10} />
                {formatFileSize(doc.file_size)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={!signedUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download size={13} />
              Download
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-accent flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 overflow-auto bg-accent/20 p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading preview…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <FileText size={28} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-foreground">Preview unavailable</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && signedUrl && (
            <>
              {isImage && (
                <div className="flex items-center justify-center min-h-64">
                  <img
                    src={signedUrl}
                    alt={doc.name}
                    className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-card"
                  />
                </div>
              )}

              {isPdf && (
                <iframe
                  src={signedUrl}
                  title={doc.name}
                  className="w-full rounded-xl border border-border"
                  style={{ height: "65vh" }}
                />
              )}

              {isDocx && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <FileCode2 size={36} className="text-indigo-500" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      DOCX Preview
                    </p>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                      DOCX files cannot be rendered inline. Open in Google Docs for a full preview.
                    </p>
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Open in Google Docs Viewer
                    </a>
                  </div>
                </div>
              )}

              {!isImage && !isPdf && !isDocx && (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                    <FileText size={28} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Preview not available for this file type.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
