// ─── Типы ──────────────────────────────────────────────────────────────────

export interface MarkupRule {
  id: string;
  type: "supplier" | "category";
  name: string;
  markup: number;   // %
  rounding: number; // руб
  enabled: boolean;
}

export interface RoundingRule {
  id: string;
  priceFrom: number;
  priceTo: number | null; // null = без верхней границы
  rounding: number;
}

// ─── Константы ─────────────────────────────────────────────────────────────

export const ROUNDING_OPTIONS = [5, 10, 25, 50, 100];

export const TAB_ITEMS = [
  { id: "markup",     label: "Наценки",     icon: "Percent"  },
  { id: "connection", label: "Подключение", icon: "Database" },
];

export interface DbConfig {
  host:     string;
  database: string;
  user:     string;
  password: string;
  port:     string;
}

export const defaultDbConfig: DbConfig = {
  host:     "localhost",
  database: "",
  user:     "SYSDBA",
  password: "masterkey",
  port:     "8000",
};

export function loadDbConfig(): DbConfig {
  try {
    const raw = localStorage.getItem("wms_db_config");
    if (raw) return { ...defaultDbConfig, ...JSON.parse(raw) };
  } catch (_e) { /* ignore */ }
  return { ...defaultDbConfig };
}

export function saveDbConfig(cfg: DbConfig): void {
  localStorage.setItem("wms_db_config", JSON.stringify(cfg));
}

export const defaultMarkupRules: MarkupRule[] = [
  { id: "1", type: "supplier", name: "ООО Кабельстрой",  markup: 35, rounding: 10, enabled: true  },
  { id: "2", type: "supplier", name: "ИП Электромонтаж", markup: 45, rounding: 10, enabled: true  },
  { id: "3", type: "category", name: "Кабели и провода", markup: 30, rounding: 5,  enabled: true  },
  { id: "4", type: "category", name: "Крепёж",           markup: 60, rounding: 5,  enabled: true  },
  { id: "5", type: "category", name: "Инструменты",      markup: 50, rounding: 50, enabled: false },
];

export const defaultRoundingRules: RoundingRule[] = [
  { id: "r1", priceFrom: 0,    priceTo: 100,  rounding: 5   },
  { id: "r2", priceFrom: 100,  priceTo: 500,  rounding: 10  },
  { id: "r3", priceFrom: 500,  priceTo: 1000, rounding: 25  },
  { id: "r4", priceFrom: 1000, priceTo: 5000, rounding: 50  },
  { id: "r5", priceFrom: 5000, priceTo: null, rounding: 100 },
];

// ─── Утилиты ───────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clampMarkup(v: number): number {
  return Math.min(300, Math.max(10, v));
}