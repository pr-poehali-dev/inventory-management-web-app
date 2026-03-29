import { useState } from "react";
import Icon from "@/components/ui/icon";

const syncLog = [
  { time: "13:40:12", type: "success", msg: "Синхронизация завершена. Обновлено 142 позиции." },
  { time: "13:40:10", type: "info", msg: "Получены данные из Client-Shop: 142 записи." },
  { time: "13:40:08", type: "info", msg: "Подключение к базе Firebird 2.5 установлено." },
  { time: "13:00:01", type: "success", msg: "Плановая синхронизация завершена успешно." },
  { time: "12:00:01", type: "success", msg: "Плановая синхронизация завершена успешно." },
  { time: "11:28:34", type: "warning", msg: "Расхождение: товар 'Кабель Cat6' — WMS: 18, CS: 20." },
  { time: "11:00:01", type: "success", msg: "Плановая синхронизация завершена успешно." },
  { time: "10:15:22", type: "error", msg: "Ошибка соединения с Firebird. Повтор через 5 мин." },
  { time: "10:10:01", type: "info", msg: "Попытка подключения к базе Firebird 2.5..." },
];

const logColors: Record<string, string> = {
  success: "hsl(var(--wms-green))",
  info: "hsl(var(--wms-blue))",
  warning: "hsl(var(--wms-amber))",
  error: "hsl(var(--wms-red))",
};

const logIcons: Record<string, string> = {
  success: "CheckCircle",
  info: "Info",
  warning: "AlertTriangle",
  error: "XCircle",
};

export default function Sync() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2500);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Status Card */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--wms-green) / 0.1)", border: "1px solid hsl(var(--wms-green) / 0.3)" }}
            >
              <Icon name="Database" size={26} style={{ color: "hsl(var(--wms-green))" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span className="font-semibold text-foreground">Client-Shop / Firebird 2.5</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">Соединение активно • Последняя синхр.: сегодня 13:40</div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Хост: <span className="mono text-foreground">192.168.1.10:3050</span></span>
                <span>База: <span className="mono text-foreground">SHOP.FDB</span></span>
                <span>Версия: <span className="mono text-foreground">Firebird 2.5.9</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              <Icon name="Settings" size={15} />
              Настройки
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-70"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Icon name="RefreshCw" size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Синхронизация..." : "Синхронизировать"}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card space-y-4">
          <div className="section-title flex items-center gap-2">
            <Icon name="Settings2" size={16} className="text-primary" />
            Настройки подключения
          </div>
          {[
            { label: "Хост / IP сервера", value: "192.168.1.10", type: "text" },
            { label: "Порт", value: "3050", type: "text" },
            { label: "Путь к базе данных", value: "C:/DATA/SHOP.FDB", type: "text" },
            { label: "Пользователь", value: "SYSDBA", type: "text" },
            { label: "Пароль", value: "masterkey", type: "password" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
              <input
                type={f.type}
                defaultValue={f.value}
                className="w-full bg-muted border border-border rounded-md text-sm px-3 py-2 text-foreground mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
          <button
            className="w-full py-2 rounded-md text-sm font-medium"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            Сохранить
          </button>
        </div>

        <div className="stat-card space-y-4">
          <div className="section-title flex items-center gap-2">
            <Icon name="Timer" size={16} className="text-primary" />
            Расписание синхронизации
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">Автоматическая синхронизация</label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Включена</span>
              <div
                className="w-10 h-5 rounded-full relative cursor-pointer"
                style={{ background: "hsl(var(--primary))" }}
              >
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Интервал синхронизации</label>
            <select className="w-full bg-muted border border-border rounded-md text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Каждые 5 минут</option>
              <option>Каждые 15 минут</option>
              <option>Каждый час</option>
              <option>Каждые 4 часа</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Синхронизировать</label>
            {["Товары и остатки", "Приходные документы", "Расходные документы", "Контрагенты"].map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--primary))", border: "1px solid hsl(var(--primary))" }}
                >
                  <Icon name="Check" size={11} style={{ color: "#fff" }} />
                </div>
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Log */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title flex items-center gap-2">
            <Icon name="Terminal" size={16} className="text-primary" />
            Журнал синхронизации
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Icon name="Trash2" size={13} />
            Очистить
          </button>
        </div>
        <div
          className="rounded-lg p-4 space-y-2 overflow-y-auto scrollbar-thin font-mono text-xs"
          style={{ background: "hsl(220 18% 6%)", border: "1px solid hsl(var(--border))", maxHeight: 240 }}
        >
          {syncLog.map((entry, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-muted-foreground flex-shrink-0">{entry.time}</span>
              <Icon
                name={logIcons[entry.type]}
                fallback="Circle"
                size={13}
                className="flex-shrink-0 mt-0.5"
                style={{ color: logColors[entry.type] }}
              />
              <span style={{ color: logColors[entry.type] }}>{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
