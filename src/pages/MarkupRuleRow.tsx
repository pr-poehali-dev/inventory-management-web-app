import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MarkupRule, ROUNDING_OPTIONS, clampMarkup } from "./settingsTypes";

interface MarkupRowProps {
  rule: MarkupRule;
  onUpdate: (r: MarkupRule) => void;
  onDelete: (id: string) => void;
}

export function MarkupRow({ rule, onUpdate, onDelete }: MarkupRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule);

  const save = () => {
    onUpdate({ ...draft, markup: clampMarkup(draft.markup) });
    setEditing(false);
  };

  const cancel = () => {
    setDraft(rule);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr style={{ background: "hsl(var(--wms-blue) / 0.04)" }}>
        <td className="px-4 py-2">
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as MarkupRule["type"] }))}
            className="rounded-md border text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            <option value="supplier">Поставщик</option>
            <option value="category">Категория</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="w-full rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={300}
              value={draft.markup}
              onChange={(e) => setDraft((d) => ({ ...d, markup: Number(e.target.value) }))}
              className="w-20 rounded-md border text-sm px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <span className="text-xs text-muted-foreground">%</span>
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
              onClick={cancel}
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
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: rule.type === "supplier" ? "hsl(var(--wms-blue) / 0.12)" : "hsl(var(--wms-amber) / 0.12)",
            color: rule.type === "supplier" ? "hsl(var(--wms-blue))" : "hsl(var(--wms-amber))",
          }}
        >
          {rule.type === "supplier" ? "Поставщик" : "Категория"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">{rule.name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.round(((rule.markup - 10) / 290) * 80)}px`,
              minWidth: 8,
              background: "hsl(var(--primary))",
            }}
          />
          <span className="font-mono text-sm font-semibold text-foreground">{rule.markup}%</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{rule.rounding} ₽</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ ...rule, enabled: !rule.enabled })}
            className="relative w-8 h-4 rounded-full transition-colors flex-shrink-0"
            style={{ background: rule.enabled ? "hsl(var(--wms-green))" : "hsl(var(--muted))" }}
          >
            <span
              className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
              style={{ left: rule.enabled ? "17px" : "2px" }}
            />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
          >
            <Icon name="Pencil" size={14} />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
          >
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
