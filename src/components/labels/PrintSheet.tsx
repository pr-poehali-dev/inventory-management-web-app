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

  const perPage = isLarge ? 9 : size === "small20" ? 20 : 24;
  const cols = isLarge ? 3 : 4;
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
                padding: "8mm",
                boxSizing: "border-box",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: "2mm",
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