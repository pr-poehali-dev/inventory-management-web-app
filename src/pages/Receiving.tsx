import { useState } from "react";
import Icon from "@/components/ui/icon";
import { InvoiceRow } from "@/components/receiving/InvoiceImport";

interface ReceivingDoc {
  id: string;
  supplier: string;
  date: string;
  items: number;
  status: "pending" | "checking" | "done" | "error";
  doc: string;
  rows?: InvoiceRow[];
}

const initialDocs: ReceivingDoc[] = [
  { id: "ПРД-0144", supplier: "ООО Кабельстрой",  date: "29.03.2026", items: 5,  status: "pending",  doc: "НКЛ-0012" },
  { id: "ПРД-0143", supplier: "ИП Электромонтаж", date: "29.03.2026", items: 12, status: "checking", doc: "НКЛ-0011" },
  { id: "ПРД-0142", supplier: "АО ЭлектроСнаб",  date: "28.03.2026", items: 8,  status: "done",     doc: "НКЛ-0010" },
  { id: "ПРД-0141", supplier: "ООО Техносфера",   date: "28.03.2026", items: 3,  status: "done",     doc: "НКЛ-0009" },
  { id: "ПРД-0140", supplier: "ИП Розниченко",    date: "27.03.2026", items: 7,  status: "error",    doc: "НКЛ-0008" },
];

const STATUS: Record<ReceivingDoc["status"], { text: string; cls: string }> = {
  pending:  { text: "Ожидает",     cls: "badge-pending" },
  checking: { text: "Проверка",    cls: "badge-out" },
  done:     { text: "Принято",     cls: "badge-in" },
  error:    { text: "Расхождение", cls: "badge-error" },
};

const MOCK_ITEMS = [
  { id: 1, name: "Кабель витая пара Cat6 (бухта 305м)", art: "4607086360124", qty: 2, unit: "бух", expected: 2, scanned: 0 },
  { id: 2, name: "Коннектор RJ-45 (уп. 100шт)",         art: "4607086360131", qty: 5, unit: "уп",  expected: 5, scanned: 5 },
  { id: 3, name: "Патч-корд 1м синий",                   art: "4607086360148", qty: 50, unit: "шт", expected: 50, scanned: 48 },
  { id: 4, name: "Труба гофрированная 16мм (бухта 50м)", art: "4607086360155", qty: 3, unit: "бух", expected: 3, scanned: 3 },
  { id: 5, name: "Дюбель-гвоздь 6×60 (уп. 200шт)",      art: "4607086360162", qty: 10, unit: "уп", expected: 10, scanned: 10 },
];

