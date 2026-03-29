export type LabelSize = "large" | "small" | "thermo58x40" | "thermo58x30" | "thermo40x25";

export interface LabelFields {
  shopName: boolean;
  productName: boolean;
  date: boolean;
  article: boolean;
  price: boolean;
  barcode: boolean;
  bigPrice: boolean;
}

export interface LabelStyle {
  priceScaleX: number;
  priceScaleY: number;
  priceFont: string;
}

export interface LabelData {
  shopName: string;
  productName: string;
  date: string;
  article: string;
  price: string;
  barcode: string;
}