import { useState, useEffect, useCallback, useRef } from "react";
import { GoodItem, GroupNode } from "./clientshop/types";
import GoodsGroupTree from "./clientshop/GoodsGroupTree";
import GoodsModal from "./clientshop/GoodsModal";
import GoodsTable, { GoodsSearchBar } from "./clientshop/GoodsTable";

const FUNC_URL = "https://functions.poehali.dev/c9ea37e6-42e6-4703-9de7-6889f45ff132";
const FUNC_GROUPS_URL = "https://functions.poehali.dev/f953c269-2df9-49f3-b70e-95aab47a8fd5";
const LIMIT = 50;

export default function ClientShopGoods() {
  const [items, setItems] = useState<GoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailCode, setDetailCode] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загрузка групп
  useEffect(() => {
    fetch(FUNC_GROUPS_URL)
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || []))
      .catch(() => {});
  }, []);

  // Загрузка товаров
  const loadGoods = useCallback((pg: number, q: string, grp: number | null) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) });
    if (q) params.set("search", q);
    if (grp !== null) params.set("group", String(grp));

    fetch(`${FUNC_URL}?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => setError("Ошибка загрузки данных"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadGoods(page, search, selectedGroup);
  }, [page, search, selectedGroup, loadGoods]);

  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 400);
  };

  const handleGroupSelect = (code: number | null) => {
    setSelectedGroup(code);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex gap-4 h-full min-h-0">
      <GoodsGroupTree
        groups={groups}
        selectedGroup={selectedGroup}
        onSelect={handleGroupSelect}
      />

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <GoodsSearchBar
          searchInput={searchInput}
          total={total}
          loading={loading}
          onChange={handleSearchChange}
        />

        <GoodsTable
          items={items}
          loading={loading}
          error={error}
          search={search}
          page={page}
          totalPages={totalPages}
          onRowClick={setDetailCode}
          onPage={setPage}
        />
      </div>

      {detailCode !== null && (
        <GoodsModal code={detailCode} onClose={() => setDetailCode(null)} />
      )}
    </div>
  );
}
