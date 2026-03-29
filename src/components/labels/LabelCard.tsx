import type { LabelData, LabelFields, LabelSize, LabelStyle, ThermoWordStyle } from "./types";
import { Barcode } from "./Barcode";
import { ThermoCard } from "./ThermoCard";

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

// ─── LabelCard ────────────────────────────────────────────────────────────────

export { Barcode };

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
  const is30 = size === "small30";

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
