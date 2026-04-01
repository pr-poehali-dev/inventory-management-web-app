import { useState, useCallback } from "react";
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

// ─── Основной компонент-оркестратор ────────────────────────────────────────

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

  // ── Обработка загруженных данных ──────────────────────────────────────
  const processRaw = useCallback((data: Record<string, unknown>[]) => {
    if (!data.length) return;
    const allHdrs = Object.keys(data[0]);

    // Фильтруем пустые/__EMPTY столбцы и столбцы без данных
    const hdrs = allHdrs.filter((h) => {
      const name = h.trim();
      if (!name || name.startsWith("__EMPTY")) return false;
      // Проверяем, есть ли хоть одно непустое значение в этом столбце
      return data.some((row) => {
        const v = row[h];
        return v !== undefined && v !== null && String(v).trim() !== "";
      });
    });

    if (!hdrs.length) return;

    setHeaders(hdrs);
    setRawRows(data);

    const allHints = { ...ENRICH_HINTS, ...MATCH_HINTS };
    const detected = autoDetect(hdrs, allHints);
    setColMapping(detected);

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

  // ── Парсинг файла ─────────────────────────────────────────────────────
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

  // ── Применение обогащения ─────────────────────────────────────────────
  const handleApply = () => {
    const result = applyEnrichment(rows, rawRows, matchCol, matchField, colMapping);
    setMatchStats({ matched: result.matched, total: result.total });
    setEnrichedRows(result.enrichedRows);
    setStep("preview");
  };

  // ── Индикатор шагов ────────────────────────────────────────────────────
  const STEPS = ["upload", "mapping", "preview"] as const;
  const STEP_LABELS = ["Файл", "Столбцы", "Результат"];

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

        {/* Шаги */}
        {step === "upload" && (
          <EnrichmentStepUpload onFile={handleFile} />
        )}

        {step === "mapping" && (
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

        {step === "preview" && (
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