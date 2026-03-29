import { useState } from "react";
import Icon from "@/components/ui/icon";

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "receiving", label: "Приёмка товара", icon: "PackagePlus" },
  { id: "warehouse", label: "Склад", icon: "Warehouse" },
  { id: "labels", label: "Ценники и этикетки", icon: "Tag" },
  { id: "reports", label: "Отчёты и графики", icon: "BarChart3" },
  { id: "sync", label: "Синхронизация", icon: "RefreshCw" },
  { id: "users", label: "Сотрудники", icon: "Users" },
];

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 border-r border-border"
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          background: "hsl(var(--sidebar-background))",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              background: "hsl(var(--wms-blue) / 0.15)",
              border: "1px solid hsl(var(--wms-blue) / 0.3)",
            }}
          >
            <Icon name="Boxes" size={18} className="text-primary" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold tracking-tight text-foreground">WMS</div>
              <div className="text-[10px] text-muted-foreground mono uppercase tracking-widest">
                Склад
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full text-left ${activePage === item.id ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} fallback="Circle" size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-4 border-t border-border space-y-1">
          <button className="nav-item w-full text-left" title={collapsed ? "Настройки" : undefined}>
            <Icon name="Settings" size={18} className="flex-shrink-0" />
            {!collapsed && <span>Настройки</span>}
          </button>
          <div className="nav-item">
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                width: 28,
                height: 28,
                background: "hsl(var(--wms-blue) / 0.15)",
                color: "hsl(var(--wms-blue))",
              }}
            >
              АД
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">Администратор</div>
                <div className="text-[10px] text-muted-foreground">Полный доступ</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {navItems.find((n) => n.id === activePage)?.label}
            </h1>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="pulse-dot" />
              <span>Client-Shop подключён</span>
            </div>
            <button
              className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
            >
              <Icon name="Bell" size={18} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(var(--wms-red))" }}
              />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted">
              <Icon name="Search" size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}