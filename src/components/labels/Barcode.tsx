import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({ value, height = 32, fontSize = 8 }: { value: string; height?: number; fontSize?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        fontSize,
        margin: 2,
        displayValue: true,
        background: "transparent",
        lineColor: "#000",
        fontOptions: "bold",
      });
    } catch {
      // invalid barcode value — ignore
    }
  }, [value, height, fontSize]);

  return <svg ref={ref} className="w-full" />;
}
