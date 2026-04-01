import Icon from "@/components/ui/icon";
import { ENRICH_FIELDS, MatchKey } from "./enrichmentTypes";

interface EnrichmentStepMappingProps {
  headers: string[];
  rawRows: Record<string, unknown>[];
  matchCol: string;
  matchField: MatchKey;
  colMapping: Record<string, string | null>;
  onMatchColChange: (col: string) => void;
  onMatchFieldChange: (field: MatchKey) => void;
  onColMappingChange: (header: string, value: string | null) => void;
  onBack: () => void;
  onApply: () => void;
}

export function EnrichmentStepMapping({
  headers,
  rawRows,
  matchCol,
  matchField,
  colMapping,
  onMatchColChange,
  onMatchFieldChange,
  onColMappingChange,
  onBack,
  onApply,
}: EnrichmentStepMappingProps) {
  return (
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
            onChange={(e) => onMatchColChange(e.target.value)}
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
            onChange={(e) => onMatchFieldChange(e.target.value as MatchKey)}
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
            {headers.map((h, idx) => (
              <tr key={idx} className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <td className="px-4 py-2 font-mono text-xs text-foreground">{h}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[160px]">
                  {String(rawRows[0]?.[h] ?? "—")}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={colMapping[h] ?? ""}
                    onChange={(e) => onColMappingChange(h, e.target.value || null)}
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
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={15} />
          Назад
        </button>
        <button
          onClick={onApply}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "hsl(var(--primary))", color: "#fff" }}
        >
          Применить
          <Icon name="ArrowRight" size={15} />
        </button>
      </div>
    </div>
  );
}