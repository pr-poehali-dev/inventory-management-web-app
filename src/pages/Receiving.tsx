import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

/* ─── Типы ──────────────────────────────────────────────────────── */
interface ReceivingItem {
  id: number;
  name: string;
  barcodes: string[];
  art: string;
  unit: string;
  expected: number;
  received: number;
}

interface ReceivingDoc {
  id: string;
  supplier: string;
  date: string;
  status: "pending" | "checking" | "done" | "error";
  doc: string;
  items: ReceivingItem[];
}

/* ─── Моковые данные ─────────────────────────────────────────────── */
const DOCS: ReceivingDoc[] = [
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

const STATUS_CFG = {
  pending:  { text: "Ожидает",     color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  checking: { text: "Проверка",    color: "hsl(var(--wms-amber))",        bg: "hsl(var(--wms-amber) / 0.12)" },
  done:     { text: "Принято",     color: "hsl(var(--wms-green))",        bg: "hsl(var(--wms-green) / 0.12)" },
  error:    { text: "Расхождение", color: "hsl(var(--wms-red))",          bg: "hsl(var(--wms-red) / 0.12)" },
};

/* ─── fuzzy-поиск по частям слова в любом порядке ───────────────── */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const parts = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return parts.every((part) => t.includes(part));
}

/* ─── Компонент поля количества с колёсиком мыши ────────────────── */
function QtyInput({
  value, onChange, unit,
}: { value: number; onChange: (v: number) => void; unit: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    onChange(Math.max(0, value + (e.deltaY < 0 ? 1 : -1)));
  };
  return (
    <div className="flex items-center gap-1">
      <input
        ref={ref}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        onWheel={handleWheel}
        className="w-20 text-center px-2 py-1 text-sm font-mono rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        style={{ borderColor: "hsl(var(--border))" }}
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

/* ─── Главный компонент ──────────────────────────────────────────── */
export default function Receiving() {
  const [docs, setDocs] = useState<ReceivingDoc[]>(DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>(DOCS[0].id);
  const [docSearch, setDocSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [lastScans, setLastScans] = useState<{ code: string; found: boolean }[]>([]);

  // Диалог выбора накладной при совпадении в нескольких
  const [conflictModal, setConflictModal] = useState<{
    code: string;
    matches: { doc: ReceivingDoc; item: ReceivingItem }[];
  } | null>(null);

  // Диалог привязки нераспознанного штрихкода к товару
  const [bindModal, setBindModal] = useState<{ code: string } | null>(null);
  const [bindSearch, setBindSearch] = useState("");

  const barcodeRef = useRef<HTMLInputElement>(null);
  const itemSearchRef = useRef<HTMLInputElement>(null);

  const selectedDoc = docs.find((d) => d.id === selectedDocId)!;

  /* Фокус всегда в поле штрихкода, если мышь не над полем кол-ва или поиска товара */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isQty = target.closest("[data-qty-input]");
      const isItemSearch = target.closest("[data-item-search]");
      if (!isQty && !isItemSearch) {
        barcodeRef.current?.focus();
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* Обновить количество принятого в конкретном товаре конкретного документа */
  const setReceived = useCallback((docId: string, itemId: number, qty: number) => {
    setDocs((prev) => prev.map((d) =>
      d.id !== docId ? d : {
        ...d,
        items: d.items.map((it) => it.id === itemId ? { ...it, received: qty } : it),
      }
    ));
  }, []);

  /* Обработка сканирования */
  const handleScan = useCallback(() => {
    const code = barcode.trim();
    if (!code) return;
    setBarcode("");

    // Найти все совпадения по штрихкоду во всех документах
    const matches: { doc: ReceivingDoc; item: ReceivingItem }[] = [];
    for (const doc of docs) {
      for (const item of doc.items) {
        if (item.barcodes.includes(code)) {
          matches.push({ doc, item });
        }
      }
    }

    setLastScans((prev) => [{ code, found: matches.length > 0 }, ...prev.slice(0, 7)]);

    if (matches.length === 0) {
      // Нераспознанный штрихкод — предложить привязку
      setBindModal({ code });
      return;
    }

    if (matches.length === 1) {
      // Единственное совпадение — автовыбор
      const { doc, item } = matches[0];
      setSelectedDocId(doc.id);
      setReceived(doc.id, item.id, item.received + 1);
      return;
    }

    // Несколько совпадений — дать выбор
    setConflictModal({ code, matches });
  }, [barcode, docs, setReceived]);

  /* Привязать штрихкод к товару из текущего документа */
  const handleBind = (item: ReceivingItem) => {
    if (!bindModal) return;
    setDocs((prev) => prev.map((d) =>
      d.id !== selectedDocId ? d : {
        ...d,
        items: d.items.map((it) =>
          it.id !== item.id ? it : { ...it, barcodes: [...it.barcodes, bindModal.code] }
        ),
      }
    ));
    setBindModal(null);
    setBindSearch("");
  };

  /* Выбрать документ из конфликтного диалога */
  const handleConflictChoice = ({ doc, item }: { doc: ReceivingDoc; item: ReceivingItem }) => {
    setSelectedDocId(doc.id);
    setReceived(doc.id, item.id, item.received + 1);
    setConflictModal(null);
  };

  /* Фильтрация документов */
  const filteredDocs = docs.filter((d) => {
    const q = docSearch.toLowerCase();
    return (
      d.id.toLowerCase().includes(q) ||
      d.supplier.toLowerCase().includes(q) ||
      d.doc.toLowerCase().includes(q)
    );
  });

  /* Фильтрация позиций в выбранном документе */
  const filteredItems = selectedDoc.items.filter((it) =>
    !itemSearch.trim() ||
    fuzzyMatch(it.name, itemSearch) ||
    fuzzyMatch(it.art, itemSearch) ||
    it.barcodes.some((b) => b.includes(itemSearch))
  );

  const total = selectedDoc.items.reduce((s, i) => s + i.expected, 0);
  const done = selectedDoc.items.reduce((s, i) => s + i.received, 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex gap-4 h-full">

      {/* ── Левая колонка: список документов ─────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <span className="text-sm font-medium text-muted-foreground">Документы приёмки</span>

        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card text-foreground focus:outline-none"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredDocs.map((doc) => {
            const cfg = STATUS_CFG[doc.status];
            const isActive = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
                style={{
                  background: isActive ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
                  borderColor: isActive ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-medium text-primary">{doc.id}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.text}
                  </span>
                </div>
                <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{doc.date}</span>
                  <span className="text-xs text-muted-foreground">{doc.items.length} поз.</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">← {doc.doc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Правая колонка ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        {/* Сканер штрихкода */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border"
          style={{ background: "hsl(var(--wms-blue) / 0.06)", borderColor: "hsl(var(--wms-blue) / 0.2)" }}
        >
          <Icon name="ScanBarcode" size={20} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Сканер штрихкода — фокус всегда здесь</div>
            <div className="flex gap-2">
              <input
                ref={barcodeRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Отсканируйте или введите штрихкод..."
                className="flex-1 px-3 py-1.5 text-sm font-mono rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ borderColor: "hsl(var(--border))" }}
                autoFocus
              />
              <button
                onClick={handleScan}
                className="px-4 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}
              >
                Добавить
              </button>
            </div>
          </div>
          {lastScans.length > 0 && (
            <div className="flex-shrink-0 w-44">
              <div className="text-xs text-muted-foreground mb-1">Последние сканы</div>
              <div className="space-y-0.5 max-h-16 overflow-y-auto">
                {lastScans.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-mono">
                    <Icon name={s.found ? "Check" : "X"} size={10}
                      style={{ color: s.found ? "hsl(var(--wms-green))" : "hsl(var(--wms-red))" }}
                    />
                    <span className="truncate" style={{ color: s.found ? "hsl(var(--foreground))" : "hsl(var(--wms-red))" }}>
                      {s.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Шапка документа */}
        <div className="stat-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-lg font-bold text-primary">{selectedDoc.id}</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ color: STATUS_CFG[selectedDoc.status].color, background: STATUS_CFG[selectedDoc.status].bg }}
                >
                  {STATUS_CFG[selectedDoc.status].text}
                </span>
              </div>
              <div className="text-base font-semibold mt-0.5 text-foreground">{selectedDoc.supplier}</div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Накладная: <span className="text-foreground font-medium">{selectedDoc.doc}</span></span>
                <span>Дата: <span className="text-foreground font-medium">{selectedDoc.date}</span></span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Принято</div>
                  <div className="text-base font-bold font-mono">{done} / {total}</div>
                </div>
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" stroke="hsl(var(--muted))" />
                    <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                      stroke="hsl(var(--wms-green))"
                      strokeDasharray={`${progress * 0.942} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{progress}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-colors text-muted-foreground hover:text-foreground"
                  style={{ borderColor: "hsl(var(--border))" }}>
                  <Icon name="FileText" size={13} />
                  Документ
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                >
                  <Icon name="CheckCircle" size={13} />
                  Принять всё
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Поиск по позициям */}
        <div className="relative" data-item-search>
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={itemSearchRef}
            data-item-search
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Поиск по названию, артикулу, штрихкоду (части слов в любом порядке)..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>

        {/* Таблица позиций */}
        <div className="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b sticky top-0" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Наименование</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Штрихкоды / Артикул</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground w-24">Ожидается</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground w-40">Принято</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground w-28">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</td></tr>
                )}
                {filteredItems.map((item) => {
                  const ok = item.received >= item.expected;
                  const partial = item.received > 0 && item.received < item.expected;
                  const none = item.received === 0;
                  return (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/30"
                      style={{ borderColor: "hsl(var(--border))" }}>
                      <td className="py-2.5 px-3 font-medium text-foreground">{item.name}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          {item.barcodes.length > 0 ? item.barcodes.map((b, i) => (
                            <span key={i} className="text-xs font-mono text-muted-foreground">{b}</span>
                          )) : (
                            <span className="text-xs text-muted-foreground opacity-40">нет штрихкода</span>
                          )}
                          <span className="text-[11px] text-muted-foreground opacity-60">{item.art}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm">
                        {item.expected} <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center" data-qty-input>
                        <QtyInput
                          value={item.received}
                          unit={item.unit}
                          onChange={(v) => setReceived(selectedDoc.id, item.id, v)}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {ok && <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: "hsl(var(--wms-green) / 0.12)", color: "hsl(var(--wms-green))" }}>Принято</span>}
                        {partial && <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: "hsl(var(--wms-amber) / 0.12)", color: "hsl(var(--wms-amber))" }}>Частично</span>}
                        {none && <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>Ожидает</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground"
            style={{ borderColor: "hsl(var(--border))" }}>
            <span>Позиций: <span className="text-foreground font-medium">{filteredItems.length}</span>{itemSearch && ` из ${selectedDoc.items.length}`}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "hsl(var(--wms-green))" }} />
              </div>
              <span className="font-mono">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Диалог: выбор накладной при конфликте ───────────── */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConflictModal(null)}>
          <div className="rounded-xl border p-6 w-96 flex flex-col gap-4"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Выберите накладную</span>
              <button onClick={() => setConflictModal(null)}><Icon name="X" size={16} className="text-muted-foreground" /></button>
            </div>
            <div className="text-sm text-muted-foreground">
              Штрихкод <span className="font-mono text-foreground">{conflictModal.code}</span> найден в нескольких документах:
            </div>
            <div className="flex flex-col gap-2">
              {conflictModal.matches.map(({ doc, item }, i) => {
                const cfg = STATUS_CFG[doc.status];
                return (
                  <button key={i}
                    onClick={() => handleConflictChoice({ doc, item })}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all hover:border-primary"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-primary font-medium">{doc.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, background: cfg.bg }}>{cfg.text}</span>
                      </div>
                      <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.name}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">принято/ожидается</div>
                      <div className="font-mono text-sm font-medium">{item.received}/{item.expected} {item.unit}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Диалог: привязка нераспознанного штрихкода ──────── */}
      {bindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => { setBindModal(null); setBindSearch(""); }}>
          <div className="rounded-xl border p-6 w-[480px] flex flex-col gap-4"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Штрихкод не распознан</span>
              <button onClick={() => { setBindModal(null); setBindSearch(""); }}>
                <Icon name="X" size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              Штрихкод <span className="font-mono font-medium text-foreground">{bindModal.code}</span> не найден ни в одной накладной.
              Найдите товар вручную и привяжите этот штрихкод к нему:
            </div>
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                value={bindSearch}
                onChange={(e) => setBindSearch(e.target.value)}
                placeholder="Название, артикул (части слов в любом порядке)..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ borderColor: "hsl(var(--border))" }}
              />
            </div>
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
              {selectedDoc.items
                .filter((it) => !bindSearch.trim() || fuzzyMatch(it.name, bindSearch) || fuzzyMatch(it.art, bindSearch))
                .map((item) => (
                  <button key={item.id}
                    onClick={() => handleBind(item)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all hover:border-primary"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.art}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ml-3"
                      style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}>
                      Привязать
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
