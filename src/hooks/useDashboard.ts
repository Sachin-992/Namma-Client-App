import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "./useAuth";

export function useDashboardData() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["dashboard-data", profile?.org_id],
    queryFn: async () => {
      const orgId = profile?.org_id;
      if (!orgId) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. Fetch Clients
      const { data: clientsData, error: errClients } = await (supabase.from("clients") as any)
        .select("*")
        .eq("org_id", orgId);
      if (errClients) console.error("Dashboard: Error fetching clients:", errClients);
      const clients = clientsData || [];

      // 2. Fetch Projects (with clients, tags, milestones)
      const { data: projectsData, error: errProjects } = await (supabase.from("projects") as any)
        .select(`
          *,
          client:clients(*),
          tags:project_tags(*),
          milestones:milestones(*)
        `)
        .eq("org_id", orgId);
      if (errProjects) console.error("Dashboard: Error fetching projects:", errProjects);
      const projects = projectsData || [];

      // 3. Fetch Invoices
      const { data: invoicesData, error: errInvoices } = await (supabase.from("invoices") as any)
        .select(`
          *,
          client:clients(*)
        `)
        .eq("org_id", orgId);
      if (errInvoices) console.error("Dashboard: Error fetching invoices:", errInvoices);
      const invoices = invoicesData || [];

      // 4. Fetch Requirements
      const { data: reqsData, error: errReqs } = await (supabase.from("requirements") as any)
        .select(`
          *,
          client:clients(*)
        `);
      if (errReqs) console.error("Dashboard: Error fetching requirements:", errReqs);
      const requirements = (reqsData || []).filter((r: any) => r.client?.org_id === orgId);

      // 5. Fetch Activities (limit 10)
      const { data: activities, error: errActivities } = await (supabase.from("activities") as any)
        .select(`
          *,
          actor:profiles(*)
        `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (errActivities) console.error("Dashboard: Error fetching activities:", errActivities);

      // ==========================================
      // AGGREGATION & IN-MEMORY COMPUTATION
      // ==========================================

      // -- Section 1: Welcome Header Summary --
      const activeProjCount = projects.filter((p: any) => p.status === "active").length;
      const unpaidInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "overdue");
      const totalPendingBalance = unpaidInvoices.reduce((acc: number, i: any) => acc + Number(i.amount), 0);

      // Due today tasks/milestones
      const todayStr = now.toISOString().split("T")[0];
      const milestonesDueToday = projects.flatMap((p: any) => p.milestones || [])
        .filter((m: any) => !m.completed && m.due_date === todayStr).length;

      // -- Section 3: KPI Metrics --
      // Clients Metrics
      const totalClientsCount = clients.length;
      const newClientsThisMonth = clients.filter((c: any) => c.created_at >= startOfMonth).length;
      const prevClientsCount = totalClientsCount - newClientsThisMonth;
      const clientGrowthPct = prevClientsCount > 0 ? Math.round((newClientsThisMonth / prevClientsCount) * 100) : 0;

      // Projects Metrics
      const completedProjectsThisMonth = projects.filter(
        (p: any) => p.status === "completed" || (p.stage === "completed" && p.delivery_date >= startOfMonth.split("T")[0])
      ).length;

      // Revenue Metrics
      const paidInvoices = invoices.filter((i: any) => i.status === "paid");
      const totalRevenue = paidInvoices.reduce((acc: number, i: any) => acc + Number(i.amount), 0);
      const monthlyRevenue = paidInvoices
        .filter((i: any) => i.paid_at && i.paid_at >= startOfMonth)
        .reduce((acc: number, i: any) => acc + Number(i.amount), 0);

      // Pending Payments Metrics
      const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
      const overdueCount = overdueInvoices.length;

      // Upcoming Deadlines (Projects due this week - within next 7 days)
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneWeekStr = oneWeekFromNow.toISOString().split("T")[0];
      const projectsDueThisWeek = projects.filter(
        (p: any) => p.status === "active" && p.delivery_date && p.delivery_date >= todayStr && p.delivery_date <= oneWeekStr
      );
      const projectsDueThisWeekCount = projectsDueThisWeek.length;

      // Project Completion Rate (Avg completion pct across active projects)
      const activeProjects = projects.filter((p: any) => p.status === "active");
      const avgCompletionRate = activeProjects.length > 0
        ? Math.round(activeProjects.reduce((acc: number, p: any) => acc + (p.completion_pct || 0), 0) / activeProjects.length)
        : 0;

      // -- Section 6: Pending Actions (Urgency color coded) --
      const pendingActions: any[] = [];

      // Overdue Invoices -> Urgency: High (Red)
      overdueInvoices.forEach((i: any) => {
        pendingActions.push({
          id: `overdue-inv-${i.id}`,
          title: `Invoice ${i.invoice_number} is Overdue`,
          desc: `Client: ${i.client?.name || "—"} • Balance: ₹${Number(i.amount).toLocaleString("en-IN")}`,
          urgency: "high",
          actionLabel: "Collect Payment",
          actionUrl: `/invoices/${i.id}`,
        });
      });

      // Unreviewed Requirements -> Urgency: Medium (Orange)
      requirements.filter((r: any) => r.status === "submitted").forEach((r: any) => {
        pendingActions.push({
          id: `req-sub-${r.id}`,
          title: "Requirements Submitted",
          desc: `Submitted by: ${r.client?.name || "Client"} • Waiting for team review.`,
          urgency: "medium",
          actionLabel: "Review Draft",
          actionUrl: "/requirements",
        });
      });

      // Draft Requirements (missing/not submitted) -> Urgency: Low (Blue)
      projects.filter((p: any) => p.stage === "requirements" && p.status === "active").forEach((p: any) => {
        // check if requirements submission exists
        const hasSubmission = requirements.some((r: any) => r.client_id === p.client_id && r.status === "submitted");
        if (!hasSubmission) {
          pendingActions.push({
            id: `req-missing-${p.id}`,
            title: `Missing Requirements: ${p.name}`,
            desc: `Client ${p.client?.name || "—"} has not completed the onboarding wizard.`,
            urgency: "low",
            actionLabel: "View Project",
            actionUrl: `/projects/${p.id}`,
          });
        }
      });

      // Milestones due in next 48 hrs -> Urgency: High/Medium
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      projects.flatMap((p: any) => p.milestones || []).forEach((m: any) => {
        if (!m.completed && m.due_date) {
          if (m.due_date === todayStr) {
            pendingActions.push({
              id: `mile-today-${m.id}`,
              title: `Milestone Due Today: ${m.title}`,
              desc: `Project: ${projects.find((p: any) => p.id === m.project_id)?.name || "—"}`,
              urgency: "high",
              actionLabel: "Complete Milestone",
              actionUrl: `/projects/${m.project_id}`,
            });
          } else if (m.due_date === tomorrow) {
            pendingActions.push({
              id: `mile-tomorrow-${m.id}`,
              title: `Milestone Due Tomorrow: ${m.title}`,
              desc: `Project: ${projects.find((p: any) => p.id === m.project_id)?.name || "—"}`,
              urgency: "medium",
              actionLabel: "View Milestones",
              actionUrl: `/projects/${m.project_id}`,
            });
          }
        }
      });

      // Sort pending actions by urgency: high first, then medium, then low
      const urgencyWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      pendingActions.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

      // -- Section 7: Revenue Analytics (Last 6 Months Trend) --
      const monthsList = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
          yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          collected: 0,
          pending: 0,
        };
      }).reverse();

      invoices.forEach((inv: any) => {
        const date = new Date(inv.created_at);
        const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const match = monthsList.find((m) => m.yearMonth === ym);
        if (match) {
          if (inv.status === "paid") {
            match.collected += Number(inv.amount);
          } else if (inv.status === "sent" || inv.status === "overdue") {
            match.pending += Number(inv.amount);
          }
        }
      });

      // -- Section 8: Kanban Pipeline project counts --
      const stages = ["requirements", "planning", "design", "development", "testing", "deployment", "completed"];
      const pipelineStages = stages.map((s) => ({
        stage: s,
        count: projects.filter((p: any) => p.status === "active" && p.stage === s).length,
      }));

      // -- Section 9: Upcoming Deadlines Timeline --
      const deadlinesTimeline: any[] = [];
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      projects.filter((p: any) => p.status === "active" && p.delivery_date).forEach((p: any) => {
        const diffTime = new Date(p.delivery_date).getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let priority = "low";
        if (diffDays <= 4) priority = "high";
        else if (diffDays <= 10) priority = "medium";

        let dateGroup = "This Week";
        if (p.delivery_date === todayStr) dateGroup = "Today";
        else if (p.delivery_date === tomorrow) dateGroup = "Tomorrow";

        deadlinesTimeline.push({
          id: p.id,
          project: p.name,
          client: p.client?.name || "—",
          daysRemaining: diffDays,
          priority,
          dateGroup,
          delivery_date: p.delivery_date,
        });
      });
      // Sort deadlines timeline ascending
      deadlinesTimeline.sort((a: any, b: any) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime());

      // -- Section 10: Client Insights --
      // Calculate total paid per client
      const clientPaidMap: Record<string, number> = {};
      paidInvoices.forEach((i: any) => {
        clientPaidMap[i.client_id] = (clientPaidMap[i.client_id] || 0) + Number(i.amount);
      });

      const topClients = clients.map((c: any) => ({
        ...c,
        paidRevenue: clientPaidMap[c.id] || 0,
        activeProjCount: projects.filter((p: any) => p.client_id === c.id && p.status === "active").length,
      }))
      .sort((a: any, b: any) => b.paidRevenue - a.paidRevenue)
      .slice(0, 4);

      const recentClients = [...clients]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);

      const pendingClients = clients.filter((c: any) =>
        invoices.some((i: any) => i.client_id === c.id && (i.status === "sent" || i.status === "overdue"))
      ).slice(0, 4);

      const activeClients = clients.filter((c: any) =>
        projects.some((p: any) => p.client_id === c.id && p.status === "active")
      ).slice(0, 4);

      return {
        // Welcomes Summary
        activeProjCount,
        totalPendingBalance,
        milestonesDueToday,
        
        // KPI metrics
        totalClients: totalClientsCount,
        newClientsThisMonth,
        clientGrowthPct,
        completedProjectsThisMonth,
        totalRevenue,
        monthlyRevenue,
        overdueCount,
        projectsDueThisWeekCount,
        avgCompletionRate,

        // Data arrays
        projects, // Section 4 Overview table
        activities: activities || [], // Section 5 Timeline feed
        pendingActions, // Section 6 urgency feed
        revenueTrend: monthsList, // Section 7 Chart data
        pipelineStages, // Section 8 Kanban data
        deadlinesTimeline: deadlinesTimeline.slice(0, 6), // Section 9 deadlines timeline
        
        // Client Insights
        clientInsights: {
          topClients,
          recentClients,
          pendingClients,
          activeClients,
        },
      };
    },
    enabled: !!profile?.org_id,
  });
}
