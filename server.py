"""
Локальный сервер для подключения веб-приложения к базе данных Firebird (ClientShop).
Запуск: python server.py
По умолчанию слушает на порту 8000.

Endpoints:
  GET /goods        — список товаров (search, group, page, limit)
  GET /goods/detail — карточка товара (?id=CODE)
  GET /groups       — дерево групп товаров
  GET /health       — проверка подключения к БД
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ── Настройки: читаем db.config → затем env → затем дефолты ───────
def _load_config():
    cfg = {
        "FB_HOST":     "localhost",
        "FB_DATABASE": "",
        "FB_USER":     "SYSDBA",
        "FB_PASSWORD": "masterkey",
        "PORT":        "8000",
    }
    config_path = os.path.join(os.path.dirname(__file__), "db.config")
    if os.path.exists(config_path):
        with open(config_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    cfg[k.strip()] = v.strip()
    for k in cfg:
        cfg[k] = os.environ.get(k, cfg[k])
    return cfg

_cfg = _load_config()
FB_HOST     = _cfg["FB_HOST"]
FB_DATABASE = _cfg["FB_DATABASE"]
FB_USER     = _cfg["FB_USER"]
FB_PASSWORD = _cfg["FB_PASSWORD"]
PORT        = int(_cfg["PORT"])


def get_conn():
    import firebirdsql

    # Ищем fbclient.dll — пробуем Firebird 3.0, потом 5.0
    fb_client_candidates = [
        r"C:\Program Files\Firebird\Firebird_3_0\fbclient.dll",
        r"C:\Program Files\Firebird\Firebird_5_0\fbclient.dll",
        r"C:\Program Files (x86)\Firebird\Firebird_3_0\fbclient.dll",
        r"C:\Program Files (x86)\Firebird\Firebird_2_0\fbclient.dll",
    ]
    fb_client = None
    for path in fb_client_candidates:
        if os.path.exists(path):
            fb_client = path
            break

    kwargs = dict(
        host=FB_HOST,
        database=FB_DATABASE,
        user=FB_USER,
        password=FB_PASSWORD,
        charset="WIN1251",
    )
    if fb_client:
        kwargs["fb_library_name"] = fb_client

    return firebirdsql.connect(**kwargs)


CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
}


def build_tree(nodes, parent_id):
    children = [n for n in nodes if n["parent"] == parent_id]
    for child in children:
        child["children"] = build_tree(nodes, child["code"])
    return children


def handle_goods(params):
    search = (params.get("search", [""])[0] or "").strip()
    group  = params.get("group",  [None])[0]
    try:
        page  = max(1, int(params.get("page",  [1])[0]))
        limit = min(200, max(1, int(params.get("limit", [50])[0])))
    except Exception:
        page, limit = 1, 50

    skip = (page - 1) * limit

    where_parts = ["G.DELETED = 0", "G.ISPATH = 0"]
    args = []

    if group:
        where_parts.append("G.PARENT = ?")
        args.append(int(group))

    if search:
        where_parts.append(
            "(UPPER(TRIM(G.NAME)) CONTAINING UPPER(?) "
            "OR UPPER(TRIM(G.ART)) CONTAINING UPPER(?) "
            "OR EXISTS (SELECT 1 FROM DIR_GOODS_SCAN S WHERE S.CODE = G.CODE AND TRIM(S.VALUE0) = ?))"
        )
        args += [search, search, search]

    where_sql = " AND ".join(where_parts)

    sql = f"""
        SELECT FIRST {limit} SKIP {skip}
          G.CODE, TRIM(G.NAME) AS NAME, TRIM(G.ART) AS ART,
          G.PRICE_, G.PRICE1, G.PRICE2, G.PRICE3,
          TRIM(U.NAME) AS UNIT_NAME,
          COALESCE(SUM(E.QUANTITY), 0) AS STOCK
        FROM DIR_GOODS G
        LEFT JOIN DIR_UNITS U ON U.CODE = G.UNIT
        LEFT JOIN EXIST0 E ON E.SUBCONTO = G.CODE AND E.ACCOUNT = 41
        WHERE {where_sql}
        GROUP BY G.CODE, G.NAME, G.ART, G.PRICE_, G.PRICE1, G.PRICE2, G.PRICE3, U.NAME
        ORDER BY G.NAME
    """

    count_sql = f"""
        SELECT COUNT(DISTINCT G.CODE)
        FROM DIR_GOODS G
        LEFT JOIN DIR_GOODS_SCAN S ON S.CODE = G.CODE
        WHERE {where_sql}
    """

    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(sql, args)
    rows  = cur.fetchall()
    items = [
        {
            "code":   r[0],
            "name":   r[1],
            "art":    r[2],
            "price":  float(r[3]) if r[3] else 0,
            "price1": float(r[4]) if r[4] else 0,
            "price2": float(r[5]) if r[5] else 0,
            "price3": float(r[6]) if r[6] else 0,
            "unit":   r[7] or "",
            "stock":  float(r[8]) if r[8] else 0,
        }
        for r in rows
    ]
    cur.execute(count_sql, args)
    total = cur.fetchone()[0]
    conn.close()

    return 200, {"items": items, "total": total, "page": page, "limit": limit}


def handle_goods_detail(params):
    code = params.get("id", [None])[0]
    if not code:
        return 400, {"error": "id required"}
    try:
        code_int = int(code)
    except Exception:
        return 400, {"error": "id must be integer"}

    conn = get_conn()
    cur  = conn.cursor()

    cur.execute(
        """
        SELECT G.CODE, TRIM(G.NAME), TRIM(G.ART), G.PRICE_, G.PRICE1, G.PRICE2, G.PRICE3,
               TRIM(U.NAME) AS UNIT_NAME, G.FIRSTPRICE, G.NAGRADA, G.MARKING_,
               G.PARENT, G.PHOTO
        FROM DIR_GOODS G
        LEFT JOIN DIR_UNITS U ON U.CODE = G.UNIT
        WHERE G.CODE = ? AND G.DELETED = 0
        """,
        (code_int,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return 404, {"error": "not found"}

    good = {
        "code":       row[0],
        "name":       row[1],
        "art":        row[2],
        "price":      float(row[3]) if row[3] else 0,
        "price1":     float(row[4]) if row[4] else 0,
        "price2":     float(row[5]) if row[5] else 0,
        "price3":     float(row[6]) if row[6] else 0,
        "unit":       row[7] or "",
        "firstPrice": float(row[8]) if row[8] else 0,
        "nagrada":    float(row[9]) if row[9] else 0,
        "marking":    row[10],
        "parent":     row[11],
        "photo":      row[12],
    }

    cur.execute(
        "SELECT TRIM(VALUE0), DATE0 FROM DIR_GOODS_SCAN WHERE CODE = ? ORDER BY DATE0 DESC",
        (code_int,),
    )
    barcodes = [{"value": r[0], "date": str(r[1]) if r[1] else None} for r in cur.fetchall()]

    cur.execute(
        """
        SELECT E.SKLAD, TRIM(F.NAME) AS SKLAD_NAME,
               COALESCE(SUM(E.QUANTITY), 0), COALESCE(SUM(E.SUMMA), 0)
        FROM EXIST0 E
        LEFT JOIN DIR_FILIALS F ON F.CODE = E.SKLAD
        WHERE E.SUBCONTO = ? AND E.ACCOUNT = 41
        GROUP BY E.SKLAD, F.NAME
        HAVING SUM(E.QUANTITY) <> 0
        ORDER BY F.NAME
        """,
        (code_int,),
    )
    stocks = [
        {
            "sklad":     r[0],
            "skladName": r[1] or f"Склад {r[0]}",
            "qty":       float(r[2]),
            "summa":     float(r[3]),
        }
        for r in cur.fetchall()
    ]

    conn.close()
    return 200, {"good": good, "barcodes": barcodes, "stocks": stocks}


def handle_groups(_params):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT CODE, TRIM(NAME), PARENT
        FROM DIR_GOODS
        WHERE ISPATH = 1 AND DELETED = 0
        ORDER BY NAME
        """
    )
    rows  = cur.fetchall()
    conn.close()

    nodes = [{"code": r[0], "name": r[1], "parent": r[2], "children": []} for r in rows]

    root_ids = {n["code"] for n in nodes}
    tree = build_tree(nodes, None)
    if not tree:
        orphan_parents = {n["parent"] for n in nodes if n["parent"] not in root_ids}
        tree = build_tree(nodes, list(orphan_parents)[0] if orphan_parents else 0)

    return 200, {
        "groups": tree,
        "flat": [{"code": n["code"], "name": n["name"], "parent": n["parent"]} for n in nodes],
    }


