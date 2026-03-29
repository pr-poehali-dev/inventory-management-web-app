import { useState } from "react";
import Icon from "@/components/ui/icon";

const users = [
  { id: 1, name: "Андрей Дмитриев", role: "Администратор", email: "admin@sklad.ru", dept: "ИТ", lastLogin: "29.03.2026 13:22", status: "active", avatar: "АД" },
  { id: 2, name: "Мария Сергеева", role: "Кладовщик", email: "m.sergeeva@sklad.ru", dept: "Склад", lastLogin: "29.03.2026 12:15", status: "active", avatar: "МС" },
  { id: 3, name: "Игорь Петров", role: "Кладовщик", email: "i.petrov@sklad.ru", dept: "Склад", lastLogin: "29.03.2026 09:40", status: "active", avatar: "ИП" },
  { id: 4, name: "Елена Козлова", role: "Менеджер", email: "e.kozlova@sklad.ru", dept: "Снабжение", lastLogin: "28.03.2026 17:55", status: "active", avatar: "ЕК" },
  { id: 5, name: "Сергей Воронов", role: "Менеджер", email: "s.voronov@sklad.ru", dept: "Продажи", lastLogin: "27.03.2026 14:30", status: "inactive", avatar: "СВ" },
  { id: 6, name: "Анна Тихонова", role: "Аудитор", email: "a.tikhonova@sklad.ru", dept: "Финансы", lastLogin: "29.03.2026 11:00", status: "active", avatar: "АТ" },
];

const roles = [
  {
    name: "Администратор",
    color: "var(--wms-blue)",
    perms: ["Полный доступ ко всем разделам", "Управление пользователями", "Настройка синхронизации", "Редактирование справочников"],
  },
  {
    name: "Кладовщик",
    color: "var(--wms-green)",
    perms: ["Приёмка и отпуск товара", "Просмотр склада и остатков", "Сканирование штрихкодов", "Базовые отчёты"],
  },
  {
    name: "Менеджер",
    color: "var(--wms-amber)",
    perms: ["Просмотр остатков", "Просмотр движения товара", "Расширенные отчёты", "Экспорт данных"],
  },
  {
    name: "Аудитор",
    color: "hsl(280 60% 55%)",
    perms: ["Только чтение", "Просмотр всех отчётов", "Журнал операций"],
  },
];

const avatarColors = [
  "hsl(210 80% 45%)",
  "hsl(160 55% 38%)",
  "hsl(38 85% 48%)",
  "hsl(280 55% 50%)",
  "hsl(330 65% 48%)",
  "hsl(195 70% 42%)",
];

export default function Users() {
  const [tab, setTab] = useState<"users" | "roles">("users");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setTab("users")}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={tab === "users" ? { background: "hsl(var(--primary))", color: "#fff" } : { color: "hsl(var(--muted-foreground))" }}
          >
            Сотрудники
          </button>
          <button
            onClick={() => setTab("roles")}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={tab === "roles" ? { background: "hsl(var(--primary))", color: "#fff" } : { color: "hsl(var(--muted-foreground))" }}
          >
            Роли и права
          </button>
        </div>

        {tab === "users" && (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            <Icon name="UserPlus" size={15} />
            Добавить сотрудника
          </button>
        )}
      </div>

      {tab === "users" ? (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Все сотрудники <span className="text-muted-foreground font-normal text-sm ml-2">{users.length} чел.</span></div>
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Поиск..."
                className="bg-muted border border-border rounded-md text-sm pl-8 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Сотрудник</th>
                <th className="text-left">Роль</th>
                <th className="text-left">Отдел</th>
                <th className="text-left">Email</th>
                <th className="text-left">Последний вход</th>
                <th className="text-center">Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: avatarColors[i % avatarColors.length] }}
                      >
                        {u.avatar}
                      </div>
                      <span className="font-medium text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: `hsl(${roles.find((r) => r.name === u.role)?.color ?? "var(--muted)"} / 0.15)`,
                        color: `hsl(${roles.find((r) => r.name === u.role)?.color ?? "var(--muted-foreground)"})`,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">{u.dept}</td>
                  <td className="mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="mono text-xs text-muted-foreground">{u.lastLogin}</td>
                  <td className="text-center">
                    {u.status === "active" ? (
                      <span className="badge-in">Активен</span>
                    ) : (
                      <span className="badge-pending">Неактивен</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="Pencil" size={15} />
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: `hsl(${role.color})` }}
                  />
                  <span className="font-semibold text-foreground">{role.name}</span>
                </div>
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Icon name="Pencil" size={12} />
                  Изменить
                </button>
              </div>
              <div className="space-y-1.5">
                {role.perms.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <Icon name="Check" size={13} style={{ color: `hsl(${role.color})` }} />
                    <span className="text-muted-foreground">{p}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{users.filter((u) => u.role === role.name).length} сотрудников</span>
                <button
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: `hsl(${role.color} / 0.1)`,
                    color: `hsl(${role.color})`,
                  }}
                >
                  Просмотр прав
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
