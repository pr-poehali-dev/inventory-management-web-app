import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Типы ──────────────────────────────────────────────────────────────────

interface MarkupRule {
  id: string;
  type: "supplier" | "category";
  name: string;
  markup: number; // %
  rounding: number; // руб
  enabled: boolean;
}

interface RoundingRule {
  id: string;
  priceFrom: number;
  priceTo: number | null; // null = без верхней границы
  rounding: number;
}

// ─── Дефолтные данные ──────────────────────────────────────────────────────

const defaultMarkupRules: MarkupRule[] = [
  { id: "1", type: "supplier", name: "ООО Кабельстрой",  markup: 35, rounding: 10,  enabled: true },
  { id: "2", type: "supplier", name: "ИП Электромонтаж", markup: 45, rounding: 10,  enabled: true },
  { id: "3", type: "category", name: "Кабели и провода", markup: 30, rounding: 5,   enabled: true },
  { id: "4", type: "category", name: "Крепёж",           markup: 60, rounding: 5,   enabled: true },
  { id: "5", type: "category", name: "Инструменты",      markup: 50, rounding: 50,  enabled: false },
];

const defaultRoundingRules: RoundingRule[] = [
  { id: "r1", priceFrom: 0,     priceTo: 100,   rounding: 5   },
  { id: "r2", priceFrom: 100,   priceTo: 500,   rounding: 10  },
  { id: "r3", priceFrom: 500,   priceTo: 1000,  rounding: 25  },
  { id: "r4", priceFrom: 1000,  priceTo: 5000,  rounding: 50  },
  { id: "r5", priceFrom: 5000,  priceTo: null,  rounding: 100 },
];

// ─── Вспомогательные ───────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function clampMarkup(v: number) {
  return Math.min(300, Math.max(10, v));
}

const ROUNDING_OPTIONS = [5, 10, 25, 50, 100];

const TAB_ITEMS = [
  { id: "markup", label: "Наценки", icon: "Percent" },
];

// ─── Компонент строки наценки ───────────────────────────────────────────────

function MarkupRow({
  rule,
  onUpdate,
  onDelete,
}: {
  rule: MarkupRule;
  onUpdate: (r: MarkupRule) => void;
  onDelete: (id: string) => void;
}) {
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
          {/* Toggle */}
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

// ─── Компонент строки шкалы округления ─────────────────────────────────────

function RoundingRow({
  rule,
  isLast,
  onUpdate,
  onDelete,
}: {
  rule: RoundingRule;
  isLast: boolean;
  onUpdate: (r: RoundingRule) => void;
  onDelete: (id: string) => void;
}) {
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

// ─── Калькулятор наценки (превью) ──────────────────────────────────────────

function MarkupCalculator({
  markupRules,
  roundingRules,
}: {
  markupRules: MarkupRule[];
  roundingRules: RoundingRule[];
}) {
  const [costPrice, setCostPrice] = useState("1000");
  const [selectedRule, setSelectedRule] = useState(markupRules[0]?.id ?? "");

  const rule = markupRules.find((r) => r.id === selectedRule);
  const cost = parseFloat(costPrice) || 0;

  const rawPrice = rule ? cost * (1 + rule.markup / 100) : cost;

  // Найти округление по цене
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
            <span className="text-2xl font-bold font-mono text-primary">{finalPrice.toLocaleString("ru-RU")}</span>
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

// ─── Основная страница настроек ─────────────────────────────────────────────

export default function Settings() {
  const [activeTab] = useState("markup");
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>(defaultMarkupRules);
  const [roundingRules, setRoundingRules] = useState<RoundingRule[]>(defaultRoundingRules);
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
    setMarkupRules((prev) => [
      ...prev,
      { ...newMarkup, id: uid(), markup: clampMarkup(newMarkup.markup) },
    ]);
    setNewMarkup({ type: "supplier", name: "", markup: 30, rounding: 10, enabled: true });
    setAddingMarkup(false);
  };

  const addRoundingRule = () => {
    const last = roundingRules[roundingRules.length - 1];
    const from = last?.priceTo ?? (last?.priceFrom ?? 0) + 1000;
    setRoundingRules((prev) => [
      ...prev,
      { id: uid(), priceFrom: from, priceTo: null, rounding: 100 },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Вкладки */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.id ? "hsl(var(--card))" : "transparent",
              color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}
          >
            <Icon name={tab.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Вкладка Наценки ───────────────────────────────────────────── */}
      {activeTab === "markup" && (
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
                      onUpdate={(r) => setMarkupRules((prev) => prev.map((x) => x.id === r.id ? r : x))}
                      onDelete={(id) => setMarkupRules((prev) => prev.filter((x) => x.id !== id))}
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
                      onUpdate={(r) => setRoundingRules((prev) => prev.map((x) => x.id === r.id ? r : x))}
                      onDelete={(id) => setRoundingRules((prev) => prev.filter((x) => x.id !== id))}
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
      )}
    </div>
  );
}
