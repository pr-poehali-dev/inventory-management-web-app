import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { GoodDetail, BarcodeRow, StockRow, fmt, fmtQty } from "./types";

const FUNC_DETAIL_URL = "https://functions.poehali.dev/89ed7505-2cd9-4940-a48d-3088f7edb5e0";

export default function GoodsModal({
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
