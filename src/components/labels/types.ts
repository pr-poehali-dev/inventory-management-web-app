export type LabelSize = "large" | "small20" | "small30";

export interface LabelFields {
  shopName: boolean;
  productName: boolean;
  date: boolean;
  article: boolean;
  price: boolean;
  barcode: boolean;
  bigPrice: boolean;
}

export interface LabelData {
  shopName: string;
  productName: string;
  date: string;
  article: string;
  price: string;
  barcode: string;
}
