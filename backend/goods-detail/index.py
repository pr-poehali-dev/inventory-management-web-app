"""
Карточка товара из Firebird (ClientShop).
GET /?id=CODE — полная карточка: поля, штрихкоды, остатки по складам
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
    code = params.get("id")
    if not code:
        return resp(400, {"error": "id required"})

    try:
        code_int = int(code)
    except Exception:
        return resp(400, {"error": "id must be integer"})

    conn = get_conn()
    cur = conn.cursor()

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
        return resp(404, {"error": "not found"})

    good = {
        "code": row[0],
        "name": row[1],
        "art": row[2],
        "price": float(row[3]) if row[3] else 0,
        "price1": float(row[4]) if row[4] else 0,
        "price2": float(row[5]) if row[5] else 0,
        "price3": float(row[6]) if row[6] else 0,
        "unit": row[7] or "",
        "firstPrice": float(row[8]) if row[8] else 0,
        "nagrada": float(row[9]) if row[9] else 0,
        "marking": row[10],
        "parent": row[11],
        "photo": row[12],
    }

    cur.execute(
        "SELECT TRIM(VALUE0), DATE0 FROM DIR_GOODS_SCAN WHERE CODE = ? ORDER BY DATE0 DESC",
        (code_int,),
    )
    barcodes = [{"value": r[0], "date": str(r[1]) if r[1] else None} for r in cur.fetchall()]

    cur.execute(
        """
        SELECT E.SKLAD, TRIM(F.NAME) AS SKLAD_NAME, COALESCE(SUM(E.QUANTITY), 0), COALESCE(SUM(E.SUMMA), 0)
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
            "sklad": r[0],
            "skladName": r[1] or f"Склад {r[0]}",
            "qty": float(r[2]),
            "summa": float(r[3]),
        }
        for r in cur.fetchall()
    ]

    conn.close()
    return resp(200, {"good": good, "barcodes": barcodes, "stocks": stocks})
