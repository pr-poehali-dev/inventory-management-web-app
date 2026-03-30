import { useState } from "react";
import { MarkupRule, RoundingRule } from "./settingsTypes";

interface MarkupCalculatorProps {
  markupRules: MarkupRule[];
  roundingRules: RoundingRule[];
}

export function MarkupCalculator({ markupRules, roundingRules }: MarkupCalculatorProps) {
  const [costPrice, setCostPrice] = useState("1000");
  const [selectedRule, setSelectedRule] = useState(markupRules[0]?.id ?? "");

  const rule = markupRules.find((r) => r.id === selectedRule);
  const cost = parseFloat(costPrice) || 0;

  const rawPrice = rule ? cost * (1 + rule.markup / 100) : cost;

  const roundingRule = roundingRules.find(
    (r) => rawPrice >= r.priceFrom && (r.priceTo == null || rawPrice < r.priceTo)
  );
  const roundStep = rule?.rounding ?? roundingRule?.rounding ?? 10;
  const finalPrice = Math.ceil(rawPrice / roundStep) * roundStep;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "hsl(var(--wms-blue) / 0.05)", borderColor: "hsl(var(--wms-blue) / 0.2)" }}
    >
      <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        Калькулятор цены
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Себестоимость</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full rounded-md border text-sm px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <span className="text-xs text-muted-foreground">₽</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Правило</label>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value)}
            className="w-full rounded-md border text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            {markupRules.filter((r) => r.enabled).map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.markup}%)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Итоговая цена</label>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono text-primary">
              {finalPrice.toLocaleString("ru-RU")}
            </span>
            <span className="text-sm text-muted-foreground mb-0.5">₽</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Без округления: {rawPrice.toFixed(2)} ₽ · округление {roundStep} ₽
          </div>
        </div>
      </div>
    </div>
  );
}
