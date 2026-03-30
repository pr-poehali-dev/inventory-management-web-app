import { useState } from "react";
import Icon from "@/components/ui/icon";
import { RoundingRule, ROUNDING_OPTIONS } from "./settingsTypes";

interface RoundingRowProps {
  rule: RoundingRule;
  isLast: boolean;
  onUpdate: (r: RoundingRule) => void;
  onDelete: (id: string) => void;
}

export function RoundingRow({ rule, isLast, onUpdate, onDelete }: RoundingRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule);

  const save = () => {
    onUpdate(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr style={{ background: "hsl(var(--wms-blue) / 0.04)" }}>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={draft.priceFrom}
              onChange={(e) => setDraft((d) => ({ ...d, priceFrom: Number(e.target.value) }))}
              className="w-24 rounded-md border text-sm px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <span className="text-xs text-muted-foreground">₽ —</span>
            <input
              type="number"
              min={0}
              value={draft.priceTo ?? ""}
              placeholder="∞"
              onChange={(e) => setDraft((d) => ({ ...d, priceTo: e.target.value ? Number(e.target.value) : null }))}
              className="w-24 rounded-md border text-sm px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <span className="text-xs text-muted-foreground">₽</span>
          </div>
        </td>
        <td className="px-4 py-2">
          <select
            value={draft.rounding}
            onChange={(e) => setDraft((d) => ({ ...d, rounding: Number(e.target.value) }))}
            className="rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            {ROUNDING_OPTIONS.map((r) => (
              <option key={r} value={r}>{r} ₽</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={save}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="Check" size={12} />
              Сохранить
            </button>
            <button
              onClick={() => { setDraft(rule); setEditing(false); }}
              className="px-2.5 py-1 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Отмена
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t group" style={{ borderColor: "hsl(var(--border))" }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-foreground">{rule.priceFrom.toLocaleString("ru-RU")} ₽</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-foreground">
            {rule.priceTo != null ? `${rule.priceTo.toLocaleString("ru-RU")} ₽` : "∞"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.round((rule.rounding / 100) * 80)}px`,
              minWidth: 4,
              background: "hsl(var(--wms-amber))",
            }}
          />
          <span className="font-mono text-sm font-semibold text-foreground">{rule.rounding} ₽</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
          >
            <Icon name="Pencil" size={14} />
          </button>
          {!isLast && (
            <button
              onClick={() => onDelete(rule.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
            >
              <Icon name="Trash2" size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
