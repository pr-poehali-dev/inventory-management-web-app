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

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedId, setSelectedId] = useState(initialInvoices[0].id);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);
  const [showMarking, setShowMarking] = useState(false);

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

  const handleImport = (newRows: InvoiceRow[]) => {
    const today = new Date().toLocaleDateString("ru-RU");
    const num = String(invoices.length + 1).padStart(4, "0");
    const newInv: Invoice = {
      id: `НКЛ-${num}`,
      supplier: selected?.supplier ?? "Новый поставщик",
      date: today,
      items: newRows.length,
      status: "draft",
      docNumber: `ИМП-${num}`,
      rows: newRows,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedId(newInv.id);
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
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="FileUp" size={14} />
              Загрузить
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="mono text-lg font-bold text-primary">{selected?.id}</span>
                  {selected && (
                    <span className={STATUS[selected.status].cls}>{STATUS[selected.status].text}</span>
                  )}
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
