import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null, fmt = "MMM dd"): string {
  if (!date) return "—";
  try {
    return format(new Date(date), fmt);
  } catch {
    return "—";
  }
}

export function formatRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function daysRemaining(date: string | null): number | null {
  if (!date) return null;
  return differenceInDays(new Date(date), new Date());
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateInvoiceNumber(count: number): string {
  return `#${String(count + 200).padStart(3, "0")}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str: string, len = 50): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

export function slugify(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 30);
}

export function generateMeaningfulFilename(
  clientName: string | null | undefined,
  projectName: string | null | undefined,
  docType: string,
  date?: string | null,
  ext?: string
): string {
  const client = slugify(clientName || "Client");
  const project = slugify(projectName || "Project");
  const type = slugify(docType);
  const dateStr = date
    ? format(new Date(date), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const filename = [client, project, type, dateStr].filter(Boolean).join("_");
  return ext ? `${filename}.${ext}` : filename;
}
