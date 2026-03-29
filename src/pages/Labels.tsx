import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import JsBarcode from "jsbarcode";

// ─── Types ───────────────────────────────────────────────────────────────────

type LabelSize = "large" | "small20" | "small30";

interface LabelFields {
  shopName: boolean;
  productName: boolean;
  date: boolean;
  article: boolean;
  price: boolean;
  barcode: boolean;
  bigPrice: boolean;
}

interface LabelData {
  shopName: string;
  productName: string;
  date: string;
  article: string;
  price: string;
  barcode: string;
}

// ─── Barcode component ────────────────────────────────────────────────────────

function Barcode({ value, height = 32, fontSize = 8 }: { value: string; height?: number; fontSize?: number }) {
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

// ─── Single Label ─────────────────────────────────────────────────────────────

function LabelCard({
  data,
  fields,
  size,
}: {
  data: LabelData;
  fields: LabelFields;
  size: LabelSize;
}) {
  const isLarge = size === "large";
  const is30 = size === "small30";

  if (isLarge) {
    if (fields.bigPrice) {
      return (
        <div
          className="label-card border border-gray-300 bg-white"
          style={{ width: "91mm", height: "62mm", padding: "3mm", boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}
        >
          {/* Row 1: shop name */}
          {fields.shopName && (
            <div style={{ fontSize: "9pt", fontWeight: 700, textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "1.5mm", marginBottom: "1.5mm", color: "#000", flexShrink: 0 }}>
              {data.shopName}
            </div>
          )}
          {/* Row 2: product name full width */}
          {fields.productName && (
            <div style={{ fontSize: "9pt", fontWeight: 700, lineHeight: 1.2, color: "#000", marginBottom: "1.5mm", flexShrink: 0 }}>
              {data.productName}
            </div>
          )}
          {/* Row 3: bottom area — left: barcode+meta, right: big price */}
          <div style={{ display: "flex", flex: 1, gap: "2mm", minHeight: 0, alignItems: "flex-end" }}>
            {/* Left column: barcode, then article + date */}
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
            {/* Right column: huge price + ₽ bottom-right */}
            {fields.price && (
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
                <div style={{ fontSize: "34pt", fontWeight: 900, color: "#000", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {data.price}
                </div>
                <div style={{ fontSize: "10pt", fontWeight: 700, color: "#000", marginTop: "0.5mm" }}>₽</div>
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

  // Small variants
  const w = is30 ? "60mm" : "65mm";
  const h = is30 ? "26mm" : "29mm";
  const p = "1.5mm";

  return (
    <div
      className="label-card border border-gray-300 bg-white flex flex-col"
      style={{ width: w, height: h, padding: p, boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}
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

// ─── Print Sheet Preview ──────────────────────────────────────────────────────

function PrintSheet({
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Labels() {
  const [size, setSize] = useState<LabelSize>("large");
  const [copies, setCopies] = useState(9);
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

  const fieldLabels: { key: keyof LabelFields; label: string; onlyLarge?: boolean }[] = [
    { key: "shopName", label: "Название магазина" },
    { key: "productName", label: "Название товара" },
    { key: "date", label: "Дата" },
    { key: "article", label: "Артикул поставщика" },
    { key: "price", label: "Цена" },
    { key: "barcode", label: "Штрихкод" },
    { key: "bigPrice", label: "Крупная цена (1/4 ценника)", onlyLarge: true },
  ];

  const sizeOptions: { id: LabelSize; label: string; sub: string }[] = [
    { id: "large", label: "Большой", sub: "9 на листе А4" },
    { id: "small20", label: "Маленький 20", sub: "20 на листе А4" },
    { id: "small30", label: "Маленький 30", sub: "30 на листе А4" },
  ];

  return (
    <>
      {/* Hidden print portal */}
      <div id="print-portal" style={{ display: "none", position: "fixed", inset: 0, zIndex: 9999, background: "#fff" }}>
        <PrintSheet data={data} fields={fields} size={size} copies={copies} />
      </div>

      <div className="flex gap-5 h-full">
        {/* ── Left Panel ── */}
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

          {/* Data editor */}
          <div className="stat-card space-y-3">
            <div className="section-title mb-1">Данные</div>
            {[
              { key: "shopName", label: "Магазин", show: fields.shopName },
              { key: "productName", label: "Товар", show: fields.productName },
              { key: "date", label: "Дата", show: fields.date },
              { key: "article", label: "Артикул", show: fields.article },
              { key: "price", label: "Цена", show: fields.price },
              { key: "barcode", label: "Штрихкод", show: fields.barcode },
            ]
              .filter((f) => f.show)
              .map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                  <input
                    value={data[f.key as keyof LabelData]}
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
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
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
                onClick={() => setCopies((c) => Math.min(300, c + 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="Plus" size={14} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {Math.ceil(copies / (size === "large" ? 9 : size === "small20" ? 20 : 30))} лист(а) А4
            </div>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            <Icon name="Printer" size={17} />
            Печать / PDF
          </button>
        </div>

        {/* ── Right: Preview ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="section-title">
              Предпросмотр
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({copies} шт. · {Math.ceil(copies / (size === "large" ? 9 : size === "small20" ? 20 : 30))} стр.)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="Info" size={13} />
              Реальный размер при печати
            </div>
          </div>

          {/* Sheet preview — scaled */}
          <div
            className="flex-1 overflow-auto scrollbar-thin rounded-lg border border-border"
            style={{ background: "hsl(220 14% 12%)" }}
          >
            <div className="p-6 flex flex-col items-center gap-4">
              {Array.from({ length: Math.ceil(copies / (size === "large" ? 9 : size === "small20" ? 20 : 30)) }).map((_, pi) => {
                const perPage = size === "large" ? 9 : size === "small20" ? 20 : 30;
                const cols = size === "large" ? 3 : size === "small20" ? 4 : 5;
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
                      gap: "2mm",
                      alignContent: "start",
                      transform: "scale(0.55)",
                      transformOrigin: "top center",
                      marginBottom: "-95mm",
                    }}
                  >
                    {Array.from({ length: count }).map((_, i) => (
                      <LabelCard key={i} data={data} fields={fields} size={size} />
                    ))}
                  </div>
                );
              })}
              <div style={{ height: "20px" }} />
            </div>
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