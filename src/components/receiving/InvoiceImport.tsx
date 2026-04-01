import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";
import {
  InvoiceRow,
  FieldKey,
  SupplierTemplate,
  autoDetectMapping,
  parseRows,
  applyValidation,
  loadTemplates,
  saveTemplates,
} from "./invoiceImportTypes";
import { CostWarningDialog, CandleDialog } from "./InvoiceImportDialogs";
import { StepInput, StepMapping, StepPreview } from "./InvoiceImportSteps";

export type { InvoiceRow };

// ─── Основной компонент-оркестратор ────────────────────────────────────────

interface InvoiceImportProps {
  supplierName?: string;
  onImport: (rows: InvoiceRow[]) => void;
  onClose: () => void;
}

export default function InvoiceImport({ supplierName = "", onImport, onClose }: InvoiceImportProps) {
  const [step, setStep] = useState<"input" | "mapping" | "preview">("input");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | null>>({});
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [templates, setTemplates] = useState<SupplierTemplate[]>(loadTemplates);
  const [saveTemplateName, setSaveTemplateName] = useState(supplierName);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [costWarningRow, setCostWarningRow] = useState<{ idx: number; row: InvoiceRow } | null>(null);
  const [candleRow, setCandleRow] = useState<{ idx: number; row: InvoiceRow } | null>(null);
  const [warningQueue, setWarningQueue] = useState<number[]>([]);
  const [candleQueue, setCandleQueue] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Нормализация заголовков: убираем пустые/__EMPTY и дубли ──────────
  const normalizeHeaders = useCallback(
    (hdrs: string[], rows2: Record<string, unknown>[]): [string[], Record<string, unknown>[]] => {
      // Переименовываем проблемные заголовки
      const seen = new Map<string, number>();
      const normalized = hdrs.map((h, i) => {
        let name = h.trim();
        // XLSX генерирует __EMPTY, __EMPTY_1 и т.д. для пустых столбцов
        if (!name || name.startsWith("__EMPTY")) {
          name = `Столбец_${i + 1}`;
        }
        // Если имя уже встречалось — добавляем суффикс
        const count = seen.get(name) ?? 0;
        seen.set(name, count + 1);
        return count > 0 ? `${name}_${count}` : name;
      });

      // Если заголовок изменился — переименовываем ключи в строках данных
      const renamedRows = rows2.map((row) => {
        const newRow: Record<string, unknown> = {};
        hdrs.forEach((oldKey, i) => {
          newRow[normalized[i]] = row[oldKey];
        });
        return newRow;
      });

      return [normalized, renamedRows];
    },
    []
  );

  // ── Применяем шаблон поставщика если есть ─────────────────────────────
  const applyTemplate = useCallback(
    (hdrs: string[], rows2: Record<string, unknown>[]) => {
      const [normHdrs, normRows] = normalizeHeaders(hdrs, rows2);
      const tpl = templates.find((t) => t.supplier === supplierName);
      const detected = tpl ? tpl.mapping : autoDetectMapping(normHdrs);
      setHeaders(normHdrs);
      setRawRows(normRows);
      setMapping(detected as Record<string, FieldKey | null>);
      setStep("mapping");
    },
    [templates, supplierName, normalizeHeaders]
  );

  // ── Парсинг Excel ──────────────────────────────────────────────────────
  const parseExcel = useCallback(
    (buffer: ArrayBuffer) => {
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Пробуем найти строку с заголовками таблицы
      // Сначала читаем весь лист как массив массивов
      const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

      // Ключевые слова, которые указывают на строку-заголовок таблицы товаров
      const headerKeywords = [
        "наименование", "название", "товар", "артикул", "количество",
        "кол-во", "цена", "сумма", "бренд", "производитель",
        "name", "description", "article", "qty", "price", "amount",
        "номенклатура", "позиция", "код"
      ];

      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(allRows.length, 50); i++) {
        const row = allRows[i] as unknown[];
        const rowStr = row.map(c => String(c ?? "").toLowerCase()).join(" ");
        const matches = headerKeywords.filter(kw => rowStr.includes(kw));
        if (matches.length >= 2) {
          headerRowIdx = i;
          break;
        }
      }

      let data: Record<string, unknown>[];
      if (headerRowIdx > 0) {
        // Берём заголовки из найденной строки и данные начиная со следующей
        const headers = (allRows[headerRowIdx] as unknown[]).map((h, i) => {
          const str = String(h ?? "").trim();
          return str || `Столбец_${i + 1}`;
        });
        data = [];
        for (let i = headerRowIdx + 1; i < allRows.length; i++) {
          const rawRow = allRows[i] as unknown[];
          // Пропускаем пустые строки и строки-итоги
          const hasContent = rawRow.some(c => String(c ?? "").trim() !== "");
          if (!hasContent) continue;
          const obj: Record<string, unknown> = {};
          headers.forEach((h, j) => { obj[h] = rawRow[j] ?? ""; });
          data.push(obj);
        }
      } else {
        // Стандартный режим — заголовки из первой строки
        data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      }

      if (!data.length) return;
      applyTemplate(Object.keys(data[0]), data);
    },
    [applyTemplate]
  );

  // ── Парсинг XML ────────────────────────────────────────────────────────
  const parseXML = useCallback(
    (text: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const rows2: Record<string, unknown>[] = [];
      const items = doc.querySelectorAll("Row, row, item, Item, Record, record, Строка");
      if (items.length === 0) {
        alert("Не удалось найти строки товаров в XML файле. Проверьте структуру файла.");
        return;
      }
      items.forEach((el) => {
        const obj: Record<string, unknown> = {};
        el.childNodes.forEach((child) => {
          if (child.nodeType === 1) {
            obj[(child as Element).tagName] = child.textContent?.trim() ?? "";
          }
        });
        if (Object.keys(obj).length) rows2.push(obj);
      });
      if (!rows2.length) return;
      applyTemplate(Object.keys(rows2[0]), rows2);
    },
    [applyTemplate]
  );

  // ── Парсинг TSV/CSV из буфера ──────────────────────────────────────────
  const parseText = useCallback(
    (text: string) => {
      const lines = text.trim().split("\n").filter(Boolean);
      if (lines.length < 2) return;
      const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
      const hdrs = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
      const data = lines.slice(1).map((line) => {
        const vals = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, unknown> = {};
        hdrs.forEach((h, i) => (obj[h] = vals[i] ?? ""));
        return obj;
      });
      applyTemplate(hdrs, data);
    },
    [applyTemplate]
  );

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => parseExcel(e.target!.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      } else if (ext === "xml") {
        const reader = new FileReader();
        reader.onload = (e) => parseXML(e.target!.result as string);
        reader.readAsText(file, "utf-8");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => parseText(e.target!.result as string);
        reader.readAsText(file, "utf-8");
      }
    },
    [parseExcel, parseXML, parseText]
  );

  // ── Переход к preview после маппинга ──────────────────────────────────
  const handleConfirmMapping = () => {
    const parsed = applyValidation(parseRows(rawRows, mapping));
    setRows(parsed);

    const cwq: number[] = [];
    const caq: number[] = [];
    parsed.forEach((r, i) => {
      if (r._costWarning) cwq.push(i);
      if (r._candleAlert) caq.push(i);
    });

    if (cwq.length) {
      setWarningQueue(cwq.slice(1));
      setCostWarningRow({ idx: cwq[0], row: parsed[cwq[0]] });
    } else if (caq.length) {
      setCandleQueue(caq.slice(1));
      setCandleRow({ idx: caq[0], row: parsed[caq[0]] });
    } else {
      setStep("preview");
    }
  };

  // ── Обработка диалога расхождения себестоимости ────────────────────────
  const handleCostResolve = (useDivided: boolean) => {
    if (!costWarningRow) return;
    const updated = [...rows];
    if (useDivided && updated[costWarningRow.idx].qty > 0) {
      updated[costWarningRow.idx].costPrice =
        updated[costWarningRow.idx].costTotal / updated[costWarningRow.idx].qty;
    }
    updated[costWarningRow.idx]._costWarning = false;
    setRows(updated);

    if (warningQueue.length) {
      const [next, ...rest] = warningQueue;
      setWarningQueue(rest);
      setCostWarningRow({ idx: next, row: updated[next] });
    } else {
      setCostWarningRow(null);
      if (candleQueue.length || rows.some((r) => r._candleAlert)) {
        const caq = rows.map((r, i) => (r._candleAlert ? i : -1)).filter((i) => i >= 0);
        if (caq.length) {
          setCandleQueue(caq.slice(1));
          setCandleRow({ idx: caq[0], row: updated[caq[0]] });
          return;
        }
      }
      setStep("preview");
    }
  };

  // ── Обработка диалога свечей ───────────────────────────────────────────
  const handleCandleResolve = (makeKit: boolean) => {
    if (!candleRow) return;
    const updated = [...rows];
    if (makeKit) {
      const qty = updated[candleRow.idx]._candleQty ?? updated[candleRow.idx].qty;
      const kits = Math.floor(qty / 4);
      const rem = qty % 4;
      updated[candleRow.idx].qty = kits;
      updated[candleRow.idx].unit = "компл.";
      updated[candleRow.idx]._candleAlert = false;
      if (rem > 0) {
        updated.splice(candleRow.idx + 1, 0, {
          ...updated[candleRow.idx],
          qty: rem,
          unit: "шт",
          _candleAlert: false,
          _candleQty: undefined,
        });
      }
    } else {
      updated[candleRow.idx]._candleAlert = false;
    }
    setRows(updated);

    if (candleQueue.length) {
      const [next, ...rest] = candleQueue;
      setCandleQueue(rest);
      setCandleRow({ idx: next, row: updated[next] });
    } else {
      setCandleRow(null);
      setStep("preview");
    }
  };

  // ── Сохранение шаблона ─────────────────────────────────────────────────
  const handleSaveTemplate = () => {
    if (!saveTemplateName.trim()) return;
    const tpl: SupplierTemplate = { supplier: saveTemplateName.trim(), mapping };
    const existing = templates.filter((t) => t.supplier !== saveTemplateName.trim());
    const updated = [...existing, tpl];
    setTemplates(updated);
    saveTemplates(updated);
    setShowSaveTemplate(false);
  };

  const handleDeleteTemplate = (supplier: string) => {
    const updated = templates.filter((t) => t.supplier !== supplier);
    setTemplates(updated);
    saveTemplates(updated);
  };

  // ── Финальный импорт ───────────────────────────────────────────────────
  const handleImport = () => {
    onImport(rows);
    onClose();
  };

  // ── Индикатор шагов ────────────────────────────────────────────────────
  const STEPS = ["input", "mapping", "preview"] as const;
  const STEP_LABELS = ["Загрузка", "Столбцы", "Проверка"];

  return (
    <>
      {costWarningRow && (
        <CostWarningDialog row={costWarningRow.row} onResolve={handleCostResolve} />
      )}
      {!costWarningRow && candleRow && (
        <CandleDialog row={candleRow.row} onResolve={handleCandleResolve} />
      )}

      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div
          className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          {/* Заголовок */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div className="flex items-center gap-3">
              <Icon name="FileUp" size={20} className="text-primary" />
              <span className="font-semibold text-foreground">Загрузка накладной</span>
              {supplierName && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                >
                  {supplierName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Индикатор шагов */}
              <div className="flex items-center gap-2 text-xs">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          step === s
                            ? "hsl(var(--primary))"
                            : STEPS.indexOf(step) > i
                            ? "hsl(var(--wms-green))"
                            : "hsl(var(--muted))",
                        color:
                          step === s || STEPS.indexOf(step) > i
                            ? "#fff"
                            : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {STEPS.indexOf(step) > i ? "✓" : i + 1}
                    </div>
                    <span
                      style={{
                        color: step === s ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {STEP_LABELS[i]}
                    </span>
                    {i < 2 && <span className="text-muted-foreground mx-1">→</span>}
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>

          {/* Шаги */}
          {step === "input" && (
            <StepInput
              templates={templates}
              onFile={handleFile}
              onPasteText={parseText}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}

          {step === "mapping" && (
            <StepMapping
              headers={headers}
              rawRows={rawRows}
              mapping={mapping}
              saveTemplateName={saveTemplateName}
              showSaveTemplate={showSaveTemplate}
              onMappingChange={(header, value) =>
                setMapping((m) => ({ ...m, [header]: value }))
              }
              onToggleSaveTemplate={() => setShowSaveTemplate((v) => !v)}
              onSaveTemplateName={setSaveTemplateName}
              onSaveTemplate={handleSaveTemplate}
              onBack={() => setStep("input")}
              onConfirm={handleConfirmMapping}
            />
          )}

          {step === "preview" && (
            <StepPreview
              rows={rows}
              onBack={() => setStep("mapping")}
              onImport={handleImport}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
}