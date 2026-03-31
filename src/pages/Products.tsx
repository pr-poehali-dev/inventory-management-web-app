import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

export interface SupplierArticle {
  supplierName: string;
  article: string;
}

export interface Product {
  id: string;
  name: string;
  manufacturerArticle: string;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  qty: number;
  lowStockThreshold: number;
  barcode: string;
  oem: string;
  photo: string;
  supplierArticles: SupplierArticle[];
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
    qty: 12,
    lowStockThreshold: 50,
    barcode: "4600000012345",
    oem: "",
    photo: "",
    supplierArticles: [
      { supplierName: "ЭлектроОптТорг", article: "KAB-VVG-325" },
      { supplierName: "МегаКабель", article: "VVG3x2.5-BLK" },
    ],
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
    lowStockThreshold: 20,
    barcode: "4600000023456",
    oem: "BA47-29",
    photo: "",
    supplierArticles: [
      { supplierName: "ЭлектроОптТорг", article: "IEK-MCB16-C" },
    ],
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
    lowStockThreshold: 10,
    barcode: "3414971094536",
    oem: "",
    photo: "",
    supplierArticles: [
      { supplierName: "Промэлектро", article: "LGR-SK2Z-W" },
    ],
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
    lowStockThreshold: 5,
    barcode: "4600000034567",
    oem: "",
    photo: "",
    supplierArticles: [
      { supplierName: "МегаКабель", article: "EKF-BOX12N" },
      { supplierName: "Промэлектро", article: "BX-N12-EKF" },
    ],
  },
];

const UNITS = ["шт", "м", "кг", "л", "уп", "рул", "компл"];

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

async function resizeToWebP(file: File | Blob, size = 650): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const aspect = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (aspect > 1) { sx = (sw - sh) / 2; sw = sh; }
      else if (aspect < 1) { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      resolve(canvas.toDataURL("image/webp", 0.88));
    };
    img.src = url;
  });
}

async function urlToWebP(src: string, size = 650): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const aspect = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (aspect > 1) { sx = (sw - sh) / 2; sw = sh; }
      else if (aspect < 1) { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      resolve(canvas.toDataURL("image/webp", 0.88));
    };
    img.onerror = reject;
    img.src = src;
  });
}

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

function PhotoUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File | Blob) => {
    setLoading(true);
    const result = await resizeToWebP(file);
    onChange(result);
    setLoading(false);
  }, [onChange]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) await handleFile(blob);
        return;
      }
    }
  }, [handleFile]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const result = await urlToWebP(urlInput.trim());
      onChange(result);
      setUrlInput("");
      setUrlMode(false);
    } catch {
      alert("Не удалось загрузить изображение по ссылке. Возможно, сайт блокирует загрузку.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? "hsl(var(--wms-blue))" : "hsl(var(--border))",
          background: dragOver ? "hsl(var(--wms-blue) / 0.06)" : "hsl(var(--card))",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) await handleFile(file);
        }}
        onClick={() => !value && fileRef.current?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Icon name="Loader2" size={28} className="animate-spin" />
            <span className="text-xs">Обработка…</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="фото" className="w-full h-full object-cover" />
            <button
              className="absolute top-2 right-2 p-1 rounded-md"
              style={{ background: "hsl(var(--background) / 0.85)" }}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >
              <Icon name="X" size={14} className="text-destructive" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground px-4 text-center">
            <Icon name="ImagePlus" size={32} className="opacity-40" />
            <span className="text-xs leading-relaxed">
              Перетащите, вставьте<br />(Ctrl+V) или нажмите
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md border"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
        >
          <Icon name="Upload" size={12} />
          Файл
        </button>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md border"
          style={{
            borderColor: urlMode ? "hsl(var(--wms-blue))" : "hsl(var(--border))",
            color: urlMode ? "hsl(var(--wms-blue))" : "hsl(var(--muted-foreground))",
          }}
        >
          <Icon name="Link" size={12} />
          Ссылка
        </button>
      </div>

      {urlMode && (
        <div className="flex gap-1.5">
          <input
            className="flex-1 px-2 py-1.5 text-xs rounded-md border bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }}
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrl()}
          />
          <button
            type="button"
            onClick={handleUrl}
            className="px-2 py-1.5 text-xs rounded-md font-medium"
            style={{ background: "hsl(var(--wms-blue))", color: "#fff" }}
          >
            Ок
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PrintLabelModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=420,height=320");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Ценник</title>
    <style>
      @page{size:58mm 40mm;margin:0}
      body{margin:0;padding:6px;font-family:Arial,sans-serif;width:58mm;box-sizing:border-box}
      .name{font-size:9pt;font-weight:bold;line-height:1.2;margin-bottom:3px}
      .art{font-size:7pt;color:#666;margin-bottom:4px}
      .price{font-size:18pt;font-weight:bold;text-align:right}
      .bc{font-size:7pt;text-align:center;color:#555;margin-top:3px}
    </style></head><body>
    <div class="name">${product.name}</div>
    <div class="art">Арт: ${product.manufacturerArticle || product.id}</div>
    <div class="price">${fmt(product.salePrice)} ₽</div>
    <div class="bc">${product.barcode || product.id}</div>
    <script>window.onload=function(){window.print();window.close();}
    </body></html>`);
    w.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl border p-6 w-80 flex flex-col gap-4"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Печать ценника</span>
          <button onClick={onClose}><Icon name="X" size={16} className="text-muted-foreground" /></button>
        </div>
        <div
          className="rounded-lg border p-4 flex flex-col gap-1"
          style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
        >
          <div className="text-sm font-bold text-foreground leading-tight">{product.name}</div>
          <div className="text-xs text-muted-foreground">Арт: {product.manufacturerArticle || product.id}</div>
          <div className="text-2xl font-bold text-right mt-1" style={{ color: "hsl(var(--wms-blue))" }}>
            {fmt(product.salePrice)} ₽
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">{product.barcode || product.id}</div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm"
          style={{ background: "hsl(var(--wms-blue))", color: "#fff" }}
        >
          <Icon name="Printer" size={15} />
          Печать
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-1.5 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

export default function Products() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Product | null>(null);
  const [printTarget, setPrintTarget] = useState<Product | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleRowClick(p: Product) {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setSelected(p);
      setEditing(false);
      setForm(null);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
      }, 230);
    }
  }

  function startEdit(p: Product) {
    setForm({ ...p });
    setEditing(true);
    setSelected(p);
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

  function setF<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function addSupplierArticle() {
    setForm((prev) =>
      prev ? { ...prev, supplierArticles: [...prev.supplierArticles, { supplierName: "", article: "" }] } : prev
    );
  }

  function removeSupplierArticle(i: number) {
    setForm((prev) =>
      prev ? { ...prev, supplierArticles: prev.supplierArticles.filter((_, idx) => idx !== i) } : prev
    );
  }

  function setSupplierArticle(i: number, key: keyof SupplierArticle, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const arr = [...prev.supplierArticles];
      arr[i] = { ...arr[i], [key]: value };
      return { ...prev, supplierArticles: arr };
    });
  }

  const display = form ?? selected;

  return (
    <div className="flex gap-4 h-full">
      {/* Список товаров */}
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
            const isActive = selected?.id === p.id;

            return (
              <div
                key={p.id}
                onDoubleClick={() => handleRowClick(p)}
                onClick={() => handleRowClick(p)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer select-none transition-all"
                style={{
                  background: isActive ? "hsl(var(--wms-blue) / 0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid hsl(var(--wms-blue))" : "2px solid transparent",
                }}
              >
                {/* Миниатюра */}
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

                {/* Данные */}
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

                {/* Кнопки действий */}
                <div className="flex flex-col gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    title="Редактировать"
                  >
                    <Icon name="Pencil" size={13} />
                  </button>
                  <button
                    onClick={() => setPrintTarget(p)}
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

      {/* Правая панель — карточка */}
      <div className="flex-1 min-w-0">
        {display ? (
          <div
            className="rounded-xl border h-full overflow-y-auto"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
          >
            {/* Шапка */}
            <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: "hsl(var(--border))" }}>
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
                <button
                  onClick={() => { cancelEdit(); setSelected(null); }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  title="Закрыть"
                >
                  <Icon name="X" size={16} />
                </button>
                {editing ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="text-sm px-3 py-1.5 rounded-md font-medium border"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveEdit}
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
                      onClick={() => selected && startEdit(selected)}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium"
                      style={{ background: "hsl(var(--wms-blue) / 0.12)", color: "hsl(var(--wms-blue))" }}
                    >
                      <Icon name="Pencil" size={14} />
                      Редактировать
                    </button>
                    <button
                      onClick={() => selected && setPrintTarget(selected)}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium border"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                    >
                      <Icon name="Printer" size={14} />
                      Ценник
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 flex gap-5">
              {/* Фото */}
              <div className="w-44 flex-shrink-0">
                {editing && form ? (
                  <PhotoUploader value={form.photo} onChange={(v) => setF("photo", v)} />
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
                          <tr>
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
                        </>
                      ) : (
                        [
                          { label: "Бренд", value: display.brand || "—" },
                          { label: "Артикул изг.", value: display.manufacturerArticle || "—" },
                          { label: "Штрихкод", value: display.barcode || "—" },
                          { label: "OEM", value: display.oem || "—" },
                          { label: "Единица", value: display.unit },
                          { label: "Мин. остаток", value: `${display.lowStockThreshold} ${display.unit}` },
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <Icon name="Package" size={40} className="opacity-20" />
            <div className="text-sm">Двойной клик на товар — откроется карточка</div>
          </div>
        )}
      </div>

      {printTarget && (
        <PrintLabelModal product={printTarget} onClose={() => setPrintTarget(null)} />
      )}
    </div>
  );
}