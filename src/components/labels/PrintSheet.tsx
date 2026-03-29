import LabelCard from "./LabelCard";
import type { LabelData, LabelFields, LabelSize, LabelStyle } from "./types";

export default function PrintSheet({
  data,
  fields,
  size,
  copies,
  labelStyle,
}: {
  data: LabelData;
  fields: LabelFields;
  size: LabelSize;
  copies: number;
  labelStyle: LabelStyle;
}) {
  const isLarge = size === "large";

  const isThermoPre = size.startsWith("thermo");
  const thermoMmPre: Record<string, { w: number; h: number }> = { thermo58x40: { w: 58, h: 40 }, thermo58x30: { w: 58, h: 30 }, thermo40x25: { w: 40, h: 25 } };
  const preMm = thermoMmPre[size];
  const pageW = isThermoPre ? `${preMm?.w ?? 58}mm` : (isLarge ? "297mm" : "210mm");
  const pageH = isThermoPre ? `${preMm?.h ?? 40}mm` : (isLarge ? "210mm" : "297mm");
  const orientation = isLarge ? "landscape" : "portrait";

  const isThermo = size.startsWith("thermo");
  const thermoMm: Record<string, { w: number; h: number }> = {
    thermo58x40: { w: 58, h: 40 },
    thermo58x30: { w: 58, h: 30 },
    thermo40x25: { w: 40, h: 25 },
  };
  const labelMm = isThermo ? (thermoMm[size] ?? { w: 58, h: 40 }) : (isLarge ? { w: 91, h: 62 } : { w: 50, h: 35 });
  const pageMmW = isThermo ? labelMm.w : (isLarge ? 297 : 210);
  const pageMmH = isThermo ? labelMm.h : (isLarge ? 210 : 297);
  const marginMm = isThermo ? 0 : 3;
  const gapMm = isThermo ? 0 : 1;
  const cols = isThermo ? 1 : (isLarge ? 3 : 4);
  const colsCalc = isThermo ? 1 : Math.floor((pageMmW - marginMm * 2 + gapMm) / (labelMm.w + gapMm));
  const rowsCalc = isThermo ? 1 : Math.floor((pageMmH - marginMm * 2 + gapMm) / (labelMm.h + gapMm));
  const perPage = isLarge ? 9 : colsCalc * rowsCalc;
  const pages = Math.ceil(copies / perPage);

  return (
    <>
      <style>{`@media print { @page { size: ${pageW} ${pageH}; margin: 0; } }`}</style>
      <div id="print-area">
        {Array.from({ length: pages }).map((_, pi) => {
          const start = pi * perPage;
          const count = Math.min(perPage, copies - start);
          return (
            <div
              key={pi}
              className="print-page"
              style={{
                width: pageW,
                height: pageH,
                background: "#fff",
                margin: "0 auto",
                padding: `${marginMm}mm`,
                boxSizing: "border-box",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: `${gapMm}mm`,
                alignContent: "start",
                pageBreakAfter: pi < pages - 1 ? "always" : "auto",
              }}
            >
              {Array.from({ length: count }).map((_, i) => (
                <LabelCard key={i} data={data} fields={fields} size={size} labelStyle={labelStyle} />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}