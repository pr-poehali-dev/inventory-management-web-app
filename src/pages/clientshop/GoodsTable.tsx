import Icon from "@/components/ui/icon";
import { GoodItem, fmt, fmtQty } from "./types";

export function GoodsSearchBar({
  searchInput,
  total,
  loading,
  onChange,
}: {
  searchInput: string;
  total: number;
  loading: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="section-title flex-1">Товары</div>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Поиск по названию, артикулу, штрихкоду..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-72"
            style={{ borderColor: "hsl(var(--border))" }}
          />
          {searchInput && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => onChange("")}>
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {loading ? "Загрузка..." : `${total.toLocaleString("ru-RU")} товаров`}
        </span>
      </div>
    </div>
  );
}

export function GoodsPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
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
          onClick={() => onPage(1)}
          className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <Icon name="ChevronsLeft" size={13} />
        </button>
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
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
              onClick={() => onPage(p)}
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
          onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <Icon name="ChevronRight" size={13} />
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onPage(totalPages)}
          className="px-2 py-1 rounded text-xs border disabled:opacity-30 transition-colors hover:border-primary"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <Icon name="ChevronsRight" size={13} />
        </button>
      </div>
    </div>
  );
}

export default function GoodsTable({
  items,
  loading,
  error,
  search,
  page,
  totalPages,
  onRowClick,
  onPage,
}: {
  items: GoodItem[];
  loading: boolean;
  error: string;
  search: string;
  page: number;
  totalPages: number;
  onRowClick: (code: number) => void;
  onPage: (p: number) => void;
}) {
  return (
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
                onClick={() => onRowClick(item.code)}
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

      <GoodsPagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}
