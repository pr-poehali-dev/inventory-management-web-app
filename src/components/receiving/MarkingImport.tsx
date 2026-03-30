import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./InvoiceImport";

// ─── Типы иерархии маркировки ──────────────────────────────────────────────
// Честный знак / ЦРПТ поддерживает:
//   1. Формат "Заказ кодов" — XML/CSV с отдельными кодами
//   2. Формат агрегации — SSCC (короб/паллет) → DataMatrix каждого товара
//   3. Текстовый список кодов (по одному на строку)
//   4. Excel с колонками: SSCC | Код | Кол-во

export interface MarkingUnit {
  code: string;         // DataMatrix / QR-код маркировки единицы
  gtin?: string;        // GTIN (штрихкод товара)
  serial?: string;      // Серийный номер
  productName?: string; // Название товара если есть в файле
}

export interface MarkingBox {
  sscc: string;         // Код короба SSCC-18
  qty: number;          // Кол-во единиц в коробе
  units: MarkingUnit[]; // Коды каждой единицы
}

export interface MarkingFile {
  boxes: MarkingBox[];
  unboxed: MarkingUnit[]; // Коды без привязки к коробу
  totalUnits: number;
  format: string;
}

// ─── Парсеры форматов ──────────────────────────────────────────────────────

// Формат 1: XML Честного знака (агрегация)
// <aggregation><sscc>12345</sscc><units><unit><cis>код</cis><gtin>...</gtin></unit></units></aggregation>
function parseXmlMarking(text: string): MarkingFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const boxes: MarkingBox[] = [];
  const unboxed: MarkingUnit[] = [];

  // Формат агрегации ЦРПТ
  const aggregations = doc.querySelectorAll("aggregation, Aggregation, пачка, box, Box, package");
  if (aggregations.length > 0) {
    aggregations.forEach((agg) => {
      const sscc =
        agg.querySelector("sscc, SSCC, sscc18")?.textContent?.trim() ?? "";
      const unitEls = agg.querySelectorAll("unit, Unit, cis, CIS, код, code");
      const units: MarkingUnit[] = [];
      unitEls.forEach((u) => {
        const code = u.querySelector("cis, CIS, code, код, dataMatrix")?.textContent?.trim()
          ?? (u.tagName.toLowerCase() === "cis" || u.tagName.toLowerCase() === "code" ? u.textContent?.trim() : "") ?? "";
        if (code) {
          units.push({
            code,
            gtin: u.querySelector("gtin, GTIN")?.textContent?.trim(),
            serial: u.querySelector("serial, serialNumber")?.textContent?.trim(),
          });
        }
      });
      if (sscc || units.length) {
        boxes.push({ sscc, qty: units.length, units });
      }
    });
    if (boxes.length) {
      return { boxes, unboxed, totalUnits: boxes.reduce((s, b) => s + b.qty, 0), format: "XML Агрегация" };
    }
  }

  // Формат плоского XML — просто список кодов
  const allCodes = doc.querySelectorAll("cis, CIS, dataMatrix, DataMatrix, code, код, КМ");
  allCodes.forEach((el) => {
    const code = el.textContent?.trim();
    if (code && code.length > 4) {
      unboxed.push({
        code,
        gtin: el.closest("[gtin]")?.getAttribute("gtin") ?? undefined,
      });
    }
  });

  // Формат Честного знака: <codes><code>...</code></codes>
  if (!unboxed.length) {
    const rows = doc.querySelectorAll("row, Row, Строка, item, Item");
    rows.forEach((row) => {
      const code = row.querySelector("КМ, cis, code, DataMatrix")?.textContent?.trim()
        ?? row.textContent?.trim();
      if (code && code.length > 4) {
        unboxed.push({ code });
      }
    });
  }

  return { boxes, unboxed, totalUnits: unboxed.length, format: "XML Список кодов" };
}

