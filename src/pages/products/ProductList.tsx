import { useState, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Product, fmt } from "./products.types";

/* ── Тултип поставщика ─────────────────────────────────────────── */
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

/* ── Кликабельный текст с копированием и подсветкой ────────────── */
function CopyText({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || value === "—") return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [value]);

  return (
    <span
      onClick={copy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Нажмите, чтобы скопировать"
      className={"cursor-pointer select-none rounded-sm px-0.5 -mx-0.5 transition-all duration-100 " + className}
      style={{
        background: copied
          ? "hsl(var(--wms-green) / 0.15)"
          : hovered
          ? "hsl(var(--wms-blue) / 0.12)"
          : "transparent",
        color: copied ? "hsl(var(--wms-green))" : undefined,
        outline: hovered && !copied ? "1px solid hsl(var(--wms-blue) / 0.3)" : "none",
      }}
    >
      {copied ? "✓ скопировано" : value}
    </span>
  );
}

/* ── Просмотр фото ──────────────────────────────────────────────── */
function PhotoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <img
        src={src}
        alt="фото"
        className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 p-2 rounded-full"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
        onClick={onClose}
      >
        <Icon name="X" size={20} />
      </button>
    </div>
  );
}

/* ── Фильтр ─────────────────────────────────────────────────────── */
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
  barcode: true, article: true, supplier: true,
  price: true, qty: true, cells: true,
};

/* ── Props ──────────────────────────────────────────────────────── */
interface Props {
  products: Product[];
  selectedId: string | null;
  onRowClick: (p: Product) => void;
  onEdit: (p: Product) => void;
  onPrint: (p: Product) => void;
}

/* ── Компонент ──────────────────────────────────────────────────── */
export default function ProductList({ products, selectedId, onRowClick, onEdit, onPrint }: Props) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [visible, setVisible] = useState<Record<VisibleField, boolean>>(DEFAULT_FIELDS);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [editPhotoFor, setEditPhotoFor] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoContext(e: React.MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    setEditPhotoFor(p);
    fileRef.current?.click();
  }

  return (
    <div className="w-full flex-shrink-0 flex flex-col gap-3">
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
                    <input type="checkbox" checked={visible[f]} onChange={() => toggleField(f)} className="accent-primary w-3.5 h-3.5" />
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
      <div className="flex-1 overflow-y-auto space-y-1.5" onClick={() => showFilter && setShowFilter(false)}>
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
              className="flex gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all border"
              style={{
                borderColor: isActive ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border) / 0.6)",
                background: isActive ? "hsl(var(--wms-blue) / 0.07)" : "hsl(var(--card))",
              }}
            >
              {/* Фото — ЛКМ просмотр, ПКМ редактировать */}
              <div
                className="w-20 h-20 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center relative group"
                style={{ background: "hsl(var(--wms-surface-2))" }}
                onClick={(e) => { e.stopPropagation(); if (p.photo) setViewPhoto(p.photo); }}
                onContextMenu={(e) => handlePhotoContext(e, p)}
                title={p.photo ? "ЛКМ — просмотр, ПКМ — изменить фото" : "ПКМ — добавить фото"}
              >
                {p.photo ? (
                  <>
                    <img src={p.photo} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Icon name="ZoomIn" size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground opacity-40 group-hover:opacity-70 transition-opacity">
                    <Icon name="ImagePlus" size={22} />
                  </div>
                )}
              </div>

              {/* Данные */}
              <div className="flex-1 min-w-0 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                {/* Название */}
                <div className="text-base font-semibold text-foreground leading-snug">
                  <CopyText value={p.name} />
                </div>

                {/* Штрихкод */}
                {visible.barcode && p.barcode && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Barcode" size={12} className="opacity-50 flex-shrink-0" />
                    <CopyText value={p.barcode} />
                  </div>
                )}

                {/* Артикул + OEM */}
                {visible.article && (p.manufacturerArticle || p.oem) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                    <Icon name="Hash" size={12} className="opacity-50 flex-shrink-0" />
                    {p.manufacturerArticle && <CopyText value={p.manufacturerArticle} />}
                    {p.oem && (
                      <>
                        <span className="opacity-30 text-xs">OEM</span>
                        <CopyText value={p.oem} />
                      </>
                    )}
                  </div>
                )}

                {/* Артикулы поставщиков */}
                {visible.supplier && p.supplierArticles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.supplierArticles.map((sa, i) => (
                      <SupplierTooltip key={i} text={sa.supplierName}>
                        <span
                          className="text-xs px-2 py-0.5 rounded cursor-pointer transition-all hover:brightness-110"
                          style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(sa.article); }}
                          title={`${sa.supplierName} — нажмите для копирования`}
                        >
                          {sa.article}
                        </span>
                      </SupplierTooltip>
                    ))}
                  </div>
                )}

                {/* Остаток + ячейки */}
                <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                  {visible.qty && (
                    <div
                      className="text-xs font-medium px-2 py-0.5 rounded"
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
                  {visible.cells && p.cells.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Цена + кнопки */}
              <div className="flex flex-col items-end justify-between flex-shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                {visible.price && (
                  <div className="text-base font-bold" style={{ color: "hsl(var(--wms-blue))" }}>
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
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button
                    onClick={() => onPrint(p)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    title="Печать ценника"
                  >
                    <Icon name="Printer" size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Просмотр фото на весь экран */}
      {viewPhoto && <PhotoViewer src={viewPhoto} onClose={() => setViewPhoto(null)} />}

      {/* Скрытый input для замены фото через ПКМ */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !editPhotoFor) return;
          e.target.value = "";
          const confirmed = window.confirm(`Заменить фото товара «${editPhotoFor.name}»?`);
          if (!confirmed) { setEditPhotoFor(null); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 650; canvas.height = 650;
              const ctx = canvas.getContext("2d")!;
              const asp = img.naturalWidth / img.naturalHeight;
              let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
              if (asp > 1) { sx = (sw - sh) / 2; sw = sh; }
              else if (asp < 1) { sy = (sh - sw) / 2; sh = sw; }
              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 650, 650);
              const dataUrl = canvas.toDataURL("image/webp", 0.88);
              editPhotoFor.photo = dataUrl;
              setEditPhotoFor(null);
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}
