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

export interface ThermoWordStyle {
  fontSize?: number;
  fontWeight?: number;
}

export interface LabelStyle {
  priceScaleX: number;
  priceScaleY: number;
  priceFont: string;
  thermoFontSize: number;
  thermoFontWeight: number;
  thermoFields: Partial<Record<keyof Omit<LabelData, 'barcode'>, ThermoFieldStyle>>;
  thermoWords: Record<string, ThermoWordStyle>;
}

export interface ThermoFieldStyle {
  fontSize: number;
  fontWeight: number;
}

export interface LabelData {
  shopName: string;
  productName: string;
  date: string;
  article: string;
  price: string;
  barcode: string;
}