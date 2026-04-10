"""
Список товаров из Firebird (ClientShop).
GET / — список с пагинацией и поиском
Параметры: search, group, page (1-based), limit
"""
import json
import os
import firebirdsql


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return firebirdsql.connect(
        host=os.environ["FB_HOST"],
        database=os.environ["FB_DATABASE"],
        user=os.environ["FB_USER"],
        password=os.environ["FB_PASSWORD"],
        charset="WIN1251",
    )


def resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    search = (params.get("search") or "").strip()
    group = params.get("group")
    try:
        page = max(1, int(params.get("page", 1)))
        limit = min(200, max(1, int(params.get("limit", 50))))
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
    cur = conn.cursor()

    cur.execute(sql, args)
    rows = cur.fetchall()
    items = [
        {
            "code": r[0],
            "name": r[1],
            "art": r[2],
            "price": float(r[3]) if r[3] else 0,
            "price1": float(r[4]) if r[4] else 0,
            "price2": float(r[5]) if r[5] else 0,
            "price3": float(r[6]) if r[6] else 0,
            "unit": r[7] or "",
            "stock": float(r[8]) if r[8] else 0,
        }
        for r in rows
    ]

    cur.execute(count_sql, args)
    total = cur.fetchone()[0]

    conn.close()
    return resp(200, {"items": items, "total": total, "page": page, "limit": limit})
