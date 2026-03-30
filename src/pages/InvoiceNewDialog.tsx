import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NewInvoiceForm, todayStr } from "./invoicesTypes";

interface InvoiceNewDialogProps {
  nextId: string;
  onConfirm: (form: NewInvoiceForm) => void;
  onClose: () => void;
}

export function InvoiceNewDialog({ nextId, onConfirm, onClose }: InvoiceNewDialogProps) {
  const [form, setForm] = useState<NewInvoiceForm>({
    supplier: "",
    docNumber: "",
    date: todayStr(),
  });

  const set = (k: keyof NewInvoiceForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <Icon name="FilePlus" size={18} className="text-primary" />
            <span className="font-semibold text-foreground">Новая накладная</span>
            <span className="mono text-xs text-muted-foreground">{nextId}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Поставщик <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={form.supplier}
              onChange={(e) => set("supplier", e.target.value)}
              placeholder="Название организации или ИП..."
              className="w-full rounded-lg border bg-muted text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Номер документа поставщика
            </label>
            <input
              value={form.docNumber}
              onChange={(e) => set("docNumber", e.target.value)}
              placeholder="Например: ТН-2024-0892 или УПД-56800..."
              className="w-full rounded-lg border bg-muted text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Дата накладной <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full rounded-lg border bg-muted text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ borderColor: "hsl(var(--border))", colorScheme: "dark" }}
            />
          </div>
        </div>

        <div
          className="flex justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => { if (form.supplier.trim() && form.date) onConfirm(form); }}
            disabled={!form.supplier.trim() || !form.date}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            <Icon name="Check" size={15} />
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
