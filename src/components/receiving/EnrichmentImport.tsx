import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./InvoiceImport";

// Поля которые можно обогатить из второго файла
type EnrichKey = "supplierArticle" | "manufacturerArticle" | "brand" | "oem" | "photo" | "salePrice";

const ENRICH_FIELDS: { key: EnrichKey; label: string; icon: string }[] = [
  { key: "supplierArticle", label: "Артикул поставщика", icon: "Tag" },
  { key: "manufacturerArticle", label: "Артикул изготовителя", icon: "Tag" },
  { key: "brand", label: "Бренд", icon: "Building2" },
  { key: "oem", label: "OEM / Аналоги", icon: "Link" },
  { key: "photo", label: "Фото (URL)", icon: "Image" },
  { key: "salePrice", label: "Цена продажная", icon: "CircleDollarSign" },
];

const ENRICH_HINTS: Record<EnrichKey, string[]> = {
  supplierArticle: ["артикул поставщика", "арт пост", "supplier art", "article"],
  manufacturerArticle: ["артикул изготовителя", "арт произв", "manufacturer", "арт изг"],
  brand: ["бренд", "производитель", "brand"],
  oem: ["oem", "аналог", "cross"],
  photo: ["фото", "image", "photo", "картинка", "url"],
  salePrice: ["цена продажная", "розница", "sale price", "цена прод"],
};

// Ключевые столбцы для сопоставления строк
type MatchKey = "name" | "supplierArticle" | "manufacturerArticle";
const MATCH_HINTS: Record<MatchKey, string[]> = {
  name: ["наименование", "название", "товар", "name", "номенклатура"],
  supplierArticle: ["артикул поставщика", "арт пост", "supplier art", "article"],
  manufacturerArticle: ["артикул изготовителя", "арт произв", "manufacturer"],
};

