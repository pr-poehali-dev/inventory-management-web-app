import Icon from "@/components/ui/icon";
import { ReceivingDoc, ReceivingItem, STATUS_CFG, fuzzyMatch } from "./types";

/* ─── Диалог: выбор накладной при конфликте ─────────────────────── */
interface ConflictModalProps {
  conflictModal: {
    code: string;
    matches: { doc: ReceivingDoc; item: ReceivingItem }[];
  } | null;
  onClose: () => void;
  onChoice: (match: { doc: ReceivingDoc; item: ReceivingItem }) => void;
}

export function ConflictModal({ conflictModal, onClose, onChoice }: ConflictModalProps) {
  if (!conflictModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div className="rounded-xl border p-6 w-96 flex flex-col gap-4"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Выберите накладную</span>
          <button onClick={onClose}><Icon name="X" size={16} className="text-muted-foreground" /></button>
        </div>
        <div className="text-sm text-muted-foreground">
          Штрихкод <span className="font-mono text-foreground">{conflictModal.code}</span> найден в нескольких документах:
        </div>
        <div className="flex flex-col gap-2">
          {conflictModal.matches.map(({ doc, item }, i) => {
            const cfg = STATUS_CFG[doc.status];
            return (
              <button key={i}
                onClick={() => onChoice({ doc, item })}
                className="flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all hover:border-primary"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-primary font-medium">{doc.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, background: cfg.bg }}>{cfg.text}</span>
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">{doc.supplier}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted-foreground">принято/ожидается</div>
                  <div className="font-mono text-sm font-medium">{item.received}/{item.expected} {item.unit}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Диалог: привязка нераспознанного штрихкода ────────────────── */
interface BindModalProps {
  bindModal: { code: string } | null;
  bindSearch: string;
  selectedDocItems: ReceivingItem[];
  onClose: () => void;
  onBindSearchChange: (value: string) => void;
  onBind: (item: ReceivingItem) => void;
}

export function BindModal({
  bindModal,
  bindSearch,
  selectedDocItems,
  onClose,
  onBindSearchChange,
  onBind,
}: BindModalProps) {
  if (!bindModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div className="rounded-xl border p-6 w-[480px] flex flex-col gap-4"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Штрихкод не распознан</span>
          <button onClick={onClose}>
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Штрихкод <span className="font-mono font-medium text-foreground">{bindModal.code}</span> не найден ни в одной накладной.
          Найдите товар вручную и привяжите этот штрихкод к нему:
        </div>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            autoFocus
            value={bindSearch}
            onChange={(e) => onBindSearchChange(e.target.value)}
            placeholder="Название, артикул (части слов в любом порядке)..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
          {selectedDocItems
            .filter((it) => !bindSearch.trim() || fuzzyMatch(it.name, bindSearch) || fuzzyMatch(it.art, bindSearch))
            .map((item) => (
              <button key={item.id}
                onClick={() => onBind(item)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all hover:border-primary"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                <div>
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.art}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ml-3"
                  style={{ background: "hsl(var(--wms-blue) / 0.1)", color: "hsl(var(--wms-blue))" }}>
                  Привязать
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