// Формат 2: CSV/TXT со строками
// Может быть: просто коды, или SSCC;код1;код2, или SSCC\tGTIN\tКод
function parseCsvMarking(text: string): MarkingFile {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 4);
  const boxes: MarkingBox[] = [];
  const unboxed: MarkingUnit[] = [];

  // Определяем разделитель
  const first = lines[0];
  const sep = first.includes("\t") ? "\t" : first.includes(";") ? ";" : first.includes(",") ? "," : null;

  if (!sep) {
    // Просто список кодов — по одному на строку
    lines.forEach((l) => {
      const code = l.trim().replace(/^"|"$/g, "");
      if (code) unboxed.push({ code });
    });
    return { boxes, unboxed, totalUnits: unboxed.length, format: "TXT Список кодов" };
  }

  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const hasHeader = headers.some((h) =>
    ["sscc", "код", "gtin", "cis", "code", "серийн", "datamatrix"].some((k) => h.includes(k))
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const ssccIdx = hasHeader ? headers.findIndex((h) => h.includes("sscc")) : -1;
  const codeIdx = hasHeader
    ? headers.findIndex((h) =>
        ["cis", "код", "datamatrix", "code", "км"].some((k) => h.includes(k))
      )
    : 0;
  const gtinIdx = hasHeader ? headers.findIndex((h) => h.includes("gtin")) : -1;
  const serialIdx = hasHeader ? headers.findIndex((h) => h.includes("серийн") || h.includes("serial")) : -1;

  // Группируем по SSCC если есть
  const boxMap: Record<string, MarkingUnit[]> = {};

  dataLines.forEach((line) => {
    const cols = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
    const code = codeIdx >= 0 ? cols[codeIdx] : cols[0];
    if (!code || code.length < 4) return;

    const unit: MarkingUnit = {
      code,
      gtin: gtinIdx >= 0 ? cols[gtinIdx] : undefined,
      serial: serialIdx >= 0 ? cols[serialIdx] : undefined,
    };

    const sscc = ssccIdx >= 0 ? cols[ssccIdx] : "";
    if (sscc && sscc.length >= 8) {
      if (!boxMap[sscc]) boxMap[sscc] = [];
      boxMap[sscc].push(unit);
    } else {
      unboxed.push(unit);
    }
  });

  Object.entries(boxMap).forEach(([sscc, units]) => {
    boxes.push({ sscc, qty: units.length, units });
  });

  return {
    boxes,
    unboxed,
    totalUnits: boxes.reduce((s, b) => s + b.qty, 0) + unboxed.length,
    format: hasHeader ? "CSV с заголовками" : "CSV Список",
  };
}

// Формат 3: Excel
function parseExcelMarking(buffer: ArrayBuffer): MarkingFile {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (!data.length) return { boxes: [], unboxed: [], totalUnits: 0, format: "Excel пустой" };

  const text = data.map((row) => Object.values(row).join(";")).join("\n");
  const headers = Object.keys(data[0]).join(";");
  return parseCsvMarking(headers + "\n" + text);
}

// ─── Функция сопоставления маркировки с накладной ──────────────────────────

export function applyMarkingToRows(rows: InvoiceRow[], marking: MarkingFile): InvoiceRow[] {
  const allCodes = [
    ...marking.unboxed.map((u) => u.code),
    ...marking.boxes.flatMap((b) => b.units.map((u) => u.code)),
  ];

  // Распределяем коды последовательно по позициям накладной
  let offset = 0;
  return rows.map((row) => {
    const chunk = allCodes.slice(offset, offset + row.qty);
    offset += row.qty;
    return { ...row, marking: chunk };
  });
}

// ─── Компонент ──────────────────────────────────────────────────────────────

interface MarkingImportProps {
  rows: InvoiceRow[];
  onApplied: (rows: InvoiceRow[]) => void;
  onClose: () => void;
}