export default function Receiving() {
  const [docs] = useState<ReceivingDoc[]>(initialDocs);
  const [selectedId, setSelectedId] = useState(initialDocs[0].id);
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const selected = docs.find((d) => d.id === selectedId);

  const filtered = docs.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.supplier.toLowerCase().includes(search.toLowerCase()) ||
      d.doc.toLowerCase().includes(search.toLowerCase())
  );

  const handleScan = () => {
    if (!barcode.trim()) return;
    setScanned((prev) => [barcode.trim(), ...prev.slice(0, 9)]);
    setBarcode("");
  };

  const scannedTotal = MOCK_ITEMS.reduce((s, i) => s + i.scanned, 0);
  const expectedTotal = MOCK_ITEMS.reduce((s, i) => s + i.expected, 0);
  const progress = expectedTotal > 0 ? Math.round((scannedTotal / expectedTotal) * 100) : 0;

  return (
    <div className="flex gap-4 h-full">

      {/* ─── Левая колонка: список документов приёмки ─────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Документы приёмки</span>
        </div>

        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full bg-muted border border-border rounded-md text-sm pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2 overflow-y-auto scrollbar-thin flex-1">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              className="w-full text-left p-3 rounded-lg border transition-all"
              style={{
                background: selectedId === doc.id ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
                borderColor: selectedId === doc.id ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="mono text-xs font-medium text-primary">{doc.id}</span>
                <span className={STATUS[doc.status].cls}>{STATUS[doc.status].text}</span>
              </div>
              <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{doc.date}</span>
                <span className="text-xs text-muted-foreground">{doc.items} поз.</span>
              </div>
              <div className="mono text-[10px] text-muted-foreground mt-0.5">← {doc.doc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Правая колонка ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Сканер */}
        <div
          className="flex items-center gap-3 p-4 rounded-lg border"
          style={{ background: "hsl(var(--wms-blue) / 0.06)", borderColor: "hsl(var(--wms-blue) / 0.2)" }}
        >
          <Icon name="ScanBarcode" size={20} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Сканер штрихкода</div>
            <div className="flex gap-2">
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Отсканируйте или введите штрихкод..."
                className="flex-1 bg-background border border-border rounded-md text-sm px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mono"
              />
              <button
                onClick={handleScan}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}
              >
                Добавить
              </button>
            </div>
          </div>
          {scanned.length > 0 && (
            <div className="flex-shrink-0 max-w-[200px]">
              <div className="text-xs text-muted-foreground mb-1">Последние сканы</div>
              <div className="space-y-0.5 max-h-20 overflow-y-auto">
                {scanned.map((s, i) => (
                  <div key={i} className="mono text-xs text-foreground truncate">{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Шапка */}
        <div className="stat-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="mono text-lg font-bold text-primary">{selected?.id}</span>
                {selected && (
                  <span className={STATUS[selected.status].cls}>{STATUS[selected.status].text}</span>
                )}
              </div>
              <div className="text-base font-semibold mt-0.5 text-foreground">{selected?.supplier}</div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Накладная: <span className="text-foreground font-medium">{selected?.doc}</span></span>
                <span>Дата: <span className="text-foreground font-medium">{selected?.date}</span></span>
              </div>
            </div>

            {/* Прогресс приёмки */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Принято</div>
                  <div className="text-base font-bold font-mono text-foreground">
                    {scannedTotal} / {expectedTotal}
                  </div>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold font-mono"
                  style={{
                    background: `conic-gradient(hsl(var(--wms-green)) ${progress * 3.6}deg, hsl(var(--muted)) 0deg)`,
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "hsl(var(--card))" }}
                  >
                    {progress}%
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="FileText" size={14} />
                  Документ
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                >
                  <Icon name="CheckCircle" size={14} />
                  Принять всё
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица позиций */}
        <div className="stat-card flex-1 overflow-hidden flex flex-col">
          <div className="section-title mb-4">Позиции для приёмки</div>
          <div className="overflow-y-auto scrollbar-thin flex-1">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Штрихкод</th>
                  <th className="text-left">Наименование</th>
                  <th className="text-right">Ожидается</th>
                  <th className="text-right">Принято</th>
                  <th className="text-center">Статус</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ITEMS.map((item) => {
                  const ok = item.scanned === item.expected;
                  const partial = item.scanned > 0 && item.scanned < item.expected;
                  const none = item.scanned === 0;
                  return (
                    <tr key={item.id}>
                      <td className="mono text-xs text-muted-foreground">{item.art}</td>
                      <td className="text-sm font-medium text-foreground">{item.name}</td>
                      <td className="text-right mono text-sm">
                        {item.expected} <span className="text-muted-foreground text-xs">{item.unit}</span>
                      </td>
                      <td className="text-right mono text-sm">
                        <span style={{ color: ok ? "hsl(var(--wms-green))" : partial ? "hsl(var(--wms-amber))" : "hsl(var(--muted-foreground))" }}>
                          {item.scanned}
                        </span>
                        {" "}<span className="text-muted-foreground text-xs">{item.unit}</span>
                      </td>
                      <td className="text-center">
                        {ok   && <span className="badge-in">Принято</span>}
                        {partial && <span className="badge-out">Частично</span>}
                        {none && <span className="badge-pending">Ожидает</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className="flex items-center justify-between pt-3 mt-3 border-t text-sm"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <span className="text-muted-foreground">
              Позиций: <span className="text-foreground font-medium">{MOCK_ITEMS.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 w-32 rounded-full overflow-hidden"
                style={{ background: "hsl(var(--muted))" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "hsl(var(--wms-green))" }}
                />
              </div>
              <span className="font-mono text-xs text-foreground">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
