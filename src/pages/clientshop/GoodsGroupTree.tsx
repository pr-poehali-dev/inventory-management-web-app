import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GroupNode } from "./types";

function GroupTreeNode({
  node,
  selected,
  onSelect,
  level = 0,
}: {
  node: GroupNode;
  selected: number | null;
  onSelect: (code: number | null) => void;
  level?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors"
        style={{
          paddingLeft: `${8 + level * 14}px`,
          background: selected === node.code ? "hsl(var(--primary) / 0.15)" : "transparent",
          color: selected === node.code ? "hsl(var(--primary))" : "hsl(var(--foreground))",
        }}
        onClick={() => {
          onSelect(selected === node.code ? null : node.code);
          if (hasChildren) setOpen((o) => !o);
        }}
      >
        {hasChildren ? (
          <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} className="flex-shrink-0 text-muted-foreground" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <Icon name="Folder" size={13} className="flex-shrink-0" style={{ color: "hsl(var(--wms-amber))" }} />
        <span className="truncate">{node.name}</span>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <GroupTreeNode key={child.code} node={child} selected={selected} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoodsGroupTree({
  groups,
  selectedGroup,
  onSelect,
}: {
  groups: GroupNode[];
  selectedGroup: number | null;
  onSelect: (code: number | null) => void;
}) {
  return (
    <div className="w-52 flex-shrink-0 stat-card overflow-y-auto scrollbar-thin">
      <div className="section-title mb-3">Группы</div>
      <div
        className="flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm mb-1 transition-colors"
        style={{
          background: selectedGroup === null ? "hsl(var(--primary) / 0.15)" : "transparent",
          color: selectedGroup === null ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
        onClick={() => onSelect(null)}
      >
        <Icon name="LayoutGrid" size={13} className="flex-shrink-0" />
        <span>Все товары</span>
      </div>
      {groups.map((g) => (
        <GroupTreeNode key={g.code} node={g} selected={selectedGroup} onSelect={onSelect} />
      ))}
      {groups.length === 0 && (
        <div className="text-xs text-muted-foreground mt-2 px-2">Загрузка...</div>
      )}
    </div>
  );
}
