import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { ReceivingDoc, ReceivingItem, STATUS_CFG } from "./types";

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

interface DocDetailsProps {
  selectedDoc: ReceivingDoc;
  filteredItems: ReceivingItem[];
  itemSearch: string;
  itemSearchRef: React.RefObject<HTMLInputElement>;
  progress: number;
  done: number;
  total: number;
  onItemSearchChange: (value: string) => void;
  onSetReceived: (docId: string, itemId: number, qty: number) => void;
}

export default function DocDetails({
  selectedDoc,
  filteredItems,
  itemSearch,
  itemSearchRef,
  progress,
  done,
  total,
  onItemSearchChange,
  onSetReceived,
}: DocDetailsProps) {
  return (
    <>
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
          onChange={(e) => onItemSearchChange(e.target.value)}
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
                        onChange={(v) => onSetReceived(selectedDoc.id, item.id, v)}
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
    </>
  );
}
