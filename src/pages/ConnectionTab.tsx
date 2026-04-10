import { useState } from "react";
import Icon from "@/components/ui/icon";
import { DbConfig, saveDbConfig } from "./settingsTypes";

interface Props {
  config: DbConfig;
  onChange: (cfg: DbConfig) => void;
}

type TestStatus = "idle" | "loading" | "ok" | "error";

export function ConnectionTab({ config, onChange }: Props) {
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");

  const set = (field: keyof DbConfig, value: string) => {
    onChange({ ...config, [field]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    saveDbConfig(config);
    try {
      await fetch(`http://${config.host}:${config.port}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(2000),
      });
    } catch (_e) { /* сервер не запущен — ничего страшного */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTestStatus("loading");
    setTestMessage("");
    const url = `http://${config.host}:${config.port}/health`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.status === "ok") {
        setTestStatus("ok");
        setTestMessage(`Подключено. Товаров в базе: ${data.goods_count ?? "?"}`);
      } else {
        setTestStatus("error");
        setTestMessage(data.message || "Неизвестная ошибка");
      }
    } catch (e: unknown) {
      setTestStatus("error");
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("fetch") || msg.includes("Failed")) {
        setTestMessage("Сервер недоступен. Убедитесь, что server.py запущен и порт верный.");
      } else {
        setTestMessage(msg);
      }
    }
  };

  const fields: { key: keyof DbConfig; label: string; placeholder: string; type?: string }[] = [
    { key: "host",     label: "Хост (IP компьютера с Firebird)",    placeholder: "localhost или 192.168.1.10" },
    { key: "database", label: "Путь к файлу базы данных (.FDB)",    placeholder: "C:\\ClientShop\\TASK2.FDB" },
    { key: "user",     label: "Пользователь",                       placeholder: "SYSDBA" },
    { key: "password", label: "Пароль",                             placeholder: "masterkey", type: "password" },
    { key: "port",     label: "Порт локального сервера (server.py)", placeholder: "8000" },
  ];

  return (
    <div className="space-y-6">
      {/* Инфо-баннер */}
      <div
        className="flex gap-3 p-4 rounded-lg text-sm"
        style={{ background: "hsl(var(--wms-blue) / 0.08)", border: "1px solid hsl(var(--wms-blue) / 0.2)" }}
      >
        <Icon name="Info" size={16} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--wms-blue))" }} />
        <div style={{ color: "hsl(var(--foreground))" }}>
          Для работы с базой Firebird (ClientShop) на вашем ПК должен быть запущен файл{" "}
          <span className="mono font-semibold">server.py</span>. Заполните настройки и нажмите{" "}
          <span className="font-semibold">Проверить подключение</span>.
        </div>
      </div>

      {/* Поля */}
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
            <input
              type={f.type || "text"}
              value={config[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 rounded-md border text-sm bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary mono"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          </div>
        ))}
      </div>

      {/* Статус теста */}
      {testStatus !== "idle" && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{
            background: testStatus === "ok"
              ? "hsl(var(--wms-green) / 0.1)"
              : testStatus === "error"
              ? "hsl(var(--wms-red) / 0.1)"
              : "hsl(var(--muted))",
            border: `1px solid hsl(var(--${testStatus === "ok" ? "wms-green" : testStatus === "error" ? "wms-red" : "border"}) / 0.3)`,
          }}
        >
          {testStatus === "loading" && <Icon name="Loader2" size={15} className="animate-spin text-muted-foreground" />}
          {testStatus === "ok"      && <Icon name="CheckCircle2" size={15} style={{ color: "hsl(var(--wms-green))" }} />}
          {testStatus === "error"   && <Icon name="XCircle"      size={15} style={{ color: "hsl(var(--wms-red))"   }} />}
          <span style={{
            color: testStatus === "ok" ? "hsl(var(--wms-green))" : testStatus === "error" ? "hsl(var(--wms-red))" : "hsl(var(--muted-foreground))"
          }}>
            {testStatus === "loading" ? "Проверяю подключение..." : testMessage}
          </span>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={testStatus === "loading"}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:border-primary disabled:opacity-50"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          <Icon name="Plug" size={15} />
          Проверить подключение
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            background: saved ? "hsl(var(--wms-green) / 0.15)" : "hsl(var(--primary))",
            color: saved ? "hsl(var(--wms-green))" : "hsl(var(--primary-foreground))",
          }}
        >
          <Icon name={saved ? "CheckCheck" : "Save"} size={15} />
          {saved ? "Сохранено!" : "Сохранить"}
        </button>
      </div>

      {/* Подсказка про server.py */}
      <div className="rounded-lg p-4 space-y-2" style={{ background: "hsl(var(--muted))" }}>
        <div className="text-xs font-semibold text-foreground uppercase tracking-wide">Быстрый запуск</div>
        <div className="text-sm text-muted-foreground">
          Дважды кликни на файл <span className="mono font-semibold text-foreground">start.bat</span> в папке проекта — 
          он автоматически запустит сервер с этими настройками.
        </div>
        <div className="text-xs mono text-muted-foreground mt-1">
          Или вручную: <span className="text-foreground">python server.py</span>
        </div>
      </div>
    </div>
  );
}