import Icon from "@/components/ui/icon";
import { Product, fmt } from "./products.types";

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductPrintModal({ product, onClose }: Props) {
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
