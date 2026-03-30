import { useState } from "react";
import Icon from "@/components/ui/icon";
import InvoiceValidation from "@/components/receiving/InvoiceValidation";
import { Invoice, InvoiceRow, STATUS, todayStr } from "./invoicesTypes";

interface HeaderDraft {
  supplier: string;
  docNumber: string;
  date: string;
}

interface InvoiceDetailProps {
  selected: Invoice | undefined;
  rows: InvoiceRow[] | null;
  totalSum: number;
  onShowImport: () => void;
  onShowEnrich: () => void;
  onShowMarking: () => void;
  onSendToReceiving: () => void;
  onSaveHeader: (draft: HeaderDraft) => void;
}

export function InvoiceDetail({
  selected,
  rows,
  totalSum,
  onShowImport,
  onShowEnrich,
  onShowMarking,
  onSendToReceiving,
  onSaveHeader,
}: InvoiceDetailProps) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<HeaderDraft>({ supplier: "", docNumber: "", date: "" });

  const startEditHeader = () => {
    if (!selected) return;
    const parts = selected.date.split(".");
    const iso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : todayStr();
    setHeaderDraft({ supplier: selected.supplier, docNumber: selected.docNumber, date: iso });
    setEditingHeader(true);
  };

  const saveHeader = () => {
    if (!headerDraft.supplier.trim()) return;
    onSaveHeader(headerDraft);
    setEditingHeader(false);
  };

  return (
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
                    Сумма:{" "}
                    <span className="text-primary font-mono font-semibold">
                      {totalSum.toLocaleString("ru-RU")} ₽
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <button
                onClick={onShowImport}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                <Icon name="FileUp" size={15} />
                {rows ? "Перезагрузить" : "Загрузить накладную"}
              </button>
              {rows && selected?.status !== "sent" && (
                <button
                  onClick={onSendToReceiving}
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

      {/* Пустое состояние */}
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
            onClick={onShowImport}
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
          onEnrich={onShowEnrich}
          onMarking={onShowMarking}
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
                          <span
                            title={`${row.marking.length} кодов DataMatrix`}
                            style={{ color: "hsl(var(--wms-green))" }}
                          >
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
  );
}
