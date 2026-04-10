import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const FUNC_URL = "https://functions.poehali.dev/c9ea37e6-42e6-4703-9de7-6889f45ff132";
const FUNC_DETAIL_URL = "https://functions.poehali.dev/89ed7505-2cd9-4940-a48d-3088f7edb5e0";
const FUNC_GROUPS_URL = "https://functions.poehali.dev/f953c269-2df9-49f3-b70e-95aab47a8fd5";

interface GoodItem {
  code: number;
  name: string;
  art: string;
  price: number;
  price1: number;
  price2: number;
  price3: number;
  unit: string;
  stock: number;
}

interface GoodDetail {
  code: number;
  name: string;
  art: string;
  price: number;
  price1: number;
  price2: number;
  price3: number;
  unit: string;
  firstPrice: number;
  nagrada: number;
  marking: string | null;
  parent: number | null;
  photo: string | null;
}

interface BarcodeRow {
  value: string;
  date: string | null;
}

interface StockRow {
  sklad: number;
  skladName: string;
  qty: number;
  summa: number;
}

interface GroupNode {
  code: number;
  name: string;
  parent: number | null;
  children: GroupNode[];
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ── Узел дерева групп ──────────────────────────────────────────────
function GroupTreeNode({
  node,
  selected,
  onSelect,
  level = 0,
}: {
  node: GroupNode;
  selected: number | null;
  onSelect: (code: number | null) => void;
  level?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors"
        style={{
          paddingLeft: `${8 + level * 14}px`,
          background: selected === node.code ? "hsl(var(--primary) / 0.15)" : "transparent",
          color: selected === node.code ? "hsl(var(--primary))" : "hsl(var(--foreground))",
        }}
        onClick={() => {
          onSelect(selected === node.code ? null : node.code);
          if (hasChildren) setOpen((o) => !o);
        }}
      >
        {hasChildren ? (
          <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} className="flex-shrink-0 text-muted-foreground" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <Icon name="Folder" size={13} className="flex-shrink-0" style={{ color: "hsl(var(--wms-amber))" }} />
        <span className="truncate">{node.name}</span>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <GroupTreeNode key={child.code} node={child} selected={selected} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Карточка товара ───────────────────────────────────────────────
function GoodModal({
  code,
  onClose,
}: {
  code: number;
  onClose: () => void;
}) {
  const [good, setGood] = useState<GoodDetail | null>(null);
  const [barcodes, setBarcodes] = useState<BarcodeRow[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${FUNC_DETAIL_URL}?id=${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setGood(data.good);
        setBarcodes(data.barcodes || []);
        setStocks(data.stocks || []);
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [code]);

  const totalStock = stocks.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="stat-card w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            ) : (
              <div className="font-bold text-lg text-foreground leading-tight">{good?.name}</div>
            )}
            {good?.art && <div className="text-xs text-muted-foreground mono mt-0.5">{good.art}</div>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <Icon name="X" size={20} />
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 rounded bg-muted animate-pulse" style={{ width: `${60 + i * 12}%` }} />
            ))}
          </div>
        )}

        {error && <div className="text-sm" style={{ color: "hsl(var(--wms-red))" }}>{error}</div>}

        {good && !loading && (
          <div className="space-y-5">
            {/* Цены */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Цены</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Основная", value: good.price },
                  { label: "Опт", value: good.price1 },
                  { label: "Опт 2", value: good.price2 },
                  { label: "Опт 3", value: good.price3 },
                ].map((p) => (
                  <div
                    key={p.label}
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">{p.label}</div>
                    <div className="font-semibold mono text-sm" style={{ color: "hsl(var(--primary))" }}>
                      {p.value > 0 ? `${fmt(p.value)} ₽` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Остатки */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Остатки по складам</div>
                <span className="text-xs font-semibold" style={{ color: "hsl(var(--wms-green))" }}>
                  Итого: {fmtQty(totalStock)} {good.unit}
                </span>
              </div>
              {stocks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Нет остатков</div>
              ) : (
                <div className="space-y-1">
                  {stocks.map((s) => (
                    <div key={s.sklad} className="flex items-center justify-between py-1.5 px-3 rounded-md" style={{ background: "hsl(var(--muted))" }}>
                      <span className="text-sm text-foreground">{s.skladName}</span>
                      <span className="font-semibold mono text-sm" style={{ color: "hsl(var(--wms-green))" }}>
                        {fmtQty(s.qty)} {good.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Штрихкоды */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Штрихкоды ({barcodes.length})
              </div>
              {barcodes.length === 0 ? (
                <div className="text-sm text-muted-foreground">Нет штрихкодов</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {barcodes.map((b, i) => (
                    <span
                      key={i}
                      className="mono text-xs px-2.5 py-1 rounded-md"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--wms-blue))" }}
                    >
                      {b.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Доп. поля */}
            {(good.firstPrice > 0 || good.nagrada > 0 || good.marking) && (
              <div className="grid grid-cols-2 gap-3">
                {good.firstPrice > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Первичная цена</div>
                    <div className="text-sm mono">{fmt(good.firstPrice)} ₽</div>
                  </div>
                )}
                {good.nagrada > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Награда</div>
                    <div className="text-sm mono">{fmt(good.nagrada)} ₽</div>
                  </div>
                )}
                {good.marking && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-0.5">Маркировка</div>
                    <div className="text-sm mono text-muted-foreground">{good.marking}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Основная страница ─────────────────────────────────────────────
export default function ClientShopGoods() {
  const [items, setItems] = useState<GoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailCode, setDetailCode] = useState<number | null>(null);
  const LIMIT = 50;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загрузка групп
  useEffect(() => {
    fetch(FUNC_GROUPS_URL)
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || []))
      .catch(() => {});
  }, []);

  // Загрузка товаров
  const loadGoods = useCallback((pg: number, q: string, grp: number | null) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) });
    if (q) params.set("search", q);
    if (grp !== null) params.set("group", String(grp));

    fetch(`${FUNC_URL}?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => setError("Ошибка загрузки данных"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadGoods(page, search, selectedGroup);
  }, [page, search, selectedGroup, loadGoods]);

  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 400);
  };

  const handleGroupSelect = (code: number | null) => {
    setSelectedGroup(code);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Дерево групп */}
      <div className="w-52 flex-shrink-0 stat-card overflow-y-auto scrollbar-thin">
        <div className="section-title mb-3">Группы</div>
        <div
          className="flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm mb-1 transition-colors"
          style={{ background: selectedGroup === null ? "hsl(var(--primary) / 0.15)" : "transparent", color: selectedGroup === null ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
          onClick={() => handleGroupSelect(null)}
        >
          <Icon name="LayoutGrid" size={13} className="flex-shrink-0" />
          <span>Все товары</span>
        </div>
        {groups.map((g) => (
          <GroupTreeNode key={g.code} node={g} selected={selectedGroup} onSelect={handleGroupSelect} />
        ))}
        {groups.length === 0 && (
          <div className="text-xs text-muted-foreground mt-2 px-2">Загрузка...</div>
        )}
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Шапка + поиск */}
        <div className="stat-card">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="section-title flex-1">Товары</div>
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Поиск по названию, артикулу, штрихкоду..."
                className="pl-8 pr-3 py-1.5 text-sm rounded-md border bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-72"
                style={{ borderColor: "hsl(var(--border))" }}
              />
              {searchInput && (
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => handleSearchChange("")}>
                  <Icon name="X" size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {loading ? "Загрузка..." : `${total.toLocaleString("ru-RU")} товаров`}
            </span>
          </div>
        </div>

        {/* Таблица */}
        <div className="stat-card flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-md text-sm" style={{ background: "hsl(var(--wms-red) / 0.1)", color: "hsl(var(--wms-red))" }}>
              {error}
            </div>
          )}

          <div className="overflow-y-auto scrollbar-thin flex-1">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Наименование</th>
                  <th className="text-left">Артикул</th>
                  <th className="text-right">Цена осн.</th>
                  <th className="text-right">Опт</th>
                  <th className="text-right">Остаток</th>
                  <th className="text-left">Ед.</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 && (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {[70, 30, 15, 15, 15, 10].map((w, j) => (
                        <td key={j}>
                          <div className="h-3.5 rounded animate-pulse" style={{ width: `${w}%`, background: "hsl(var(--muted))" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">
                      {search ? "Ничего не найдено" : "Нет товаров"}
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr
                    key={item.code}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setDetailCode(item.code)}
                  >
                    <td>
                      <div className="font-medium text-sm text-foreground">{item.name}</div>
                    </td>
                    <td className="mono text-xs text-muted-foreground">{item.art || "—"}</td>
                    <td className="text-right mono text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
                      {item.price > 0 ? `${fmt(item.price)} ₽` : "—"}
                    </td>
                    <td className="text-right mono text-xs text-muted-foreground">
                      {item.price1 > 0 ? `${fmt(item.price1)} ₽` : "—"}
                    </td>
                    <td className="text-right mono text-sm">
                      <span style={{ color: item.stock > 0 ? "hsl(var(--wms-green))" : "hsl(var(--muted-foreground))" }}>
                        {fmtQty(item.stock)}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between pt-3 mt-3 border-t text-sm"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <span className="text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <Icon name="ChevronsLeft" size={13} />
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <Icon name="ChevronLeft" size={13} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="px-2.5 py-1 rounded text-xs border transition-colors"
                      style={{
                        borderColor: p === page ? "hsl(var(--primary))" : "hsl(var(--border))",
                        background: p === page ? "hsl(var(--primary) / 0.15)" : "transparent",
                        color: p === page ? "hsl(var(--primary))" : undefined,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <Icon name="ChevronRight" size={13} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <Icon name="ChevronsRight" size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модалка карточки */}
      {detailCode !== null && (
        <GoodModal code={detailCode} onClose={() => setDetailCode(null)} />
      )}
    </div>
  );
}