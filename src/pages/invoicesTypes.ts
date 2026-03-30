import { InvoiceRow } from "@/components/receiving/InvoiceImport";

export type { InvoiceRow };

// ─── Типы ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  supplier: string;
  date: string;
  items: number;
  status: "draft" | "ready" | "sent" | "error";
  docNumber: string;
  rows?: InvoiceRow[];
}

export interface NewInvoiceForm {
  supplier: string;
  docNumber: string;
  date: string;
}

// ─── Константы ─────────────────────────────────────────────────────────────

export const STATUS: Record<Invoice["status"], { text: string; cls: string; icon: string }> = {
  draft: { text: "Черновик", cls: "badge-pending", icon: "FileEdit" },
  ready: { text: "Готова",   cls: "badge-out",     icon: "CheckCircle" },
  sent:  { text: "Передана", cls: "badge-in",      icon: "Send" },
  error: { text: "Ошибка",   cls: "badge-error",   icon: "AlertCircle" },
};

export const initialInvoices: Invoice[] = [
  { id: "НКЛ-0012", supplier: "ООО Кабельстрой", date: "29.03.2026", items: 5,  status: "ready", docNumber: "ТН-2024-0891" },
  { id: "НКЛ-0011", supplier: "ИП Электромонтаж", date: "29.03.2026", items: 12, status: "draft", docNumber: "УПД-56712" },
  { id: "НКЛ-0010", supplier: "АО ЭлектроСнаб",  date: "28.03.2026", items: 8,  status: "sent",  docNumber: "ТН-2024-0880" },
  { id: "НКЛ-0009", supplier: "ООО Техносфера",   date: "27.03.2026", items: 3,  status: "sent",  docNumber: "УПД-56680" },
  { id: "НКЛ-0008", supplier: "ИП Розниченко",    date: "26.03.2026", items: 7,  status: "error", docNumber: "ТН-2024-0871" },
];

// ─── Утилиты ───────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
