import { useState } from "react";
import Icon from "@/components/ui/icon";
import InvoiceImport, { InvoiceRow } from "@/components/receiving/InvoiceImport";
import InvoiceValidation from "@/components/receiving/InvoiceValidation";
import EnrichmentImport from "@/components/receiving/EnrichmentImport";
import MarkingImport from "@/components/receiving/MarkingImport";

export interface Invoice {
  id: string;
  supplier: string;
  date: string;
  items: number;
  status: "draft" | "ready" | "sent" | "error";
  docNumber: string;
  rows?: InvoiceRow[];
}

const initialInvoices: Invoice[] = [
  { id: "НКЛ-0012", supplier: "ООО Кабельстрой", date: "29.03.2026", items: 5, status: "ready", docNumber: "ТН-2024-0891" },
  { id: "НКЛ-0011", supplier: "ИП Электромонтаж", date: "29.03.2026", items: 12, status: "draft", docNumber: "УПД-56712" },
  { id: "НКЛ-0010", supplier: "АО ЭлектроСнаб", date: "28.03.2026", items: 8, status: "sent", docNumber: "ТН-2024-0880" },
  { id: "НКЛ-0009", supplier: "ООО Техносфера", date: "27.03.2026", items: 3, status: "sent", docNumber: "УПД-56680" },
  { id: "НКЛ-0008", supplier: "ИП Розниченко", date: "26.03.2026", items: 7, status: "error", docNumber: "ТН-2024-0871" },
];

const STATUS: Record<Invoice["status"], { text: string; cls: string; icon: string }> = {
  draft:  { text: "Черновик",  cls: "badge-pending", icon: "FileEdit" },
  ready:  { text: "Готова",    cls: "badge-out",     icon: "CheckCircle" },
  sent:   { text: "Передана",  cls: "badge-in",      icon: "Send" },
  error:  { text: "Ошибка",    cls: "badge-error",   icon: "AlertCircle" },
};

