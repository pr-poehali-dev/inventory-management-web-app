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

  const pageW = isLarge ? "297mm" : "210mm";
  const pageH = isLarge ? "210mm" : "297mm";
  const orientation = isLarge ? "landscape" : "portrait";

  const cols = isLarge ? 3 : 4;
  const marginMm = isLarge ? 8 : 3;
  const gapMm = isLarge ? 2 : 1;
  const pageMmW = isLarge ? 297 : 210;
  const pageMmH = isLarge ? 210 : 297;
  const labelMmW = isLarge ? 91 : 50;
  const labelMmH = isLarge ? 62 : 35;
  const colsCalc = Math.floor((pageMmW - marginMm * 2 + gapMm) / (labelMmW + gapMm));
  const rowsCalc = Math.floor((pageMmH - marginMm * 2 + gapMm) / (labelMmH + gapMm));
  const perPage = isLarge ? 9 : colsCalc * rowsCalc;
  const pages = Math.ceil(copies / perPage);

  return (
    <>
      <style>{`@media print { @page { size: A4 ${orientation}; margin: 0; } }`}</style>
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