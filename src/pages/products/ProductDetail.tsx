import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Product, SupplierArticle, UNITS, fmt, inputCls } from "./products.types";
import ProductPhotoUploader from "./ProductPhotoUploader";

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
  product: Product;
  editing: boolean;
  form: Product | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onClose: () => void;
  onGoToLabels: () => void;
  setF: <K extends keyof Product>(key: K, value: Product[K]) => void;
  addSupplierArticle: () => void;
  removeSupplierArticle: (i: number) => void;
  setSupplierArticle: (i: number, key: keyof SupplierArticle, value: string) => void;
}

export default function ProductDetail({
  product,
  editing,
  form,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onClose,
  onGoToLabels,
  setF,
  addSupplierArticle,
  removeSupplierArticle,
  setSupplierArticle,
}: Props) {
  const display = form ?? product;

  return (
    <div
      className="relative rounded-xl border h-full overflow-y-auto"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {/* Крестик */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors z-10"
        style={{ color: "hsl(var(--muted-foreground))" }}
        title="Закрыть"
      >
        <Icon name="X" size={16} />
      </button>

      {/* Шапка */}
      <div className="p-5 pr-10 border-b flex items-start justify-between gap-4" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">{display.id}</div>
          {editing && form ? (
            <input
              className={inputCls + " text-base font-semibold"}
              value={form.name}
              onChange={(e) => setF("name", e.target.value)}
            />
          ) : (
            <h2 className="text-lg font-semibold text-foreground truncate">{display.name}</h2>
          )}
          {!editing && display.brand && (
            <div className="text-sm text-muted-foreground mt-0.5">{display.brand}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={onCancelEdit}
                className="text-sm px-3 py-1.5 rounded-md font-medium border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Отмена
              </button>
              <button
                onClick={onSaveEdit}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium"
                style={{ background: "hsl(var(--wms-blue))", color: "#fff" }}
              >
                <Icon name="Check" size={14} />
                Сохранить
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartEdit}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium"
                style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
              >
                <Icon name="Pencil" size={14} />
                Редактировать
              </button>
              <button
                onClick={onGoToLabels}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                <Icon name="Tag" size={14} />
                Ценники и этикетки
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-5 flex gap-5">
        {/* Фото */}
        <div className="w-44 flex-shrink-0">
          {editing && form ? (
            <ProductPhotoUploader value={form.photo} onChange={(v) => setF("photo", v)} />
          ) : (
            <div
              className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--wms-surface-2))" }}
            >
              {display.photo ? (
                <img src={display.photo} alt="фото" className="w-full h-full object-cover" />
              ) : (
                <Icon name="Package" size={40} className="text-muted-foreground opacity-20" />
              )}
            </div>
          )}
        </div>

        {/* Правая часть */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Цены и остатки */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card">
              <div className="text-xs text-muted-foreground mb-1">Остаток</div>
              {editing && form ? (
                <input
                  type="number"
                  className={inputCls + " text-lg font-bold"}
                  value={form.qty}
                  onChange={(e) => setF("qty", Number(e.target.value))}
                />
              ) : (
                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      display.qty === 0
                        ? "hsl(var(--wms-red))"
                        : display.qty <= display.lowStockThreshold
                        ? "hsl(var(--wms-amber))"
                        : "hsl(var(--wms-green))",
                  }}
                >
                  {fmt(display.qty)}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">{display.unit}</div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-muted-foreground mb-1">Себестоимость</div>
              {editing && form ? (
                <input
                  type="number"
                  className={inputCls + " text-lg font-bold"}
                  value={form.costPrice}
                  onChange={(e) => setF("costPrice", Number(e.target.value))}
                />
              ) : (
                <div className="text-2xl font-bold text-foreground">{fmt(display.costPrice)} ₽</div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">за ед.</div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-muted-foreground mb-1">Цена продажи</div>
              {editing && form ? (
                <input
                  type="number"
                  className={inputCls + " text-lg font-bold"}
                  value={form.salePrice}
                  onChange={(e) => setF("salePrice", Number(e.target.value))}
                />
              ) : (
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--wms-blue))" }}>
                  {fmt(display.salePrice)} ₽
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                наценка {display.costPrice > 0 ? Math.round(((display.salePrice - display.costPrice) / display.costPrice) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Реквизиты */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
            <table className="w-full text-sm">
              <tbody>
                {editing && form ? (
                  <>
                    {[
                      { label: "Бренд", key: "brand" as const },
                      { label: "Артикул изг.", key: "manufacturerArticle" as const },
                      { label: "Штрихкод", key: "barcode" as const },
                      { label: "OEM", key: "oem" as const },
                    ].map(({ label, key }, i, arr) => (
                      <tr key={key} className={i < arr.length - 1 ? "border-b" : ""} style={{ borderColor: "hsl(var(--border))" }}>
                        <td className="text-muted-foreground px-3 py-2 w-36">{label}</td>
                        <td className="px-3 py-2">
                          <input
                            className={inputCls}
                            value={form[key] as string}
                            onChange={(e) => setF(key, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
                      <td className="text-muted-foreground px-3 py-2">Единица</td>
                      <td className="px-3 py-2">
                        <select
                          className={inputCls}
                          value={form.unit}
                          onChange={(e) => setF("unit", e.target.value)}
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
                      <td className="text-muted-foreground px-3 py-2">Мин. остаток</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className={inputCls}
                          value={form.lowStockThreshold}
                          onChange={(e) => setF("lowStockThreshold", Number(e.target.value))}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground px-3 py-2">Ячейки</td>
                      <td className="px-3 py-2">
                        <input
                          className={inputCls}
                          placeholder="А-01-1, Б-02-3"
                          value={form.cells.join(", ")}
                          onChange={(e) => setF("cells", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                        />
                      </td>
                    </tr>
                  </>
                ) : (
                  [
                    { label: "Бренд", value: display.brand || "—" },
                    { label: "Артикул изг.", value: display.manufacturerArticle || "—" },
                    { label: "Штрихкод", value: display.barcode || "—" },
                    { label: "OEM", value: display.oem || "—" },
                    { label: "Единица", value: display.unit },
                    { label: "Мин. остаток", value: `${display.lowStockThreshold} ${display.unit}` },
                    { label: "Ячейки", value: display.cells.length ? display.cells.join(", ") : "—" },
                  ].map(({ label, value }, i, arr) => (
                    <tr key={label} className={i < arr.length - 1 ? "border-b" : ""} style={{ borderColor: "hsl(var(--border))" }}>
                      <td className="text-muted-foreground px-3 py-2 w-36">{label}</td>
                      <td className="font-medium text-foreground px-3 py-2">{value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Артикулы поставщиков */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Артикулы поставщиков</span>
              {editing && (
                <button
                  onClick={addSupplierArticle}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                  style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}
                >
                  <Icon name="Plus" size={11} />
                  Добавить
                </button>
              )}
            </div>
            {editing && form ? (
              <div className="flex flex-col gap-2">
                {form.supplierArticles.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2 text-center">Нет артикулов поставщиков</div>
                )}
                {form.supplierArticles.map((sa, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className={inputCls}
                      placeholder="Поставщик"
                      value={sa.supplierName}
                      onChange={(e) => setSupplierArticle(i, "supplierName", e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="Артикул"
                      value={sa.article}
                      onChange={(e) => setSupplierArticle(i, "article", e.target.value)}
                    />
                    <button onClick={() => removeSupplierArticle(i)}>
                      <Icon name="X" size={14} className="text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {display.supplierArticles.length === 0 && (
                  <span className="text-xs text-muted-foreground">Не указаны</span>
                )}
                {display.supplierArticles.map((sa, i) => (
                  <Tooltip key={i} text={sa.supplierName}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-md cursor-default font-medium"
                      style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}
                    >
                      {sa.article}
                    </span>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}