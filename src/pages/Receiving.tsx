import { useState, useRef, useEffect, useCallback } from "react";
import { DOCS, ReceivingDoc, ReceivingItem, fuzzyMatch } from "./receiving/types";
import DocList from "./receiving/DocList";
import BarcodeScanner from "./receiving/BarcodeScanner";
import DocDetails from "./receiving/DocDetails";
import { ConflictModal, BindModal } from "./receiving/Modals";

/* ─── Главный компонент ──────────────────────────────────────────── */
export default function Receiving() {
  const [docs, setDocs] = useState<ReceivingDoc[]>(DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>(DOCS[0].id);
  const [docSearch, setDocSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [lastScans, setLastScans] = useState<{ code: string; found: boolean }[]>([]);

  // Диалог выбора накладной при совпадении в нескольких
  const [conflictModal, setConflictModal] = useState<{
    code: string;
    matches: { doc: ReceivingDoc; item: ReceivingItem }[];
  } | null>(null);

  // Диалог привязки нераспознанного штрихкода к товару
  const [bindModal, setBindModal] = useState<{ code: string } | null>(null);
  const [bindSearch, setBindSearch] = useState("");

  const barcodeRef = useRef<HTMLInputElement>(null);
  const itemSearchRef = useRef<HTMLInputElement>(null);

  const selectedDoc = docs.find((d) => d.id === selectedDocId)!;

  /* Фокус всегда в поле штрихкода, если мышь не над полем кол-ва или поиска товара */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isQty = target.closest("[data-qty-input]");
      const isItemSearch = target.closest("[data-item-search]");
      if (!isQty && !isItemSearch) {
        barcodeRef.current?.focus();
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* Обновить количество принятого в конкретном товаре конкретного документа */
  const setReceived = useCallback((docId: string, itemId: number, qty: number) => {
    setDocs((prev) => prev.map((d) =>
      d.id !== docId ? d : {
        ...d,
        items: d.items.map((it) => it.id === itemId ? { ...it, received: qty } : it),
      }
    ));
  }, []);

  /* Обработка сканирования */
  const handleScan = useCallback(() => {
    const code = barcode.trim();
    if (!code) return;
    setBarcode("");

    // Найти все совпадения по штрихкоду во всех документах
    const matches: { doc: ReceivingDoc; item: ReceivingItem }[] = [];
    for (const doc of docs) {
      for (const item of doc.items) {
        if (item.barcodes.includes(code)) {
          matches.push({ doc, item });
        }
      }
    }

    setLastScans((prev) => [{ code, found: matches.length > 0 }, ...prev.slice(0, 7)]);

    if (matches.length === 0) {
      // Нераспознанный штрихкод — предложить привязку
      setBindModal({ code });
      return;
    }

    if (matches.length === 1) {
      // Единственное совпадение — автовыбор
      const { doc, item } = matches[0];
      setSelectedDocId(doc.id);
      setReceived(doc.id, item.id, item.received + 1);
      return;
    }

    // Несколько совпадений — дать выбор
    setConflictModal({ code, matches });
  }, [barcode, docs, setReceived]);

  /* Привязать штрихкод к товару из текущего документа */
  const handleBind = (item: ReceivingItem) => {
    if (!bindModal) return;
    setDocs((prev) => prev.map((d) =>
      d.id !== selectedDocId ? d : {
        ...d,
        items: d.items.map((it) =>
          it.id !== item.id ? it : { ...it, barcodes: [...it.barcodes, bindModal.code] }
        ),
      }
    ));
    setBindModal(null);
    setBindSearch("");
  };

  /* Выбрать документ из конфликтного диалога */
  const handleConflictChoice = ({ doc, item }: { doc: ReceivingDoc; item: ReceivingItem }) => {
    setSelectedDocId(doc.id);
    setReceived(doc.id, item.id, item.received + 1);
    setConflictModal(null);
  };

  /* Фильтрация документов */
  const filteredDocs = docs.filter((d) => {
    const q = docSearch.toLowerCase();
    return (
      d.id.toLowerCase().includes(q) ||
      d.supplier.toLowerCase().includes(q) ||
      d.doc.toLowerCase().includes(q)
    );
  });

  /* Фильтрация позиций в выбранном документе */
  const filteredItems = selectedDoc.items.filter((it) =>
    !itemSearch.trim() ||
    fuzzyMatch(it.name, itemSearch) ||
    fuzzyMatch(it.art, itemSearch) ||
    it.barcodes.some((b) => b.includes(itemSearch))
  );

  const total = selectedDoc.items.reduce((s, i) => s + i.expected, 0);
  const done = selectedDoc.items.reduce((s, i) => s + i.received, 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex gap-4 h-full">

      {/* Левая колонка: список документов */}
      <DocList
        filteredDocs={filteredDocs}
        selectedDocId={selectedDocId}
        docSearch={docSearch}
        onDocSearchChange={setDocSearch}
        onSelectDoc={setSelectedDocId}
      />

      {/* Правая колонка */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        {/* Сканер штрихкода */}
        <BarcodeScanner
          barcode={barcode}
          lastScans={lastScans}
          barcodeRef={barcodeRef}
          onBarcodeChange={setBarcode}
          onScan={handleScan}
        />

        {/* Шапка документа + поиск + таблица позиций */}
        <DocDetails
          selectedDoc={selectedDoc}
          filteredItems={filteredItems}
          itemSearch={itemSearch}
          itemSearchRef={itemSearchRef}
          progress={progress}
          done={done}
          total={total}
          onItemSearchChange={setItemSearch}
          onSetReceived={setReceived}
        />
      </div>

      {/* Диалог: выбор накладной при конфликте */}
      <ConflictModal
        conflictModal={conflictModal}
        onClose={() => setConflictModal(null)}
        onChoice={handleConflictChoice}
      />

      {/* Диалог: привязка нераспознанного штрихкода */}
      <BindModal
        bindModal={bindModal}
        bindSearch={bindSearch}
        selectedDocItems={selectedDoc.items}
        onClose={() => { setBindModal(null); setBindSearch(""); }}
        onBindSearchChange={setBindSearch}
        onBind={handleBind}
      />
    </div>
  );
}
