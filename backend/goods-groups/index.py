"""
Дерево групп товаров из Firebird (ClientShop).
GET / — все группы (ISPATH=1, DELETED=0) с иерархией через PARENT
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


def build_tree(nodes, parent_id):
    children = [n for n in nodes if n["parent"] == parent_id]
    for child in children:
        child["children"] = build_tree(nodes, child["code"])
    return children


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT CODE, TRIM(NAME), PARENT
        FROM DIR_GOODS
        WHERE ISPATH = 1 AND DELETED = 0
        ORDER BY NAME
        """
    )
    rows = cur.fetchall()
    conn.close()

    nodes = [{"code": r[0], "name": r[1], "parent": r[2], "children": []} for r in rows]

    root_ids = {n["code"] for n in nodes}
    tree = build_tree(nodes, None)
    if not tree:
        orphan_parents = {n["parent"] for n in nodes if n["parent"] not in root_ids}
        tree = build_tree(nodes, list(orphan_parents)[0] if orphan_parents else 0)

    return resp(200, {"groups": tree, "flat": [{"code": n["code"], "name": n["name"], "parent": n["parent"]} for n in nodes]})
