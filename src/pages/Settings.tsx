import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MarkupRule, RoundingRule, TAB_ITEMS, defaultMarkupRules, defaultRoundingRules } from "./settingsTypes";
import { MarkupTab } from "./MarkupTab";

// ─── Основная страница настроек ─────────────────────────────────────────────

export default function Settings() {
  const [activeTab] = useState("markup");
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>(defaultMarkupRules);
  const [roundingRules, setRoundingRules] = useState<RoundingRule[]>(defaultRoundingRules);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Вкладки */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.id ? "hsl(var(--card))" : "transparent",
              color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}
          >
            <Icon name={tab.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Вкладка Наценки */}
      {activeTab === "markup" && (
        <MarkupTab
          markupRules={markupRules}
          roundingRules={roundingRules}
          onMarkupUpdate={setMarkupRules}
          onRoundingUpdate={setRoundingRules}
        />
      )}
    </div>
  );
}
