import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Product, fmt } from "./products.types";

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded-md whitespace-nowrap z-50 pointer-events-none"
          style={{ background: "hsl(var(--wms-blue))", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: "hsl(var(--wms-blue))" }}
          />
        </span>
      )}
    </span>
  );
}

interface Props {
  products: Product[];
  selectedId: string | null;
  onRowClick: (p: Product) => void;
  onEdit: (p: Product) => void;
  onPrint: (p: Product) => void;
}

export default function ProductList({ products, selectedId, onRowClick, onEdit, onPrint }: Props) {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.manufacturerArticle.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.supplierArticles.some((sa) => sa.article.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Товары</span>
        <button
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium"
          style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
        >
          <Icon name="Plus" size={13} />
          Новый
        </button>
      </div>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск товара..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card"
          style={{ borderColor: "hsl(var(--border))" }}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-px">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">Ничего не найдено</div>
        )}
        {filtered.map((p) => {
          const isLow = p.qty > 0 && p.qty <= p.lowStockThreshold;
          const isOut = p.qty === 0;
          const isActive = selectedId === p.id;

          return (
            <div
              key={p.id}
              onDoubleClick={() => onRowClick(p)}
              onClick={() => onRowClick(p)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer select-none transition-all"
              style={{
                background: isActive ? "hsl(var(--wms-blue) / 0.08)" : "transparent",
                borderLeft: isActive ? "2px solid hsl(var(--wms-blue))" : "2px solid transparent",
              }}
            >
              <div
                className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: "hsl(var(--wms-surface-2))" }}
              >
                {p.photo ? (
                  <img src={p.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Package" size={18} className="text-muted-foreground opacity-40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate leading-tight">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.barcode || "—"}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.manufacturerArticle || "—"}</div>
                    {p.supplierArticles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.supplierArticles.map((sa, i) => (
                          <Tooltip key={i} text={sa.supplierName}>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded cursor-default"
                              style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}
                            >
                              {sa.article}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold" style={{ color: "hsl(var(--wms-blue))" }}>
                      {fmt(p.salePrice)} ₽
                    </div>
                    <div
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={
                        isOut
                          ? { background: "hsl(var(--wms-red) / 0.12)", color: "hsl(var(--wms-red))" }
                          : isLow
                          ? { background: "hsl(var(--wms-amber) / 0.12)", color: "hsl(var(--wms-amber))" }
                          : { background: "hsl(var(--wms-green) / 0.12)", color: "hsl(var(--wms-green))" }
                      }
                    >
                      {p.qty} {p.unit}{isLow && " ⚠"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(p)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  title="Редактировать"
                >
                  <Icon name="Pencil" size={13} />
                </button>
                <button
                  onClick={() => onPrint(p)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  title="Печать ценника"
                >
                  <Icon name="Printer" size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
