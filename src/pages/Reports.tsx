import Icon from "@/components/ui/icon";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const monthlyData = [
  { m: "Окт", приход: 1240, расход: 980, остаток: 4200 },
  { m: "Ноя", приход: 890, расход: 1200, остаток: 3800 },
  { m: "Дек", приход: 2100, расход: 1450, остаток: 5100 },
  { m: "Янв", приход: 1780, расход: 1670, остаток: 4600 },
  { m: "Фев", приход: 2560, расход: 2010, остаток: 5400 },
  { m: "Мар", приход: 1980, расход: 1820, остаток: 4980 },
];

const categoryData = [
  { name: "Кабели", value: 38 },
  { name: "Розетки", value: 24 },
  { name: "Крепёж", value: 16 },
  { name: "Трубы", value: 12 },
  { name: "Коробки", value: 10 },
];

const COLORS = [
  "hsl(210 80% 52%)",
  "hsl(160 60% 42%)",
  "hsl(38 90% 52%)",
  "hsl(280 60% 55%)",
  "hsl(0 72% 55%)",
];

const topMoving = [
  { name: "Кабель Cat6 305м", ops: 142, trend: 12 },
  { name: "Коннектор RJ-45", ops: 118, trend: -4 },
  { name: "Патч-корд 1м", ops: 97, trend: 8 },
  { name: "Выключатель 2-кл.", ops: 88, trend: 22 },
  { name: "Труба гофр. 16мм", ops: 76, trend: -1 },
];

interface TooltipPayload { dataKey: string; name: string; value: number; color: string; }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-2">{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
            <span style={{ color: p.color }}>●</span>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold text-foreground">{p.value.toLocaleString("ru")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {["Неделя", "Месяц", "Квартал", "Год"].map((p, i) => (
            <button
              key={p}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={
                i === 1
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <Icon name="Download" size={13} />
            Excel
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <Icon name="Printer" size={13} />
            Печать
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Оборот за месяц", value: "2 640 800 ₽", delta: "+14%", up: true },
          { label: "Операций приёмки", value: "89", delta: "+6", up: true },
          { label: "Операций расхода", value: "134", delta: "+21", up: true },
          { label: "Оборачиваемость", value: "18.4 дн", delta: "−2 дня", up: true },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card text-center">
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
            <div
              className="text-xs font-medium mt-1"
              style={{ color: kpi.up ? "hsl(var(--wms-green))" : "hsl(var(--wms-red))" }}
            >
              {kpi.up ? "↑" : "↓"} {kpi.delta} к прошлому месяцу
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Динамика движения товара</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--wms-green))" }} />
                Приход
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--wms-amber))" }} />
                Расход
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--primary))" }} />
                Остаток
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="приход" name="Приход" stroke="hsl(160 60% 42%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(160 60% 42%)" }} />
              <Line type="monotone" dataKey="расход" name="Расход" stroke="hsl(38 90% 52%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38 90% 52%)" }} />
              <Line type="monotone" dataKey="остаток" name="Остаток" stroke="hsl(210 80% 52%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(210 80% 52%)" }} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="stat-card">
          <div className="section-title mb-4">Структура по категориям</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </span>
                <span className="font-medium text-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Moving */}
        <div className="stat-card">
          <div className="section-title mb-4">Топ-5 по движению</div>
          <div className="space-y-3">
            {topMoving.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.ops / 142) * 100}%`,
                        background: "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="mono text-sm font-semibold text-foreground">{item.ops}</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: item.trend > 0 ? "hsl(var(--wms-green))" : "hsl(var(--wms-red))" }}
                  >
                    {item.trend > 0 ? "+" : ""}{item.trend}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="stat-card">
          <div className="section-title mb-4">Приход vs Расход по месяцам</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={2} barSize={12}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="приход" name="Приход" fill="hsl(160 60% 42%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="расход" name="Расход" fill="hsl(38 90% 52%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
