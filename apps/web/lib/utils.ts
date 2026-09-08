import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApplicationStatus } from "@visaflow/shared-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amountInCents: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

// If you sometimes already have a decimal (not cents), add a second helper:
export function formatAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function formatDatetime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function getStatusColor(status: ApplicationStatus) {
  const map: Record<ApplicationStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
    MISSING_DOCUMENTS: "bg-orange-100 text-orange-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function getStatusLabel(status: ApplicationStatus) {
  const map: Record<ApplicationStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    MISSING_DOCUMENTS: "Missing Documents",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function truncate(str: string, length = 50) {
  return str.length > length ? str.slice(0, length) + "..." : str;
}
