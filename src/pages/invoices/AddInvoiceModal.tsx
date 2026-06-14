import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  qty: z.coerce.number().min(1, "Qty must be at least 1"),
  rate: z.coerce.number().min(1, "Rate must be at least 1"),
});

const schema = z.object({
  invoice_number: z.string().min(2, "Invoice number is required"),
  client_id: z.string().uuid("Please select a client"),
  project_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  currency: z.string().default("INR"),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("sent"),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function AddInvoiceModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const createInvoice = useCreateInvoice();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();

  // Generate random invoice number on mount
  const defaultInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      invoice_number: defaultInvoiceNumber,
      currency: "INR",
      status: "sent",
      line_items: [{ description: "", qty: 1, rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const selectedClient = watch("client_id");
  const lineItems = watch("line_items") || [];

  // Filter projects for the selected client
  const clientProjects = projects?.filter(p => p.client_id === selectedClient) || [];

  // Auto-calculate subtotal and total
  const subtotal = lineItems.reduce((acc: number, item: any) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  // GST (18%)
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Format line items with auto-computed amounts
      const formattedLineItems = data.line_items.map((item: any) => ({
        ...item,
        amount: Number(item.qty) * Number(item.rate),
      }));

      const payload = {
        invoice_number: data.invoice_number,
        client_id: data.client_id,
        project_id: data.project_id || null,
        amount: total,
        currency: data.currency,
        status: data.status,
        due_date: data.due_date,
        line_items: formattedLineItems,
        notes: data.notes || null,
      };

      await createInvoice.mutateAsync(payload as any);
      toast.success("Invoice created successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-card-hover w-full max-w-[620px] max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">Create Invoice</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Invoice Number *</label>
              <input {...register("invoice_number")} className="form-input" placeholder="INV-1001" />
              {errors.invoice_number && <p className="text-xs text-destructive mt-1">{(errors.invoice_number as any).message}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Due Date *</label>
              <input {...register("due_date")} type="date" className="form-input" />
              {errors.due_date && <p className="text-xs text-destructive mt-1">{(errors.due_date as any).message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Client Selection */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Client *</label>
              <select {...register("client_id")} className="form-input" onChange={e => {
                setValue("client_id", e.target.value);
                setValue("project_id", ""); // reset project
              }}>
                <option value="">Choose a client...</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company ? `(${client.company})` : ""}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-xs text-destructive mt-1">{(errors.client_id as any).message}</p>}
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Project (Optional)</label>
              <select {...register("project_id")} className="form-input" disabled={!selectedClient}>
                <option value="">Choose a project...</option>
                {clientProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items header */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Line Items</h3>
              <button
                type="button"
                onClick={() => append({ description: "", qty: 1, rate: 0 })}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            {errors.line_items && <p className="text-xs text-destructive mb-2">{(errors.line_items as any).message}</p>}

            {/* Line items rows */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      {...register(`line_items.${index}.description` as const)}
                      placeholder="Service / Deliverable description"
                      className="form-input text-xs py-1.5"
                    />
                    {(errors.line_items as any)?.[index]?.description && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        {(errors.line_items as any)[index].description.message}
                      </p>
                    )}
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      {...register(`line_items.${index}.qty` as const)}
                      placeholder="Qty"
                      className="form-input text-xs py-1.5 text-center"
                      min="1"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      {...register(`line_items.${index}.rate` as const)}
                      placeholder="Rate (₹)"
                      className="form-input text-xs py-1.5 text-right"
                      min="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Amount breakdown panel */}
          <div className="bg-accent/40 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-semibold text-foreground">₹{gst.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border/60 pt-2">
              <span className="text-foreground">Total Amount</span>
              <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{t("invoices.notes")}</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="form-input resize-none"
              placeholder="Payment terms, bank details..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-accent transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
