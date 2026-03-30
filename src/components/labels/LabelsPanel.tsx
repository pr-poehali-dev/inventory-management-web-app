import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { LabelData, LabelFields, LabelSize, LabelStyle, PrintItem } from "./types";

const sizeOptions: { id: LabelSize; label: string; sub: string }[] = [
  { id: "large",       label: "Большой 91×62 мм",   sub: "9 шт на листе А4" },
  { id: "small",       label: "Маленький 50×35 мм",  sub: "32 шт на листе А4" },
  { id: "thermo58x40", label: "Термо 58×40 мм",      sub: "термопринтер" },
  { id: "thermo58x30", label: "Термо 58×30 мм",      sub: "термопринтер" },
  { id: "thermo40x25", label: "Термо 40×25 мм",      sub: "термопринтер" },
];

const fieldLabels: { key: keyof LabelFields; label: string; onlyLarge?: boolean }[] = [
  { key: "shopName", label: "Название магазина" },
  { key: "productName", label: "Название товара" },
  { key: "date", label: "Дата" },
  { key: "article", label: "Артикул поставщика" },
  { key: "price", label: "Цена" },
  { key: "barcode", label: "Штрихкод" },
  { key: "bigPrice", label: "Крупная цена" },
];

const fontOptions: { value: string; label: string }[] = [
  { value: "'Barlow Condensed', Arial Narrow, sans-serif", label: "Barlow Condensed" },
  { value: "'Oswald', Arial Narrow, sans-serif", label: "Oswald" },
  { value: "'Anton', Impact, sans-serif", label: "Anton" },
  { value: "'Black Han Sans', sans-serif", label: "Black Han Sans" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Impact, sans-serif", label: "Impact" },
];

const DATA_FIELDS: { key: keyof LabelData; label: string; fieldKey: keyof LabelFields }[] = [
  { key: "shopName", label: "Магазин", fieldKey: "shopName" },
  { key: "productName", label: "Товар", fieldKey: "productName" },
  { key: "date", label: "Дата", fieldKey: "date" },
  { key: "article", label: "Артикул", fieldKey: "article" },
  { key: "price", label: "Цена", fieldKey: "price" },
  { key: "barcode", label: "Штрихкод", fieldKey: "barcode" },
];

function Slider({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground mono">{value.toFixed(1)}×</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function CopiesCounter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors flex-shrink-0"
      >
        <Icon name="Minus" size={12} />
      </button>
      <input
        type="number"
        min={1}
        max={300}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(300, Number(e.target.value))))}
        className="w-14 text-center bg-muted border border-border rounded-md text-sm py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary mono font-bold"
      />
      <button
        onClick={() => onChange(Math.min(300, value + 1))}
        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors flex-shrink-0"
      >
        <Icon name="Plus" size={12} />
      </button>
    </div>
  );
}

