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
  _isDuplicate?: boolean;
  _duplicateKey?: string;
}

export type FieldKey = keyof Omit<InvoiceRow, "_costWarning" | "_candleAlert" | "_candleQty" | "_isDuplicate" | "_duplicateKey">;

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
  name: ["наименование", "название", "товар", "продукт", "name", "description", "номенклатура", "позиция", "товары (работы", "работы, услуги"],
  supplierArticle: ["артикул поставщика", "арт поставщика", "supplier art", "артикул пост", "код"],
  manufacturerArticle: ["артикул изготовителя", "артикул производителя", "manufacturer art", "арт произв", "арт изг", "артикул"],
  brand: ["бренд", "производитель", "brand", "manufacturer", "торговая марка", "изготовитель"],
  qty: ["количество", "кол-во", "кол.", "qty", "count", "шт", "единиц"],
  unit: ["единица", "ед.изм", "ед.", "unit", "мера"],
  costPrice: ["себестоимость", "цена закупки", "закупочная цена", "cost", "закупка", "цена прихода", "цена"],
  costTotal: ["сумма себестоимости", "сумма закупки", "итого закупка", "total cost", "сумма прихода", "сумма"],
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
    let bestMatchLen = 0;

    // Ищем наилучшее совпадение (самое длинное ключевое слово — приоритетнее)
    for (const [fieldKey, hints] of Object.entries(FIELD_HINTS) as [FieldKey, string[]][]) {
      if (used.has(fieldKey)) continue;
      for (const hint of hints) {
        if (hl.includes(hint) || hint.includes(hl)) {
          const matchLen = hint.length;
          if (matchLen > bestMatchLen) {
            bestMatchLen = matchLen;
            matched = fieldKey;
          }
        }
      }
    }

    if (matched) used.add(matched);
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

// ─── Дубли ─────────────────────────────────────────────────────────────────

/** Ключ идентичности: артикул изготовителя → название (нормализованное) */
export function rowDuplicateKey(row: InvoiceRow): string {
  if (row.manufacturerArticle.trim()) return `ma:${row.manufacturerArticle.trim().toLowerCase()}`;
  return `nm:${row.name.trim().toLowerCase()}`;
}

/** Помечает дубли флагом _isDuplicate (первое вхождение — оригинал, остальные — дубли) */
export function markDuplicates(rows: InvoiceRow[]): InvoiceRow[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const key = rowDuplicateKey(row);
    if (seen.has(key)) {
      return { ...row, _isDuplicate: true, _duplicateKey: key };
    }
    seen.set(key, 1);
    return { ...row, _isDuplicate: false, _duplicateKey: key };
  });
}

/** Объединяет дубли: суммирует qty, costTotal, объединяет маркировки, берёт max costPrice/salePrice */
export function mergeDuplicates(rows: InvoiceRow[]): InvoiceRow[] {
  const order: string[] = [];
  const map = new Map<string, InvoiceRow>();

  for (const row of rows) {
    const key = rowDuplicateKey(row);
    if (map.has(key)) {
      const base = map.get(key)!;
      map.set(key, {
        ...base,
        qty: base.qty + row.qty,
        costTotal: base.costTotal + row.costTotal,
        costPrice: Math.max(base.costPrice, row.costPrice),
        salePrice: Math.max(base.salePrice, row.salePrice),
        marking: [...base.marking, ...row.marking.filter((m) => !base.marking.includes(m))],
        _isDuplicate: false,
      });
    } else {
      order.push(key);
      map.set(key, { ...row, _isDuplicate: false });
    }
  }

  return order.map((k) => map.get(k)!);
}

/** Удаляет дубли — оставляет только первое вхождение каждого ключа */
export function removeDuplicates(rows: InvoiceRow[]): InvoiceRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = rowDuplicateKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function applyValidation(rows: InvoiceRow[]): InvoiceRow[] {
  const withDuplicates = markDuplicates(rows);
  return withDuplicates.map((row) => {
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