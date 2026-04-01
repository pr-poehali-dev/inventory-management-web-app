/* ─── Типы ──────────────────────────────────────────────────────── */
export interface ReceivingItem {
  id: number;
  name: string;
  barcodes: string[];
  art: string;
  unit: string;
  expected: number;
  received: number;
}

export interface ReceivingDoc {
  id: string;
  supplier: string;
  date: string;
  status: "pending" | "checking" | "done" | "error";
  doc: string;
  items: ReceivingItem[];
}

/* ─── Моковые данные ─────────────────────────────────────────────── */
export const DOCS: ReceivingDoc[] = [
  {
    id: "ПРД-0144", supplier: "ООО Кабельстрой", date: "29.03.2026",
    status: "checking", doc: "НКЛ-0012",
    items: [
      { id: 1, name: "Кабель ВВГ 3х2.5", barcodes: ["4600000012345"], art: "VVG-3x2.5-100", unit: "м", expected: 100, received: 0 },
      { id: 2, name: "Автомат 16А IEK", barcodes: ["4600000023456"], art: "MCB-1P-16A-C", unit: "шт", expected: 20, received: 20 },
      { id: 3, name: "Розетка двойная Legrand", barcodes: ["3414971094536", "3414971094537"], art: "SK-2Z-WHT", unit: "шт", expected: 15, received: 10 },
      { id: 4, name: "Щиток навесной 12 мод.", barcodes: ["4600000034567"], art: "BOX-N-12M", unit: "шт", expected: 5, received: 0 },
      { id: 5, name: "Кабель-канал 25х16", barcodes: [], art: "KK-2516-WH", unit: "м", expected: 50, received: 50 },
    ],
  },
  {
    id: "ПРД-0143", supplier: "ИП Электромонтаж", date: "29.03.2026",
    status: "pending", doc: "НКЛ-0011",
    items: [
      { id: 6, name: "Кабель ВВГ 3х2.5", barcodes: ["4600000012345"], art: "VVG-3x2.5-100", unit: "м", expected: 200, received: 0 },
      { id: 7, name: "Патч-корд 1м Cat6", barcodes: ["4607086360148"], art: "PC-1M-BLU", unit: "шт", expected: 50, received: 0 },
      { id: 8, name: "Труба гофр. 16мм", barcodes: ["4607086360155"], art: "PIPE-16-50", unit: "м", expected: 100, received: 0 },
    ],
  },
  {
    id: "ПРД-0142", supplier: "АО ЭлектроСнаб", date: "28.03.2026",
    status: "done", doc: "НКЛ-0010",
    items: [
      { id: 9, name: "Дюбель-гвоздь 6×60", barcodes: ["4607086360162"], art: "DG-660-200", unit: "уп", expected: 10, received: 10 },
    ],
  },
];

export const STATUS_CFG = {
  pending:  { text: "Ожидает",     color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  checking: { text: "Проверка",    color: "hsl(var(--wms-amber))",        bg: "hsl(var(--wms-amber) / 0.12)" },
  done:     { text: "Принято",     color: "hsl(var(--wms-green))",        bg: "hsl(var(--wms-green) / 0.12)" },
  error:    { text: "Расхождение", color: "hsl(var(--wms-red))",          bg: "hsl(var(--wms-red) / 0.12)" },
};

/* ─── fuzzy-поиск по частям слова в любом порядке ───────────────── */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const parts = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return parts.every((part) => t.includes(part));
}
