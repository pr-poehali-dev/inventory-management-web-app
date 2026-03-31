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

export default function Products() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.manufacturerArticle.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q)
    );
  });

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
              onClick={() => setSelected(p)}
              className="w-full text-left px-3 py-2.5 rounded-md border transition-all"
              style={{
                borderColor: selected?.id === p.id ? "hsl(var(--wms-blue) / 0.5)" : "hsl(var(--border))",
                background:
                  selected?.id === p.id
                    ? "hsl(var(--wms-blue) / 0.06)"
                    : "hsl(var(--card))",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.manufacturerArticle || "—"}</div>
                </div>
                <div className="flex-shrink-0 text-right">
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
            <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <div className="text-xs text-muted-foreground mb-1">{selected.id}</div>
                <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
                {selected.brand && (
                  <div className="text-sm text-muted-foreground mt-0.5">{selected.brand}</div>
                )}
              </div>
              <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium transition-colors" style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}>
                <Icon name="Pencil" size={14} />
                Редактировать
              </button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
              {/* Остаток */}
              <div className="stat-card col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Остаток</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: selected.qty === 0 ? "hsl(var(--wms-red))" : "hsl(var(--wms-green))" }}
                >
                  {fmt(selected.qty)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{selected.unit}</div>
              </div>

              {/* Себестоимость */}
              <div className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">Себестоимость</div>
                <div className="text-2xl font-bold text-foreground">{fmt(selected.costPrice)} ₽</div>
                <div className="text-xs text-muted-foreground mt-0.5">за единицу</div>
              </div>

              {/* Цена продажи */}
              <div className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">Цена продажи</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--wms-blue))" }}>
                  {fmt(selected.salePrice)} ₽
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  наценка {selected.costPrice > 0 ? Math.round(((selected.salePrice - selected.costPrice) / selected.costPrice) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="px-6 pb-6">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                <table className="w-full data-table">
                  <tbody>
                    {[
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
                    ))}
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
