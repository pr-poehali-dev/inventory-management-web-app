import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Product, fmt } from "./products.types";

function SupplierTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded-md whitespace-nowrap z-50 pointer-events-none"
          style={{ background: "hsl(var(--wms-blue))", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "hsl(var(--wms-blue))" }} />
        </span>
      )}
    </span>
  );
}

function CopyChip({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || value === "—") return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [value]);

  return (
    <span
      onClick={copy}
      title={`Скопировать${label ? `: ${label}` : ""}`}
      className="cursor-pointer select-none transition-colors rounded px-0.5"
      style={{ color: copied ? "hsl(var(--wms-green))" : undefined }}
    >
      {copied ? "✓" : value}
    </span>
  );
}

type VisibleField = "barcode" | "article" | "supplier" | "price" | "qty" | "cells";

const FIELD_LABELS: Record<VisibleField, string> = {
  barcode: "Штрихкод",
  article: "Артикул",
  supplier: "Арт. поставщика",
  price: "Цена",
  qty: "Остаток",
  cells: "Ячейки",
};

const DEFAULT_FIELDS: Record<VisibleField, boolean> = {
  barcode: true,
  article: true,
  supplier: true,
  price: true,
  qty: true,
  cells: true,
};

interface Props {
  products: Product[];
  selectedId: string | null;
  onRowClick: (p: Product) => void;
  onEdit: (p: Product) => void;
  onPrint: (p: Product) => void;
}

export default function ProductList({ products, selectedId, onRowClick, onEdit, onPrint }: Props) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [visible, setVisible] = useState<Record<VisibleField, boolean>>(DEFAULT_FIELDS);

  const toggleField = (f: VisibleField) => setVisible((v) => ({ ...v, [f]: !v[f] }));

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.manufacturerArticle.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.oem.toLowerCase().includes(q) ||
      p.supplierArticles.some((sa) => sa.article.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-96 flex-shrink-0 flex flex-col gap-3">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">Товары</span>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md font-medium border transition-colors"
              style={{
                borderColor: showFilter ? "hsl(var(--wms-blue))" : "hsl(var(--border))",
                color: showFilter ? "hsl(var(--wms-blue))" : "hsl(var(--muted-foreground))",
              }}
              title="Настроить отображение полей"
            >
              <Icon name="SlidersHorizontal" size={13} />
            </button>
            {showFilter && (
              <div
                className="absolute top-full right-0 mt-1 z-30 rounded-lg border p-3 flex flex-col gap-1.5 min-w-[170px]"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
              >
                <div className="text-[11px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">Показывать</div>
                {(Object.keys(FIELD_LABELS) as VisibleField[]).map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={visible[f]}
                      onChange={() => toggleField(f)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-foreground">{FIELD_LABELS[f]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium"
            style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
          >
            <Icon name="Plus" size={13} />
            Новый
          </button>
        </div>
      </div>

      {/* Поиск */}
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

      {/* Список */}
      <div className="flex-1 overflow-y-auto space-y-1" onClick={() => showFilter && setShowFilter(false)}>
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
              className="flex gap-3 px-3 py-3 rounded-lg cursor-pointer select-none transition-all border"
              style={{
                borderColor: isActive ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border) / 0.6)",
                background: isActive ? "hsl(var(--wms-blue) / 0.07)" : "hsl(var(--card))",
              }}
            >
              {/* Фото */}
              <div
                className="w-16 h-16 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: "hsl(var(--wms-surface-2))" }}
              >
                {p.photo ? (
                  <img src={p.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Package" size={24} className="text-muted-foreground opacity-30" />
                )}
              </div>

              {/* Данные */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                {/* Название — кликабельно для копирования */}
                <div
                  className="text-sm font-medium text-foreground leading-snug"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(p.name);
                  }}
                  title="Нажмите, чтобы скопировать название"
                >
                  <CopyChip value={p.name} label="название" />
                </div>

                {/* Штрихкод */}
                {visible.barcode && p.barcode && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Icon name="Barcode" size={10} className="opacity-50 flex-shrink-0" />
                    <CopyChip value={p.barcode} label="штрихкод" />
                  </div>
                )}

                {/* Артикул изготовителя */}
                {visible.article && p.manufacturerArticle && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Icon name="Hash" size={10} className="opacity-50 flex-shrink-0" />
                    <CopyChip value={p.manufacturerArticle} label="артикул" />
                    {p.oem && (
                      <>
                        <span className="opacity-30">·</span>
                        <span className="text-[10px] opacity-60">OEM:</span>
                        <CopyChip value={p.oem} label="OEM" />
                      </>
                    )}
                  </div>
                )}

                {/* Артикулы поставщиков */}
                {visible.supplier && p.supplierArticles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {p.supplierArticles.map((sa, i) => (
                      <SupplierTooltip key={i} text={sa.supplierName}>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                          style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(sa.article);
                          }}
                          title={`Скопировать: ${sa.article}`}
                        >
                          {sa.article}
                        </span>
                      </SupplierTooltip>
                    ))}
                  </div>
                )}

                {/* Остаток + ячейки */}
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  {visible.qty && (
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
                  )}
                  {visible.cells && p.cells.length > 0 && p.cells.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Правая колонка: цена + кнопки */}
              <div className="flex flex-col items-end justify-between flex-shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                {visible.price && (
                  <div className="text-sm font-semibold" style={{ color: "hsl(var(--wms-blue))" }}>
                    {fmt(p.salePrice)} ₽
                  </div>
                )}
                <div className="flex gap-0.5">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
