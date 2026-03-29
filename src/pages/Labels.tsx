import { useState } from "react";
import Icon from "@/components/ui/icon";
import LabelCard from "@/components/labels/LabelCard";
import PrintSheet from "@/components/labels/PrintSheet";
import LabelsPanel from "@/components/labels/LabelsPanel";
import type { LabelData, LabelFields, LabelSize, LabelStyle } from "@/components/labels/types";

type PreviewMode = "single" | "sheet";

export default function Labels() {
  const [size, setSize] = useState<LabelSize>("large");
  const [copies, setCopies] = useState(9);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("single");
  const [fields, setFields] = useState<LabelFields>({
    shopName: true,
    productName: true,
    date: true,
    article: true,
    price: true,
    barcode: true,
    bigPrice: false,
  });
  const [data, setData] = useState<LabelData>({
    shopName: "Мой магазин",
    productName: "Кабель витая пара Cat6 бухта 305м",
    date: new Date().toLocaleDateString("ru-RU"),
    article: "КВП-6-305",
    price: "3 200",
    barcode: "460708636012",
  });
  const [labelStyle, setLabelStyle] = useState<LabelStyle>({
    priceScaleX: 1.0,
    priceScaleY: 1.0,
    priceFont: "'Barlow Condensed', Arial Narrow, sans-serif",
  });

  const toggleField = (key: keyof LabelFields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "print-style";
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #print-portal { display: block !important; }
        @page { size: A4 landscape; margin: 0; }
      }
    `;
    document.head.appendChild(style);

    const portal = document.getElementById("print-portal");
    if (portal) portal.style.display = "block";

    window.print();

    setTimeout(() => {
      document.head.removeChild(style);
      if (portal) portal.style.display = "none";
    }, 500);
  };

  const perPage = size === "large" ? 9 : size === "small20" ? 20 : 30;
  const cols = size === "large" ? 3 : size === "small20" ? 4 : 5;
  const rows = size === "large" ? 3 : size === "small20" ? 5 : 6;
  const rowH = size === "large" ? "1fr" : `${Math.floor(194 / rows)}mm`;
  const totalPages = Math.ceil(copies / perPage);

  return (
    <>
      {/* Hidden print portal */}
      <div id="print-portal" style={{ display: "none", position: "fixed", inset: 0, zIndex: 9999, background: "#fff" }}>
        <PrintSheet data={data} fields={fields} size={size} copies={copies} labelStyle={labelStyle} />
      </div>

      <div className="flex gap-5 h-full">
        {/* ── Left Panel ── */}
        <LabelsPanel
          size={size}
          setSize={setSize}
          copies={copies}
          setCopies={setCopies}
          fields={fields}
          toggleField={toggleField}
          data={data}
          setData={setData}
          labelStyle={labelStyle}
          setLabelStyle={setLabelStyle}
          onPrint={handlePrint}
        />

        {/* ── Right: Preview ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Header with tab switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
              <button
                onClick={() => setPreviewMode("single")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: previewMode === "single" ? "hsl(var(--background))" : "transparent",
                  color: previewMode === "single" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: previewMode === "single" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <Icon name="ScanBarcode" size={14} />
                Ценник
              </button>
              <button
                onClick={() => setPreviewMode("sheet")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: previewMode === "sheet" ? "hsl(var(--background))" : "transparent",
                  color: previewMode === "sheet" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: previewMode === "sheet" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <Icon name="LayoutGrid" size={14} />
                На листе
              </button>
            </div>
            <div className="text-xs text-muted-foreground">
              {previewMode === "sheet"
                ? `${copies} шт. · ${totalPages} стр.`
                : "Реальный размер при печати"}
            </div>
          </div>

          {/* Preview area */}
          <div
            className="flex-1 overflow-auto scrollbar-thin rounded-lg border border-border flex items-center justify-center"
            style={{ background: "hsl(220 14% 12%)" }}
          >
            {previewMode === "single" ? (
              /* Single label preview — centered, natural scale */
              <div style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                <LabelCard data={data} fields={fields} size={size} labelStyle={labelStyle} />
              </div>
            ) : (
              /* Sheet preview — scaled to fit */
              <div className="p-6 flex flex-col items-center gap-4 w-full">
                {Array.from({ length: totalPages }).map((_, pi) => {
                  const start = pi * perPage;
                  const count = Math.min(perPage, copies - start);
                  return (
                    <div
                      key={pi}
                      style={{
                        width: "297mm",
                        minHeight: "210mm",
                        background: "#fff",
                        padding: "8mm",
                        boxSizing: "border-box",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridAutoRows: rowH,
                        gap: "2mm",
                        alignContent: "start",
                        transform: "scale(0.55)",
                        transformOrigin: "top center",
                        marginBottom: "-95mm",
                      }}
                    >
                      {Array.from({ length: count }).map((_, i) => (
                        <LabelCard key={i} data={data} fields={fields} size={size} labelStyle={labelStyle} />
                      ))}
                    </div>
                  );
                })}
                <div style={{ height: "20px" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > * { display: none !important; }
          #print-portal { display: block !important; position: static !important; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </>
  );
}