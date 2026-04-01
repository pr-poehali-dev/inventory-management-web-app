import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./invoiceImportTypes";

// ─── Вспомогательный компонент ячейки с diff ───────────────────────────────

export function EnrichCell({ original, updated }: { original: string; updated: string }) {
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

// ─── Шаг 3: Предпросмотр результата ────────────────────────────────────────

interface EnrichmentStepPreviewProps {
  enrichedRows: InvoiceRow[];
  originalRows: InvoiceRow[];
  matchStats: { matched: number; total: number } | null;
  onBack: () => void;
  onConfirm: () => void;
}

export function EnrichmentStepPreview({
  enrichedRows,
  originalRows,
  matchStats,
  onBack,
  onConfirm,
}: EnrichmentStepPreviewProps) {
  return (
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
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Штрихкоды</th>
            </tr>
          </thead>
          <tbody>
            {enrichedRows.map((row, i) => {
              const original = originalRows[i];
              const markingChanged =
                (row.marking?.length ?? 0) !== (original.marking?.length ?? 0) ||
                row.marking?.some((m, mi) => m !== original.marking?.[mi]);
              const changed =
                row.supplierArticle !== original.supplierArticle ||
                row.manufacturerArticle !== original.manufacturerArticle ||
                row.brand !== original.brand ||
                row.oem !== original.oem ||
                row.salePrice !== original.salePrice ||
                markingChanged;
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
                  <td className="px-3 py-2 font-mono text-xs max-w-[180px]">
                    <EnrichCell
                      original={(original.marking ?? []).join(", ")}
                      updated={(row.marking ?? []).join(", ")}
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
          onClick={onBack}
          className="px-4 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          Назад
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
        >
          <Icon name="CheckCircle" size={16} />
          Применить обогащение
        </button>
      </div>
    </div>
  );
}