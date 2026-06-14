import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils";
import { useState } from "react";
import { useClientDetail, useDeleteClient } from "@/hooks/useClients";
import { toast } from "sonner";
import AddClientModal from "./AddClientModal";

export default function ClientDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [showEdit, setShowEdit] = useState(false);
  const { data: client, isLoading } = useClientDetail(id || "");
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this client? This will delete all their data.")) return;
    
    try {
      await deleteClient.mutateAsync(id);
      toast.success("Client deleted successfully");
      navigate("/clients");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete client");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Client not found.
      </div>
    );
  }

  const initials = client.name ? client.name.split(" ").map(n => n[0]).join("").toUpperCase() : "C";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
              {client.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Building2 size={13} /> {client.company}
                </p>
              )}
              <span className="mt-2 inline-block badge badge-active capitalize">{client.status}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent transition-colors cursor-pointer"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={14} className="text-primary" />
            <span>{client.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone size={14} className="text-primary" />
            <span>{client.phone || "No phone listed"}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground col-span-2">
            <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <span>{client.address || "No address listed"}</span>
          </div>
          {client.gst && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-semibold bg-accent px-2 py-0.5 rounded text-foreground">GST</span>
              <span className="font-mono text-xs">{client.gst}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-xs text-muted-foreground">Member since {formatDate(client.created_at, "MMM yyyy")}</span>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-accent rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6">
        <h2 className="text-base font-bold text-foreground mb-4">{t("nav.projects")}</h2>
        <div className="space-y-3">
          {(client as any).projects && (client as any).projects.length > 0 ? (
            (client as any).projects.map((project: any) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full flex items-center justify-between p-4 border border-border rounded-xl hover:bg-accent transition-colors text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{project.stage}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${project.completion_pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{project.completion_pct}%</span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No projects assigned to this client.</p>
          )}
        </div>
      </div>

      {showEdit && (
        <AddClientModal
          onClose={() => setShowEdit(false)}
          editData={{
            id: client.id,
            name: client.name,
            company: client.company || "",
            email: client.email,
            phone: client.phone || "",
            address: client.address || "",
            gst: client.gst || "",
            notes: client.notes || "",
            status: client.status as "active" | "onboarding" | "inactive",
          }}
        />
      )}
    </div>
  );
}
