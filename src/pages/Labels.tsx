import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import LabelCard from "@/components/labels/LabelCard";
import PrintSheet from "@/components/labels/PrintSheet";
import LabelsPanel from "@/components/labels/LabelsPanel";
import type { LabelData, LabelFields, LabelSize, LabelStyle } from "@/components/labels/types";

type PreviewMode = "single" | "sheet";

const STORAGE_KEY = "labels_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSettings(data: object) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) { /* ignore */ }
}

// Размеры ценников в мм
const LABEL_SIZES: Record<LabelSize, { w: number; h: number; thermo?: boolean }> = {
  large:        { w: 91,  h: 62 },
  small:        { w: 50,  h: 35 },
  thermo58x40:  { w: 58,  h: 40,  thermo: true },
  thermo58x30:  { w: 58,  h: 30,  thermo: true },
  thermo40x25:  { w: 40,  h: 25,  thermo: true },
};

export default function Labels() {
  const saved = loadSettings();

  const validSizes: LabelSize[] = ["large", "small", "thermo58x40", "thermo58x30", "thermo40x25"];
  const savedSize: LabelSize = validSizes.includes(saved?.size) ? saved.size : "large";
  const [size, setSize] = useState<LabelSize>(savedSize);
  const [copies, setCopies] = useState<number>(saved?.copies ?? 9);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("single");
  const [fields, setFields] = useState<LabelFields>(saved?.fields ?? {
    shopName: true,
    productName: true,
    date: true,
    article: true,
    price: true,
    barcode: true,
    bigPrice: false,
  });
  const [data, setData] = useState<LabelData>(saved?.data ?? {
    shopName: "Мой магазин",
    productName: "Кабель витая пара Cat6 бухта 305м",
    date: new Date().toLocaleDateString("ru-RU"),
    article: "КВП-6-305",
    price: "3 200",
    barcode: "460708636012",
  });
  const [labelStyle, setLabelStyle] = useState<LabelStyle>(saved?.labelStyle ?? {
    priceScaleX: 1.0,
    priceScaleY: 1.0,
    priceFont: "'Barlow Condensed', Arial Narrow, sans-serif",
    thermoFontSize: 6,
    thermoFontWeight: 700,
    thermoFields: {},
    thermoWords: {},
  });

  // Сохраняем при каждом изменении
  useEffect(() => {
    saveSettings({ size, copies, fields, data, labelStyle });
  }, [size, copies, fields, data, labelStyle]);

  const toggleField = (key: keyof LabelFields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "print-style";
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #print-portal { display: block !important; }
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

  const isLarge = size === "large";
  const isThermo = !!LABEL_SIZES[size].thermo;
  const labelMmW = LABEL_SIZES[size].w;
  const labelMmH = LABEL_SIZES[size].h;

  // Термопринтер: страница = размер этикетки, 1 шт на страницу
  // А4: считаем сколько влезает с минимальными отступами
  const pageMmW = isThermo ? labelMmW : (isLarge ? 297 : 210);
  const pageMmH = isThermo ? labelMmH : (isLarge ? 210 : 297);
  const marginMm = isThermo ? 0 : 3;
  const gapMm = isThermo ? 0 : 1;
  const cols = isThermo ? 1 : (isLarge ? 3 : 4);
  const usableW = pageMmW - marginMm * 2;
  const usableH = pageMmH - marginMm * 2;
  const colsCalc = isThermo ? 1 : Math.floor((usableW + gapMm) / (labelMmW + gapMm));
  const rowsCalc = isThermo ? 1 : Math.floor((usableH + gapMm) / (labelMmH + gapMm));
  const perPage = isLarge ? 9 : colsCalc * rowsCalc;
  const totalPages = Math.ceil(copies / perPage);
  const pagePxW = pageMmW * 3.7795;
  const pagePxH = pageMmH * 3.7795;

  // Ref на контейнер предпросмотра для динамического масштаба
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const PX_PER_MM = 3.7795;
  // Масштаб листа — вписываем в контейнер с отступом 48px
  const sheetScale = Math.min(
    (containerSize.w - 48) / pagePxW,
    (containerSize.h - 48) / pagePxH,
    1
  );
  const sheetMarginBottom = `-${pagePxH * (1 - sheetScale) + 24}px`;

  // Масштаб одного ценника
  const labelMm = LABEL_SIZES[size];
  const labelPxW = labelMm.w * PX_PER_MM;
  const labelPxH = labelMm.h * PX_PER_MM;
  // Для термо-ленты масштабируем по ширине (лента вертикальная)
  const singleScale = isThermo && previewMode === "sheet"
    ? Math.min((containerSize.w - 80) / labelPxW, 3)
    : Math.min(
        (containerSize.w - 80) / labelPxW,
        (containerSize.h - 80) / labelPxH,
        2.5
      );

  return (
    <>
      <div id="print-portal" style={{ display: "none", position: "fixed", inset: 0, zIndex: 9999, background: "#fff" }}>
        <PrintSheet data={data} fields={fields} size={size} copies={copies} labelStyle={labelStyle} />
      </div>

      <div className="flex gap-5 h-full">
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

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {!isThermo && (
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
            )}
            {isThermo && <div />}
            <div className="text-xs text-muted-foreground">
              {isThermo
                ? `${labelMm.w}×${labelMm.h} мм · ${copies} шт.`
                : previewMode === "sheet"
                  ? `${copies} шт. · ${totalPages} стр.`
                  : `${labelMm.w}×${labelMm.h} мм`}
            </div>
          </div>

          <div
            ref={previewRef}
            className={`flex-1 rounded-lg border border-border ${
              isThermo
                ? "overflow-visible flex items-center justify-center"
                : previewMode === "single"
                  ? "overflow-hidden flex items-center justify-center"
                  : "overflow-auto scrollbar-thin flex flex-col items-center"
            }`}
            style={{ background: "hsl(220 14% 12%)" }}
          >
            {previewMode === "single" || isThermo ? (
              /* Один ценник / этикетка */
              <div style={{
                transform: `scale(${singleScale})`,
                transformOrigin: "center center",
                width: `${labelPxW}px`,
                height: `${labelPxH}px`,
                flexShrink: 0,
                overflow: "visible",
              }}>
                <LabelCard
                  data={data} fields={fields} size={size} labelStyle={labelStyle}
                  onThermoWordStyle={isThermo ? (wordKey, style) => {
                    setLabelStyle((s) => ({
                      ...s,
                      thermoWords: { ...(s.thermoWords ?? {}), [wordKey]: style },
                    }));
                  } : undefined}
                  onThermoDataChange={isThermo ? (field, value) => {
                    setData((d) => ({ ...d, [field]: value }));
                  } : undefined}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center" style={{ gap: `${pagePxH * sheetScale + 16}px`, paddingTop: "24px", paddingBottom: "24px" }}>
                {Array.from({ length: totalPages }).map((_, pi) => {
                  const start = pi * perPage;
                  const count = Math.min(perPage, copies - start);
                  return (
                    <div
                      key={pi}
                      style={{
                        width: `${pagePxW}px`,
                        height: `${pagePxH}px`,
                        background: "#fff",
                        padding: `${marginMm}mm`,
                        boxSizing: "border-box",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gap: `${gapMm}mm`,
                        alignContent: "start",
                        transform: `scale(${sheetScale})`,
                        transformOrigin: "top left",
                        marginBottom: `-${pagePxH * (1 - sheetScale)}px`,
                        marginRight: `-${pagePxW * (1 - sheetScale)}px`,
                        flexShrink: 0,
                      }}
                    >
                      {Array.from({ length: count }).map((_, i) => (
                        <LabelCard key={i} data={data} fields={fields} size={size} labelStyle={labelStyle} />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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