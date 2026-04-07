import { InvoiceRow } from "./invoiceImportTypes";

// ─── Типы ──────────────────────────────────────────────────────────────────

export type EnrichKey = "name" | "supplierArticle" | "manufacturerArticle" | "brand" | "oem" | "photo" | "salePrice" | "marking";
export type MatchKey = "name" | "supplierArticle" | "manufacturerArticle";

// ─── Константы ─────────────────────────────────────────────────────────────

export const ENRICH_FIELDS: { key: EnrichKey; label: string; icon: string }[] = [
  { key: "name",                 label: "Наименование товара",  icon: "Package" },
  { key: "supplierArticle",      label: "Артикул поставщика",   icon: "Tag" },
  { key: "manufacturerArticle", label: "Артикул изготовителя", icon: "Tag" },
  { key: "brand",                label: "Бренд",                icon: "Building2" },
  { key: "oem",                  label: "OEM / Аналоги",        icon: "Link" },
  { key: "photo",                label: "Фото (URL)",           icon: "Image" },
  { key: "salePrice",            label: "Цена продажная",       icon: "CircleDollarSign" },
  { key: "marking",              label: "Штрихкоды / Маркировка", icon: "Barcode" },
];

export const ENRICH_HINTS: Record<EnrichKey, string[]> = {
  name:                ["наименование", "номенклатура", "название", "товар", "name", "description"],
  supplierArticle:      ["артикул поставщика", "арт пост", "supplier art", "article"],
  manufacturerArticle: ["артикул изготовителя", "арт произв", "manufacturer", "арт изг"],
  brand:               ["бренд", "производитель", "brand"],
  oem:                 ["oem", "аналог", "cross"],
  photo:               ["фото", "image", "photo", "картинка", "url"],
  salePrice:           ["цена продажная", "розница", "sale price", "цена прод"],
  marking:             ["штрихкод", "штрих-код", "barcode", "баркод", "ean", "gtin", "маркировка", "datamatrix", "датаматрикс", "честный знак"],
};

export const MATCH_HINTS: Record<MatchKey, string[]> = {
  name:                ["наименование", "название", "товар", "name", "номенклатура"],
  supplierArticle:     ["артикул поставщика", "арт пост", "supplier art", "article"],
  manufacturerArticle: ["артикул изготовителя", "арт произв", "manufacturer"],
};

// ─── Чистые функции ────────────────────────────────────────────────────────

export function autoDetect(
  headers: string[],
  hints: Record<string, string[]>
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};
  const used = new Set<string>();
  for (const header of headers) {
    const hl = header.toLowerCase().trim();
    let matched: string | null = null;
    for (const [key, kws] of Object.entries(hints)) {
      if (used.has(key)) continue;
      if (kws.some((kw) => hl.includes(kw) || kw.includes(hl))) {
        matched = key;
        used.add(key);
        break;
      }
    }
    mapping[header] = matched;
  }
  return mapping;
}

export interface ApplyEnrichmentResult {
  enrichedRows: InvoiceRow[];
  matched: number;
  total: number;
}

export function applyEnrichment(
  rows: InvoiceRow[],
  rawRows: Record<string, unknown>[],
  matchCol: string,
  matchField: MatchKey,
  colMapping: Record<string, string | null>
): ApplyEnrichmentResult {
  // Строим индекс из файла обогащения
  const enrichIndex: Record<string, Record<string, unknown>> = {};
  for (const raw of rawRows) {
    const keyVal = String(raw[matchCol] ?? "").toLowerCase().trim();
    if (keyVal) enrichIndex[keyVal] = raw;
  }

  let matched = 0;
  const enrichedRows = rows.map((row): InvoiceRow => {
    const lookupVal = String((row as Record<string, unknown>)[matchField] ?? "").toLowerCase().trim();
    const enrichData = enrichIndex[lookupVal];
    if (!enrichData) return { ...row };
    matched++;

    const updated = { ...row };
    for (const [col, fieldKey] of Object.entries(colMapping)) {
      if (!fieldKey || !(fieldKey in ENRICH_HINTS)) continue;
      const key = fieldKey as EnrichKey;
      const val = String(enrichData[col] ?? "").trim();
      if (!val) continue;
      if (key === "salePrice") {
        updated.salePrice = parseFloat(val.replace(/\s/g, "").replace(",", ".")) || updated.salePrice;
      } else if (key === "marking") {
        // Штрихкоды — добавляем к существующим (не дублируя)
        const newCodes = val.split(/[;\n,|]/).map((s) => s.trim()).filter(Boolean);
        const existing = new Set(updated.marking ?? []);
        for (const code of newCodes) existing.add(code);
        updated.marking = [...existing];
      } else {
        (updated as Record<string, unknown>)[key] = val;
      }
    }
    return updated;
  });

  return { enrichedRows, matched, total: rows.length };
}