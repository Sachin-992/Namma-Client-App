import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Eye, Upload, Trash2, FolderOpen } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useClientInfo } from "@/hooks/useRequirements";
import { supabase } from "@/services/supabase/client";
import { storageService } from "@/services/storageService";
import { toast } from "sonner";
import { formatDate } from "@/utils";

export default function ClientDocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Client details
  const { data: clientInfo } = useClientInfo();
  const { data: projects } = useProjects();
  const { data: documents, isLoading } = useDocuments();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploading, setUploading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientInfo || !user) return;

    if (!selectedProjectId) {
      toast.error("Please select a project before uploading.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const orgId = clientInfo.org_id;
      const filePath = `documents/${clientInfo.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to bucket
      await storageService.uploadClientDocument(filePath, file);

      // Register file type map
      const fileTypeMap: Record<string, "pdf" | "jpg" | "png" | "docx"> = {
        pdf: "pdf",
        jpg: "jpg",
        jpeg: "jpg",
        png: "png",
        docx: "docx",
      };

      const { error } = await (supabase.from("documents") as any).insert({
        org_id: orgId,
        client_id: clientInfo.id,
        project_id: selectedProjectId,
        name: file.name,
        file_path: filePath,
        file_type: fileTypeMap[fileExt?.toLowerCase() || ""] || "pdf",
        file_size: file.size,
        uploaded_by: user.id,
      });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (doc: any) => {
    try {
      const signedUrl = await storageService.getSignedUrl("client-documents", doc.file_path);
      window.open(signedUrl, "_blank");
    } catch (err) {
      toast.error("Failed to generate preview URL");
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      // Delete from storage
      await storageService.deleteFile("client-documents", doc.file_path);

      // Delete from DB
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">My Documents</h1>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage and share project collateral, PDFs, and wireframes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left h-fit">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Upload New Document</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Associate Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-700"
              >
                <option value="">-- Choose Project --</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 relative cursor-pointer">
              <input
                type="file"
                disabled={uploading || !selectedProjectId}
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {uploading ? "Uploading..." : "Click to select file"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, DOCX up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Shared Documents</h3>

          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                        {doc.file_type} • {(doc.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-850 rounded-lg"
                      title="View Document"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-750 rounded-lg"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <FolderOpen size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-400 font-bold italic">No documents shared yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
