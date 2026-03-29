import Icon from "@/components/ui/icon";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const stockData = [
  { day: "Пн", приход: 142, расход: 98 },
  { day: "Вт", приход: 89, расход: 120 },
  { day: "Ср", приход: 210, расход: 145 },
  { day: "Чт", приход: 178, расход: 167 },
  { day: "Пт", приход: 256, расход: 201 },
  { day: "Сб", приход: 134, расход: 88 },
  { day: "Вс", приход: 67, расход: 43 },
];

const areaData = [
  { month: "Окт", остаток: 4200 },
  { month: "Ноя", остаток: 3800 },
  { month: "Дек", остаток: 5100 },
  { month: "Янв", остаток: 4600 },
  { month: "Фев", остаток: 5400 },
  { month: "Мар", остаток: 4980 },
];

const recentActivity = [
  { id: "ПРД-0142", name: "Кабель витая пара Cat6", qty: 50, unit: "бух", type: "in", time: "09:14" },
  { id: "РСХ-0089", name: "Розетка RJ-45 двойная", qty: 200, unit: "шт", type: "out", time: "10:32" },
  { id: "ПРД-0143", name: "Патч-корд 1м синий", qty: 300, unit: "шт", type: "in", time: "11:05" },
  { id: "РСХ-0090", name: "Коробка установочная", qty: 150, unit: "шт", type: "out", time: "12:18" },
  { id: "ПРД-0144", name: "Труба гофрированная 16мм", qty: 20, unit: "бух", type: "in", time: "13:40" },
];

const lowStock = [
  { name: "Выключатель 2-кл. белый", qty: 12, min: 50 },
  { name: "Дюбель-гвоздь 6×60", qty: 8, min: 200 },
  { name: "Кабель-канал 20×10", qty: 3, min: 20 },
];

interface TooltipPayload { dataKey: string; name: string; value: number; color: string; }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span style={{ color: p.color }}>●</span>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Приходов сегодня",
            value: "24",
            sub: "+3 к вчера",
            icon: "PackagePlus",
            color: "var(--wms-green)",
            trend: true,
          },
          {
            label: "Расходов сегодня",
            value: "18",
            sub: "−1 к вчера",
            icon: "PackageMinus",
            color: "var(--wms-amber)",
            trend: false,
          },
          {
            label: "Позиций на складе",
            value: "1 248",
            sub: "из 1 500 ячеек",
            icon: "Warehouse",
            color: "var(--wms-blue)",
            trend: true,
          },
          {
            label: "Критический запас",
            value: "3",
            sub: "требуют пополнения",
            icon: "AlertTriangle",
            color: "var(--wms-red)",
            trend: false,
          },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div
                className="rounded-lg p-2"
                style={{ background: `hsl(${card.color} / 0.12)` }}
              >
                <Icon
                  name={card.icon}
                  fallback="Circle"
                  size={20}
                  style={{ color: `hsl(${card.color})` }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: card.trend ? "hsl(var(--wms-green))" : "hsl(var(--wms-red))" }}
              >
                {card.trend ? "↑" : "↓"} {card.sub}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Movement Chart */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Движение товара — неделя</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--wms-green))" }} />
                Приход
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--wms-amber))" }} />
                Расход
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData} barGap={4} barSize={14}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="приход" name="Приход" fill="hsl(var(--wms-green))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="расход" name="Расход" fill="hsl(var(--wms-amber))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Trend */}
        <div className="stat-card">
          <div className="section-title mb-1">Остатки</div>
          <div className="text-xs text-muted-foreground mb-4">За 6 месяцев</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210 80% 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210 80% 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="остаток"
                stroke="hsl(var(--wms-blue))"
                strokeWidth={2}
                fill="url(#stockGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Последние операции</div>
            <button className="text-xs text-primary hover:underline">Все операции →</button>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Документ</th>
                <th className="text-left">Наименование</th>
                <th className="text-right">Кол-во</th>
                <th className="text-center">Тип</th>
                <th className="text-right">Время</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row) => (
                <tr key={row.id} className="cursor-pointer">
                  <td className="mono text-xs text-muted-foreground">{row.id}</td>
                  <td className="font-medium">{row.name}</td>
                  <td className="text-right mono text-sm">
                    {row.qty} <span className="text-muted-foreground">{row.unit}</span>
                  </td>
                  <td className="text-center">
                    <span className={row.type === "in" ? "badge-in" : "badge-out"}>
                      {row.type === "in" ? "Приход" : "Расход"}
                    </span>
                  </td>
                  <td className="text-right mono text-xs text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="AlertTriangle" size={16} style={{ color: "hsl(var(--wms-red))" }} />
            <div className="section-title">Критический запас</div>
          </div>
          <div className="space-y-3">
            {lowStock.map((item) => {
              const pct = Math.round((item.qty / item.min) * 100);
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <span className="mono text-xs text-muted-foreground">
                      {item.qty}/{item.min}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct < 20 ? "hsl(var(--wms-red))" : "hsl(var(--wms-amber))",
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{pct}% от минимума</div>
                </div>
              );
            })}
          </div>
          <button
            className="w-full mt-4 text-xs py-2 rounded-md font-medium transition-colors"
            style={{
              background: "hsl(var(--wms-red) / 0.1)",
              color: "hsl(var(--wms-red))",
              border: "1px solid hsl(var(--wms-red) / 0.2)",
            }}
          >
            Создать заявку на пополнение
          </button>
        </div>
      </div>
    </div>
  );
}