export default function LabelsPanel({
  size,
  setSize,
  copies,
  setCopies,
  fields,
  toggleField,
  data,
  setData,
  labelStyle,
  setLabelStyle,
  onPrint,
  multiMode,
  setMultiMode,
  printItems,
  setPrintItems,
}: {
  size: LabelSize;
  setSize: (s: LabelSize) => void;
  copies: number;
  setCopies: (n: number) => void;
  fields: LabelFields;
  toggleField: (key: keyof LabelFields) => void;
  data: LabelData;
  setData: (fn: (d: LabelData) => LabelData) => void;
  labelStyle: LabelStyle;
  setLabelStyle: (fn: (s: LabelStyle) => LabelStyle) => void;
  onPrint: () => void;
  multiMode: boolean;
  setMultiMode: (v: boolean) => void;
  printItems: PrintItem[];
  setPrintItems: (fn: (items: PrintItem[]) => PrintItem[]) => void;
}) {
  const isThermo = size.startsWith("thermo");
  const perPage = size === "large" ? 9 : isThermo ? 1 : 32;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const totalMultiCopies = printItems.reduce((s, it) => s + it.copies, 0);

  const addItem = () => {
    const newId = crypto.randomUUID();
    setPrintItems((items) => [
      ...items,
      { id: newId, data: { ...data }, copies: 1 },
    ]);
    setExpandedItem(newId);
  };

  const removeItem = (id: string) => {
    setPrintItems((items) => items.filter((it) => it.id !== id));
    if (expandedItem === id) setExpandedItem(null);
  };

  const updateItemData = (id: string, key: keyof LabelData, value: string) => {
    setPrintItems((items) =>
      items.map((it) => it.id === id ? { ...it, data: { ...it.data, [key]: value } } : it)
    );
  };

  const updateItemCopies = (id: string, n: number) => {
    setPrintItems((items) =>
      items.map((it) => it.id === id ? { ...it, copies: n } : it)
    );
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin pb-4">

      {/* Size selector */}
      <div className="stat-card space-y-2">
        <div className="section-title mb-3">Размер ценника</div>
        {sizeOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSize(opt.id)}
            className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
            style={{
              background: size === opt.id ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--muted))",
              borderColor: size === opt.id ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
            }}
          >
            <div className="text-sm font-medium text-foreground">{opt.label}</div>
            <div className="text-xs text-muted-foreground">{opt.sub}</div>
          </button>
        ))}
      </div>

      {/* Fields toggle */}
      <div className="stat-card space-y-2">
        <div className="section-title mb-3">Поля ценника</div>
        {fieldLabels
          .filter(({ onlyLarge }) => !onlyLarge || size === "large")
          .map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleField(key)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-muted"
            >
              <span className="text-sm text-foreground">{label}</span>
              <div
                className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: fields[key] ? "hsl(var(--primary))" : "hsl(var(--border))" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                  style={{ left: fields[key] ? "calc(100% - 18px)" : "2px" }}
                />
              </div>
            </button>
          ))}
      </div>

      {/* Price style */}
      {fields.bigPrice && (
        <div className="stat-card space-y-3">
          <div className="section-title mb-1">Стиль цены</div>
          <Slider
            label="Ширина цифр"
            value={labelStyle.priceScaleX}
            min={0.5} max={3} step={0.1}
            onChange={(v) => setLabelStyle((s) => ({ ...s, priceScaleX: v }))}
          />
          <Slider
            label="Высота цифр"
            value={labelStyle.priceScaleY}
            min={0.5} max={3} step={0.1}
            onChange={(v) => setLabelStyle((s) => ({ ...s, priceScaleY: v }))}
          />
          <div>
            <div className="text-xs text-muted-foreground mb-2">Шрифт цены</div>
            <div className="flex flex-col gap-1.5">
              {fontOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setLabelStyle((s) => ({ ...s, priceFont: f.value }))}
                  className="w-full text-left px-3 py-2 rounded-lg border transition-all"
                  style={{
                    fontFamily: f.value,
                    fontWeight: 900,
                    fontSize: "15px",
                    background: labelStyle.priceFont === f.value ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--muted))",
                    borderColor: labelStyle.priceFont === f.value ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {f.label} — 3 200
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thermo hint */}
      {isThermo && (
        <div className="stat-card">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Кликни на любое поле этикетки в превью — появится панель размера и жирности шрифта.
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="stat-card">
        <div className="section-title mb-3">Режим печати</div>
        <div className="flex gap-2">
          <button
            onClick={() => setMultiMode(false)}
            className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
            style={{
              background: !multiMode ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--muted))",
              borderColor: !multiMode ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            Один товар
          </button>
          <button
            onClick={() => setMultiMode(true)}
            className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
            style={{
              background: multiMode ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--muted))",
              borderColor: multiMode ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            Несколько
          </button>
        </div>
      </div>

      {/* Single mode: data + copies */}
      {!multiMode && (
        <>
          <div className="stat-card space-y-3">
            <div className="section-title mb-1">Данные</div>
            {DATA_FIELDS.filter((f) => fields[f.fieldKey]).map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                <input
                  value={data[f.key]}
                  onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-md text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <div className="stat-card">
            <div className="section-title mb-3">Количество</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="Minus" size={14} />
              </button>
              <input
                type="number"
                min={1}
                max={300}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(300, Number(e.target.value))))}
                className="flex-1 text-center bg-muted border border-border rounded-md text-sm py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary mono font-bold"
              />
              <button
                onClick={() => setCopies(Math.min(300, copies + 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="Plus" size={14} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {isThermo
                ? `${copies} этикеток`
                : `${Math.ceil(copies / perPage)} лист(а) А4`}
            </div>
          </div>
        </>
      )}

      {/* Multi mode: list of items */}
      {multiMode && (
        <div className="stat-card space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="section-title">Товары</div>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Icon name="Plus" size={12} />
              Добавить
            </button>
          </div>

          {printItems.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              Нажми «Добавить» чтобы добавить товар
            </div>
          )}

          {printItems.map((item, idx) => (
            <div
              key={item.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Item header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{idx + 1}.</span>
                <span className="text-sm text-foreground flex-1 truncate">
                  {item.data.productName || "Без названия"}
                </span>
                <span className="text-xs text-muted-foreground mono flex-shrink-0">{item.copies} шт</span>
                <Icon
                  name={expandedItem === item.id ? "ChevronUp" : "ChevronDown"}
                  size={14}
                  className="text-muted-foreground flex-shrink-0"
                />
              </div>

              {/* Item body */}
              {expandedItem === item.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
                  {DATA_FIELDS.filter((f) => fields[f.fieldKey]).map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                      <input
                        value={item.data[f.key]}
                        onChange={(e) => updateItemData(item.id, f.key, e.target.value)}
                        className="w-full bg-background border border-border rounded-md text-xs px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Кол-во:</span>
                      <CopiesCounter value={item.copies} onChange={(n) => updateItemCopies(item.id, n)} />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-destructive hover:opacity-70 transition-opacity flex items-center gap-1"
                    >
                      <Icon name="Trash2" size={13} />
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {printItems.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              {totalMultiCopies} шт.{!isThermo && ` · ${Math.ceil(totalMultiCopies / perPage)} лист(а) А4`}
            </div>
          )}
        </div>
      )}

      {/* Print button */}
      <button
        onClick={onPrint}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "hsl(var(--primary))", color: "#fff" }}
      >
        <Icon name="Printer" size={17} />
        Печать / PDF
      </button>
    </div>
  );
}