export default function MarkingImport({ rows, onApplied, onClose }: MarkingImportProps) {
  const [marking, setMarking] = useState<MarkingFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  const handleFile = useCallback((file: File) => {
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = parseExcelMarking(e.target!.result as ArrayBuffer);
          setMarking(result);
        } catch {
          setError("Не удалось прочитать Excel файл");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target!.result as string;
          const result = ext === "xml" ? parseXmlMarking(text) : parseCsvMarking(text);
          if (result.totalUnits === 0) {
            setError("Коды маркировки не найдены. Проверьте формат файла.");
            return;
          }
          setMarking(result);
        } catch {
          setError("Ошибка при разборе файла");
        }
      };
      reader.readAsText(file, "utf-8");
    }
  }, []);

  const handleApply = () => {
    if (!marking) return;
    const updated = applyMarkingToRows(rows, marking);
    onApplied(updated);
    onClose();
  };

  const codesMatch = marking && marking.totalUnits === totalQty;
  const codesShort = marking && marking.totalUnits < totalQty;
  const codesExtra = marking && marking.totalUnits > totalQty;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        {/* Шапка */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3">
            <Icon name="QrCode" size={20} className="text-primary" />
            <div>
              <div className="font-semibold text-foreground">Загрузка файла маркировки</div>
              <div className="text-xs text-muted-foreground">Честный знак / ЦРПТ</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Форматы файлов */}
          <div
            className="rounded-lg p-4 text-xs space-y-2"
            style={{ background: "hsl(var(--muted))", borderLeft: "3px solid hsl(var(--wms-blue))" }}
          >
            <div className="font-medium text-foreground mb-1">Поддерживаемые форматы:</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Icon name="FileCode" size={11} className="text-primary" />
                <span><b className="text-foreground">XML</b> — файл агрегации ЦРПТ (SSCC → коды)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="FileText" size={11} className="text-primary" />
                <span><b className="text-foreground">CSV/TXT</b> — список кодов или с группировкой по SSCC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="FileSpreadsheet" size={11} className="text-primary" />
                <span><b className="text-foreground">Excel</b> — таблица SSCC/GTIN/код DataMatrix</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="List" size={11} className="text-primary" />
                <span><b className="text-foreground">TXT</b> — по одному коду на строку</span>
              </div>
            </div>
            <div className="text-muted-foreground mt-2 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              Иерархия: <span className="text-foreground">SSCC (код короба)</span> →{" "}
              <span className="text-foreground">DataMatrix (каждая единица)</span>. Коды привязываются к позициям накладной по порядку.
            </div>
          </div>

          {/* Drag&Drop */}
          {!marking && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? "hsl(var(--primary))" : "hsl(var(--border))",
                background: dragOver ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
              }}
            >
              <Icon name="QrCode" size={36} className="mx-auto mb-3 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">Перетащите файл маркировки</div>
              <div className="text-xs text-muted-foreground mt-1">XML · CSV · TXT · Excel</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xml,.csv,.txt,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {error && (
            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{ background: "hsl(var(--wms-red) / 0.1)", color: "hsl(var(--wms-red))" }}
            >
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          {/* Результат парсинга */}
          {marking && (
            <div className="space-y-4">
              {/* Статистика */}
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-foreground font-mono">{marking.totalUnits}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Кодов загружено</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: "hsl(var(--wms-blue))" }}>
                    {marking.boxes.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Коробов (SSCC)</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold font-mono text-foreground">{totalQty}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Ожидается по накладной</div>
                </div>
              </div>

              {/* Соответствие количества */}
              <div
                className="rounded-lg p-3 flex items-center gap-3 text-sm"
                style={{
                  background: codesMatch
                    ? "hsl(var(--wms-green) / 0.08)"
                    : "hsl(var(--wms-amber) / 0.08)",
                  borderLeft: `3px solid hsl(var(--${codesMatch ? "wms-green" : "wms-amber"}))`,
                }}
              >
                <Icon
                  name={codesMatch ? "CheckCircle2" : "AlertTriangle"}
                  size={18}
                  style={{ color: `hsl(var(--${codesMatch ? "wms-green" : "wms-amber"}))` }}
                />
                <span>
                  {codesMatch && "Количество кодов совпадает с накладной — всё готово к привязке."}
                  {codesShort && `Кодов меньше чем товаров: ${marking.totalUnits} из ${totalQty}. Часть позиций останется без маркировки.`}
                  {codesExtra && `Кодов больше чем товаров: ${marking.totalUnits} vs ${totalQty}. Лишние коды будут проигнорированы.`}
                </span>
              </div>

              {/* Формат */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="FileCheck" size={13} />
                Распознан формат: <span className="text-foreground font-medium">{marking.format}</span>
              </div>

              {/* Коробки */}
              {marking.boxes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Коробки (SSCC):</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {marking.boxes.map((box, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="Package" size={13} className="text-primary" />
                          <span className="font-mono text-foreground">{box.sscc || "Без SSCC"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{box.qty} ед.</span>
                          <span className="font-mono text-[10px] truncate max-w-[180px]">
                            {box.units[0]?.code?.slice(0, 20)}…
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Несвязанные коды */}
              {marking.unboxed.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Коды без короба: {marking.unboxed.length} шт
                  </div>
                  <div
                    className="rounded-lg p-3 font-mono text-xs max-h-32 overflow-y-auto space-y-1"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    {marking.unboxed.slice(0, 10).map((u, i) => (
                      <div key={i} className="text-muted-foreground truncate">{u.code}</div>
                    ))}
                    {marking.unboxed.length > 10 && (
                      <div className="text-muted-foreground">… ещё {marking.unboxed.length - 10} кодов</div>
                    )}
                  </div>
                </div>
              )}

              {/* Кнопка загрузить другой файл */}
              <button
                onClick={() => { setMarking(null); setError(""); fileRef.current?.click(); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Загрузить другой файл
              </button>
            </div>
          )}
        </div>

        {/* Футер */}
        <div
          className="flex justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            disabled={!marking || marking.totalUnits === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
          >
            <Icon name="QrCode" size={16} />
            Привязать {marking?.totalUnits ?? 0} кодов
          </button>
        </div>
      </div>
    </div>
  );
}
