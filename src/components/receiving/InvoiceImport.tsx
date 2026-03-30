import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";

// ─── Типы ──────────────────────────────────────────────────────────────────

export interface InvoiceRow {
  name: string;
  supplierArticle: string;
  manufacturerArticle: string;
  brand: string;
  qty: number;
  unit: string;
  costPrice: number;
  costTotal: number;
  salePrice: number;
  photo: string;
  oem: string;
  marking: string[];
  // служебные
  _costWarning?: boolean;
  _candleAlert?: boolean;
  _candleQty?: number;
}

type FieldKey = keyof Omit<InvoiceRow, "_costWarning" | "_candleAlert" | "_candleQty">;

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Наименование", required: true },
  { key: "supplierArticle", label: "Артикул поставщика" },
  { key: "manufacturerArticle", label: "Артикул изготовителя" },
  { key: "brand", label: "Бренд" },
  { key: "qty", label: "Количество", required: true },
  { key: "unit", label: "Единица измерения" },
  { key: "costPrice", label: "Себестоимость (за ед.)" },
  { key: "costTotal", label: "Сумма себестоимости" },
  { key: "salePrice", label: "Цена продажная" },
  { key: "photo", label: "Фото товара" },
  { key: "oem", label: "OEM" },
  { key: "marking", label: "Маркировка (DataMatrix)" },
];

// Ключевые слова для автораспознавания
const FIELD_HINTS: Record<FieldKey, string[]> = {
  name: ["наименование", "название", "товар", "продукт", "name", "description", "номенклатура", "позиция"],
  supplierArticle: ["артикул поставщика", "арт поставщика", "supplier art", "артикул пост"],
  manufacturerArticle: ["артикул изготовителя", "артикул производителя", "manufacturer art", "арт произв", "арт изг"],
  brand: ["бренд", "производитель", "brand", "manufacturer", "торговая марка"],
  qty: ["количество", "кол-во", "кол.", "qty", "count", "шт", "единиц"],
  unit: ["единица", "ед.изм", "ед.", "unit", "мера"],
  costPrice: ["себестоимость", "цена закупки", "закупочная цена", "cost", "закупка", "цена прихода"],
  costTotal: ["сумма себестоимости", "сумма закупки", "итого закупка", "total cost", "сумма прихода"],
  salePrice: ["цена продажная", "цена продажи", "розничная цена", "sale price", "продажа", "розница"],
  photo: ["фото", "изображение", "image", "photo", "картинка"],
  oem: ["oem", "oeм", "ое м", "аналог", "cross"],
  marking: ["маркировка", "datamatrix", "датаматрикс", "кз", "честный знак", "marking"],
};

interface SupplierTemplate {
  supplier: string;
  mapping: Record<string, FieldKey | null>;
}

const CANDLE_KEYWORDS = ["свеч", "candle", "spark plug", "свечи", "свеча"];

