import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { ENRICH_FIELDS } from "./enrichmentTypes";

interface EnrichmentStepUploadProps {
  onFile: (file: File) => void;
}

export function EnrichmentStepUpload({ onFile }: EnrichmentStepUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div
        className="rounded-lg p-4 text-sm"
        style={{ background: "hsl(var(--wms-blue) / 0.07)", borderLeft: "3px solid hsl(var(--wms-blue))" }}
      >
        Загрузите файл с дополнительными данными — прайс-лист поставщика, файл с штрихкодами, артикулами и т.д.
        Система сопоставит строки по наименованию или артикулу и добавит недостающие поля.
      </div>

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
        className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? "hsl(var(--primary))" : "hsl(var(--border))",
          background: dragOver ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
        }}
      >
        <Icon name="FilePlus2" size={32} className="mx-auto mb-3 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">Перетащите или выберите файл обогащения</div>
        <div className="text-xs text-muted-foreground mt-1">Excel (.xlsx) · CSV · TSV</div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">Что можно добавить из файла:</div>
        <div className="flex flex-wrap gap-2">
          {ENRICH_FIELDS.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
            >
              <Icon name={f.icon as Parameters<typeof Icon>[0]["name"]} size={12} />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
