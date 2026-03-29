import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import type { LabelData, LabelFields, LabelSize, LabelStyle, ThermoFieldStyle } from "./types";

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

function ThermoCard({
  tw, th, tp, data, fields, fs, fw, barcodeH, barcodeFontSize,
  defaultFs, defaultFw, tf, editable, onFieldStyle,
}: {
  tw: string; th: string; tp: string;
  data: LabelData; fields: LabelFields;
  fs: (f: ThermoFieldKey) => string;
  fw: (f: ThermoFieldKey) => number;
  barcodeH: number; barcodeFontSize: number;
  defaultFs: number; defaultFw: number;
  tf: Partial<Record<ThermoFieldKey, ThermoFieldStyle>>;
  editable: boolean;
  onFieldStyle?: (field: ThermoFieldKey, style: ThermoFieldStyle) => void;
}) {
  const [selected, setSelected] = useState<ThermoFieldKey | null>(null);

  const handleClick = (e: React.MouseEvent, field: ThermoFieldKey) => {
    if (!editable) return;
    e.stopPropagation();
    setSelected(selected === field ? null : field);
  };

  const selFs = selected ? (tf[selected]?.fontSize ?? defaultFs) : defaultFs;
  const selFw = selected ? (tf[selected]?.fontWeight ?? defaultFw) : defaultFw;

  const fieldStyle = (field: ThermoFieldKey): React.CSSProperties => ({
    cursor: editable ? "pointer" : "default",
    outline: selected === field ? "1px dashed #2563eb" : "1px dashed transparent",
    borderRadius: "0.5mm",
    padding: "0.2mm 0.4mm",
    margin: "-0.2mm -0.4mm",
  });

  return (
    <div
      className="label-card bg-white"
      style={{ width: tw, height: th, padding: tp, boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "visible", border: "1px solid #ccc", borderRadius: "2mm", position: "relative" }}
      onClick={() => setSelected(null)}
    >
      {/* Тулбар над выбранным полем */}
      {editable && selected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
            background: "#1e293b", borderRadius: "6px", padding: "4px 6px",
            display: "flex", alignItems: "center", gap: "4px", zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
          }}
        >
          <button onClick={() => onFieldStyle?.(selected, { fontSize: Math.max(4, selFs - 0.5), fontWeight: selFw })}
            style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px 4px", lineHeight: 1 }}>−</button>
          <span style={{ color: "#f1f5f9", fontSize: "11px", minWidth: "28px", textAlign: "center" }}>{selFs}pt</span>
          <button onClick={() => onFieldStyle?.(selected, { fontSize: Math.min(20, selFs + 0.5), fontWeight: selFw })}
            style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px 4px", lineHeight: 1 }}>+</button>
          <div style={{ width: "1px", height: "14px", background: "#334155", margin: "0 2px" }} />
          {([400, 700, 900] as number[]).map((w) => (
            <button key={w} onClick={() => onFieldStyle?.(selected, { fontSize: selFs, fontWeight: w })}
              style={{
                color: selFw === w ? "#fff" : "#94a3b8",
                background: selFw === w ? "#2563eb" : "none",
                border: "none", cursor: "pointer", fontSize: "11px",
                fontWeight: w, padding: "2px 5px", borderRadius: "4px", lineHeight: 1,
              }}
            >{w === 400 ? "N" : w === 700 ? "B" : "X"}</button>
          ))}
        </div>
      )}

      {fields.shopName && (
        <div onClick={(e) => handleClick(e, "shopName")}
          style={{ ...fieldStyle("shopName"), fontSize: fs("shopName"), fontWeight: fw("shopName"), textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.3mm", marginBottom: "0.5mm", color: "#000", flexShrink: 0 }}>
          {data.shopName}
        </div>
      )}
      {fields.productName && (
        <div onClick={(e) => handleClick(e, "productName")}
          style={{ ...fieldStyle("productName"), fontSize: fs("productName"), fontWeight: fw("productName"), lineHeight: 1.1, color: "#000", marginBottom: "0.5mm", flexShrink: 0, overflow: "hidden" }}>
          {data.productName}
        </div>
      )}
      <div style={{ display: "flex", flex: 1, gap: "1mm", minHeight: 0, alignItems: "flex-end" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
          {fields.barcode && (
            <div><Barcode value={data.barcode} height={barcodeH} fontSize={barcodeFontSize} /></div>
          )}
          {fields.article && (
            <div onClick={(e) => handleClick(e, "article")}
              style={{ ...fieldStyle("article"), fontSize: fs("article"), fontWeight: fw("article"), color: "#333", marginTop: "0.3mm" }}>
              Арт: {data.article}
            </div>
          )}
          {fields.date && (
            <div onClick={(e) => handleClick(e, "date")}
              style={{ ...fieldStyle("date"), fontSize: fs("date"), fontWeight: fw("date"), color: "#333" }}>
              {data.date}
            </div>
          )}
        </div>
        {fields.price && (
          <div onClick={(e) => handleClick(e, "price")}
            style={{ ...fieldStyle("price"), flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <div style={{ fontSize: `calc(${fs("price")} * 1.8)`, fontWeight: fw("price"), color: "#000", lineHeight: 1 }}>
              {data.price} <span style={{ fontSize: fs("price") }}>₽</span>
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
  onThermoFieldStyle,
}: {
  data: LabelData;
  fields: LabelFields;
  size: LabelSize;
  labelStyle: LabelStyle;
  onThermoFieldStyle?: (field: keyof Omit<LabelData, 'barcode'>, style: ThermoFieldStyle) => void;
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
    const tf = labelStyle.thermoFields ?? {};

    const fs = (field: keyof Omit<LabelData, 'barcode'>) => `${tf[field]?.fontSize ?? defaultFs}pt`;
    const fw = (field: keyof Omit<LabelData, 'barcode'>) => tf[field]?.fontWeight ?? defaultFw;

    return (
      <ThermoCard
        tw={tw} th={th} tp={tp}
        data={data} fields={fields}
        fs={fs} fw={fw}
        barcodeH={barcodeH} barcodeFontSize={barcodeFontSize}
        defaultFs={defaultFs} defaultFw={defaultFw} tf={tf}
        editable={!!onThermoFieldStyle}
        onFieldStyle={onThermoFieldStyle}
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