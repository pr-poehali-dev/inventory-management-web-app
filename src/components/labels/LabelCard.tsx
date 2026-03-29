import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import type { LabelData, LabelFields, LabelSize, LabelStyle, ThermoFieldStyle, ThermoWordStyle } from "./types";

// ─── Barcode ──────────────────────────────────────────────────────────────────

export function Barcode({ value, height = 32, fontSize = 8 }: { value: string; height?: number; fontSize?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        fontSize,
        margin: 2,
        displayValue: true,
        background: "transparent",
        lineColor: "#000",
        fontOptions: "bold",
      });
    } catch {
      // invalid barcode value — ignore
    }
  }, [value, height, fontSize]);

  return <svg ref={ref} className="w-full" />;
}

// ─── Big Price SVG ────────────────────────────────────────────────────────────

function BigPriceSvg({ price, style }: { price: string; style: LabelStyle }) {
  const { priceScaleX, priceScaleY, priceFont } = style;
  // viewBox width controls horizontal stretch: smaller = wider chars
  const vbW = Math.round(300 / priceScaleX);
  // viewBox height controls vertical stretch: smaller = taller chars
  const vbH = Math.round(106 / priceScaleY);

  return (
    <svg
      width="44mm"
      height="28mm"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <text
        x={vbW}
        y={vbH - 6}
        textAnchor="end"
        fontFamily={priceFont}
        fontWeight="900"
        fill="#000"
        fontSize={vbH - 6}
      >
        {price}
      </text>
    </svg>
  );
}

// ─── ThermoCard ───────────────────────────────────────────────────────────────

type ThermoFieldKey = keyof Omit<LabelData, 'barcode'>;

// Разбивает текст на слова и рендерит каждое кликабельным спаном
function WordSpans({
  text, fieldKey, defaultFs, defaultFw, words, selected, editable,
  onWordClick,
}: {
  text: string;
  fieldKey: ThermoFieldKey;
  defaultFs: number;
  defaultFw: number;
  words: Record<string, ThermoWordStyle>;
  selected: Set<string>;
  editable: boolean;
  onWordClick: (key: string, e: React.MouseEvent) => void;
}) {
  // Разбиваем с учётом \n как отдельного токена
  const tokens = text.split(/(\s+|\n)/);
  let wordIdx = 0;
  return (
    <>
      {tokens.map((token, i) => {
        if (token === "\n") return <br key={i} />;
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        if (token === "") return null;
        const key = `${fieldKey}:${wordIdx++}`;
        const ws = words[key];
        const isSelected = selected.has(key);
        return (
          <span
            key={key}
            onClick={editable ? (e) => onWordClick(key, e) : undefined}
            style={{
              fontSize: ws?.fontSize ? `${ws.fontSize}pt` : `${defaultFs}pt`,
              fontWeight: ws?.fontWeight ?? defaultFw,
              cursor: editable ? "pointer" : "default",
              background: isSelected ? "rgba(37,99,235,0.18)" : "transparent",
              borderRadius: "1px",
              outline: isSelected ? "1px solid #2563eb" : "none",
              display: "inline",
            }}
          >{token}</span>
        );
      })}
    </>
  );
}

// Применяет операцию к тексту: удалить слово, вставить пробел или перенос ПОСЛЕ него
function applyTextOp(text: string, wordIdx: number, op: "delete" | "space" | "newline"): string {
  // Тот же сплит что в WordSpans — чтобы индексы совпадали
  const tokens = text.split(/(\s+|\n)/).filter((t) => t !== "");
  // Находим реальные слова (не пробелы и не \n)
  const wordPositions: number[] = [];
  tokens.forEach((t, i) => {
    if (t !== "\n" && !/^\s+$/.test(t)) wordPositions.push(i);
  });
  const tokIdx = wordPositions[wordIdx];
  if (tokIdx === undefined) return text;
  const next = [...tokens];
  if (op === "delete") {
    next.splice(tokIdx, 1);
    // убираем соседний разделитель
    const after = next[tokIdx];
    const before = next[tokIdx - 1];
    if (after !== undefined && (after === "\n" || /^\s+$/.test(after))) next.splice(tokIdx, 1);
    else if (before !== undefined && (before === "\n" || /^\s+$/.test(before))) next.splice(tokIdx - 1, 1);
  } else if (op === "space") {
    next.splice(tokIdx + 1, 0, " ");
  } else if (op === "newline") {
    next.splice(tokIdx + 1, 0, "\n");
  }
  return next.join("");
}

