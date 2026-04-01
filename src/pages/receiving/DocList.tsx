import Icon from "@/components/ui/icon";
import { ReceivingDoc, STATUS_CFG } from "./types";

interface DocListProps {
  filteredDocs: ReceivingDoc[];
  selectedDocId: string;
  docSearch: string;
  onDocSearchChange: (value: string) => void;
  onSelectDoc: (id: string) => void;
}

export default function DocList({
  filteredDocs,
  selectedDocId,
  docSearch,
  onDocSearchChange,
  onSelectDoc,
}: DocListProps) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">Документы приёмки</span>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={docSearch}
          onChange={(e) => onDocSearchChange(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card text-foreground focus:outline-none"
          style={{ borderColor: "hsl(var(--border))" }}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5">
        {filteredDocs.map((doc) => {
          const cfg = STATUS_CFG[doc.status];
          const isActive = doc.id === selectedDocId;
          return (
            <button
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
              style={{
                background: isActive ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
                borderColor: isActive ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-medium text-primary">{doc.id}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
                  {cfg.text}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{doc.date}</span>
                <span className="text-xs text-muted-foreground">{doc.items.length} поз.</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">← {doc.doc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
