import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./invoiceImportTypes";

// ─── Диалог расхождения себестоимости ──────────────────────────────────────

interface CostWarningDialogProps {
  row: InvoiceRow;
  onResolve: (useDivided: boolean) => void;
}

export function CostWarningDialog({ row, onResolve }: CostWarningDialogProps) {
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

export function CandleDialog({ row, onResolve }: CandleDialogProps) {
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
