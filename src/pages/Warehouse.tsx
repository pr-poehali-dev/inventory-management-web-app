import { useState } from "react";
import Icon from "@/components/ui/icon";

const categories = ["Все", "Кабели", "Розетки", "Инструмент", "Крепёж", "Трубы", "Коробки"];

const products = [
  { id: "00142", name: "Кабель витая пара Cat6 (305м)", barcode: "4607086360124", cell: "A-01-03", qty: 18, unit: "бух", min: 5, category: "Кабели", price: 3200 },
  { id: "00143", name: "Розетка RJ-45 двойная встраиваемая", barcode: "4607086360131", cell: "B-02-05", qty: 145, unit: "шт", min: 50, category: "Розетки", price: 185 },
  { id: "00144", name: "Коннектор RJ-45 (уп. 100шт)", barcode: "4607086360148", cell: "B-02-06", qty: 28, unit: "уп", price: 480, min: 10, category: "Крепёж" },
  { id: "00145", name: "Патч-корд 0.5м синий", barcode: "4607086360155", cell: "C-01-02", qty: 230, unit: "шт", min: 100, category: "Кабели", price: 65 },
  { id: "00146", name: "Труба гофрированная 16мм (50м)", barcode: "4607086360162", cell: "D-03-01", qty: 8, unit: "бух", min: 5, category: "Трубы", price: 720 },
  { id: "00147", name: "Выключатель 2-кл. белый", barcode: "4607086360179", cell: "B-04-02", qty: 12, unit: "шт", min: 50, category: "Розетки", price: 290 },
  { id: "00148", name: "Коробка установочная 65мм", barcode: "4607086360186", cell: "C-02-04", qty: 89, unit: "шт", min: 30, category: "Коробки", price: 18 },
  { id: "00149", name: "Дюбель-гвоздь 6×60 (уп.200шт)", barcode: "4607086360193", cell: "D-01-03", qty: 8, unit: "уп", min: 20, category: "Крепёж", price: 210 },
  { id: "00150", name: "Кабель-канал 20×10 (2м)", barcode: "4607086360200", cell: "A-03-01", qty: 3, unit: "шт", min: 20, category: "Трубы", price: 89 },
];

const zones = [
  { id: "A", name: "Зона А", color: "var(--wms-blue)", cells: 24, occupied: 18 },
  { id: "B", name: "Зона Б", color: "var(--wms-green)", cells: 32, occupied: 29 },
  { id: "C", name: "Зона В", color: "var(--wms-amber)", cells: 20, occupied: 11 },
  { id: "D", name: "Зона Г", color: "var(--wms-red)", cells: 16, occupied: 5 },
];

export default function Warehouse() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Все");
  const [view, setView] = useState<"list" | "map">("list");

  const filtered = products.filter(
    (p) =>
      (cat === "Все" || p.category === cat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search) ||
        p.cell.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, штрихкоду, ячейке..."
            className="w-full bg-card border border-border rounded-md text-sm pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={
                cat === c
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-md">
          <button
            onClick={() => setView("list")}
            className="p-1.5 rounded transition-colors"
            style={view === "list" ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))" } : { color: "hsl(var(--muted-foreground))" }}
          >
            <Icon name="List" size={16} />
          </button>
          <button
            onClick={() => setView("map")}
            className="p-1.5 rounded transition-colors"
            style={view === "map" ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))" } : { color: "hsl(var(--muted-foreground))" }}
          >
            <Icon name="LayoutGrid" size={16} />
          </button>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: "hsl(var(--primary))", color: "#fff" }}
        >
          <Icon name="Plus" size={15} />
          Добавить товар
        </button>
      </div>

      {view === "list" ? (
        <div className="stat-card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">
              Позиции на складе <span className="text-muted-foreground font-normal text-sm ml-2">{filtered.length} позиций</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Download" size={14} />
              Экспорт
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Арт.</th>
                  <th className="text-left">Наименование</th>
                  <th className="text-left">Штрихкод</th>
                  <th className="text-left">Ячейка</th>
                  <th className="text-right">Остаток</th>
                  <th className="text-right">Цена</th>
                  <th className="text-center">Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pct = (p.qty / p.min) * 100;
                  const isLow = pct < 100;
                  return (
                    <tr key={p.id} className="cursor-pointer">
                      <td className="mono text-xs text-muted-foreground">{p.id}</td>
                      <td>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                      </td>
                      <td className="mono text-xs text-muted-foreground">{p.barcode}</td>
                      <td>
                        <span
                          className="mono text-xs font-medium px-2 py-1 rounded"
                          style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                        >
                          {p.cell}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`mono font-semibold ${isLow ? "text-amber-400" : "text-foreground"}`}>
                          {p.qty}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">{p.unit}</span>
                      </td>
                      <td className="text-right mono text-sm">{p.price.toLocaleString("ru")} ₽</td>
                      <td className="text-center">
                        {isLow ? (
                          <span className="badge-out">Мало</span>
                        ) : (
                          <span className="badge-in">Норма</span>
                        )}
                      </td>
                      <td>
                        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                          <Icon name="MoreHorizontal" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Map View */
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map((z) => {
              const pct = Math.round((z.occupied / z.cells) * 100);
              return (
                <div key={z.id} className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-foreground">{z.name}</span>
                    <span className="mono text-xs text-muted-foreground">{z.occupied}/{z.cells}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: `hsl(${z.color})` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{pct}% заполнено</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {zones.map((z) => (
              <div key={z.id} className="stat-card">
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{z.name}</div>
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: z.cells }).map((_, i) => {
                    const occupied = i < z.occupied;
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-sm flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                        title={occupied ? `${z.id}-${String(Math.floor(i / 4) + 1).padStart(2, "0")}-${String((i % 4) + 1).padStart(2, "0")}` : "Свободно"}
                        style={{
                          background: occupied ? `hsl(${z.color} / 0.4)` : "hsl(var(--muted))",
                          border: occupied ? `1px solid hsl(${z.color} / 0.6)` : "1px solid hsl(var(--border))",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: `hsl(${z.color} / 0.4)` }} />
                    Занято
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-muted border border-border" />
                    Свободно
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
