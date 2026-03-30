import { useState } from "react";
import Icon from "@/components/ui/icon";
import InvoiceImport, { InvoiceRow } from "@/components/receiving/InvoiceImport";

interface Document {
  id: string;
  supplier: string;
  date: string;
  items: number;
  status: string;
  doc: string;
  rows?: InvoiceRow[];
}

const initialDocuments: Document[] = [
  { id: "ПРД-0144", supplier: "ООО Кабельстрой", date: "29.03.2026", items: 5, status: "pending", doc: "ТН-2024-0891" },
  { id: "ПРД-0143", supplier: "ИП Электромонтаж", date: "29.03.2026", items: 12, status: "checking", doc: "УПД-56712" },
  { id: "ПРД-0142", supplier: "АО ЭлектроСнаб", date: "28.03.2026", items: 8, status: "done", doc: "ТН-2024-0880" },
  { id: "ПРД-0141", supplier: "ООО Техносфера", date: "28.03.2026", items: 3, status: "done", doc: "УПД-56680" },
  { id: "ПРД-0140", supplier: "ИП Розниченко", date: "27.03.2026", items: 7, status: "error", doc: "ТН-2024-0871" },
];

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending: { text: "Ожидает", cls: "badge-pending" },
  checking: { text: "Проверка", cls: "badge-out" },
  done: { text: "Принято", cls: "badge-in" },
  error: { text: "Расхождение", cls: "badge-error" },
};

const fallbackItems = [
  { barcode: "4607086360124", name: "Кабель витая пара Cat6 (бухта 305м)", qty: 2, unit: "бух", costPrice: 3200 },
  { barcode: "4607086360131", name: "Коннектор RJ-45 (уп. 100шт)", qty: 5, unit: "уп", costPrice: 480 },
  { barcode: "4607086360148", name: "Патч-корд 1м синий", qty: 50, unit: "шт", costPrice: 95 },
  { barcode: "4607086360155", name: "Труба гофрированная 16мм (бухта 50м)", qty: 3, unit: "бух", costPrice: 720 },
  { barcode: "4607086360162", name: "Дюбель-гвоздь 6×60 (уп. 200шт)", qty: 10, unit: "уп", costPrice: 210 },
];

