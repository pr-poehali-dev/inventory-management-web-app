import { useState } from "react";
import Icon from "@/components/ui/icon";

export interface Product {
  id: string;
  name: string;
  manufacturerArticle: string;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  qty: number;
  barcode: string;
  oem: string;
  photo: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "ТВР-0001",
    name: "Кабель ВВГ 3х2.5",
    manufacturerArticle: "VVG-3x2.5-100",
    brand: "Кабельстрой",
    unit: "м",
    costPrice: 48,
    salePrice: 65,
    qty: 340,
    barcode: "4600000012345",
    oem: "",
    photo: "",
  },
  {
    id: "ТВР-0002",
    name: "Автоматический выключатель 16А",
    manufacturerArticle: "MCB-1P-16A-C",
    brand: "IEK",
    unit: "шт",
    costPrice: 120,
    salePrice: 185,
    qty: 54,
    barcode: "4600000023456",
    oem: "BA47-29",
    photo: "",
  },
  {
    id: "ТВР-0003",
    name: "Розетка двойная с заземлением",
    manufacturerArticle: "SK-2Z-WHT",
    brand: "Legrand",
    unit: "шт",
    costPrice: 210,
    salePrice: 320,
    qty: 0,
    barcode: "3414971094536",
    oem: "",
    photo: "",
  },
  {
    id: "ТВР-0004",
    name: "Щиток навесной 12 мод.",
    manufacturerArticle: "BOX-N-12M",
    brand: "EKF",
    unit: "шт",
    costPrice: 540,
    salePrice: 790,
    qty: 18,
    barcode: "4600000034567",
    oem: "",
    photo: "",
  },
];

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

const UNITS = ["шт", "м", "кг", "л", "уп", "рул", "компл"];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.manufacturerArticle.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q)
    );
  });

  function startEdit() {
    if (!selected) return;
    setForm({ ...selected });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
  }

  function saveEdit() {
    if (!form) return;
    setProducts((prev) => prev.map((p) => (p.id === form.id ? form : p)));
    setSelected(form);
    setEditing(false);
    setForm(null);
  }

  function setF(key: keyof Product, value: string | number) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  const inputCls = "w-full px-3 py-1.5 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-1";
  const inputStyle = { borderColor: "hsl(var(--border))", ["--tw-ring-color" as string]: "hsl(var(--wms-blue))" };

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Товары</span>
          <button
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors"
            style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
          >
            <Icon name="Plus" size={13} />
            Новый
          </button>
        </div>

        <div className="relative">
          <Icon
            name="Search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск товара..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>

        <div className="space-y-1.5 overflow-y-auto scrollbar-thin flex-1">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">Ничего не найдено</div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); cancelEdit(); }}
              className="w-full text-left px-3 py-2.5 rounded-md border transition-all"
              style={{
                borderColor: selected?.id === p.id ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
                background: selected?.id === p.id ? "hsl(var(--wms-blue) / 0.06)" : "hsl(var(--card))",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.manufacturerArticle || "—"}</div>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={
                      p.qty === 0
                        ? { background: "hsl(var(--wms-red) / 0.12)", color: "hsl(var(--wms-red))" }
                        : { background: "hsl(var(--wms-green) / 0.12)", color: "hsl(var(--wms-green))" }
                    }
                  >
                    {p.qty} {p.unit}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <div
            className="rounded-xl border h-full overflow-y-auto"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground mb-1">{selected.id}</div>
                {editing && form ? (
                  <input
                    className={inputCls + " text-base font-semibold"}
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => setF("name", e.target.value)}
                  />
                ) : (
                  <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
                )}
                {!editing && selected.brand && (
                  <div className="text-sm text-muted-foreground mt-0.5">{selected.brand}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editing ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="text-sm px-3 py-1.5 rounded-md font-medium border transition-colors"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium transition-colors"
                      style={{ background: "hsl(var(--wms-blue))", color: "#fff" }}
                    >
                      <Icon name="Check" size={14} />
                      Сохранить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium transition-colors"
                    style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
                  >
                    <Icon name="Pencil" size={14} />
                    Редактировать
                  </button>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div className="p-6 grid grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">Остаток</div>
                {editing && form ? (
                  <input
                    type="number"
                    className={inputCls + " text-xl font-bold"}
                    style={inputStyle}
                    value={form.qty}
                    onChange={(e) => setF("qty", Number(e.target.value))}
                  />
                ) : (
                  <div className="text-2xl font-bold" style={{ color: selected.qty === 0 ? "hsl(var(--wms-red))" : "hsl(var(--wms-green))" }}>
                    {fmt(selected.qty)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">{selected.unit}</div>
              </div>

              <div className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">Себестоимость</div>
                {editing && form ? (
                  <input
                    type="number"
                    className={inputCls + " text-xl font-bold"}
                    style={inputStyle}
                    value={form.costPrice}
                    onChange={(e) => setF("costPrice", Number(e.target.value))}
                  />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{fmt(selected.costPrice)} ₽</div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">за единицу</div>
              </div>

              <div className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">Цена продажи</div>
                {editing && form ? (
                  <input
                    type="number"
                    className={inputCls + " text-xl font-bold"}
                    style={inputStyle}
                    value={form.salePrice}
                    onChange={(e) => setF("salePrice", Number(e.target.value))}
                  />
                ) : (
                  <div className="text-2xl font-bold" style={{ color: "hsl(var(--wms-blue))" }}>
                    {fmt(selected.salePrice)} ₽
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">
                  наценка {(form ?? selected).costPrice > 0
                    ? Math.round((((form ?? selected).salePrice - (form ?? selected).costPrice) / (form ?? selected).costPrice) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="px-6 pb-6">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                <table className="w-full data-table">
                  <tbody>
                    {editing && form ? (
                      <>
                        <tr>
                          <td className="text-muted-foreground w-48">Артикул изготовителя</td>
                          <td><input className={inputCls} style={inputStyle} value={form.manufacturerArticle} onChange={(e) => setF("manufacturerArticle", e.target.value)} /></td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground">Бренд</td>
                          <td><input className={inputCls} style={inputStyle} value={form.brand} onChange={(e) => setF("brand", e.target.value)} /></td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground">Единица измерения</td>
                          <td>
                            <select
                              className={inputCls}
                              style={inputStyle}
                              value={form.unit}
                              onChange={(e) => setF("unit", e.target.value)}
                            >
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                              {!UNITS.includes(form.unit) && <option value={form.unit}>{form.unit}</option>}
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground">Штрихкод</td>
                          <td><input className={inputCls} style={inputStyle} value={form.barcode} onChange={(e) => setF("barcode", e.target.value)} /></td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground">OEM / Кросс-артикул</td>
                          <td><input className={inputCls} style={inputStyle} value={form.oem} onChange={(e) => setF("oem", e.target.value)} /></td>
                        </tr>
                      </>
                    ) : (
                      [
                        { label: "Артикул изготовителя", value: selected.manufacturerArticle || "—" },
                        { label: "Бренд", value: selected.brand || "—" },
                        { label: "Единица измерения", value: selected.unit || "—" },
                        { label: "Штрихкод", value: selected.barcode || "—" },
                        { label: "OEM / Кросс-артикул", value: selected.oem || "—" },
                      ].map(({ label, value }) => (
                        <tr key={label}>
                          <td className="text-muted-foreground w-48">{label}</td>
                          <td className="font-medium text-foreground">{value}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <Icon name="Package" size={40} className="opacity-20" />
            <div className="text-sm">Выберите товар из списка</div>
          </div>
        )}
      </div>
    </div>
  );
}
