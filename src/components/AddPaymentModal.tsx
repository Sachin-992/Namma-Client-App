import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useInvoices, useRecordPayment, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { formatCurrency } from "@/utils";

const schema = z.object({
  invoice_id: z.string().uuid("Please select an invoice"),
  amount: z.coerce.number().min(1, "Amount must be at least ₹1"),
  method: z.enum(["cash", "bank_transfer", "card", "cheque", "upi", "other"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function AddPaymentModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const { data: invoices } = useInvoices();
  const recordPayment = useRecordPayment();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  // Only show sent or overdue invoices
  const unpaidInvoices = (invoices || []).filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  );

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      method: "upi",
      amount: 0,
    },
  });

  const selectedInvoiceId = watch("invoice_id");
  const selectedInvoice = unpaidInvoices.find((i) => i.id === selectedInvoiceId);

  // Set the default payment amount when an invoice is selected
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invId = e.target.value;
    setValue("invoice_id", invId);
    const inv = unpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setValue("amount", Number(inv.amount));
    } else {
      setValue("amount", 0);
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedInvoice) return;
    setLoading(true);
    try {
      // 1. Record payment in public.payments table
      await recordPayment.mutateAsync({
        invoice_id: data.invoice_id,
        client_id: selectedInvoice.client_id,
        amount: data.amount,
        method: data.method === "bank_transfer" ? "bank" : (data.method as any),
        notes: data.notes || null,
      } as any);

      // 2. Mark invoice as paid
      await updateInvoiceStatus.mutateAsync({
        id: data.invoice_id,
        status: "paid",
        paid_at: new Date().toISOString(),
      });

      toast.success("Payment recorded and invoice marked as paid!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-card-hover w-full max-w-[440px] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Record Payment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Invoice Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Select Unpaid Invoice *</label>
            <select
              {...register("invoice_id")}
              onChange={handleInvoiceChange}
              className="form-input"
            >
              <option value="">Choose an invoice...</option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.client?.name} ({formatCurrency(inv.amount, inv.currency)})
                </option>
              ))}
            </select>
            {errors.invoice_id?.message && <p className="text-xs text-destructive mt-1">{String(errors.invoice_id.message)}</p>}
          </div>

          {selectedInvoice && (
            <div className="bg-accent/40 rounded-xl p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-semibold text-foreground">{selectedInvoice.client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-semibold text-foreground">{selectedInvoice.client?.company || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project:</span>
                <span className="font-semibold text-foreground">{selectedInvoice.project?.name || "—"}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-1.5 mt-1.5 font-bold">
                <span className="text-foreground">Invoice Total:</span>
                <span className="text-primary">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
              </div>
            </div>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Amount Received (₹) *</label>
            <input
              type="number"
              step="any"
              {...register("amount")}
              className="form-input"
              placeholder="5000"
            />
            {errors.amount?.message && <p className="text-xs text-destructive mt-1">{String(errors.amount.message)}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Payment Method *</label>
            <select {...register("method")} className="form-input">
              <option value="upi">UPI (GPay/PhonePe)</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="card">Card Payment</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
            {errors.method?.message && <p className="text-xs text-destructive mt-1">{String(errors.method.message)}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Notes / Transaction ID</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="form-input resize-none"
              placeholder="e.g. TXN9832742984, advanced payment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedInvoice}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
