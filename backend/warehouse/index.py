"""
API для управления складом: зоны, стеллажи, ячейки.
GET    /         - получить всю структуру склада
POST   /zones    - создать зону
PUT    /zones    - обновить зону
POST   /racks    - создать стеллаж (автоматически создаёт ячейки)
PUT    /racks    - обновить стеллаж
POST   /cells/bulk-print - получить данные ячеек для печати
"""
import json
import os
import psycopg2


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status, body):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False)}


def generate_cell_label(zone_name, rack_name, row, col):
    return f"{zone_name}-{rack_name}-R{row:02d}C{col:02d}"


def generate_barcode(zone_name, rack_name, row, col):
    z = zone_name[:2].upper().replace(" ", "")
    r = rack_name[:4].upper().replace(" ", "")
    return f"WH-{z}-{r}-{row:02d}-{col:02d}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    # GET / — вся структура
    if method == "GET":
        cur.execute("SELECT id, name, color, sort_order FROM zones ORDER BY sort_order, name")
        zones = [{"id": str(r[0]), "name": r[1], "color": r[2], "sort_order": r[3]} for r in cur.fetchall()]

        cur.execute("SELECT id, zone_id, name, rows_count, cols_count, sort_order FROM racks ORDER BY sort_order, name")
        racks_raw = cur.fetchall()
        racks = [{"id": str(r[0]), "zone_id": str(r[1]), "name": r[2], "rows_count": r[3], "cols_count": r[4], "sort_order": r[5]} for r in racks_raw]

        cur.execute("SELECT id, rack_id, zone_id, row_num, col_num, label, barcode, is_occupied FROM cells ORDER BY row_num, col_num")
        cells = [{"id": str(r[0]), "rack_id": str(r[1]), "zone_id": str(r[2]), "row_num": r[3], "col_num": r[4], "label": r[5], "barcode": r[6], "is_occupied": r[7]} for r in cur.fetchall()]

        conn.close()
        return resp(200, {"zones": zones, "racks": racks, "cells": cells})

    # POST /zones — создать зону
    if method == "POST" and "/zones" in path:
        name = body.get("name", "").strip()
        color = body.get("color", "#3b82f6")
        if not name:
            conn.close()
            return resp(400, {"error": "name required"})
        cur.execute("SELECT COALESCE(MAX(sort_order),0)+1 FROM zones")
        sort = cur.fetchone()[0]
        cur.execute("INSERT INTO zones (name, color, sort_order) VALUES (%s,%s,%s) RETURNING id", (name, color, sort))
        new_id = str(cur.fetchone()[0])
        conn.commit()
        conn.close()
        return resp(200, {"id": new_id, "name": name, "color": color, "sort_order": sort})

    # PUT /zones — обновить зону
    if method == "PUT" and "/zones" in path:
        zone_id = body.get("id")
        if not zone_id:
            conn.close()
            return resp(400, {"error": "id required"})
        fields = []
        vals = []
        if "name" in body:
            fields.append("name=%s"); vals.append(body["name"])
        if "color" in body:
            fields.append("color=%s"); vals.append(body["color"])
        if not fields:
            conn.close()
            return resp(400, {"error": "nothing to update"})
        vals.append(zone_id)
        cur.execute(f"UPDATE zones SET {', '.join(fields)} WHERE id=%s", vals)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # POST /racks — создать стеллаж + ячейки
    if method == "POST" and "/racks" in path:
        zone_id = body.get("zone_id")
        name = body.get("name", "").strip()
        rows = int(body.get("rows_count", 4))
        cols = int(body.get("cols_count", 5))
        if not zone_id or not name:
            conn.close()
            return resp(400, {"error": "zone_id and name required"})

        cur.execute("SELECT name FROM zones WHERE id=%s", (zone_id,))
        zone_row = cur.fetchone()
        if not zone_row:
            conn.close()
            return resp(404, {"error": "zone not found"})
        zone_name = zone_row[0]

        cur.execute("SELECT COALESCE(MAX(sort_order),0)+1 FROM racks WHERE zone_id=%s", (zone_id,))
        sort = cur.fetchone()[0]
        cur.execute("INSERT INTO racks (zone_id, name, rows_count, cols_count, sort_order) VALUES (%s,%s,%s,%s,%s) RETURNING id", (zone_id, name, rows, cols, sort))
        rack_id = str(cur.fetchone()[0])

        cells_created = []
        for row in range(1, rows + 1):
            for col in range(1, cols + 1):
                label = generate_cell_label(zone_name, name, row, col)
                barcode = generate_barcode(zone_name, name, row, col)
                cur.execute(
                    "INSERT INTO cells (rack_id, zone_id, row_num, col_num, label, barcode) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (rack_id, zone_id, row, col, label, barcode)
                )
                cell_id = str(cur.fetchone()[0])
                cells_created.append({"id": cell_id, "rack_id": rack_id, "zone_id": zone_id, "row_num": row, "col_num": col, "label": label, "barcode": barcode, "is_occupied": False})

        conn.commit()
        conn.close()
        return resp(200, {"id": rack_id, "zone_id": zone_id, "name": name, "rows_count": rows, "cols_count": cols, "sort_order": sort, "cells": cells_created})

    # PUT /racks — обновить стеллаж
    if method == "PUT" and "/racks" in path:
        rack_id = body.get("id")
        if not rack_id:
            conn.close()
            return resp(400, {"error": "id required"})
        fields = []
        vals = []
        if "name" in body:
            fields.append("name=%s"); vals.append(body["name"])
        if not fields:
            conn.close()
            return resp(400, {"error": "nothing to update"})
        vals.append(rack_id)
        cur.execute(f"UPDATE racks SET {', '.join(fields)} WHERE id=%s", vals)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # POST /cells/bulk-print — данные ячеек для печати
    if method == "POST" and "bulk-print" in path:
        rack_id = body.get("rack_id")
        cell_ids = body.get("cell_ids", [])
        if rack_id:
            cur.execute("SELECT id, label, barcode FROM cells WHERE rack_id=%s ORDER BY row_num, col_num", (rack_id,))
        elif cell_ids:
            placeholders = ",".join(["%s"] * len(cell_ids))
            cur.execute(f"SELECT id, label, barcode FROM cells WHERE id IN ({placeholders}) ORDER BY row_num, col_num", cell_ids)
        else:
            conn.close()
            return resp(400, {"error": "rack_id or cell_ids required"})
        cells = [{"id": str(r[0]), "label": r[1], "barcode": r[2]} for r in cur.fetchall()]
        conn.close()
        return resp(200, {"cells": cells})

    conn.close()
    return resp(404, {"error": "not found"})
