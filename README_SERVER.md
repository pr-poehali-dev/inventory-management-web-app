# Локальный сервер подключения к ClientShop (Firebird)

Этот сервер запускается на твоём ПК и даёт веб-приложению доступ к базе данных Firebird.

## Схема работы

```
Браузер → Облако (poehali.dev) → server.py на твоём ПК → Firebird (ClientShop)
```

---

## 1. Установка Python

Скачай Python 3.10+ с https://python.org/downloads  
При установке отметь галочку **"Add Python to PATH"**

---

## 2. Установка зависимости

Открой командную строку (Win+R → cmd) и выполни:

```
pip install firebirdsql
```

---

## 3. Настройка подключения к БД

Открой файл `server.py` в блокноте и измени строки в начале:

```python
FB_HOST     = "localhost"                      # IP или имя компьютера с Firebird
FB_DATABASE = r"C:\ClientShop\TASK2.FDB"       # Полный путь к файлу базы данных
FB_USER     = "SYSDBA"                         # Пользователь (обычно SYSDBA)
FB_PASSWORD = "masterkey"                      # Пароль (обычно masterkey)
PORT        = 8000                             # Порт сервера
```

---

## 4. Запуск сервера

```
python server.py
```

Если всё верно, увидишь:
```
╔══════════════════════════════════════════╗
║  ClientShop Local Bridge  v1.0           ║
╚══════════════════════════════════════════╝
  БД:   localhost → C:\ClientShop\TASK2.FDB
  Порт: http://localhost:8000
```

Проверь подключение в браузере: http://localhost:8000/health

---

## 5. Открыть порт наружу (чтобы облако видело сервер)

Облачные функции не могут достучаться до `localhost`. Нужен туннель.

### Вариант А — Cloudflare Tunnel (бесплатно, рекомендую)

1. Скачай: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Запусти:
   ```
   cloudflared tunnel --url http://localhost:8000
   ```
3. Скопируй выданный URL вида `https://xxxx-xxxx.trycloudflare.com`

### Вариант Б — ngrok (бесплатно)

1. Скачай: https://ngrok.com/download
2. Запусти:
   ```
   ngrok http 8000
   ```
3. Скопируй URL вида `https://xxxx.ngrok-free.app`

---

## 6. Прописать URL в настройки проекта

После получения URL из туннеля — сообщи его разработчику.  
Он пропишет его в секреты проекта как `FB_BRIDGE_URL`, и облачные функции начнут работать через твой сервер.

---

## Доступные адреса

| Адрес | Что возвращает |
|-------|----------------|
| `/health` | Проверка подключения к БД |
| `/goods?search=молоко&page=1` | Список товаров |
| `/goods/detail?id=1234` | Карточка товара |
| `/groups` | Дерево групп товаров |
