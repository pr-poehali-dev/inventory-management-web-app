import Icon from "@/components/ui/icon";
import { InvoiceRow } from "./InvoiceImport";

interface ValidationField {
  key: keyof InvoiceRow;
  label: string;
  icon: string;
  enrichable: boolean;
}

const FIELDS: ValidationField[] = [
  { key: "supplierArticle", label: "Артикул поставщика", icon: "Tag", enrichable: true },
  { key: "manufacturerArticle", label: "Артикул изготовителя", icon: "Tag", enrichable: true },
  { key: "brand", label: "Бренд", icon: "Building2", enrichable: true },
  { key: "oem", label: "OEM", icon: "Link", enrichable: true },
  { key: "photo", label: "Фото товара", icon: "Image", enrichable: true },
  { key: "costPrice", label: "Себестоимость", icon: "Wallet", enrichable: false },
  { key: "salePrice", label: "Цена продажная", icon: "CircleDollarSign", enrichable: true },
  { key: "marking", label: "Коды маркировки", icon: "QrCode", enrichable: true },
];

function fieldFilled(row: InvoiceRow, key: keyof InvoiceRow): boolean {
  const v = row[key];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return v > 0;
  return !!v;
}

interface FieldStat {
  key: keyof InvoiceRow;
  label: string;
  icon: string;
  enrichable: boolean;
  filled: number;
  total: number;
  pct: number;
}

export interface ValidationResult {
  hasBarcode: boolean;
  hasMarking: boolean;
  missingFields: FieldStat[];
  enrichableFields: FieldStat[];
  stats: FieldStat[];
  duplicateCount: number;
}

export function calcValidation(rows: InvoiceRow[]): ValidationResult {
  if (!rows.length) {
    return { hasBarcode: false, hasMarking: false, missingFields: [], enrichableFields: [], stats: [], duplicateCount: 0 };
  }

  const stats: FieldStat[] = FIELDS.map((f) => {
    const filled = rows.filter((r) => fieldFilled(r, f.key)).length;
    return { ...f, filled, total: rows.length, pct: Math.round((filled / rows.length) * 100) };
  });

  const hasBarcode = rows.some((r) => !!r.supplierArticle || !!r.manufacturerArticle);
  const hasMarking = rows.some((r) => r.marking?.length > 0);
  const duplicateCount = rows.filter((r) => r._isDuplicate).length;

  const missingFields = stats.filter((s) => s.pct < 100);
  const enrichableFields = missingFields.filter((s) => s.enrichable);

  return { hasBarcode, hasMarking, missingFields, enrichableFields, stats, duplicateCount };
}

interface InvoiceValidationProps {
  rows: InvoiceRow[];
  onEnrich: () => void;
  onMarking: () => void;
  onMergeDuplicates: () => void;
  onRemoveDuplicates: () => void;
}

export default function InvoiceValidation({ rows, onEnrich, onMarking, onMergeDuplicates, onRemoveDuplicates }: InvoiceValidationProps) {
  const v = calcValidation(rows);

  if (!rows.length) return null;

  const hasIssues = !v.hasBarcode || !v.hasMarking || v.missingFields.length > 0 || v.duplicateCount > 0;

  return (
    <div className="space-y-3">

      {/* Блок дублей — отдельная карточка, только если есть */}
      {v.duplicateCount > 0 && (
        <div
          className="rounded-lg border p-4"
          style={{
            background: "hsl(var(--wms-red) / 0.05)",
            borderColor: "hsl(var(--wms-red) / 0.3)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--wms-red) / 0.15)" }}
              >
                <Icon name="Copy" size={15} style={{ color: "hsl(var(--wms-red))" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "hsl(var(--wms-red))" }}>
                  Найдено дублей: {v.duplicateCount}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Одинаковые позиции по артикулу или названию — выберите действие
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onMergeDuplicates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
                style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
              >
                <Icon name="Merge" size={13} />
                Объединить
              </button>
              <button
                onClick={onRemoveDuplicates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap border"
                style={{
                  borderColor: "hsl(var(--wms-red) / 0.4)",
                  color: "hsl(var(--wms-red))",
                  background: "hsl(var(--wms-red) / 0.07)",
                }}
              >
                <Icon name="Trash2" size={13} />
                Удалить лишние
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Основной блок заполненности */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: hasIssues ? "hsl(var(--wms-amber) / 0.05)" : "hsl(var(--wms-green) / 0.05)",
          borderColor: hasIssues ? "hsl(var(--wms-amber) / 0.25)" : "hsl(var(--wms-green) / 0.25)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: hasIssues ? "hsl(var(--wms-amber) / 0.15)" : "hsl(var(--wms-green) / 0.15)",
              }}
            >
              <Icon
                name={hasIssues ? "AlertTriangle" : "CheckCircle2"}
                size={16}
                style={{ color: hasIssues ? "hsl(var(--wms-amber))" : "hsl(var(--wms-green))" }}
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-2">
                {hasIssues ? "Накладная заполнена не полностью" : "Накладная проверена — всё заполнено"}
              </div>

              <div className="flex flex-wrap gap-2">
                {v.stats.map((s) => (
                  <div
                    key={String(s.key)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                    style={{
                      background:
                        s.pct === 100
                          ? "hsl(var(--wms-green) / 0.1)"
                          : s.pct === 0
                          ? "hsl(var(--wms-red) / 0.1)"
                          : "hsl(var(--wms-amber) / 0.1)",
                      color:
                        s.pct === 100
                          ? "hsl(var(--wms-green))"
                          : s.pct === 0
                          ? "hsl(var(--wms-red))"
                          : "hsl(var(--wms-amber))",
                    }}
                  >
                    <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={11} />
                    <span>{s.label}</span>
                    {s.pct < 100 && <span className="font-mono font-bold">{s.pct}%</span>}
                    {s.pct === 100 && <Icon name="Check" size={11} />}
                  </div>
                ))}
              </div>

              {(!v.hasBarcode || !v.hasMarking) && (
                <div className="mt-3 space-y-1.5">
                  {!v.hasBarcode && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--wms-red))" }}>
                      <Icon name="AlertCircle" size={12} />
                      Штрихкоды не указаны — товары не будут привязаны к базе
                    </div>
                  )}
                  {!v.hasMarking && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--wms-amber))" }}>
                      <Icon name="QrCode" size={12} />
                      Коды маркировки (Честный знак) не загружены
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {v.enrichableFields.length > 0 && (
              <button
                onClick={onEnrich}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}
              >
                <Icon name="FilePlus2" size={14} />
                Обогатить данные
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  {v.enrichableFields.length}
                </span>
              </button>
            )}
            <button
              onClick={onMarking}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border"
              style={{
                borderColor: "hsl(var(--wms-blue) / 0.4)",
                color: "hsl(var(--wms-blue))",
                background: "hsl(var(--wms-blue) / 0.07)",
              }}
            >
              <Icon name="QrCode" size={14} />
              {v.hasMarking ? "Обновить маркировку" : "Загрузить маркировку"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}