function isCandleItem(name: string): boolean {
  const lower = name.toLowerCase();
  return CANDLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function autoDetectMapping(headers: string[]): Record<string, FieldKey | null> {
  const mapping: Record<string, FieldKey | null> = {};
  const used = new Set<FieldKey>();

  for (const header of headers) {
    const hl = header.toLowerCase().trim();
    let matched: FieldKey | null = null;

    for (const [fieldKey, hints] of Object.entries(FIELD_HINTS) as [FieldKey, string[]][]) {
      if (used.has(fieldKey)) continue;
      if (hints.some((hint) => hl.includes(hint) || hint.includes(hl))) {
        matched = fieldKey;
        used.add(fieldKey);
        break;
      }
    }
    mapping[header] = matched;
  }
  return mapping;
}

function parseRows(
  rawRows: Record<string, unknown>[],
  mapping: Record<string, FieldKey | null>
): InvoiceRow[] {
  return rawRows
    .map((raw): InvoiceRow | null => {
      const row: Partial<InvoiceRow> = {
        name: "",
        supplierArticle: "",
        manufacturerArticle: "",
        brand: "",
        qty: 0,
        unit: "шт",
        costPrice: 0,
        costTotal: 0,
        salePrice: 0,
        photo: "",
        oem: "",
        marking: [],
      };

      for (const [col, fieldKey] of Object.entries(mapping)) {
        if (!fieldKey || raw[col] === undefined || raw[col] === null) continue;
        const val = String(raw[col]).trim();
        if (fieldKey === "qty" || fieldKey === "costPrice" || fieldKey === "costTotal" || fieldKey === "salePrice") {
          (row as Record<FieldKey, unknown>)[fieldKey] = parseFloat(val.replace(/\s/g, "").replace(",", ".")) || 0;
        } else if (fieldKey === "marking") {
          row.marking = val.split(/[;\n,]/).map((s) => s.trim()).filter(Boolean);
        } else {
          (row as Record<FieldKey, unknown>)[fieldKey] = val;
        }
      }

      if (!row.name) return null;
      return row as InvoiceRow;
    })
    .filter(Boolean) as InvoiceRow[];
}

function applyValidation(rows: InvoiceRow[]): InvoiceRow[] {
  return rows.map((row) => {
    const r = { ...row };

    // Проверка расхождения себестоимости >3%
    if (r.costTotal > 0 && r.qty > 0 && r.costPrice > 0) {
      const calcCost = r.costTotal / r.qty;
      const diff = Math.abs(calcCost - r.costPrice) / r.costPrice;
      if (diff > 0.03) {
        r._costWarning = true;
      }
    } else if (r.costTotal > 0 && r.qty > 0 && r.costPrice === 0) {
      r.costPrice = r.costTotal / r.qty;
    }

    // Правило свечей
    if (isCandleItem(r.name)) {
      r._candleAlert = true;
      r._candleQty = r.qty;
    }

    return r;
  });
}

// ─── Диалог расхождения себестоимости ──────────────────────────────────────

interface CostWarningDialogProps {
  row: InvoiceRow;
  onResolve: (useDivided: boolean) => void;
}

function CostWarningDialog({ row, onResolve }: CostWarningDialogProps) {
  const calcCost = row.qty > 0 ? row.costTotal / row.qty : 0;
  const diff = row.costPrice > 0 ? ((calcCost - row.costPrice) / row.costPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-[480px] rounded-xl border p-6 shadow-2xl"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--wms-amber) / 0.4)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--wms-amber) / 0.15)" }}
          >
            <Icon name="AlertTriangle" size={20} style={{ color: "hsl(var(--wms-amber))" }} />
          </div>
          <div>
            <div className="font-semibold text-foreground">Расхождение себестоимости</div>
            <div className="text-sm text-muted-foreground mt-0.5">{row.name}</div>
          </div>
        </div>

        <div
          className="rounded-lg p-4 mb-5 text-sm space-y-2"
          style={{ background: "hsl(var(--wms-amber) / 0.07)" }}
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Себестоимость в накладной:</span>
            <span className="font-mono font-semibold text-foreground">{row.costPrice.toFixed(2)} ₽</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Сумма ÷ количество ({row.costTotal} ÷ {row.qty}):</span>
            <span className="font-mono font-semibold text-foreground">{calcCost.toFixed(2)} ₽</span>
          </div>
          <div
            className="flex justify-between pt-2 border-t"
            style={{ borderColor: "hsl(var(--wms-amber) / 0.2)" }}
          >
            <span className="text-muted-foreground">Отклонение:</span>
            <span className="font-mono font-bold" style={{ color: "hsl(var(--wms-amber))" }}>
              {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">Как рассчитать себестоимость?</div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolve(true)}
            className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:border-primary"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
          >
            <Icon name="Divide" size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Сумма ÷ количество</span>
            <span className="text-xs text-muted-foreground">{calcCost.toFixed(2)} ₽</span>
          </button>
          <button
            onClick={() => onResolve(false)}
            className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:border-primary"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
          >
            <Icon name="FileText" size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Оставить из накладной</span>
            <span className="text-xs text-muted-foreground">{row.costPrice.toFixed(2)} ₽</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Диалог комплектации свечей ─────────────────────────────────────────────

interface CandleDialogProps {
  row: InvoiceRow;
  onResolve: (makeKit: boolean) => void;
}

function CandleDialog({ row, onResolve }: CandleDialogProps) {
  const kits = Math.floor((row._candleQty ?? row.qty) / 4);
  const remainder = (row._candleQty ?? row.qty) % 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-[460px] rounded-xl border p-6 shadow-2xl"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--wms-blue) / 0.4)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: "hsl(var(--wms-blue) / 0.12)" }}
          >
            🕯️
          </div>
          <div>
            <div className="font-semibold text-foreground">Правило комплектации свечей</div>
            <div className="text-sm text-muted-foreground mt-0.5">{row.name}</div>
          </div>
        </div>

        <div
          className="rounded-lg p-4 mb-5 text-sm space-y-2"
          style={{ background: "hsl(var(--wms-blue) / 0.07)" }}
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Поступило поштучно:</span>
            <span className="font-mono font-semibold text-foreground">{row._candleQty ?? row.qty} шт</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Можно собрать комплектов по 4 шт:</span>
            <span className="font-mono font-semibold" style={{ color: "hsl(var(--wms-green))" }}>{kits} компл.</span>
          </div>
          {remainder > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Остаток (поштучно):</span>
              <span className="font-mono text-foreground">{remainder} шт</span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground mb-4">Собрать комплекты из 4 свечей?</div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolve(true)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            Собрать {kits} компл.{remainder > 0 ? ` + ${remainder} шт` : ""}
          </button>
          <button
            onClick={() => onResolve(false)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Оставить поштучно
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Основной компонент ─────────────────────────────────────────────────────

interface InvoiceImportProps {
  supplierName?: string;
  onImport: (rows: InvoiceRow[]) => void;
  onClose: () => void;
}

const TEMPLATES_KEY = "wms_supplier_templates";

function loadTemplates(): SupplierTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveTemplates(templates: SupplierTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export default function InvoiceImport({ supplierName = "", onImport, onClose }: InvoiceImportProps) {
  const [step, setStep] = useState<"input" | "mapping" | "preview">("input");
  const [rawText, setRawText] = useState("");
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
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Применяем шаблон поставщика если есть
  const applyTemplate = useCallback(
    (hdrs: string[], rows2: Record<string, unknown>[]) => {
      const tpl = templates.find((t) => t.supplier === supplierName);
      const detected = tpl ? tpl.mapping : autoDetectMapping(hdrs);
      setHeaders(hdrs);
      setRawRows(rows2);
      setMapping(detected as Record<string, FieldKey | null>);
      setStep("mapping");
    },
    [templates, supplierName]
  );

  // Парсинг Excel
  const parseExcel = useCallback(
    (buffer: ArrayBuffer) => {
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (!data.length) return;
      applyTemplate(Object.keys(data[0]), data);
    },
    [applyTemplate]
  );

  // Парсинг XML
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

  // Парсинг TSV/CSV из буфера
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

  const handlePasteText = () => {
    if (rawText.trim()) parseText(rawText);
  };

  // Переход к preview после маппинга
  const handleConfirmMapping = () => {
    const parsed = applyValidation(parseRows(rawRows, mapping));
    setRows(parsed);

    // Собираем очереди предупреждений
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
      // Теперь свечи
      if (candleQueue.length || rows.some((r, i) => r._candleAlert)) {
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

  const handleSaveTemplate = () => {
    if (!saveTemplateName.trim()) return;
    const tpl: SupplierTemplate = { supplier: saveTemplateName.trim(), mapping };
    const existing = templates.filter((t) => t.supplier !== saveTemplateName.trim());
    const updated = [...existing, tpl];
    setTemplates(updated);
    saveTemplates(updated);
    setShowSaveTemplate(false);
  };

  const handleImport = () => {
    onImport(rows);
    onClose();
  };

  // ── Рендер шагов ──────────────────────────────────────────────────────────

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
              {/* Шаги */}
              <div className="flex items-center gap-2 text-xs">
                {["input", "mapping", "preview"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: step === s
                          ? "hsl(var(--primary))"
                          : ["input", "mapping", "preview"].indexOf(step) > i
                          ? "hsl(var(--wms-green))"
                          : "hsl(var(--muted))",
                        color: step === s || ["input", "mapping", "preview"].indexOf(step) > i ? "#fff" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {["input", "mapping", "preview"].indexOf(step) > i ? "✓" : i + 1}
                    </div>
                    <span
                      style={{
                        color: step === s ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {["Загрузка", "Столбцы", "Проверка"][i]}
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

          {/* ШАГ 1: Загрузка */}
          {step === "input" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Drag&Drop */}
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
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragOver ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: dragOver ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
                }}
              >
                <Icon name="Upload" size={32} className="mx-auto mb-3 text-muted-foreground" />
                <div className="text-sm font-medium text-foreground">Перетащите файл или нажмите для выбора</div>
                <div className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) · XML · CSV · TSV</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.xml,.csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>

              {/* Шаблоны поставщиков */}
              {templates.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Сохранённые шаблоны:</div>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t) => (
                      <div
                        key={t.supplier}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
                      >
                        <Icon name="Building2" size={13} className="text-primary" />
                        <span className="text-foreground">{t.supplier}</span>
                        <button
                          onClick={() => {
                            const updated = templates.filter((x) => x.supplier !== t.supplier);
                            setTemplates(updated);
                            saveTemplates(updated);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Вставка из буфера */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Или вставьте данные из буфера обмена:</div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={"Скопируйте таблицу из Excel/1С и вставьте сюда (Ctrl+V)\nПервая строка — заголовки столбцов"}
                  rows={6}
                  className="w-full rounded-lg border text-sm px-3 py-2 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{
                    background: "hsl(var(--muted))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePasteText}
                    disabled={!rawText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ background: "hsl(var(--primary))", color: "#fff" }}
                  >
                    <Icon name="ArrowRight" size={15} />
                    Распознать
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ШАГ 2: Маппинг столбцов */}
          {step === "mapping" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Распознано <span className="text-foreground font-medium">{rawRows.length}</span> строк,{" "}
                  <span className="text-foreground font-medium">{headers.length}</span> столбцов.
                  Проверьте соответствие:
                </div>
                <button
                  onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="Save" size={13} />
                  Сохранить шаблон
                </button>
              </div>

              {showSaveTemplate && (
                <div
                  className="flex gap-2 p-3 rounded-lg border"
                  style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
                >
                  <input
                    value={saveTemplateName}
                    onChange={(e) => setSaveTemplateName(e.target.value)}
                    placeholder="Название поставщика..."
                    className="flex-1 bg-background border border-border rounded-md text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-1.5 rounded-md text-sm font-medium"
                    style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                  >
                    Сохранить
                  </button>
                </div>
              )}

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted))" }}>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Столбец в файле</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Пример данных</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Поле накладной</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header) => (
                      <tr
                        key={header}
                        className="border-t"
                        style={{ borderColor: "hsl(var(--border))" }}
                      >
                        <td className="px-4 py-2 font-mono text-xs text-foreground">{header}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                          {String(rawRows[0]?.[header] ?? "—")}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={mapping[header] ?? ""}
                            onChange={(e) =>
                              setMapping((m) => ({
                                ...m,
                                [header]: (e.target.value as FieldKey) || null,
                              }))
                            }
                            className="w-full rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                            style={{
                              background: "hsl(var(--background))",
                              borderColor: mapping[header] ? "hsl(var(--wms-green) / 0.5)" : "hsl(var(--border))",
                              color: "hsl(var(--foreground))",
                            }}
                          >
                            <option value="">— не использовать —</option>
                            {FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}{f.required ? " *" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep("input")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" size={15} />
                  Назад
                </button>
                <button
                  onClick={handleConfirmMapping}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}
                >
                  Применить
                  <Icon name="ArrowRight" size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ШАГ 3: Предпросмотр */}
          {step === "preview" && (
            <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Готово к импорту: <span className="text-foreground font-medium">{rows.length}</span> позиций
                </div>
                <button
                  onClick={() => setStep("mapping")}
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" size={13} />
                  К маппингу
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                <table className="w-full text-xs">
                  <thead style={{ background: "hsl(var(--muted))" }}>
                    <tr>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Наименование</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Арт. пост.</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Бренд</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Кол-во</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Себест.</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Сумма</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Цена прод.</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t"
                        style={{ borderColor: "hsl(var(--border))" }}
                      >
                        <td className="px-3 py-2 text-foreground">{row.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{row.supplierArticle || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.brand || "—"}</td>
                        <td className="px-3 py-2 text-right text-foreground">{row.qty} {row.unit}</td>
                        <td className="px-3 py-2 text-right font-mono text-foreground">{row.costPrice.toFixed(2)} ₽</td>
                        <td className="px-3 py-2 text-right font-mono text-foreground">{row.costTotal > 0 ? row.costTotal.toFixed(2) : (row.costPrice * row.qty).toFixed(2)} ₽</td>
                        <td className="px-3 py-2 text-right font-mono text-foreground">{row.salePrice > 0 ? `${row.salePrice.toFixed(2)} ₽` : "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {row.marking?.length > 0 && (
                              <span title="Есть маркировка DataMatrix" style={{ color: "hsl(var(--wms-blue))" }}>
                                <Icon name="QrCode" size={13} />
                              </span>
                            )}
                            {row.oem && (
                              <span title="Есть OEM" style={{ color: "hsl(var(--wms-amber))" }}>
                                <Icon name="Link" size={13} />
                              </span>
                            )}
                            {row.unit === "компл." && (
                              <span title="Собран комплект свечей" style={{ color: "hsl(var(--wms-green))" }}>
                                🕯️
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                >
                  <Icon name="CheckCircle" size={16} />
                  Загрузить {rows.length} позиций
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