function autoDetect(headers: string[], hints: Record<string, string[]>): Record<string, string | null> {
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

interface EnrichmentImportProps {
  rows: InvoiceRow[];
  onEnriched: (rows: InvoiceRow[]) => void;
  onClose: () => void;
}

export default function EnrichmentImport({ rows, onEnriched, onClose }: EnrichmentImportProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<Record<string, string | null>>({});
  const [matchCol, setMatchCol] = useState<string>("");
  const [matchField, setMatchField] = useState<MatchKey>("name");
  const [enrichedRows, setEnrichedRows] = useState<InvoiceRow[]>([]);
  const [matchStats, setMatchStats] = useState<{ matched: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processRaw = useCallback((data: Record<string, unknown>[]) => {
    if (!data.length) return;
    const hdrs = Object.keys(data[0]);
    setHeaders(hdrs);
    setRawRows(data);

    // Автодетект всего
    const allHints = { ...ENRICH_HINTS, ...MATCH_HINTS };
    const detected = autoDetect(hdrs, allHints);
    setColMapping(detected);

    // Выбираем столбец для сопоставления
    const matchEntry = hdrs.find((h) => {
      const v = detected[h];
      return v === "name" || v === "supplierArticle" || v === "manufacturerArticle";
    });
    if (matchEntry) {
      setMatchCol(matchEntry);
      setMatchField((detected[matchEntry] as MatchKey) ?? "name");
    } else {
      setMatchCol(hdrs[0] ?? "");
    }

    setStep("mapping");
  }, []);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target!.result as ArrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        processRaw(data);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target!.result as string;
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
        processRaw(data);
      };
      reader.readAsText(file, "utf-8");
    }
  }, [processRaw]);

  const handleApply = () => {
    // Строим индекс из файла обогащения
    const enrichIndex: Record<string, Record<string, unknown>> = {};
    for (const raw of rawRows) {
      const keyVal = String(raw[matchCol] ?? "").toLowerCase().trim();
      if (keyVal) enrichIndex[keyVal] = raw;
    }

    let matched = 0;
    const result = rows.map((row): InvoiceRow => {
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
        } else {
          (updated as Record<string, unknown>)[key] = val;
        }
      }
      return updated;
    });

    setMatchStats({ matched, total: rows.length });
    setEnrichedRows(result);
    setStep("preview");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        {/* Шапка */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3">
            <Icon name="FilePlus2" size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Обогащение данных накладной</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              {["upload", "mapping", "preview"].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        step === s
                          ? "hsl(var(--primary))"
                          : ["upload", "mapping", "preview"].indexOf(step) > i
                          ? "hsl(var(--wms-green))"
                          : "hsl(var(--muted))",
                      color:
                        step === s || ["upload", "mapping", "preview"].indexOf(step) > i
                          ? "#fff"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {["upload", "mapping", "preview"].indexOf(step) > i ? "✓" : i + 1}
                  </div>
                  <span style={{ color: step === s ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                    {["Файл", "Столбцы", "Результат"][i]}
                  </span>
                  {i < 2 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* ШАГ 1: Загрузка */}
        {step === "upload" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div
              className="rounded-lg p-4 text-sm"
              style={{ background: "hsl(var(--wms-blue) / 0.07)", borderLeft: "3px solid hsl(var(--wms-blue))" }}
            >
              Загрузите файл с дополнительными данными — прайс-лист поставщика, файл с штрихкодами, артикулами и т.д.
              Система сопоставит строки по наименованию или артикулу и добавит недостающие поля.
            </div>

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
              <Icon name="FilePlus2" size={32} className="mx-auto mb-3 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">Перетащите или выберите файл обогащения</div>
              <div className="text-xs text-muted-foreground mt-1">Excel (.xlsx) · CSV · TSV</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Что можно добавить из файла:</div>
              <div className="flex flex-wrap gap-2">
                {ENRICH_FIELDS.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                  >
                    <Icon name={f.icon as Parameters<typeof Icon>[0]["name"]} size={12} />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ШАГ 2: Маппинг */}
        {step === "mapping" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              Найдено <span className="text-foreground font-medium">{rawRows.length}</span> строк.
              Настройте сопоставление столбцов и выберите по какому полю искать совпадения с накладной.
            </div>

            {/* Поле для сопоставления */}
            <div
              className="rounded-lg p-4 border"
              style={{ background: "hsl(var(--wms-blue) / 0.05)", borderColor: "hsl(var(--wms-blue) / 0.2)" }}
            >
              <div className="text-xs font-medium text-foreground mb-2">Сопоставлять по полю:</div>
              <div className="flex gap-3">
                <select
                  value={matchCol}
                  onChange={(e) => setMatchCol(e.target.value)}
                  className="flex-1 rounded-md border text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-muted-foreground self-center text-sm">→ поле накладной:</span>
                <select
                  value={matchField}
                  onChange={(e) => setMatchField(e.target.value as MatchKey)}
                  className="flex-1 rounded-md border text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                >
                  <option value="name">Наименование</option>
                  <option value="supplierArticle">Артикул поставщика</option>
                  <option value="manufacturerArticle">Артикул изготовителя</option>
                </select>
              </div>
            </div>

            {/* Таблица маппинга */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "hsl(var(--muted))" }}>
                  <tr>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Столбец в файле</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Пример</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Добавить как</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h} className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                      <td className="px-4 py-2 font-mono text-xs text-foreground">{h}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[160px]">
                        {String(rawRows[0]?.[h] ?? "—")}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={colMapping[h] ?? ""}
                          onChange={(e) =>
                            setColMapping((m) => ({ ...m, [h]: e.target.value || null }))
                          }
                          className="w-full rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          style={{
                            background: "hsl(var(--background))",
                            borderColor: colMapping[h] ? "hsl(var(--wms-green) / 0.5)" : "hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          <option value="">— не использовать —</option>
                          {ENRICH_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("upload")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="ArrowLeft" size={15} />
                Назад
              </button>
              <button
                onClick={handleApply}
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
            {matchStats && (
              <div
                className="rounded-lg p-4 flex items-center gap-3 text-sm"
                style={{
                  background: matchStats.matched > 0 ? "hsl(var(--wms-green) / 0.08)" : "hsl(var(--wms-amber) / 0.08)",
                  borderLeft: `3px solid hsl(var(--${matchStats.matched > 0 ? "wms-green" : "wms-amber"}))`,
                }}
              >
                <Icon
                  name={matchStats.matched > 0 ? "CheckCircle2" : "AlertTriangle"}
                  size={18}
                  style={{ color: `hsl(var(--${matchStats.matched > 0 ? "wms-green" : "wms-amber"}))` }}
                />
                <span>
                  Найдено совпадений:{" "}
                  <span className="font-semibold text-foreground">{matchStats.matched}</span> из{" "}
                  <span className="font-semibold text-foreground">{matchStats.total}</span> позиций.
                  {matchStats.matched < matchStats.total && (
                    <span className="text-muted-foreground ml-1">
                      Остальные оставлены без изменений.
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
              <table className="w-full text-xs">
                <thead style={{ background: "hsl(var(--muted))" }}>
                  <tr>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Наименование</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Арт. пост.</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Арт. изг.</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Бренд</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">OEM</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Цена прод.</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedRows.map((row, i) => {
                    const original = rows[i];
                    const changed =
                      row.supplierArticle !== original.supplierArticle ||
                      row.manufacturerArticle !== original.manufacturerArticle ||
                      row.brand !== original.brand ||
                      row.oem !== original.oem ||
                      row.salePrice !== original.salePrice;
                    return (
                      <tr
                        key={i}
                        className="border-t"
                        style={{
                          borderColor: "hsl(var(--border))",
                          background: changed ? "hsl(var(--wms-green) / 0.04)" : undefined,
                        }}
                      >
                        <td className="px-3 py-2 text-foreground">
                          {changed && (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5"
                              style={{ background: "hsl(var(--wms-green))" }}
                            />
                          )}
                          {row.name}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          <EnrichCell original={original.supplierArticle} updated={row.supplierArticle} />
                        </td>
                        <td className="px-3 py-2 font-mono">
                          <EnrichCell original={original.manufacturerArticle} updated={row.manufacturerArticle} />
                        </td>
                        <td className="px-3 py-2">
                          <EnrichCell original={original.brand} updated={row.brand} />
                        </td>
                        <td className="px-3 py-2">
                          <EnrichCell original={original.oem} updated={row.oem} />
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <EnrichCell
                            original={original.salePrice > 0 ? `${original.salePrice} ₽` : ""}
                            updated={row.salePrice > 0 ? `${row.salePrice} ₽` : ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStep("mapping")}
                className="px-4 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => { onEnriched(enrichedRows); onClose(); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
              >
                <Icon name="CheckCircle" size={16} />
                Применить обогащение
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EnrichCell({ original, updated }: { original: string; updated: string }) {
  const changed = updated && updated !== original;
  if (!updated && !original) return <span className="text-muted-foreground">—</span>;
  if (changed) {
    return (
      <span style={{ color: "hsl(var(--wms-green))" }} title={original ? `Было: ${original}` : "Добавлено"}>
        {updated}
        {original && <span className="text-muted-foreground line-through ml-1 text-[10px]">{original}</span>}
      </span>
    );
  }
  return <span className="text-muted-foreground">{updated || original || "—"}</span>;
}
