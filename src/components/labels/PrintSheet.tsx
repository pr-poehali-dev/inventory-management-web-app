import LabelCard from "./LabelCard";
import type { LabelData, LabelFields, LabelSize } from "./types";

export default function PrintSheet({
  data,
  fields,
  size,
  copies,
}: {
  data: LabelData;
  fields: LabelFields;
  size: LabelSize;
  copies: number;
}) {
  const perPage = size === "large" ? 9 : size === "small20" ? 20 : 30;
  const total = copies;
  const pages = Math.ceil(total / perPage);
  const cols = size === "large" ? 3 : size === "small20" ? 4 : 5;

  return (
    <div id="print-area">
      {Array.from({ length: pages }).map((_, pi) => {
        const start = pi * perPage;
        const count = Math.min(perPage, total - start);
        return (
          <div
            key={pi}
            className="print-page"
            style={{
              width: "297mm",
              minHeight: "210mm",
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
              <LabelCard key={i} data={data} fields={fields} size={size} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
