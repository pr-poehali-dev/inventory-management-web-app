import { useState } from "react";
import type { LabelData, LabelFields, ThermoWordStyle } from "./types";
import { Barcode } from "./Barcode";
import { WordSpans, applyTextOp, deleteSepByTokenIdx, isWordKey, isSepKey, type ThermoFieldKey } from "./WordSpans";

export function ThermoCard({
  tw, th, tp, data, fields, barcodeH, barcodeFontSize,
  defaultFs, defaultFw, words, editable, onWordStyle, onDataChange,
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleWordClick = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Есть ли среди выбранных хотя бы одно слово (не сепаратор)
  const hasWords = [...selected].some(isWordKey);
  // Есть ли хотя бы один сепаратор
  const hasSeps = [...selected].some(isSepKey);

  const firstWordKey = [...selected].find(isWordKey) ?? null;
  const selFs = firstWordKey ? (words[firstWordKey]?.fontSize ?? defaultFs) : defaultFs;
  const selFw = firstWordKey ? (words[firstWordKey]?.fontWeight ?? defaultFw) : defaultFw;

  const applyToSelected = (patch: ThermoWordStyle) => {
    [...selected].filter(isWordKey).forEach((k) => onWordStyle?.(k, { ...(words[k] ?? {}), ...patch }));
  };

  // Удаляет выбранные слова (word-ключи) + выбранные сепараторы (sep-ключи)
  const applyDelete = () => {
    // группируем слова по полю
    const wordsByField: Record<string, number[]> = {};
    [...selected].filter(isWordKey).forEach((k) => {
      const [field, , idxStr] = k.split(":");
      if (!wordsByField[field]) wordsByField[field] = [];
      wordsByField[field].push(parseInt(idxStr));
    });
    // группируем сепараторы по полю: "field:s:tokIdx"
    const sepsByField: Record<string, number[]> = {};
    [...selected].filter(isSepKey).forEach((k) => {
      const [field, , tokIdxStr] = k.split(":");
      if (!sepsByField[field]) sepsByField[field] = [];
      sepsByField[field].push(parseInt(tokIdxStr));
    });

    // Собираем все поля затронутые операцией
    const allFields = new Set([...Object.keys(wordsByField), ...Object.keys(sepsByField)]);
    allFields.forEach((field) => {
      const fieldKey = field as ThermoFieldKey;
      let text = data[fieldKey];
      // Сначала удаляем сепараторы по убыванию tokIdx — пока слова на месте, индексы точные
      const sIdxs = (sepsByField[field] ?? []).sort((a, b) => b - a);
      sIdxs.forEach((tokIdx) => { text = deleteSepByTokenIdx(text, tokIdx); });
      // Потом удаляем слова по убыванию wordIdx
      const wIdxs = (wordsByField[field] ?? []).sort((a, b) => b - a);
      wIdxs.forEach((idx) => { text = applyTextOp(text, idx, "delete"); });
      onDataChange?.(fieldKey, text);
    });
    setSelected(new Set());
  };

  // Вставка пробела/переноса после выбранных слов
  const applyInsert = (op: "space" | "newline") => {
    const byField: Record<string, number[]> = {};
    [...selected].filter(isWordKey).forEach((k) => {
      const [field, , idxStr] = k.split(":");
      if (!byField[field]) byField[field] = [];
      byField[field].push(parseInt(idxStr));
    });
    Object.entries(byField).forEach(([field, indices]) => {
      const fieldKey = field as ThermoFieldKey;
      const sorted = [...indices].sort((a, b) => a - b);
      let text = data[fieldKey];
      sorted.forEach((idx) => { text = applyTextOp(text, idx, op); });
      onDataChange?.(fieldKey, text);
    });
    setSelected(new Set());
  };

  const divider = () => <div style={{ width: "1px", height: "14px", background: "#334155", margin: "0 2px" }} />;
  const btn = (label: string, onClick: () => void, color = "#94a3b8", bg = "none") => (
    <button onClick={onClick} style={{ color, background: bg, border: "none", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", lineHeight: 1.4 }}>{label}</button>
  );

  const baseStyle = (color = "#000"): React.CSSProperties => ({
    fontSize: `${defaultFs}pt`,
    fontWeight: defaultFw,
    color,
    lineHeight: 1.3,
  });

  return (
    <div
      className="label-card bg-white"
      style={{ width: tw, height: th, padding: tp, boxSizing: "border-box", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", overflow: "visible", border: "1px solid #ccc", borderRadius: "2mm", position: "relative" }}
      onClick={() => setSelected(new Set())}
    >
      {/* Тулбар */}
      {editable && selected.size > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            background: "#1e293b", borderRadius: "6px", padding: "4px 8px",
            display: "flex", alignItems: "center", gap: "4px", zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
          }}
        >
          {/* Управление размером/жирностью — только для слов */}
          {hasWords && <>
            {btn("−", () => applyToSelected({ fontSize: Math.max(4, selFs - 0.5) }))}
            <span style={{ color: "#f1f5f9", fontSize: "11px", minWidth: "30px", textAlign: "center" }}>{selFs}pt</span>
            {btn("+", () => applyToSelected({ fontSize: Math.min(20, selFs + 0.5) }))}
            {divider()}
            {([400, 700, 900] as number[]).map((w) => (
              <button key={w} onClick={() => applyToSelected({ fontWeight: w })}
                style={{
                  color: selFw === w ? "#fff" : "#94a3b8", background: selFw === w ? "#2563eb" : "none",
                  border: "none", cursor: "pointer", fontSize: "11px", fontWeight: w, padding: "2px 6px", borderRadius: "4px", lineHeight: 1.4,
                }}
              >{w === 400 ? "N" : w === 700 ? "B" : "X"}</button>
            ))}
            {divider()}
            {btn("_", () => applyInsert("space"), "#94a3b8")}
            {btn("↵", () => applyInsert("newline"), "#94a3b8")}
            {divider()}
          </>}
          {/* del — всегда, удаляет и слова и сепараторы */}
          {(hasWords || hasSeps) && btn("del", applyDelete, "#f87171")}
        </div>
      )}

      {fields.shopName && (
        <div style={{ ...baseStyle(), textAlign: "center", borderBottom: "0.5px solid #ccc", paddingBottom: "0.3mm", marginBottom: "0.5mm", flexShrink: 0 }}>
          <WordSpans text={data.shopName} fieldKey="shopName" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
        </div>
      )}
      {fields.productName && (
        <div style={{ ...baseStyle(), marginBottom: "0.5mm", flexShrink: 0, overflow: "hidden" }}>
          <WordSpans text={data.productName} fieldKey="productName" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
        </div>
      )}
      <div style={{ display: "flex", flex: 1, gap: "1mm", minHeight: 0, alignItems: "flex-end" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
          {fields.barcode && (
            <div><Barcode value={data.barcode} height={barcodeH} fontSize={barcodeFontSize} /></div>
          )}
          {fields.article && (
            <div style={{ ...baseStyle("#333"), marginTop: "0.3mm" }}>
              <WordSpans text={`Арт: ${data.article}`} fieldKey="article" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
            </div>
          )}
          {fields.date && (
            <div style={baseStyle("#333")}>
              <WordSpans text={data.date} fieldKey="date" defaultFs={defaultFs} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
            </div>
          )}
        </div>
        {fields.price && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <div style={{ ...baseStyle(), fontSize: `${defaultFs * 1.8}pt`, lineHeight: 1 }}>
              <WordSpans text={data.price} fieldKey="price" defaultFs={defaultFs * 1.8} defaultFw={defaultFw} words={words} selected={selected} editable={editable} onWordClick={handleWordClick} />
              {" "}<span style={{ fontSize: `${defaultFs}pt` }}>₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}