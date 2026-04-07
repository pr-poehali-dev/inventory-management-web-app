import { useState } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./invoiceImportTypes";
import {
  MatchKey,
  ENRICH_HINTS,
  MATCH_HINTS,
  autoDetect,
  applyEnrichment,
} from "./enrichmentTypes";
import { EnrichmentStepUpload } from "./EnrichmentStepUpload";
import { EnrichmentStepMapping } from "./EnrichmentStepMapping";
import { EnrichmentStepPreview } from "./EnrichmentStepPreview";

interface EnrichmentImportProps {
  rows: InvoiceRow[];
  onEnriched: (rows: InvoiceRow[]) => void;
  onClose: () => void;
}

// Ключевые слова для поиска строки-заголовка
const HEADER_KEYWORDS = [
  "наименование", "номенклатура", "название", "товар", "артикул",
  "количество", "кол-во", "цена", "сумма", "бренд", "производитель",
  "штрихкод", "barcode", "ean", "gtin", "name", "article",
  "qty", "price", "amount", "код",
];

function findHeaderRow(allRows: unknown[][]): number {
  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(allRows.length, 50); i++) {
    const cells = allRows[i].map(c => String(c ?? "").trim());
    const nonEmpty = cells.filter(c => c.length > 0);
    if (nonEmpty.length === 0) continue;
    // Строка-заголовок: ячейки короткие (не длиннее 50 символов)
    if (!nonEmpty.every(c => c.length <= 50)) continue;
    const rowStr = cells.map(c => c.toLowerCase()).join(" ");
    const score = HEADER_KEYWORDS.filter(kw => rowStr.includes(kw)).length;
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export default function EnrichmentImport({ rows, onEnriched, onClose }: EnrichmentImportProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState("");
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<Record<string, string | null>>({});
  const [matchCol, setMatchCol] = useState<string>("");
  const [matchField, setMatchField] = useState<MatchKey>("name");
  const [enrichedRows, setEnrichedRows] = useState<InvoiceRow[]>([]);
  const [matchStats, setMatchStats] = useState<{ matched: number; total: number } | null>(null);

  // ── Обработка распарсенных данных ─────────────────────────────────────
  function processRaw(data: Record<string, unknown>[]) {
    if (!data.length) { setLoading(false); return; }

    const allHdrs = Object.keys(data[0]);
    const hdrs = allHdrs.filter((h) => h.trim() && !h.startsWith("__EMPTY") && !h.startsWith("Столбец_"));

    // Если после фильтра ничего не осталось — берём всё как есть (заголовки уже нормальные)
    const finalHdrs = hdrs.length > 0 ? hdrs : allHdrs.filter(h => h.trim());

    if (!finalHdrs.length) { setLoading(false); return; }

    const filteredData = data.map((row) => {
      const obj: Record<string, unknown> = {};
      finalHdrs.forEach((h) => { obj[h] = row[h]; });
      return obj;
    });

    const allHints = { ...ENRICH_HINTS, ...MATCH_HINTS };
    const detected = autoDetect(finalHdrs, allHints);

    // Приоритет сопоставления: артикул изготовителя → артикул поставщика → наименование
    const MATCH_PRIORITY: MatchKey[] = ["manufacturerArticle", "supplierArticle", "name"];
    let matchEntry: string | undefined;
    let matchFieldValue: MatchKey = "name";
    for (const priority of MATCH_PRIORITY) {
      const found = finalHdrs.find((h) => detected[h] === priority);
      if (found) {
        matchEntry = found;
        matchFieldValue = priority;
        break;
      }
    }

    setHeaders(finalHdrs);
    setRawRows(filteredData);
    setColMapping(detected);
    setMatchCol(matchEntry ?? finalHdrs[0] ?? "");
    setMatchField(matchFieldValue);
    setLoading(false);
    setStep("mapping");
  }

  // ── Парсинг XLSX/XLS ──────────────────────────────────────────────────
  function parseXlsx(buf: ArrayBuffer) {
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

    const headerRowIdx = findHeaderRow(allRows);

    const hdrsRaw = allRows[headerRowIdx].map((h, i) => {
      const str = String(h ?? "").trim();
      return str || `Столбец_${i + 1}`;
    });

    const data: Record<string, unknown>[] = [];
    for (let i = headerRowIdx + 1; i < allRows.length; i++) {
      const rawRow = allRows[i];
      if (!rawRow.some(c => String(c ?? "").trim() !== "")) continue;
      const obj: Record<string, unknown> = {};
      hdrsRaw.forEach((h, j) => { obj[h] = rawRow[j] ?? ""; });
      data.push(obj);
    }

    processRaw(data);
  }

  // ── Парсинг текстовых форматов (CSV/TSV) ─────────────────────────────
  function parseCsv(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setLoading(false); return; }
    const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
    const hdrs = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map((line) => {
      const vals = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, unknown> = {};
      hdrs.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
    processRaw(data);
  }

  // ── Обработка выбранного файла ────────────────────────────────────────
  function handleFile(file: File) {
    setLoading(true);
    setLoadingFile(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try { parseXlsx(e.target!.result as ArrayBuffer); }
        catch { setLoading(false); }
      };
      reader.onerror = () => setLoading(false);
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try { parseCsv(e.target!.result as string); }
        catch { setLoading(false); }
      };
      reader.onerror = () => setLoading(false);
      reader.readAsText(file, "utf-8");
    }
  }

  // ── Применение обогащения ─────────────────────────────────────────────
  function handleApply() {
    const result = applyEnrichment(rows, rawRows, matchCol, matchField, colMapping);
    setMatchStats({ matched: result.matched, total: result.total });
    setEnrichedRows(result.enrichedRows);
    setStep("preview");
  }

  const STEPS = ["upload", "mapping", "preview"] as const;
  const STEP_LABELS = ["Файл", "Столбцы", "Результат"];
  const currentStepIndex = STEPS.indexOf(step);

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
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        step === s
                          ? "hsl(var(--primary))"
                          : currentStepIndex > i
                          ? "hsl(var(--wms-green))"
                          : "hsl(var(--muted))",
                      color:
                        step === s || currentStepIndex > i
                          ? "#fff"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {currentStepIndex > i ? "✓" : i + 1}
                  </div>
                  <span style={{ color: step === s ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                    {STEP_LABELS[i]}
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

        {/* Индикатор загрузки */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: "hsl(var(--border))", borderTopColor: "hsl(var(--primary))" }}
            />
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">Читаю файл...</div>
              <div className="text-xs text-muted-foreground mt-1 max-w-[260px] truncate">{loadingFile}</div>
            </div>
          </div>
        )}

        {!loading && step === "upload" && (
          <EnrichmentStepUpload onFile={handleFile} />
        )}

        {!loading && step === "mapping" && (
          <EnrichmentStepMapping
            headers={headers}
            rawRows={rawRows}
            matchCol={matchCol}
            matchField={matchField}
            colMapping={colMapping}
            onMatchColChange={setMatchCol}
            onMatchFieldChange={setMatchField}
            onColMappingChange={(header, value) =>
              setColMapping((m) => ({ ...m, [header]: value }))
            }
            onBack={() => setStep("upload")}
            onApply={handleApply}
          />
        )}

        {!loading && step === "preview" && (
          <EnrichmentStepPreview
            enrichedRows={enrichedRows}
            originalRows={rows}
            matchStats={matchStats}
            onBack={() => setStep("mapping")}
            onConfirm={() => { onEnriched(enrichedRows); onClose(); }}
          />
        )}
      </div>
    </div>
  );
}