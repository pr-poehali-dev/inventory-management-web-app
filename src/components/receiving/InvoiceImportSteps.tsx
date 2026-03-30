import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { FIELDS, FieldKey, InvoiceRow, SupplierTemplate } from "./invoiceImportTypes";

// ─── Шаг 1: Загрузка файла / вставка из буфера ─────────────────────────────

interface StepInputProps {
  templates: SupplierTemplate[];
  onFile: (file: File) => void;
  onPasteText: (text: string) => void;
  onDeleteTemplate: (supplier: string) => void;
}

export function StepInput({ templates, onFile, onPasteText, onDeleteTemplate }: StepInputProps) {
  const [dragOver, setDragOver] = useState(false);
  const [rawText, setRawText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Drag&Drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? "hsl(var(--primary))" : "hsl(var(--border))",
          background: dragOver ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
        }}
      >
        <Icon name="Upload" size={32} className="mx-auto mb-3 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">Перетащите файл или нажмите для выбора</div>
        <div className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) · XML · CSV · TSV</div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.xml,.csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
        />
      </div>

      {/* Шаблоны поставщиков */}
      {templates.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">Сохранённые шаблоны:</div>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div
                key={t.supplier}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
              >
                <Icon name="Building2" size={13} className="text-primary" />
                <span className="text-foreground">{t.supplier}</span>
                <button
                  onClick={() => onDeleteTemplate(t.supplier)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Вставка из буфера */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Или вставьте данные из буфера обмена:</div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={"Скопируйте таблицу из Excel/1С и вставьте сюда (Ctrl+V)\nПервая строка — заголовки столбцов"}
          rows={6}
          className="w-full rounded-lg border text-sm px-3 py-2 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          style={{
            background: "hsl(var(--muted))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => { if (rawText.trim()) onPasteText(rawText); }}
            disabled={!rawText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            <Icon name="ArrowRight" size={15} />
            Распознать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Шаг 2: Маппинг столбцов ───────────────────────────────────────────────

interface StepMappingProps {
  headers: string[];
  rawRows: Record<string, unknown>[];
  mapping: Record<string, FieldKey | null>;
  saveTemplateName: string;
  showSaveTemplate: boolean;
  onMappingChange: (header: string, value: FieldKey | null) => void;
  onToggleSaveTemplate: () => void;
  onSaveTemplateName: (name: string) => void;
  onSaveTemplate: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function StepMapping({
  headers,
  rawRows,
  mapping,
  saveTemplateName,
  showSaveTemplate,
  onMappingChange,
  onToggleSaveTemplate,
  onSaveTemplateName,
  onSaveTemplate,
  onBack,
  onConfirm,
}: StepMappingProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Распознано <span className="text-foreground font-medium">{rawRows.length}</span> строк,{" "}
          <span className="text-foreground font-medium">{headers.length}</span> столбцов.
          Проверьте соответствие:
        </div>
        <button
          onClick={onToggleSaveTemplate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="Save" size={13} />
          Сохранить шаблон
        </button>
      </div>

      {showSaveTemplate && (
        <div
          className="flex gap-2 p-3 rounded-lg border"
          style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
        >
          <input
            value={saveTemplateName}
            onChange={(e) => onSaveTemplateName(e.target.value)}
            placeholder="Название поставщика..."
            className="flex-1 bg-background border border-border rounded-md text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={onSaveTemplate}
            className="px-4 py-1.5 rounded-md text-sm font-medium"
            style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
          >
            Сохранить
          </button>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsl(var(--muted))" }}>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Столбец в файле</th>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Пример данных</th>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Поле накладной</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header) => (
              <tr key={header} className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <td className="px-4 py-2 font-mono text-xs text-foreground">{header}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                  {String(rawRows[0]?.[header] ?? "—")}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={mapping[header] ?? ""}
                    onChange={(e) => onMappingChange(header, (e.target.value as FieldKey) || null)}
                    className="w-full rounded-md border text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    style={{
                      background: "hsl(var(--background))",
                      borderColor: mapping[header] ? "hsl(var(--wms-green) / 0.5)" : "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <option value="">— не использовать —</option>
                    {FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}{f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={15} />
          Назад
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "hsl(var(--primary))", color: "#fff" }}
        >
          Применить
          <Icon name="ArrowRight" size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Шаг 3: Предпросмотр ───────────────────────────────────────────────────

interface StepPreviewProps {
  rows: InvoiceRow[];
  onBack: () => void;
  onImport: () => void;
  onClose: () => void;
}

export function StepPreview({ rows, onBack, onImport, onClose }: StepPreviewProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Готово к импорту: <span className="text-foreground font-medium">{rows.length}</span> позиций
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={13} />
          К маппингу
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
        <table className="w-full text-xs">
          <thead style={{ background: "hsl(var(--muted))" }}>
            <tr>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Наименование</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Арт. пост.</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Бренд</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Кол-во</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Себест.</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Сумма</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Цена прод.</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <td className="px-3 py-2 text-foreground">{row.name}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{row.supplierArticle || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.brand || "—"}</td>
                <td className="px-3 py-2 text-right text-foreground">{row.qty} {row.unit}</td>
                <td className="px-3 py-2 text-right font-mono text-foreground">{row.costPrice.toFixed(2)} ₽</td>
                <td className="px-3 py-2 text-right font-mono text-foreground">
                  {(row.costTotal > 0 ? row.costTotal : row.costPrice * row.qty).toFixed(2)} ₽
                </td>
                <td className="px-3 py-2 text-right font-mono text-foreground">
                  {row.salePrice > 0 ? `${row.salePrice.toFixed(2)} ₽` : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {row.marking?.length > 0 && (
                      <span title="Есть маркировка DataMatrix" style={{ color: "hsl(var(--wms-blue))" }}>
                        <Icon name="QrCode" size={13} />
                      </span>
                    )}
                    {row.oem && (
                      <span title="Есть OEM" style={{ color: "hsl(var(--wms-amber))" }}>
                        <Icon name="Link" size={13} />
                      </span>
                    )}
                    {row.unit === "компл." && (
                      <span title="Собран комплект свечей">🕯️</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "hsl(var(--wms-green))", color: "#fff" }}
        >
          <Icon name="CheckCircle" size={16} />
          Загрузить {rows.length} позиций
        </button>
      </div>
    </div>
  );
}
