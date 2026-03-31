export interface SupplierArticle {
  supplierName: string;
  article: string;
}

export interface Product {
  id: string;
  name: string;
  manufacturerArticle: string;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  qty: number;
  lowStockThreshold: number;
  barcode: string;
  oem: string;
  photo: string;
  cells: string[];
  supplierArticles: SupplierArticle[];
}

export const UNITS = ["шт", "м", "кг", "л", "уп", "рул", "компл"];

export function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export const inputCls =
  "w-full px-3 py-1.5 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "ТВР-0001",
    name: "Кабель ВВГ 3х2.5",
    manufacturerArticle: "VVG-3x2.5-100",
    brand: "Кабельстрой",
    unit: "м",
    costPrice: 48,
    salePrice: 65,
    qty: 12,
    lowStockThreshold: 50,
    barcode: "4600000012345",
    oem: "",
    photo: "",
    cells: ["А-01-3", "А-01-4"],
    supplierArticles: [
      { supplierName: "ЭлектроОптТорг", article: "KAB-VVG-325" },
      { supplierName: "МегаКабель", article: "VVG3x2.5-BLK" },
    ],
  },
  {
    id: "ТВР-0002",
    name: "Автоматический выключатель 16А",
    manufacturerArticle: "MCB-1P-16A-C",
    brand: "IEK",
    unit: "шт",
    costPrice: 120,
    salePrice: 185,
    qty: 54,
    lowStockThreshold: 20,
    barcode: "4600000023456",
    oem: "BA47-29",
    photo: "",
    cells: ["Б-03-1"],
    supplierArticles: [
      { supplierName: "ЭлектроОптТорг", article: "IEK-MCB16-C" },
    ],
  },
  {
    id: "ТВР-0003",
    name: "Розетка двойная с заземлением",
    manufacturerArticle: "SK-2Z-WHT",
    brand: "Legrand",
    unit: "шт",
    costPrice: 210,
    salePrice: 320,
    qty: 0,
    lowStockThreshold: 10,
    barcode: "3414971094536",
    oem: "",
    photo: "",
    cells: [],
    supplierArticles: [
      { supplierName: "Промэлектро", article: "LGR-SK2Z-W" },
    ],
  },
  {
    id: "ТВР-0004",
    name: "Щиток навесной 12 мод.",
    manufacturerArticle: "BOX-N-12M",
    brand: "EKF",
    unit: "шт",
    costPrice: 540,
    salePrice: 790,
    qty: 18,
    lowStockThreshold: 5,
    barcode: "4600000034567",
    oem: "",
    photo: "",
    cells: ["В-05-2"],
    supplierArticles: [
      { supplierName: "МегаКабель", article: "EKF-BOX12N" },
      { supplierName: "Промэлектро", article: "BX-N12-EKF" },
    ],
  },
];