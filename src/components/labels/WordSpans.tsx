import type { LabelData, ThermoWordStyle } from "./types";

export type ThermoFieldKey = keyof Omit<LabelData, "barcode">;

// Применяет операцию к тексту: удалить слово, вставить пробел или перенос ПОСЛЕ него
export function applyTextOp(text: string, wordIdx: number, op: "delete" | "space" | "newline"): string {
  // Тот же сплит что в WordSpans — чтобы индексы совпадали
  const tokens = text.split(/(\n|[^\S\n]+)/).filter((t) => t !== "");
  // Находим реальные слова (не пробелы и не \n)
  const wordPositions: number[] = [];
  tokens.forEach((t, i) => {
    if (t !== "\n" && !/^\s+$/.test(t)) wordPositions.push(i);
  });
  const tokIdx = wordPositions[wordIdx];
  if (tokIdx === undefined) return text;
  const next = [...tokens];
  if (op === "delete") {
    next.splice(tokIdx, 1);
    // после удаления слова tokIdx теперь указывает на следующий токен
    // предпочитаем убрать разделитель ПЕРЕД удалённым словом (tokIdx-1),
    // если его нет — убираем разделитель ПОСЛЕ (новый tokIdx)
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

// Разбивает текст на слова и рендерит каждое кликабельным спаном
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
  // Разбиваем: сначала \n (отдельный токен), потом пробелы (без \n)
  const tokens = text.split(/(\n|[^\S\n]+)/);
  let wordIdx = 0;
  return (
    <>
      {tokens.map((token, i) => {
        if (token === "\n") return <br key={i} />;
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        if (token === "") return null;
        const key = `${fieldKey}:${wordIdx++}`;
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