export default function Receiving() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selected, setSelected] = useState("ПРД-0144");
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);

  const handleScan = () => {
    if (barcode.trim()) {
      setScanned((prev) => [barcode.trim(), ...prev.slice(0, 4)]);
      setBarcode("");
    }
  };

  const handleImport = (rows: InvoiceRow[]) => {
    const today = new Date().toLocaleDateString("ru-RU");
    const newId = `ПРД-${String(Date.now()).slice(-4)}`;
    const currentDoc = documents.find((d) => d.id === selected);
    const newDoc: Document = {
      id: newId,
      supplier: currentDoc?.supplier ?? "Новый поставщик",
      date: today,
      items: rows.length,
      status: "checking",
      doc: `ИМП-${newId}`,
      rows,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelected(newId);
  };

  const selectedDoc = documents.find((d) => d.id === selected);
  const importedRows = selectedDoc?.rows ?? null;

  const totalSum = importedRows
    ? importedRows.reduce((s, r) => s + (r.costTotal > 0 ? r.costTotal : r.costPrice * r.qty), 0)
    : fallbackItems.reduce((s, i) => s + i.qty * i.costPrice, 0);

  return (
    <>
      {showImport && (
        <InvoiceImport
          supplierName={selectedDoc?.supplier}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      <div className="flex gap-4 h-full">
        {/* Left: Document List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Документы приёмки</span>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="FileUp" size={14} />
              Загрузить
            </button>
          </div>

          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Поиск по документу..."
              className="w-full bg-muted border border-border rounded-md text-sm pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2 overflow-y-auto scrollbar-thin flex-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelected(doc.id)}
                className="w-full text-left p-3 rounded-lg border transition-all"
                style={{
                  background: selected === doc.id ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
                  borderColor: selected === doc.id ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-xs font-medium text-primary">{doc.id}</span>
                  <span className={statusLabel[doc.status].cls}>{statusLabel[doc.status].text}</span>
                </div>
                <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{doc.date}</span>
                  <span className="text-xs text-muted-foreground">{doc.items} поз.</span>
                </div>
                <div className="mono text-[10px] text-muted-foreground mt-0.5">{doc.doc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Document Detail */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Scanner bar */}
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
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-1">Последние сканы</div>
                <div className="space-y-0.5">
                  {scanned.map((s, i) => (
                    <div key={i} className="mono text-xs text-foreground">{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="mono text-lg font-bold text-primary">{selected}</span>
                  <span className={statusLabel[selectedDoc?.status ?? "pending"].cls}>
                    {statusLabel[selectedDoc?.status ?? "pending"].text}
                  </span>
                </div>
                <div className="text-base font-semibold mt-0.5">{selectedDoc?.supplier}</div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Документ: <span className="text-foreground font-medium">{selectedDoc?.doc}</span></span>
                  <span>Дата: <span className="text-foreground font-medium">{selectedDoc?.date}</span></span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Icon name="FileUp" size={15} />
                  Накладная
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Icon name="FileText" size={15} />
                  Документ
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
                >
                  <Icon name="CheckCircle" size={15} />
                  Принять
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="stat-card flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title">Позиции документа</div>
              {importedRows && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--wms-green) / 0.15)", color: "hsl(var(--wms-green))" }}
                >
                  Загружено из файла
                </span>
              )}
            </div>
            <div className="overflow-y-auto scrollbar-thin flex-1">
              {importedRows ? (
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left">Наименование</th>
                      <th className="text-left">Арт. пост.</th>
                      <th className="text-left">Бренд</th>
                      <th className="text-right">Кол-во</th>
                      <th className="text-right">Себест.</th>
                      <th className="text-right">Сумма</th>
                      <th className="text-right">Цена прод.</th>
                      <th className="text-center">Метки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.map((item, i) => (
                      <tr key={i} className="cursor-pointer">
                        <td>
                          <div className="font-medium text-sm">{item.name}</div>
                          {item.manufacturerArticle && (
                            <div className="text-xs text-muted-foreground mono">{item.manufacturerArticle}</div>
                          )}
                        </td>
                        <td className="mono text-xs text-muted-foreground">{item.supplierArticle || "—"}</td>
                        <td className="text-sm text-muted-foreground">{item.brand || "—"}</td>
                        <td className="text-right mono">
                          {item.qty} <span className="text-muted-foreground text-xs">{item.unit}</span>
                        </td>
                        <td className="text-right mono text-sm">{item.costPrice.toFixed(2)} ₽</td>
                        <td className="text-right mono text-sm font-medium">
                          {(item.costTotal > 0 ? item.costTotal : item.costPrice * item.qty).toFixed(2)} ₽
                        </td>
                        <td className="text-right mono text-sm">
                          {item.salePrice > 0 ? `${item.salePrice.toFixed(2)} ₽` : "—"}
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            {item.marking?.length > 0 && (
                              <span title="DataMatrix" style={{ color: "hsl(var(--wms-blue))" }}>
                                <Icon name="QrCode" size={13} />
                              </span>
                            )}
                            {item.oem && (
                              <span title="OEM" style={{ color: "hsl(var(--wms-amber))" }}>
                                <Icon name="Link" size={13} />
                              </span>
                            )}
                            {item.unit === "компл." && (
                              <span title="Комплект свечей">🕯️</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left">Штрихкод</th>
                      <th className="text-left">Наименование</th>
                      <th className="text-right">Кол-во</th>
                      <th className="text-right">Себест.</th>
                      <th className="text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fallbackItems.map((item) => (
                      <tr key={item.barcode} className="cursor-pointer">
                        <td className="mono text-xs text-muted-foreground">{item.barcode}</td>
                        <td>
                          <div className="font-medium text-sm">{item.name}</div>
                        </td>
                        <td className="text-right mono">
                          {item.qty} <span className="text-muted-foreground text-xs">{item.unit}</span>
                        </td>
                        <td className="text-right mono text-sm">{item.costPrice.toLocaleString("ru")} ₽</td>
                        <td className="text-right mono text-sm font-medium">
                          {(item.qty * item.costPrice).toLocaleString("ru")} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-sm">
              <span className="text-muted-foreground">
                Итого позиций:{" "}
                <span className="text-foreground font-medium">
                  {importedRows ? importedRows.length : fallbackItems.length}
                </span>
              </span>
              <span className="font-semibold text-foreground">
                Сумма: <span className="text-primary mono">{totalSum.toLocaleString("ru")} ₽</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
