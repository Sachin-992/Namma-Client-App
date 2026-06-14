import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils";
import type { InvoiceStatus } from "@/types";
import { useInvoices } from "@/hooks/useInvoices";
import AddInvoiceModal from "./AddInvoiceModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonInvoiceRow } from "@/components/ui/SkeletonLoader";

const statusBadge: Record<InvoiceStatus, string> = {
  draft: "badge-draft",
  sent: "badge-sent",
  paid: "badge-paid",
  overdue: "badge-overdue",
};

export default function InvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: invoices, isLoading } = useInvoices();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setShowAddModal(true);
      // Clean history state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // No early return for loading — we show skeleton rows instead

  const totalInvoiced = (invoices || []).reduce((acc, inv) => acc + Number(inv.amount), 0);
  const paid = (invoices || []).filter(inv => inv.status === "paid").reduce((acc, inv) => acc + Number(inv.amount), 0);
  const pending = (invoices || []).filter(inv => inv.status === "sent").reduce((acc, inv) => acc + Number(inv.amount), 0);
  const overdue = (invoices || []).filter(inv => inv.status === "overdue").reduce((acc, inv) => acc + Number(inv.amount), 0);

  const filtered = (invoices || []).filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (invoice.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (invoice.client?.company || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("invoices.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("invoices.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          {t("invoices.create")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Invoiced", value: formatCurrency(totalInvoiced, "INR"), color: "text-foreground" },
          { label: "Paid", value: formatCurrency(paid, "INR"), color: "text-emerald-600" },
          { label: "Pending", value: formatCurrency(pending, "INR"), color: "text-orange-500" },
          { label: "Overdue", value: formatCurrency(overdue, "INR"), color: "text-red-500" },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-muted-foreground font-medium mb-2">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "draft", "sent", "paid", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-border text-foreground hover:bg-accent"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10 py-2 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Invoice</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Amount</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Due Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonInvoiceRow key={i} />)
            ) : filtered && filtered.length > 0 ? (
              filtered.map(invoice => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="text-sm font-bold text-primary hover:underline cursor-pointer"
                    >
                      {invoice.invoice_number}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{invoice.client?.name || "—"}</p>
                      {invoice.client?.company && (
                        <p className="text-[11px] text-muted-foreground">{invoice.client.company}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-muted-foreground">
                    {invoice.due_date ? formatDate(invoice.due_date, "MMM dd, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View →
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    variant="invoices"
                    ctaLabel="Create Invoice"
                    onCta={() => setShowAddModal(true)}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddInvoiceModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