def handle_health(_params):
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM DIR_GOODS WHERE DELETED = 0 AND ISPATH = 0")
        count = cur.fetchone()[0]
        conn.close()
        return 200, {"status": "ok", "goods_count": count, "host": FB_HOST, "database": FB_DATABASE}
    except Exception as e:
        return 500, {"status": "error", "message": str(e)}


def handle_save_config(body_bytes):
    data = json.loads(body_bytes.decode("utf-8"))
    lines = [
        f"FB_HOST={data.get('host', 'localhost')}",
        f"FB_DATABASE={data.get('database', '')}",
        f"FB_USER={data.get('user', 'SYSDBA')}",
        f"FB_PASSWORD={data.get('password', 'masterkey')}",
        f"PORT={data.get('port', '8000')}",
    ]
    config_path = os.path.join(os.path.dirname(__file__), "db.config")
    with open(config_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return 200, {"status": "saved"}


ROUTES = {
    "/goods":        handle_goods,
    "/goods/detail": handle_goods_detail,
    "/groups":       handle_groups,
    "/health":       handle_health,
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"  {self.address_string()} — {format % args}")

    def send_json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        handler_fn = ROUTES.get(parsed.path)
        if handler_fn is None:
            self.send_json(404, {"error": f"unknown path: {parsed.path}"})
            return
        try:
            status, body = handler_fn(params)
        except Exception as e:
            self.send_json(500, {"error": str(e)})
            return
        self.send_json(status, body)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/config":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                status, resp_body = handle_save_config(body)
            except Exception as e:
                self.send_json(500, {"error": str(e)})
                return
            self.send_json(status, resp_body)
        else:
            self.send_json(404, {"error": "not found"})


if __name__ == "__main__":
    print(f"╔══════════════════════════════════════════╗")
    print(f"║  ClientShop Local Bridge  v1.0           ║")
    print(f"╚══════════════════════════════════════════╝")
    print(f"  БД:   {FB_HOST} → {FB_DATABASE}")
    print(f"  Порт: http://localhost:{PORT}")
    print(f"")
    print(f"  Проверка подключения: http://localhost:{PORT}/health")
    print(f"  Стоп: Ctrl+C")
    print(f"")

    # Проверяем firebirdsql при старте
    try:
        import firebirdsql
    except ImportError:
        print("ОШИБКА: библиотека firebirdsql не установлена.")
        print("Запусти: pip install firebirdsql")
        sys.exit(1)

    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")