import { useQuery } from "@tanstack/react-query";
import { CreditCard, Calendar, Check } from "lucide-react";
import { supabase } from "@/services/supabase/client";
import { formatDate } from "@/utils";
import type { Payment } from "@/types";

export default function ClientPaymentsPage() {
  // Query payments (RLS automatically restricts to rows where client_id = auth_client_id())
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["payments-client-portal"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("payments") as any)
        .select(`
          *,
          invoice:invoices(invoice_number)
        `)
        .order("paid_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">My Payments</h1>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">View your transaction history and past receipts.</p>
      </div>

      {payments && payments.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400">
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Transaction Date</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Reference ID</th>
                <th className="px-5 py-3.5">Amount Paid</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="px-5 py-4 text-slate-800 font-extrabold">
                    {pay.invoice?.invoice_number || "—"}
                  </td>
                  <td className="px-5 py-4 flex items-center gap-1.5 text-slate-400">
                    <Calendar size={12} />
                    <span>{formatDate(pay.paid_at)}</span>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-500 font-semibold">
                    {pay.method}
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-semibold font-mono">
                    {pay.reference || "—"}
                  </td>
                  <td className="px-5 py-4 font-black text-emerald-600">
                    ₹{pay.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider bg-emerald-50 text-emerald-700 border-emerald-100">
                      <Check size={10} />
                      Cleared
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
          <CreditCard size={48} className="mx-auto text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Payments Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your billing transaction history will be detailed here once a payment clears against sent invoices.
          </p>
        </div>
      )}
    </div>
  );
}
