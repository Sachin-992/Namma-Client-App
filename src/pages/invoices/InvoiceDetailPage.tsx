import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Send, CheckCircle, Mail, Clock, FileText, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate, formatCurrency, generateMeaningfulFilename } from "@/utils";
import { toast } from "sonner";
import { useInvoiceDetail, useUpdateInvoiceStatus, usePayments } from "@/hooks/useInvoices";
import { cn } from "@/utils";
import logoSquare from "@/assets/logo-square.jpg";

const STEPS = ["draft", "sent", "paid"] as const;
type StepStatus = (typeof STEPS)[number];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const stepLabels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
  };

  const currentIdx = STEPS.indexOf(currentStatus as StepStatus);
  const isOverdue = currentStatus === "overdue";

  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, idx) => {
        const isDone = currentIdx > idx || (step === "paid" && currentStatus === "paid");
        const isActive = currentIdx === idx || (isOverdue && step === "sent");
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-primary border-primary text-white"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {isDone ? (
                  <CheckCircle size={14} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-1.5",
                  isDone
                    ? "text-emerald-600"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {stepLabels[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 rounded-full",
                  idx < currentIdx ? "bg-emerald-400" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
      {isOverdue && (
        <div className="ml-3 text-xs font-semibold text-red-500 flex items-center gap-1">
          <Clock size={11} />
          Overdue
        </div>
      )}
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoiceDetail(id || "");
  const { data: allPayments } = usePayments();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <FileText size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-base font-bold text-foreground mb-1">Invoice not found</h3>
        <button onClick={() => navigate("/invoices")} className="text-sm text-primary hover:underline mt-2">
          Back to Invoices
        </button>
      </div>
    );
  }

  const lineItems = (invoice.line_items || []) as any[];
  const subtotal = lineItems.reduce(
    (s, i) => s + (Number(i.amount) || Number(i.rate) * Number(i.qty) || 0),
    0
  );
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  // Payments for this invoice
  const invoicePayments = (allPayments as any[] || []).filter(
    (p) => p.invoice_id === invoice.id
  );

  const handleMarkAsPaid = async () => {
    try {
      await updateInvoiceStatus.mutateAsync({
        id: invoice.id,
        status: "paid",
        paid_at: new Date().toISOString(),
      });
      toast.success("Invoice marked as paid!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update invoice");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleEmailInvoice = () => {
    const email = invoice.client?.email || "";
    const subject = encodeURIComponent(
      `Invoice ${invoice.invoice_number} from Namma Client`
    );
    const body = encodeURIComponent(
      `Hi ${invoice.client?.name || ""},\n\nPlease find your invoice ${invoice.invoice_number} for ${formatCurrency(total, invoice.currency)} attached.\n\nDue date: ${invoice.due_date ? formatDate(invoice.due_date, "MMM dd, yyyy") : "N/A"}\n\nThank you for your business.\n\nNamma Client`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleSendReminder = () => {
    toast.success(`Reminder sent to ${invoice.client?.name || "client"}!`, {
      description: `Invoice ${invoice.invoice_number} reminder notification sent.`,
    });
  };

  const isPaid = invoice.status === "paid";

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-full { max-width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto print-full">
        {/* Back nav — no-print */}
        <button
          onClick={() => navigate("/invoices")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 cursor-pointer no-print"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>

        {/* Status timeline — no-print */}
        <div className="no-print mb-5">
          <StatusTimeline currentStatus={invoice.status} />
        </div>

        {/* Actions — no-print */}
        <div className="flex flex-wrap gap-2 mb-5 no-print">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-4 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent cursor-pointer"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          {!isPaid && (
            <>
              <button
                onClick={handleEmailInvoice}
                className="flex items-center gap-1.5 px-4 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent cursor-pointer"
              >
                <Mail size={14} /> Email Invoice
              </button>
              <button
                onClick={handleSendReminder}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                <Send size={14} /> Send Reminder
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={updateInvoiceStatus.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle size={14} />
                {updateInvoiceStatus.isPending ? "Updating…" : t("invoices.markAsPaid")}
              </button>
            </>
          )}
        </div>

        {/* Invoice document */}
        <div className="relative bg-white border border-border rounded-2xl shadow-card overflow-hidden">
          {/* PAID watermark */}
          {isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-30deg]">
              <span className="text-[80px] font-black text-emerald-500/10 select-none tracking-widest">
                PAID
              </span>
            </div>
          )}

          {/* Invoice header */}
          <div className="p-8 border-b border-border relative z-20">
            <div className="flex justify-between">
              <div>
                <img
                  src={logoSquare}
                  alt="Namma Client"
                  className="w-12 h-12 rounded-xl object-cover mb-3"
                />
                <p className="text-sm font-bold text-foreground">Namma Client</p>
                <p className="text-xs text-muted-foreground">support@nammaclient.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-primary mb-1">INVOICE</h2>
                <p className="text-sm font-bold text-foreground">{invoice.invoice_number}</p>
                <p className="text-xs text-muted-foreground">
                  Issued: {formatDate(invoice.created_at, "MMM dd, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Due: {invoice.due_date ? formatDate(invoice.due_date, "MMM dd, yyyy") : "—"}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full",
                    invoice.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : invoice.status === "overdue"
                      ? "bg-red-100 text-red-700"
                      : invoice.status === "sent"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="px-8 py-5 border-b border-border grid grid-cols-2 gap-8 relative z-20">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Bill To
              </p>
              <p className="text-sm font-bold text-foreground">{invoice.client?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{invoice.client?.company || ""}</p>
              <p className="text-xs text-muted-foreground">{invoice.client?.email || ""}</p>
              <p className="text-xs text-muted-foreground">{invoice.client?.address || ""}</p>
              {invoice.client?.gst && (
                <p className="text-xs text-muted-foreground">GST: {invoice.client.gst}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Project
              </p>
              <p className="text-sm font-medium text-foreground">{invoice.project?.name || "—"}</p>
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Currency
                </p>
                <p className="text-sm font-medium text-foreground">{invoice.currency}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 py-5 relative z-20">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-3">
                    Description
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground pb-3">
                    Qty
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground pb-3">
                    Rate
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground pb-3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const amt = Number(item.amount) || Number(item.rate) * Number(item.qty) || 0;
                  return (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-3 text-sm text-foreground">{item.description}</td>
                      <td className="py-3 text-sm text-center text-muted-foreground">{item.qty}</td>
                      <td className="py-3 text-sm text-right text-muted-foreground">
                        {formatCurrency(item.rate, invoice.currency)}
                      </td>
                      <td className="py-3 text-sm font-semibold text-right text-foreground">
                        {formatCurrency(amt, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-5 ml-auto max-w-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">{formatCurrency(gst, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-base border-t-2 border-border pt-3">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-black text-primary text-lg">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-accent rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                <p className="text-xs text-foreground">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer strip */}
          <div className="px-8 py-4 bg-primary/5 border-t border-border text-center relative z-20">
            <p className="text-xs text-muted-foreground">
              Thank you for your business · Namma Client · support@nammaclient.com
            </p>
          </div>
        </div>

        {/* Payment history — no-print */}
        {invoicePayments.length > 0 && (
          <div className="mt-5 bg-card border border-border rounded-2xl shadow-card overflow-hidden no-print">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Payment History</h2>
            </div>
            <div className="divide-y divide-border">
              {invoicePayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Payment received
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.method} · {formatDate(p.paid_at, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    +{formatCurrency(p.amount, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
