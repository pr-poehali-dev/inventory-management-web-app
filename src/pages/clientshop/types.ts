export interface GoodItem {
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

export interface GoodDetail {
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

export interface BarcodeRow {
  value: string;
  date: string | null;
}

export interface StockRow {
  sklad: number;
  skladName: string;
  qty: number;
  summa: number;
}

export interface GroupNode {
  code: number;
  name: string;
  parent: number | null;
  children: GroupNode[];
}

export function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtQty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}
