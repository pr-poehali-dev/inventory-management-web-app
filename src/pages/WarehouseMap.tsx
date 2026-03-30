import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Barcode } from "@/components/labels/Barcode";

const API = "https://functions.poehali.dev/fc5c1456-4a2b-4a04-9836-42d09fdcac87";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

interface Zone { id: string; name: string; color: string; sort_order: number; }
interface Rack { id: string; zone_id: string; name: string; rows_count: number; cols_count: number; sort_order: number; }
interface Cell { id: string; rack_id: string; zone_id: string; row_num: number; col_num: number; label: string; barcode: string; is_occupied: boolean; }

function CellLabel({ cell }: { cell: Cell }) {
  return (
    <div style={{ background: "#fff", padding: "4mm 3mm", fontFamily: "Arial, sans-serif", width: "50mm", boxSizing: "border-box" }}>
      <div style={{ fontSize: "8pt", fontWeight: 700, textAlign: "center", marginBottom: "2mm", color: "#000" }}>{cell.label}</div>
      <Barcode value={cell.barcode} height={28} fontSize={7} />
    </div>
  );
}

function PrintCellsWindow({ cells }: { cells: Cell[] }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;border:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      @page { size: 210mm 297mm; margin: 5mm; }
      .grid { display: flex; flex-wrap: wrap; gap: 2mm; }
    </style></head><body><div class="grid">${el.innerHTML}</div></body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  return (
    <div>
      <div ref={printRef} style={{ display: "none" }}>
        {cells.map(cell => <CellLabel key={cell.id} cell={cell} />)}
      </div>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: "hsl(var(--primary))" }}
      >
        <Icon name="Printer" size={15} />
        Печать штрихкодов ({cells.length})
      </button>
    </div>
  );
}

function AddZoneModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl p-6 w-80 shadow-xl border border-border">
        <div className="text-base font-semibold text-foreground mb-4">Новая зона</div>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Название зоны (напр. Зона А)"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 flex-wrap mb-4">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: color === c ? "#fff" : "transparent", boxShadow: color === c ? "0 0 0 2px " + c : "none" }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">Отмена</button>
          <button
            onClick={() => { if (name.trim()) { onSave(name.trim(), color); onClose(); } }}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}
          >Создать</button>
        </div>
      </div>
    </div>
  );
}

