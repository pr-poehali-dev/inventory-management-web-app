import { useRef } from "react";
import Icon from "@/components/ui/icon";

interface BarcodeScannerProps {
  barcode: string;
  lastScans: { code: string; found: boolean }[];
  barcodeRef: React.RefObject<HTMLInputElement>;
  onBarcodeChange: (value: string) => void;
  onScan: () => void;
}

export default function BarcodeScanner({
  barcode,
  lastScans,
  barcodeRef,
  onBarcodeChange,
  onScan,
}: BarcodeScannerProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border"
      style={{ background: "hsl(var(--wms-blue) / 0.06)", borderColor: "hsl(var(--wms-blue) / 0.2)" }}
    >
      <Icon name="ScanBarcode" size={20} className="text-primary flex-shrink-0" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">Сканер штрихкода — фокус всегда здесь</div>
        <div className="flex gap-2">
          <input
            ref={barcodeRef}
            value={barcode}
            onChange={(e) => onBarcodeChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onScan()}
            placeholder="Отсканируйте или введите штрихкод..."
            className="flex-1 px-3 py-1.5 text-sm font-mono rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ borderColor: "hsl(var(--border))" }}
            autoFocus
          />
          <button
            onClick={onScan}
            className="px-4 py-1.5 rounded-md text-sm font-medium"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            Добавить
          </button>
        </div>
      </div>
      {lastScans.length > 0 && (
        <div className="flex-shrink-0 w-44">
          <div className="text-xs text-muted-foreground mb-1">Последние сканы</div>
          <div className="space-y-0.5 max-h-16 overflow-y-auto">
            {lastScans.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-mono">
                <Icon name={s.found ? "Check" : "X"} size={10}
                  style={{ color: s.found ? "hsl(var(--wms-green))" : "hsl(var(--wms-red))" }}
                />
                <span className="truncate" style={{ color: s.found ? "hsl(var(--foreground))" : "hsl(var(--wms-red))" }}>
                  {s.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
