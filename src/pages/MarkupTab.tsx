import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MarkupRule, RoundingRule, ROUNDING_OPTIONS, clampMarkup, uid } from "./settingsTypes";
import { MarkupRow } from "./MarkupRuleRow";
import { RoundingRow } from "./RoundingRuleRow";
import { MarkupCalculator } from "./MarkupCalculator";

interface MarkupTabProps {
  markupRules: MarkupRule[];
  roundingRules: RoundingRule[];
  onMarkupUpdate: (rules: MarkupRule[]) => void;
  onRoundingUpdate: (rules: RoundingRule[]) => void;
}

export function MarkupTab({
  markupRules,
  roundingRules,
  onMarkupUpdate,
  onRoundingUpdate,
}: MarkupTabProps) {
  const [addingMarkup, setAddingMarkup] = useState(false);
  const [newMarkup, setNewMarkup] = useState<Omit<MarkupRule, "id">>({
    type: "supplier",
    name: "",
    markup: 30,
    rounding: 10,
    enabled: true,
  });
  const [filterType, setFilterType] = useState<"all" | "supplier" | "category">("all");

  const filteredMarkup = markupRules.filter(
    (r) => filterType === "all" || r.type === filterType
  );

  const addMarkupRule = () => {
    if (!newMarkup.name.trim()) return;
    onMarkupUpdate([
      ...markupRules,
      { ...newMarkup, id: uid(), markup: clampMarkup(newMarkup.markup) },
    ]);
    setNewMarkup({ type: "supplier", name: "", markup: 30, rounding: 10, enabled: true });
    setAddingMarkup(false);
  };

  const addRoundingRule = () => {
    const last = roundingRules[roundingRules.length - 1];
    const from = last?.priceTo ?? (last?.priceFrom ?? 0) + 1000;
    onRoundingUpdate([
      ...roundingRules,
      { id: uid(), priceFrom: from, priceTo: null, rounding: 100 },
    ]);
  };

  return (
    <div className="space-y-6">

      {/* Калькулятор */}
      <MarkupCalculator markupRules={markupRules} roundingRules={roundingRules} />

      {/* Правила наценки */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title">Правила наценки</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              По поставщику или категории товара · от 10% до 300%
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Фильтр */}
            <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
              {(["all", "supplier", "category"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="px-3 py-1.5 text-xs transition-colors"
                  style={{
                    background: filterType === t ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    color: filterType === t ? "#fff" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {{ all: "Все", supplier: "Поставщики", category: "Категории" }[t]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAddingMarkup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="Plus" size={13} />
              Добавить
            </button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "hsl(var(--muted))" }}>
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-32">Тип</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Название</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-40">Наценка</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-28">Округление</th>
                <th className="px-4 py-2.5 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {/* Форма добавления */}
              {addingMarkup && (
                <tr style={{ background: "hsl(var(--wms-green) / 0.04)" }}>
                  <td className="px-4 py-2">
                    <select
                      value={newMarkup.type}
                      onChange={(e) => setNewMarkup((d) => ({ ...d, type: e.target.value as MarkupRule["type"] }))}
                      className="rounded-md border text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                    >
                      <option value="supplier">Поставщик</option>
                      <option value="category">Категория</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      autoFocus
                      value={newMarkup.name}
                      onChange={(e) => setNewMarkup((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Введите название..."
                      className="w-full rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                      onKeyDown={(e) => e.key === "Enter" && addMarkupRule()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={newMarkup.markup}
                        onChange={(e) => setNewMarkup((d) => ({ ...d, markup: Number(e.target.value) }))}
                        className="w-20 rounded-md border text-sm px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={newMarkup.rounding}
                      onChange={(e) => setNewMarkup((d) => ({ ...d, rounding: Number(e.target.value) }))}
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
                        onClick={addMarkupRule}
                        disabled={!newMarkup.name.trim()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium disabled:opacity-40"
                        style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                      >
                        <Icon name="Check" size={12} />
                        Добавить
                      </button>
                      <button
                        onClick={() => setAddingMarkup(false)}
                        className="px-2.5 py-1 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredMarkup.map((rule) => (
                <MarkupRow
                  key={rule.id}
                  rule={rule}
                  onUpdate={(r) => onMarkupUpdate(markupRules.map((x) => x.id === r.id ? r : x))}
                  onDelete={(id) => onMarkupUpdate(markupRules.filter((x) => x.id !== id))}
                />
              ))}

              {filteredMarkup.length === 0 && !addingMarkup && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Нет правил. Нажмите «Добавить».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Шкала округления */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title">Шкала округления по цене</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Чем выше цена — тем крупнее шаг округления
            </div>
          </div>
          <button
            onClick={addRoundingRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            <Icon name="Plus" size={13} />
            Добавить диапазон
          </button>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "hsl(var(--muted))" }}>
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Диапазон цены</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-48">Шаг округления</th>
                <th className="px-4 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {roundingRules.map((rule, i) => (
                <RoundingRow
                  key={rule.id}
                  rule={rule}
                  isLast={i === roundingRules.length - 1}
                  onUpdate={(r) => onRoundingUpdate(roundingRules.map((x) => x.id === r.id ? r : x))}
                  onDelete={(id) => onRoundingUpdate(roundingRules.filter((x) => x.id !== id))}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Визуальная шкала */}
        <div className="mt-4 flex items-end gap-1">
          {roundingRules.map((r, i) => (
            <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-muted-foreground">{r.rounding}₽</span>
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${Math.round((r.rounding / 100) * 48) + 8}px`,
                  background: `hsl(var(--wms-amber) / ${0.3 + i * 0.15})`,
                }}
              />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {r.priceFrom.toLocaleString("ru-RU")}+
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
