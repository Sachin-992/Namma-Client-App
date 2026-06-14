import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Banknote, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/utils";
import { useInvoices, usePayments } from "@/hooks/useInvoices";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonStatCard } from "@/components/ui/SkeletonLoader";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const METHOD_LABELS: Record<string, string> = {
  bank: "Bank Transfer",
  upi: "UPI",
  cash: "Cash",
  card: "Card",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { data: invoices, isLoading: invLoading } = useInvoices();
  const { data: payments, isLoading: payLoading } = usePayments();
  const isLoading = invLoading || payLoading;

  // -- Aggregations --
  const total = useMemo(
    () => (invoices || []).reduce((a, i) => a + Number(i.amount), 0),
    [invoices]
  );
  const paid = useMemo(
    () =>
      (invoices || [])
        .filter((i) => i.status === "paid")
        .reduce((a, i) => a + Number(i.amount), 0),
    [invoices]
  );
  const pending = useMemo(
    () =>
      (invoices || [])
        .filter((i) => i.status === "sent")
        .reduce((a, i) => a + Number(i.amount), 0),
    [invoices]
  );
  const overdue = useMemo(
    () =>
      (invoices || [])
        .filter((i) => i.status === "overdue")
        .reduce((a, i) => a + Number(i.amount), 0),
    [invoices]
  );
  const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

  // -- Monthly revenue last 6 months --
  const monthlyData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthPayments = (payments || []).filter((p) =>
        isWithinInterval(new Date(p.paid_at), { start, end })
      );
      const collected = monthPayments.reduce((a, p) => a + Number(p.amount), 0);
      result.push({
        month: format(monthDate, "MMM"),
        collected,
      });
    }
    return result;
  }, [payments]);

  // -- Pie chart data --
  const pieData = [
    { name: "Collected", value: paid },
    { name: "Pending", value: pending },
    { name: "Overdue", value: overdue },
  ].filter((d) => d.value > 0);

  // -- Client-wise collection --
  const clientCollection = useMemo(() => {
    const map: Record<
      string,
      { name: string; company: string; paid: number; pending: number; overdue: number }
    > = {};
    for (const inv of invoices || []) {
      const id = inv.client_id;
      if (!map[id]) {
        map[id] = {
          name: inv.client?.name || "Unknown",
          company: inv.client?.company || "",
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }
      const amt = Number(inv.amount);
      if (inv.status === "paid") map[id].paid += amt;
      else if (inv.status === "sent") map[id].pending += amt;
      else if (inv.status === "overdue") map[id].overdue += amt;
    }
    return Object.values(map).sort((a, b) => b.paid - a.paid);
  }, [invoices]);

  // -- Method breakdown --
  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of payments || []) {
      map[p.method] = (map[p.method] || 0) + Number(p.amount);
    }
    return Object.entries(map)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  const statCards = [
    {
      label: "Total Invoiced",
      value: formatCurrency(total, "INR"),
      icon: Banknote,
      color: "text-foreground",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Collected",
      value: formatCurrency(paid, "INR"),
      icon: CheckCircle2,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: `${collectionRate}% collection rate`,
    },
    {
      label: "Pending",
      value: formatCurrency(pending, "INR"),
      icon: Clock,
      color: "text-orange-500",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      label: "Overdue",
      value: formatCurrency(overdue, "INR"),
      icon: AlertCircle,
      color: "text-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("payments.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("payments.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                      <Icon size={15} className={card.iconColor} />
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  {card.sub && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp size={11} className="text-emerald-500" />
                      {card.sub}
                    </p>
                  )}
                </div>
              );
            })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Monthly Revenue (Last 6 Months)</h2>
          {isLoading ? (
            <div className="h-48 animate-pulse bg-muted-foreground/10 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v), "INR"), "Collected"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Payment Status</h2>
          {isLoading ? (
            <div className="h-48 animate-pulse bg-muted-foreground/10 rounded-xl" />
          ) : pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(Number(v), "INR")}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Client-wise collection + Method breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Client-wise table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Client-wise Collection</h2>
          </div>
          {clientCollection.length === 0 ? (
            <EmptyState variant="payments" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Collected</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 hidden sm:table-cell">Pending</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {clientCollection.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          {c.company && (
                            <p className="text-[11px] text-muted-foreground">{c.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(c.paid, "INR")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      <span className="text-sm text-orange-500">{formatCurrency(c.pending, "INR")}</span>
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell">
                      <span className="text-sm text-red-500">{formatCurrency(c.overdue, "INR")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Payment method breakdown */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <h2 className="text-sm font-bold text-foreground mb-4">Payment Methods</h2>
            {methodBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {methodBreakdown.map(({ method, amount }) => {
                  const pct = paid > 0 ? Math.round((amount / paid) * 100) : 0;
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">
                          {METHOD_LABELS[method] || method}
                        </span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <h2 className="text-sm font-bold text-foreground mb-4">Recent Payments</h2>
            {!payments || payments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {(payments as any[]).slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {p.client?.name || "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.invoice?.invoice_number} · {formatDate(p.paid_at, "MMM dd")}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex-shrink-0">
                      +{formatCurrency(p.amount, p.invoice?.currency || "INR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full payment history table */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">{t("payments.paymentHistory")}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden sm:table-cell">Invoice</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Method</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments && payments.length > 0 ? (
              (payments as any[]).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{p.client?.name || "—"}</td>
                  <td className="px-5 py-4 hidden sm:table-cell text-sm text-primary font-semibold">
                    {p.invoice?.invoice_number || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-emerald-600">
                      +{formatCurrency(p.amount, p.invoice?.currency || "INR")}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs capitalize badge bg-blue-50 text-blue-700 border-0">
                      {METHOD_LABELS[p.method] || p.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-muted-foreground">
                    {formatDate(p.paid_at, "MMM dd, yyyy")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState variant="payments" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
