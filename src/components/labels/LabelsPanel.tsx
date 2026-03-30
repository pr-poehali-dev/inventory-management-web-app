import Icon from "@/components/ui/icon";
import type { LabelData, LabelFields, LabelSize, LabelStyle } from "./types";

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
}) {
  const isThermo = size.startsWith("thermo");
  const perPage = size === "large" ? 9 : isThermo ? 1 : 32;

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

      {/* Price style — when bigPrice enabled */}
      {fields.bigPrice && (
        <div className="stat-card space-y-3">
          <div className="section-title mb-1">Стиль цены</div>

          <Slider
            label="Ширина цифр"
            value={labelStyle.priceScaleX}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(v) => setLabelStyle((s) => ({ ...s, priceScaleX: v }))}
          />
          <Slider
            label="Высота цифр"
            value={labelStyle.priceScaleY}
            min={0.5}
            max={3}
            step={0.1}
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
      {size.startsWith("thermo") && (
        <div className="stat-card">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Кликни на любое поле этикетки в превью — появится панель размера и жирности шрифта.
          </div>
        </div>
      )}

      {/* Data editor */}
      <div className="stat-card space-y-3">
        <div className="section-title mb-1">Данные</div>
        {(
          [
            { key: "shopName", label: "Магазин", show: fields.shopName },
            { key: "productName", label: "Товар", show: fields.productName },
            { key: "date", label: "Дата", show: fields.date },
            { key: "article", label: "Артикул", show: fields.article },
            { key: "price", label: "Цена", show: fields.price },
            { key: "barcode", label: "Штрихкод", show: fields.barcode },
          ] as { key: keyof LabelData; label: string; show: boolean }[]
        )
          .filter((f) => f.show)
          .map((f) => (
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

      {/* Copies */}
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