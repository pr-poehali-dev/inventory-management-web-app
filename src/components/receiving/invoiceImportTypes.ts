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

export type FieldKey = keyof Omit<InvoiceRow, "_costWarning" | "_candleAlert" | "_candleQty">;

export const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
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
export const FIELD_HINTS: Record<FieldKey, string[]> = {
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

export interface SupplierTemplate {
  supplier: string;
  mapping: Record<string, FieldKey | null>;
}

// ─── Утилиты шаблонов ──────────────────────────────────────────────────────

const TEMPLATES_KEY = "wms_supplier_templates";

export function loadTemplates(): SupplierTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTemplates(templates: SupplierTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ─── Чистые функции ────────────────────────────────────────────────────────

const CANDLE_KEYWORDS = ["свеч", "candle", "spark plug", "свечи", "свеча"];

export function isCandleItem(name: string): boolean {
  const lower = name.toLowerCase();
  return CANDLE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function autoDetectMapping(headers: string[]): Record<string, FieldKey | null> {
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

export function parseRows(
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

export function applyValidation(rows: InvoiceRow[]): InvoiceRow[] {
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
