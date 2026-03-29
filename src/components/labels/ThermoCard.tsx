import { useRef, useState, useCallback, useEffect } from "react";
import type { LabelData, LabelFields, ThermoWordStyle } from "./types";
import { Barcode } from "./Barcode";
import type { ThermoFieldKey } from "./WordSpans";

// Читает plain text из contentEditable (br → \n)
function getPlainText(el: HTMLElement): string {
  return Array.from(el.childNodes).map((node) => {
    if (node.nodeName === "BR") return "\n";
    return node.textContent ?? "";
  }).join("");
}

// Читает innerHTML без лишних атрибутов — для сохранения стилей слов
function getRichHTML(el: HTMLElement): string {
  return el.innerHTML;
}

// Редактируемое поле — contentEditable, сохраняет rich HTML (span со стилями)
function EditableField({
  value, fieldKey, style, onCommit,
}: {
  value: string;
  fieldKey: ThermoFieldKey;
  style?: React.CSSProperties;
  onCommit: (field: ThermoFieldKey, plain: string, html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const isHtml = value.includes("<");

  const handleInput = useCallback(() => {
    if (composing.current || !ref.current) return;
    onCommit(fieldKey, getPlainText(ref.current), getRichHTML(ref.current));
  }, [fieldKey, onCommit]);

  // Синхронизируем DOM только когда элемент не в фокусе
  const syncRef = useCallback((el: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el || document.activeElement === el) return;
    const html = isHtml ? value : value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value, isHtml]);

  return (
    <div
      ref={syncRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      style={{ outline: "none", cursor: "text", whiteSpace: "pre-wrap", minWidth: "4px", ...style }}
      onInput={handleInput}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={() => {
        composing.current = false;
        if (ref.current) onCommit(fieldKey, getPlainText(ref.current), getRichHTML(ref.current));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.execCommand("insertLineBreak");
        }
      }}
    />
  );
}

// Тулбар появляется при выделении текста внутри карточки
function SelectionToolbar({
  cardRef,
  defaultFs,
  defaultFw,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  defaultFs: number;
  defaultFw: number;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [fs, setFs] = useState(defaultFs);
  const [fw, setFw] = useState(defaultFw);

  const update = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return; }
    const card = cardRef.current;
    if (!card) return;
    const range = sel.getRangeAt(0);
    if (!card.contains(range.commonAncestorContainer)) { setPos(null); return; }
    const rect = range.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    setPos({ top: rect.top - cardRect.top, left: rect.left - cardRect.left + rect.width / 2 });
    // Читаем стиль начала выделения
    const node = range.startContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    if (el) {
      const cs = window.getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      if (!isNaN(px)) setFs(Math.round(px * 0.75 * 2) / 2);
      const w = parseInt(cs.fontWeight);
      if (!isNaN(w)) setFw(w);
    }
  }, [cardRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, [update]);

  // Оборачивает выделение в span с нужным стилем
  const wrapSelection = (css: Partial<CSSStyleDeclaration>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    Object.assign(span.style, css);
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    // Восстанавливаем выделение на новый span
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);
    span.closest("[contenteditable]")?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const changeSize = (delta: number) => {
    const next = Math.min(20, Math.max(4, Math.round((fs + delta) * 2) / 2));
    wrapSelection({ fontSize: `${next}pt` });
    setFs(next);
  };

  const changeFw = (weight: number) => {
    wrapSelection({ fontWeight: String(weight) });
    setFw(weight);
  };

  if (!pos) return null;

  const divider = <div key="div" style={{ width: "1px", height: "14px", background: "#334155", margin: "0 2px" }} />;
  const btn = (label: string, onClick: () => void, color = "#94a3b8", bg = "none") => (
    <button
      key={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{ color, background: bg, border: "none", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", lineHeight: 1.4, fontWeight: label === "B" ? 700 : label === "X" ? 900 : 400 }}
    >{label}</button>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: pos.top - 38,
        left: pos.left,
        transform: "translateX(-50%)",
        background: "#1e293b",
        borderRadius: "6px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: 200,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {btn("−", () => changeSize(-0.5))}
      <span style={{ color: "#f1f5f9", fontSize: "11px", minWidth: "30px", textAlign: "center" }}>{fs}pt</span>
      {btn("+", () => changeSize(0.5))}
      {divider}
      {btn("N", () => changeFw(400), fw === 400 ? "#fff" : "#94a3b8", fw === 400 ? "#2563eb" : "none")}
      {btn("B", () => changeFw(700), fw === 700 ? "#fff" : "#94a3b8", fw === 700 ? "#2563eb" : "none")}
      {btn("X", () => changeFw(900), fw === 900 ? "#fff" : "#94a3b8", fw === 900 ? "#2563eb" : "none")}
    </div>
  );
}

export function ThermoCard({
  tw, th, tp, data, fields, barcodeH, barcodeFontSize,
  defaultFs, defaultFw, editable, onDataChange,
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
  const cardRef = useRef<HTMLDivElement>(null);

  // Сохраняем HTML-значение в поле (rich text со span-стилями)
  const handleCommit = useCallback((field: ThermoFieldKey, _plain: string, html: string) => {
    onDataChange?.(field, html);
  }, [onDataChange]);

  const baseStyle = (color = "#000"): React.CSSProperties => ({
    fontSize: `${defaultFs}pt`,
    fontWeight: defaultFw,
    color,
    lineHeight: 1.3,
  });

  const field = (fieldKey: ThermoFieldKey, value: string, style?: React.CSSProperties) =>
    editable ? (
      <EditableField key={fieldKey} value={value} fieldKey={fieldKey} style={style} onCommit={handleCommit} />
    ) : (
      <span key={fieldKey} style={style} dangerouslySetInnerHTML={{ __html: value.replace(/\n/g, "<br>") }} />
    );

  return (
    <div
      ref={cardRef}
      className="label-card bg-white"
      style={{ width: tw, height: th, padding: tp, boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "visible", border: "1px solid #ccc", borderRadius: "2mm", position: "relative" }}
    >
      {editable && <SelectionToolbar cardRef={cardRef} defaultFs={defaultFs} defaultFw={defaultFw} />}

      {fields.shopName && (
        <div style={{ ...baseStyle(), textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.3mm", marginBottom: "0.5mm", flexShrink: 0 }}>
          {field("shopName", data.shopName, { display: "block", width: "100%", textAlign: "center" })}
        </div>
      )}
      {fields.productName && (
        <div style={{ ...baseStyle(), marginBottom: "0.5mm", flexShrink: 0, overflow: "hidden" }}>
          {field("productName", data.productName)}
        </div>
      )}
      <div style={{ display: "flex", flex: 1, gap: "1mm", minHeight: 0, alignItems: "flex-end" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
          {fields.barcode && (
            <div><Barcode value={data.barcode} height={barcodeH} fontSize={barcodeFontSize} /></div>
          )}
          {fields.article && (
            <div style={{ ...baseStyle("#333"), marginTop: "0.3mm", display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: `${defaultFs}pt`, fontWeight: defaultFw, color: "#333", flexShrink: 0 }}>Арт:</span>
              {field("article", data.article, { color: "#333" })}
            </div>
          )}
          {fields.date && (
            <div style={baseStyle("#333")}>
              {field("date", data.date, { color: "#333" })}
            </div>
          )}
        </div>
        {fields.price && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <div style={{ ...baseStyle(), fontSize: `${defaultFs * 1.8}pt`, lineHeight: 1, display: "flex", alignItems: "baseline" }}>
              {field("price", data.price, { fontSize: `${defaultFs * 1.8}pt`, fontWeight: defaultFw })}
              <span style={{ fontSize: `${defaultFs}pt`, marginLeft: "1px" }}>₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