function ThermoCard({
  tw, th, tp, data, fields, barcodeH, barcodeFontSize,
  defaultFs, defaultFw, words, editable, onWordStyle, onDataChange,
}: {
  tw: string; th: string; tp: string;
  data: LabelData; fields: LabelFields;
  barcodeH: number; barcodeFontSize: number;
  defaultFs: number; defaultFw: number;
  words: Record<string, ThermoWordStyle>;
  editable: boolean;
  onWordStyle?: (wordKey: string, style: ThermoWordStyle) => void;
  onDataChange?: (field: ThermoFieldKey, value: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleWordClick = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const firstKey = selected.size > 0 ? [...selected][0] : null;
  const selFs = firstKey ? (words[firstKey]?.fontSize ?? defaultFs) : defaultFs;
  const selFw = firstKey ? (words[firstKey]?.fontWeight ?? defaultFw) : defaultFw;

  const applyToSelected = (patch: ThermoWordStyle) => {
    selected.forEach((k) => onWordStyle?.(k, { ...(words[k] ?? {}), ...patch }));
  };

  // Применяет текстовую операцию — группируем по полю, применяем последовательно
  const applyOp = (op: "delete" | "space" | "newline") => {
    // группируем ключи по полю
    const byField: Record<string, number[]> = {};
    [...selected].forEach((k) => {
      const [field, idxStr] = k.split(":");
      if (!byField[field]) byField[field] = [];
      byField[field].push(parseInt(idxStr));
    });
    Object.entries(byField).forEach(([field, indices]) => {
      const fieldKey = field as ThermoFieldKey;
      // при delete идём с конца чтобы индексы не смещались, иначе с начала
      const sorted = [...indices].sort((a, b) => op === "delete" ? b - a : a - b);
      let text = data[fieldKey];
      sorted.forEach((idx) => { text = applyTextOp(text, idx, op); });
      onDataChange?.(fieldKey, text);
    });
    setSelected(new Set());
  };

  const sep = () => <div style={{ width: "1px", height: "14px", background: "#334155", margin: "0 2px" }} />;
  const btn = (label: string, onClick: () => void, color = "#94a3b8", bg = "none") => (
    <button onClick={onClick} style={{ color, background: bg, border: "none", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", lineHeight: 1.4 }}>{label}</button>
  );

  const baseStyle = (color = "#000"): React.CSSProperties => ({
    fontSize: `${defaultFs}pt`,
    fontWeight: defaultFw,
    color,
    lineHeight: 1.3,
  });

  return (
    <div
      className="label-card bg-white"
      style={{ width: tw, height: th, padding: tp, boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "visible", border: "1px solid #ccc", borderRadius: "2mm", position: "relative" }}
      onClick={() => setSelected(new Set())}
    >
      {/* Тулбар */}
      {editable && selected.size > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            background: "#1e293b", borderRadius: "6px", padding: "4px 8px",
            display: "flex", alignItems: "center", gap: "4px", zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
          }}
        >
          {btn("−", () => applyToSelected({ fontSize: Math.max(4, selFs - 0.5) }))}
          <span style={{ color: "#f1f5f9", fontSize: "11px", minWidth: "30px", textAlign: "center" }}>{selFs}pt</span>
          {btn("+", () => applyToSelected({ fontSize: Math.min(20, selFs + 0.5) }))}
          {sep()}
          {([400, 700, 900] as number[]).map((w) => (
            <button key={w} onClick={() => applyToSelected({ fontWeight: w })}
              style={{
                color: selFw === w ? "#fff" : "#94a3b8", background: selFw === w ? "#2563eb" : "none",
                border: "none", cursor: "pointer", fontSize: "11px", fontWeight: w, padding: "2px 6px", borderRadius: "4px", lineHeight: 1.4,
              }}
            >{w === 400 ? "N" : w === 700 ? "B" : "X"}</button>
          ))}
          {sep()}
          {btn("_", () => applyOp("space"), "#94a3b8")}
          {btn("↵", () => applyOp("newline"), "#94a3b8")}
          {btn("del", () => applyOp("delete"), "#f87171")}
        </div>
      )}

      {fields.shopName && (
        <div style={{ ...baseStyle(), textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.3mm", marginBottom: "0.5mm", flexShrink: 0 }}>
          <WordSpans text={data.shopName} fieldKey="shopName" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
        </div>
      )}
      {fields.productName && (
        <div style={{ ...baseStyle(), marginBottom: "0.5mm", flexShrink: 0, overflow: "hidden" }}>
          <WordSpans text={data.productName} fieldKey="productName" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
        </div>
      )}
      <div style={{ display: "flex", flex: 1, gap: "1mm", minHeight: 0, alignItems: "flex-end" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
          {fields.barcode && (
            <div><Barcode value={data.barcode} height={barcodeH} fontSize={barcodeFontSize} /></div>
          )}
          {fields.article && (
            <div style={{ ...baseStyle("#333"), marginTop: "0.3mm" }}>
              <WordSpans text={`Арт: ${data.article}`} fieldKey="article" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
            </div>
          )}
          {fields.date && (
            <div style={baseStyle("#333")}>
              <WordSpans text={data.date} fieldKey="date" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
            </div>
          )}
        </div>
        {fields.price && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <div style={{ ...baseStyle(), fontSize: `${defaultFs * 1.8}pt`, lineHeight: 1 }}>
              <WordSpans text={data.price} fieldKey="price" defaultFs={defaultFs * 1.8} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
              {" "}<span style={{ fontSize: `${defaultFs}pt` }}>₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LabelCard ────────────────────────────────────────────────────────────────

export default function LabelCard({
  data,
  fields,
  size,
  labelStyle,
  onThermoWordStyle,
  onThermoDataChange,
}: {
  data: LabelData;
  fields: LabelFields;
  size: LabelSize;
  labelStyle: LabelStyle;
  onThermoWordStyle?: (wordKey: string, style: ThermoWordStyle) => void;
  onThermoDataChange?: (field: keyof Omit<LabelData, 'barcode'>, value: string) => void;
}) {
  const isLarge = size === "large";
  const isThermo = size.startsWith("thermo");
  const thermoSizes: Record<string, { w: number; h: number }> = {
    thermo58x40: { w: 58, h: 40 },
    thermo58x30: { w: 58, h: 30 },
    thermo40x25: { w: 40, h: 25 },
  };

  if (isLarge) {
    if (fields.bigPrice) {
      return (
        <div
          className="label-card border border-gray-300 bg-white"
          style={{ width: "91mm", height: "62mm", padding: "3mm", boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {fields.shopName && (
            <div style={{ fontSize: "9pt", fontWeight: 700, textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "1.5mm", marginBottom: "1.5mm", color: "#000", flexShrink: 0 }}>
              {data.shopName}
            </div>
          )}
          {fields.productName && (
            <div style={{ fontSize: "9pt", fontWeight: 700, lineHeight: 1.2, color: "#000", marginBottom: "1.5mm", flexShrink: 0 }}>
              {data.productName}
            </div>
          )}
          <div style={{ display: "flex", flex: 1, gap: "2mm", minHeight: 0, alignItems: "flex-end" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
              {fields.barcode && (
                <div style={{ marginBottom: "1mm" }}>
                  <Barcode value={data.barcode} height={22} fontSize={6} />
                </div>
              )}
              {fields.article && (
                <div style={{ fontSize: "7pt", color: "#555" }}>Арт: {data.article}</div>
              )}
              {fields.date && (
                <div style={{ fontSize: "7pt", color: "#555" }}>{data.date}</div>
              )}
            </div>
            {fields.price && (
              <div style={{ width: "44mm", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
                <BigPriceSvg price={data.price} style={labelStyle} />
                <div style={{ fontSize: "11pt", fontWeight: 700, color: "#000", lineHeight: 1 }}>₽</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="label-card border border-gray-300 bg-white flex flex-col"
        style={{ width: "91mm", height: "62mm", padding: "3mm", boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}
      >
        {fields.shopName && (
          <div style={{ fontSize: "9pt", fontWeight: 700, textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "1.5mm", marginBottom: "1.5mm", color: "#000" }}>
            {data.shopName}
          </div>
        )}
        {fields.productName && (
          <div style={{ fontSize: "10pt", fontWeight: 700, lineHeight: 1.25, color: "#000", marginBottom: "1.5mm", flexShrink: 0 }}>
            {data.productName}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "auto", gap: "2mm" }}>
          <div style={{ flex: 1 }}>
            {fields.article && (
              <div style={{ fontSize: "7.5pt", color: "#555" }}>Арт: {data.article}</div>
            )}
            {fields.date && (
              <div style={{ fontSize: "7.5pt", color: "#555" }}>{data.date}</div>
            )}
            {fields.barcode && (
              <div style={{ marginTop: "1mm" }}>
                <Barcode value={data.barcode} height={28} fontSize={7} />
              </div>
            )}
          </div>
          {fields.price && (
            <div style={{ fontSize: "20pt", fontWeight: 900, color: "#000", lineHeight: 1, flexShrink: 0, textAlign: "right" }}>
              {data.price} <span style={{ fontSize: "11pt" }}>₽</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Thermo variant — закруглённые углы, штрихкод 30% высоты, inline-редактор
  if (isThermo) {
    const ts = thermoSizes[size] ?? { w: 58, h: 40 };
    const tw = `${ts.w}mm`;
    const th = `${ts.h}mm`;
    const isNarrow = ts.h <= 30;
    const tp = isNarrow ? "1mm" : "1.5mm";
    const barcodeH = Math.round(ts.h * 0.30 * 3.78);
    const barcodeFontSize = isNarrow ? 7 : 9;
    const defaultFs = labelStyle.thermoFontSize ?? 6;
    const defaultFw = labelStyle.thermoFontWeight ?? 700;
    const words = labelStyle.thermoWords ?? {};

    return (
      <ThermoCard
        tw={tw} th={th} tp={tp}
        data={data} fields={fields}
        barcodeH={barcodeH} barcodeFontSize={barcodeFontSize}
        defaultFs={defaultFs} defaultFw={defaultFw}
        words={words}
        editable={!!onThermoWordStyle || !!onThermoDataChange}
        onWordStyle={onThermoWordStyle}
        onDataChange={onThermoDataChange}
      />
    );
  }

  // Small variants — ширина 100% (растягивается по ячейке сетки), высота фиксирована
  const w = "100%";
  const h = "35mm";
  const p = "1.5mm";

  if (fields.bigPrice) {
    return (
      <div
        className="label-card bg-white"
        style={{ width: w, height: h, padding: p, boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden", border: "1.5px solid #000" }}
      >
        {fields.shopName && (
          <div style={{ fontSize: "5.5pt", fontWeight: 700, textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.5mm", marginBottom: "0.5mm", color: "#000", flexShrink: 0 }}>
            {data.shopName}
          </div>
        )}
        {fields.productName && (
          <div style={{ fontSize: "6pt", fontWeight: 700, lineHeight: 1.15, color: "#000", marginBottom: "0.5mm", flexShrink: 0 }}>
            {data.productName}
          </div>
        )}
        <div style={{ display: "flex", flex: 1, gap: "1mm", minHeight: 0, alignItems: "flex-end" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
            {fields.barcode && (
              <div style={{ marginBottom: "0.5mm" }}>
                <Barcode value={data.barcode} height={is30 ? 12 : 14} fontSize={4} />
              </div>
            )}
            {fields.article && <div style={{ fontSize: "5pt", color: "#555" }}>Арт: {data.article}</div>}
            {fields.date && <div style={{ fontSize: "5pt", color: "#555" }}>{data.date}</div>}
          </div>
          {fields.price && (
            <div style={{ width: "45%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <svg width="100%" height="100%" viewBox="0 0 300 106" preserveAspectRatio="none" style={{ display: "block", flex: 1 }}>
                <text
                  x="300"
                  y="100"
                  textAnchor="end"
                  fontFamily={labelStyle.priceFont}
                  fontWeight="900"
                  fill="#000"
                  fontSize="100"
                >
                  {data.price}
                </text>
              </svg>
              <div style={{ fontSize: "5pt", fontWeight: 700, color: "#000", lineHeight: 1 }}>₽</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="label-card bg-white flex flex-col"
      style={{ width: w, height: h, padding: p, boxSizing: "border-box", fontFamily: "Arial, sans-serif", border: "1.5px solid #000" }}
    >
      {fields.shopName && (
        <div style={{ fontSize: "5.5pt", fontWeight: 700, textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.5mm", marginBottom: "0.5mm", color: "#000" }}>
          {data.shopName}
        </div>
      )}
      {fields.productName && (
        <div style={{ fontSize: "6pt", fontWeight: 700, lineHeight: 1.15, color: "#000", marginBottom: "0.5mm" }}>
          {data.productName}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
        <div>
          {fields.article && <div style={{ fontSize: "5pt", color: "#555" }}>Арт: {data.article}</div>}
          {fields.date && <div style={{ fontSize: "5pt", color: "#555" }}>{data.date}</div>}
        </div>
        {fields.price && (
          <div style={{ fontSize: "11pt", fontWeight: 900, color: "#000", lineHeight: 1 }}>
            {data.price} <span style={{ fontSize: "6pt" }}>₽</span>
          </div>
        )}
      </div>
      {fields.barcode && (
        <div style={{ marginTop: "0.5mm" }}>
          <Barcode value={data.barcode} height={is30 ? 16 : 18} fontSize={5} />
        </div>
      )}
    </div>
  );
}