function AddRackModal({ zone, onClose, onSave }: { zone: Zone; onClose: () => void; onSave: (name: string, rows: number, cols: number) => void }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl p-6 w-80 shadow-xl border border-border">
        <div className="text-base font-semibold text-foreground mb-1">Новый стеллаж</div>
        <div className="text-xs text-muted-foreground mb-4">Зона: {zone.name}</div>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Название (напр. С-01)"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Рядов (высота)</label>
            <input type="number" min={1} max={20} value={rows} onChange={e => setRows(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Колонок (ширина)</label>
            <input type="number" min={1} max={20} value={cols} onChange={e => setCols(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-4 text-center">Будет создано {rows * cols} ячеек</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">Отмена</button>
          <button
            onClick={() => { if (name.trim()) { onSave(name.trim(), rows, cols); onClose(); } }}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}
          >Создать</button>
        </div>
      </div>
    </div>
  );
}

function RackView({ rack, cells, color, onPrintAll }: { rack: Rack; cells: Cell[]; color: string; onPrintAll: (cells: Cell[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleCell = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const rows = rack.rows_count;
  const cols = rack.cols_count;

  const getCell = (row: number, col: number) =>
    cells.find(c => c.row_num === row && c.col_num === col);

  const selectedCells = cells.filter(c => selected.has(c.id));

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border" style={{ background: color + "18" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold text-foreground">{rack.name}</span>
          <span className="text-xs text-muted-foreground">{rows}×{cols} = {rows * cols} ячеек</span>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => { onPrintAll(selectedCells); setSelected(new Set()); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white"
              style={{ background: color }}
            >
              <Icon name="Printer" size={12} />
              Печать ({selected.size})
            </button>
          )}
          <button
            onClick={() => onPrintAll(cells)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors border border-border"
          >
            <Icon name="Printer" size={12} />
            Все
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: rows }, (_, ri) =>
            Array.from({ length: cols }, (_, ci) => {
              const cell = getCell(ri + 1, ci + 1);
              if (!cell) return <div key={`${ri}-${ci}`} className="h-10 rounded bg-muted opacity-30" />;
              const isSel = selected.has(cell.id);
              return (
                <button
                  key={cell.id}
                  onClick={() => toggleCell(cell.id)}
                  title={cell.label}
                  className="h-10 rounded text-xs font-mono transition-all border-2 flex items-center justify-center leading-tight px-0.5 text-center"
                  style={{
                    background: isSel ? color : cell.is_occupied ? color + "30" : "hsl(var(--muted))",
                    borderColor: isSel ? color : "transparent",
                    color: isSel ? "#fff" : "hsl(var(--foreground))",
                    fontSize: "9px",
                  }}
                >
                  {cell.label.split("-").slice(-2).join("-")}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function WarehouseMap() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);
  const [addRackZone, setAddRackZone] = useState<Zone | null>(null);
  const [printCells, setPrintCells] = useState<Cell[] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(API);
      const d = await r.json();
      setZones(d.zones || []);
      setRacks(d.racks || []);
      setCells(d.cells || []);
      if (!activeZone && d.zones?.length > 0) setActiveZone(d.zones[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createZone = async (name: string, color: string) => {
    const r = await fetch(API + "/zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) });
    const d = await r.json();
    setZones(prev => [...prev, d]);
    setActiveZone(d.id);
  };

  const createRack = async (zone: Zone, name: string, rows: number, cols: number) => {
    const r = await fetch(API + "/racks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zone_id: zone.id, name, rows_count: rows, cols_count: cols }) });
    const d = await r.json();
    setRacks(prev => [...prev, { id: d.id, zone_id: d.zone_id, name: d.name, rows_count: d.rows_count, cols_count: d.cols_count, sort_order: d.sort_order }]);
    setCells(prev => [...prev, ...d.cells]);
  };

  const currentZone = zones.find(z => z.id === activeZone);
  const zoneRacks = racks.filter(r => r.zone_id === activeZone);

  if (printCells) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-foreground font-semibold">Готово к печати: {printCells.length} ячеек</div>
        <PrintCellsWindow cells={printCells} />
        <button onClick={() => setPrintCells(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Назад к складу</button>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar — зоны */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Зоны</span>
          <button onClick={() => setShowAddZone(true)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="Plus" size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-8">Загрузка...</div>
        ) : zones.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">Нет зон.<br/>Создай первую!</div>
        ) : (
          zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
              style={{
                background: activeZone === zone.id ? zone.color + "18" : "hsl(var(--muted))",
                borderColor: activeZone === zone.id ? zone.color + "80" : "hsl(var(--border))",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: zone.color }} />
                <span className="text-sm font-medium text-foreground truncate">{zone.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 pl-4">
                {racks.filter(r => r.zone_id === zone.id).length} стеллажей
              </div>
            </button>
          ))
        )}
      </div>

      {/* Main — стеллажи */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {currentZone ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: currentZone.color }} />
                <span className="text-base font-semibold text-foreground">{currentZone.name}</span>
                <span className="text-sm text-muted-foreground">
                  {zoneRacks.length} стеллажей · {cells.filter(c => c.zone_id === activeZone).length} ячеек
                </span>
              </div>
              <button
                onClick={() => setAddRackZone(currentZone)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: currentZone.color }}
              >
                <Icon name="Plus" size={14} />
                Добавить стеллаж
              </button>
            </div>

            {zoneRacks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <Icon name="LayoutGrid" size={40} className="text-muted-foreground opacity-40" />
                <div className="text-muted-foreground text-sm">В этой зоне нет стеллажей</div>
                <button
                  onClick={() => setAddRackZone(currentZone)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ background: currentZone.color }}
                >
                  Добавить первый стеллаж
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-3 pb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", alignContent: "start" }}>
                {zoneRacks.map(rack => (
                  <RackView
                    key={rack.id}
                    rack={rack}
                    cells={cells.filter(c => c.rack_id === rack.id)}
                    color={currentZone.color}
                    onPrintAll={setPrintCells}
                  />
                ))}
              </div>
            )}
          </>
        ) : !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <Icon name="Warehouse" size={48} className="text-muted-foreground opacity-30" />
            <div className="text-muted-foreground">Создай первую зону склада</div>
            <button
              onClick={() => setShowAddZone(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "hsl(var(--primary))" }}
            >
              Создать зону
            </button>
          </div>
        ) : null}
      </div>

      {showAddZone && <AddZoneModal onClose={() => setShowAddZone(false)} onSave={createZone} />}
      {addRackZone && <AddRackModal zone={addRackZone} onClose={() => setAddRackZone(null)} onSave={(n, r, c) => createRack(addRackZone, n, r, c)} />}
    </div>
  );
}
