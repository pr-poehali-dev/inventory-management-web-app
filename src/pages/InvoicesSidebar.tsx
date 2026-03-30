import Icon from "@/components/ui/icon";
import { Invoice, STATUS } from "./invoicesTypes";

interface InvoicesSidebarProps {
  filtered: Invoice[];
  selectedId: string;
  search: string;
  onSelect: (id: string) => void;
  onSearchChange: (value: string) => void;
  onNewClick: () => void;
}

export function InvoicesSidebar({
  filtered,
  selectedId,
  search,
  onSelect,
  onSearchChange,
  onNewClick,
}: InvoicesSidebarProps) {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Накладные</span>
        <button
          onClick={onNewClick}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
          style={{ background: "hsl(var(--primary))", color: "#fff" }}
        >
          <Icon name="Plus" size={14} />
          Новая
        </button>
      </div>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по накладной..."
          className="w-full bg-muted border border-border rounded-md text-sm pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-2 overflow-y-auto scrollbar-thin flex-1">
        {filtered.map((inv) => (
          <button
            key={inv.id}
            onClick={() => onSelect(inv.id)}
            className="w-full text-left p-3 rounded-lg border transition-all"
            style={{
              background: selectedId === inv.id ? "hsl(var(--wms-blue) / 0.08)" : "hsl(var(--card))",
              borderColor: selectedId === inv.id ? "hsl(var(--wms-blue) / 0.4)" : "hsl(var(--border))",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="mono text-xs font-medium text-primary">{inv.id}</span>
              <span className={STATUS[inv.status].cls}>{STATUS[inv.status].text}</span>
            </div>
            <div className="text-sm font-medium text-foreground truncate">{inv.supplier}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{inv.date}</span>
              <span className="text-xs text-muted-foreground">{inv.items} поз.</span>
            </div>
            <div className="mono text-[10px] text-muted-foreground mt-0.5">{inv.docNumber}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</div>
        )}
      </div>
    </div>
  );
}