interface NewInvoiceForm {
  supplier: string;
  docNumber: string;
  date: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function NewInvoiceDialog({
  onConfirm,
  onClose,
  nextId,
}: {
  onConfirm: (form: NewInvoiceForm) => void;
  onClose: () => void;
  nextId: string;
}) {
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
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
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

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
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

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedId, setSelectedId] = useState(initialInvoices[0].id);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);
  const [showMarking, setShowMarking] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<{ supplier: string; docNumber: string; date: string }>({ supplier: "", docNumber: "", date: "" });

  const selected = invoices.find((inv) => inv.id === selectedId);
  const rows = selected?.rows ?? null;

  const filtered = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(search.toLowerCase()) ||
      inv.docNumber.toLowerCase().includes(search.toLowerCase())
  );

  const updateRows = (newRows: InvoiceRow[]) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedId
          ? { ...inv, rows: newRows, items: newRows.length, status: "ready" }
          : inv
      )
    );
  };

  const nextId = `НКЛ-${String(invoices.length + 1).padStart(4, "0")}`;

  const handleCreateNew = (form: NewInvoiceForm) => {
    const displayDate = new Date(form.date).toLocaleDateString("ru-RU");
    const newInv: Invoice = {
      id: nextId,
      supplier: form.supplier,
      date: displayDate,
      items: 0,
      status: "draft",
      docNumber: form.docNumber || nextId,
      rows: undefined,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedId(newInv.id);
    setShowNewDialog(false);
  };

  const handleImport = (newRows: InvoiceRow[]) => {
    // Если накладная уже создана — просто обновляем строки
    if (selected) {
      updateRows(newRows);
      return;
    }
    // Иначе создаём новую с дефолтными реквизитами
    const today = new Date().toLocaleDateString("ru-RU");
    const num = String(invoices.length + 1).padStart(4, "0");
    const newInv: Invoice = {
      id: `НКЛ-${num}`,
      supplier: "Новый поставщик",
      date: today,
      items: newRows.length,
      status: "draft",
      docNumber: `НКЛ-${num}`,
      rows: newRows,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedId(newInv.id);
  };

  const startEditHeader = () => {
    if (!selected) return;
    // Конвертируем русскую дату обратно в ISO для input[type=date]
    const parts = selected.date.split(".");
    const iso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : todayStr();
    setHeaderDraft({ supplier: selected.supplier, docNumber: selected.docNumber, date: iso });
    setEditingHeader(true);
  };

  const saveHeader = () => {
    if (!selected || !headerDraft.supplier.trim()) return;
    const displayDate = new Date(headerDraft.date).toLocaleDateString("ru-RU");
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedId
          ? { ...inv, supplier: headerDraft.supplier, docNumber: headerDraft.docNumber, date: displayDate }
          : inv
      )
    );
    setEditingHeader(false);
  };

  const handleSendToReceiving = () => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === selectedId ? { ...inv, status: "sent" } : inv))
    );
  };

  const totalSum = rows
    ? rows.reduce((s, r) => s + (r.costTotal > 0 ? r.costTotal : r.costPrice * r.qty), 0)
    : 0;

  return (
    <>
      {showNewDialog && (
        <NewInvoiceDialog
          nextId={nextId}
          onConfirm={handleCreateNew}
          onClose={() => setShowNewDialog(false)}
        />
      )}
      {showImport && (
        <InvoiceImport
          supplierName={selected?.supplier}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      {showEnrich && rows && (
        <EnrichmentImport
          rows={rows}
          onEnriched={(r) => updateRows(r)}
          onClose={() => setShowEnrich(false)}
        />
      )}
      {showMarking && rows && (
        <MarkingImport
          rows={rows}
          onApplied={(r) => updateRows(r)}
          onClose={() => setShowMarking(false)}
        />
      )}

      <div className="flex gap-4 h-full">

        {/* ─── Левая колонка: список накладных ─────────────────────────── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Накладные</span>
            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="Plus" size={14} />
              Новая
            </button>
          </div>

          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по накладной..."
              className="w-full bg-muted border border-border rounded-md text-sm pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2 overflow-y-auto scrollbar-thin flex-1">
            {filtered.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedId(inv.id)}
                className="w-full text-left p-3 rounded-lg border transition-all"
                style={{
                  background: selectedId === inv.id ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
                  borderColor: selectedId === inv.id ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-xs font-medium text-primary">{inv.id}</span>
                  <span className={STATUS[inv.status].cls}>{STATUS[inv.status].text}</span>
                </div>
                <div className="text-sm font-medium text-foreground truncate">{inv.supplier}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{inv.date}</span>
                  <span className="text-xs text-muted-foreground">{inv.items} поз.</span>
                </div>
                <div className="mono text-[10px] text-muted-foreground mt-0.5">{inv.docNumber}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</div>
            )}
          </div>
        </div>

        {/* ─── Правая колонка: детали ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Шапка документа */}
          <div className="stat-card">
            {editingHeader ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-sm font-bold text-primary">{selected?.id}</span>
                  <span className="text-xs text-muted-foreground">— редактирование реквизитов</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs text-muted-foreground mb-1">Поставщик *</label>
                    <input
                      autoFocus
                      value={headerDraft.supplier}
                      onChange={(e) => setHeaderDraft((d) => ({ ...d, supplier: e.target.value }))}
                      className="w-full rounded-md border bg-muted text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ borderColor: "hsl(var(--border))" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Номер документа</label>
                    <input
                      value={headerDraft.docNumber}
                      onChange={(e) => setHeaderDraft((d) => ({ ...d, docNumber: e.target.value }))}
                      className="w-full rounded-md border bg-muted text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ borderColor: "hsl(var(--border))" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Дата накладной *</label>
                    <input
                      type="date"
                      value={headerDraft.date}
                      onChange={(e) => setHeaderDraft((d) => ({ ...d, date: e.target.value }))}
                      className="w-full rounded-md border bg-muted text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ borderColor: "hsl(var(--border))", colorScheme: "dark" }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveHeader}
                    disabled={!headerDraft.supplier.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ background: "hsl(var(--primary))", color: "#fff" }}
                  >
                    <Icon name="Check" size={14} />
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingHeader(false)}
                    className="px-4 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="mono text-lg font-bold text-primary">{selected?.id}</span>
                    {selected && (
                      <span className={STATUS[selected.status].cls}>{STATUS[selected.status].text}</span>
                    )}
                    <button
                      onClick={startEditHeader}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Редактировать реквизиты"
                    >
                      <Icon name="Pencil" size={12} />
                      Изменить
                    </button>
                  </div>
                  <div className="text-base font-semibold mt-0.5 text-foreground">{selected?.supplier}</div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Документ: <span className="text-foreground font-medium">{selected?.docNumber}</span></span>
                    <span>Дата: <span className="text-foreground font-medium">{selected?.date}</span></span>
                    {rows && (
                      <span>
                        Сумма: <span className="text-primary font-mono font-semibold">{totalSum.toLocaleString("ru-RU")} ₽</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    <Icon name="FileUp" size={15} />
                    {rows ? "Перезагрузить" : "Загрузить накладную"}
                  </button>
                  {rows && selected?.status !== "sent" && (
                    <button
                      onClick={handleSendToReceiving}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                    >
                      <Icon name="Send" size={15} />
                      Передать в приёмку
                    </button>
                  )}
                  {selected?.status === "sent" && (
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: "hsl(var(--wms-green) / 0.12)", color: "hsl(var(--wms-green))" }}
                    >
                      <Icon name="CheckCircle2" size={15} />
                      Передана в приёмку
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Пустое состояние — накладная не загружена */}
          {!rows && (
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed gap-4"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}
              >
                <Icon name="FileUp" size={28} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-foreground">Накладная не загружена</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Загрузите Excel, XML или вставьте данные из буфера обмена
                </div>
              </div>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}
              >
                <Icon name="FileUp" size={16} />
                Загрузить накладную
              </button>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Icon name="FileSpreadsheet" size={12} /> Excel</span>
                <span className="flex items-center gap-1"><Icon name="FileCode" size={12} /> XML</span>
                <span className="flex items-center gap-1"><Icon name="Clipboard" size={12} /> Буфер</span>
              </div>
            </div>
          )}

          {/* Панель проверки и обогащения */}
          {rows && (
            <InvoiceValidation
              rows={rows}
              onEnrich={() => setShowEnrich(true)}
              onMarking={() => setShowMarking(true)}
            />
          )}

          {/* Таблица позиций */}
          {rows && (
            <div className="stat-card flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="section-title">Позиции накладной</div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                  >
                    {rows.length} позиций
                  </span>
                </div>
              </div>

              <div className="overflow-y-auto scrollbar-thin flex-1">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left">Наименование</th>
                      <th className="text-left">Арт. пост.</th>
                      <th className="text-left">Арт. изг.</th>
                      <th className="text-left">Бренд</th>
                      <th className="text-right">Кол-во</th>
                      <th className="text-right">Себест.</th>
                      <th className="text-right">Сумма</th>
                      <th className="text-right">Цена прод.</th>
                      <th className="text-center">Метки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <div className="font-medium text-sm text-foreground">{row.name}</div>
                          {row.oem && (
                            <div className="text-[10px] text-muted-foreground mono">{row.oem}</div>
                          )}
                        </td>
                        <td className="mono text-xs text-muted-foreground">{row.supplierArticle || "—"}</td>
                        <td className="mono text-xs text-muted-foreground">{row.manufacturerArticle || "—"}</td>
                        <td className="text-sm text-muted-foreground">{row.brand || "—"}</td>
                        <td className="text-right mono text-sm">
                          {row.qty}{" "}
                          <span className="text-muted-foreground text-xs">{row.unit}</span>
                        </td>
                        <td className="text-right mono text-sm">{row.costPrice.toFixed(2)} ₽</td>
                        <td className="text-right mono text-sm font-semibold">
                          {(row.costTotal > 0 ? row.costTotal : row.costPrice * row.qty).toFixed(2)} ₽
                        </td>
                        <td className="text-right mono text-sm">
                          {row.salePrice > 0 ? `${row.salePrice.toFixed(2)} ₽` : "—"}
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1.5">
                            {row.marking?.length > 0 && (
                              <span title={`${row.marking.length} кодов DataMatrix`} style={{ color: "hsl(var(--wms-green))" }}>
                                <Icon name="QrCode" size={13} />
                              </span>
                            )}
                            {row.oem && (
                              <span title="OEM" style={{ color: "hsl(var(--wms-amber))" }}>
                                <Icon name="Link" size={13} />
                              </span>
                            )}
                            {row.photo && (
                              <span title="Есть фото" style={{ color: "hsl(var(--wms-blue))" }}>
                                <Icon name="Image" size={13} />
                              </span>
                            )}
                            {row.unit === "компл." && (
                              <span title="Комплект свечей">🕯️</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="flex items-center justify-between pt-3 mt-3 border-t text-sm"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <span className="text-muted-foreground">
                  Позиций: <span className="text-foreground font-medium">{rows.length}</span>
                  {rows.some((r) => r.marking?.length > 0) && (
                    <span className="ml-3" style={{ color: "hsl(var(--wms-green))" }}>
                      <Icon name="QrCode" size={12} className="inline mr-1" />
                      {rows.reduce((s, r) => s + (r.marking?.length ?? 0), 0)} кодов маркировки
                    </span>
                  )}
                </span>
                <span className="font-semibold text-foreground">
                  Итого:{" "}
                  <span className="text-primary mono">{totalSum.toLocaleString("ru-RU")} ₽</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}