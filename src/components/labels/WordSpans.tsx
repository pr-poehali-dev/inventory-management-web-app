import type { LabelData, ThermoWordStyle } from "./types";

export type ThermoFieldKey = keyof Omit<LabelData, "barcode">;

// Ключи: слово → "field:w:N", разделитель → "field:s:N" (N = индекс токена)
export function isWordKey(key: string) { return key.split(":")[1] === "w"; }
export function isSepKey(key: string) { return key.split(":")[1] === "s"; }

// Удаляет токен по его индексу в массиве tokens (для сепараторов)
export function deleteSepByTokenIdx(text: string, tokIdx: number): string {
  const tokens = text.split(/(\n|[^\S\n]+)/).filter((t) => t !== "");
  tokens.splice(tokIdx, 1);
  return tokens.join("");
}

// Применяет операцию к слову по его wordIdx
export function applyTextOp(text: string, wordIdx: number, op: "delete" | "space" | "newline"): string {
  const tokens = text.split(/(\n|[^\S\n]+)/).filter((t) => t !== "");
  const wordPositions: number[] = [];
  tokens.forEach((t, i) => {
    if (t !== "\n" && !/^\s+$/.test(t)) wordPositions.push(i);
  });
  const tokIdx = wordPositions[wordIdx];
  if (tokIdx === undefined) return text;
  const next = [...tokens];
  if (op === "delete") {
    next.splice(tokIdx, 1);
    const before = next[tokIdx - 1];
    const after = next[tokIdx];
    if (before !== undefined && (before === "\n" || /^\s+$/.test(before))) {
      next.splice(tokIdx - 1, 1);
    } else if (after !== undefined && (after === "\n" || /^\s+$/.test(after))) {
      next.splice(tokIdx, 1);
    }
  } else if (op === "space") {
    next.splice(tokIdx + 1, 0, " ");
  } else if (op === "newline") {
    next.splice(tokIdx + 1, 0, "\n");
  }
  return next.join("");
}

// Разбивает текст на слова и разделители, каждый — кликабельный спан
export function WordSpans({
  text, fieldKey, defaultFs, defaultFw, words, selected, editable,
  onWordClick,
}: {
  text: string;
  fieldKey: ThermoFieldKey;
  defaultFs: number;
  defaultFw: number;
  words: Record<string, ThermoWordStyle>;
  selected: Set<string>;
  editable: boolean;
  onWordClick: (key: string, e: React.MouseEvent) => void;
}) {
  const tokens = text.split(/(\n|[^\S\n]+)/).filter((t) => t !== "");
  let wordIdx = 0;

  return (
    <>
      {tokens.map((token, tokIdx) => {
        // Перенос строки
        if (token === "\n") {
          const key = `${fieldKey}:s:${tokIdx}`;
          const isSelected = selected.has(key);
          if (!editable) return <br key={key} />;
          return (
            <span
              key={key}
              onClick={(e) => onWordClick(key, e)}
              title="перенос строки"
              style={{
                display: "inline-block",
                width: "10px",
                height: `${defaultFs * 1.1}pt`,
                verticalAlign: "middle",
                background: isSelected ? "rgba(239,68,68,0.18)" : "rgba(148,163,184,0.10)",
                outline: isSelected ? "1px solid #ef4444" : "1px dashed #64748b",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "7px",
                lineHeight: 1,
                color: "#64748b",
                textAlign: "center",
                userSelect: "none",
                marginLeft: "1px",
                marginRight: "1px",
              }}
            >↵</span>
          );
        }

        // Пробел(ы)
        if (/^\s+$/.test(token)) {
          const key = `${fieldKey}:s:${tokIdx}`;
          const isSelected = selected.has(key);
          if (!editable) return <span key={key}>{token}</span>;
          return (
            <span
              key={key}
              onClick={(e) => onWordClick(key, e)}
              title="пробел"
              style={{
                display: "inline-block",
                minWidth: "6px",
                width: `${token.length * 4}px`,
                height: `${defaultFs * 1.1}pt`,
                verticalAlign: "middle",
                background: isSelected ? "rgba(239,68,68,0.18)" : "rgba(148,163,184,0.10)",
                outline: isSelected ? "1px solid #ef4444" : "1px dashed #64748b",
                borderRadius: "2px",
                cursor: "pointer",
                userSelect: "none",
                marginLeft: "1px",
                marginRight: "1px",
              }}
            />
          );
        }

        if (token === "") return null;

        // Слово
        const key = `${fieldKey}:w:${wordIdx++}`;
        const ws = words[key];
        const isSelected = selected.has(key);
        return (
          <span
            key={key}
            onClick={editable ? (e) => onWordClick(key, e) : undefined}
            style={{
              fontSize: ws?.fontSize ? `${ws.fontSize}pt` : `${defaultFs}pt`,
              fontWeight: ws?.fontWeight ?? defaultFw,
              cursor: editable ? "pointer" : "default",
              background: isSelected ? "rgba(37,99,235,0.18)" : "transparent",
              borderRadius: "1px",
              outline: isSelected ? "1px solid #2563eb" : "none",
              display: "inline",
            }}
          >{token}</span>
        );
      })}
    </>
  );
}
