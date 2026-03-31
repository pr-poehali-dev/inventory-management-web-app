import { useState } from "react";
import InvoiceImport from "@/components/receiving/InvoiceImport";
import EnrichmentImport from "@/components/receiving/EnrichmentImport";
import MarkingImport from "@/components/receiving/MarkingImport";
import { Invoice, InvoiceRow, NewInvoiceForm, initialInvoices } from "./invoicesTypes";
import { mergeDuplicates, removeDuplicates } from "@/components/receiving/invoiceImportTypes";
import { InvoiceNewDialog } from "./InvoiceNewDialog";
import { InvoicesSidebar } from "./InvoicesSidebar";
import { InvoiceDetail } from "./InvoiceDetail";

export type { Invoice };

// ─── Основной компонент-оркестратор ────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedId, setSelectedId] = useState(initialInvoices[0].id);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);
  const [showMarking, setShowMarking] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const selected = invoices.find((inv) => inv.id === selectedId);
  const rows = selected?.rows ?? null;

  const filtered = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(search.toLowerCase()) ||
      inv.docNumber.toLowerCase().includes(search.toLowerCase())
  );

  const nextId = `НКЛ-${String(invoices.length + 1).padStart(4, "0")}`;

  // ── Обновление строк текущей накладной ─────────────────────────────────
  const updateRows = (newRows: InvoiceRow[]) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedId
          ? { ...inv, rows: newRows, items: newRows.length, status: "ready" }
          : inv
      )
    );
  };

  // ── Создание новой накладной через диалог ──────────────────────────────
  const handleCreateNew = (form: NewInvoiceForm) => {
    const displayDate = new Date(form.date).toLocaleDateString("ru-RU");
    const newInv: Invoice = {
      id: nextId,
      supplier: form.supplier,
      date: displayDate,
      items: 0,
      status: "draft",
      docNumber: form.docNumber || nextId,
      rows: undefined,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedId(newInv.id);
    setShowNewDialog(false);
  };

  // ── Импорт строк из файла ──────────────────────────────────────────────
  const handleImport = (newRows: InvoiceRow[]) => {
    if (selected) {
      updateRows(newRows);
      return;
    }
    const today = new Date().toLocaleDateString("ru-RU");
    const num = String(invoices.length + 1).padStart(4, "0");
    const newInv: Invoice = {
      id: `НКЛ-${num}`,
      supplier: "Новый поставщик",
      date: today,
      items: newRows.length,
      status: "draft",
      docNumber: `НКЛ-${num}`,
      rows: newRows,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedId(newInv.id);
  };

  // ── Сохранение реквизитов шапки ────────────────────────────────────────
  const handleSaveHeader = (draft: { supplier: string; docNumber: string; date: string }) => {
    const displayDate = new Date(draft.date).toLocaleDateString("ru-RU");
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedId
          ? { ...inv, supplier: draft.supplier, docNumber: draft.docNumber, date: displayDate }
          : inv
      )
    );
  };

  // ── Объединить дубли ───────────────────────────────────────────────────
  const handleMergeDuplicates = () => {
    if (!rows) return;
    updateRows(mergeDuplicates(rows));
  };

  // ── Удалить лишние дубли ───────────────────────────────────────────────
  const handleRemoveDuplicates = () => {
    if (!rows) return;
    updateRows(removeDuplicates(rows));
  };

  // ── Передача в приёмку ─────────────────────────────────────────────────
  const handleSendToReceiving = () => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === selectedId ? { ...inv, status: "sent" } : inv))
    );
  };

  const totalSum = rows
    ? rows.reduce((s, r) => s + (r.costTotal > 0 ? r.costTotal : r.costPrice * r.qty), 0)
    : 0;

  return (
    <>
      {showNewDialog && (
        <InvoiceNewDialog
          nextId={nextId}
          onConfirm={handleCreateNew}
          onClose={() => setShowNewDialog(false)}
        />
      )}
      {showImport && (
        <InvoiceImport
          supplierName={selected?.supplier}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      {showEnrich && rows && (
        <EnrichmentImport
          rows={rows}
          onEnriched={(r) => updateRows(r)}
          onClose={() => setShowEnrich(false)}
        />
      )}
      {showMarking && rows && (
        <MarkingImport
          rows={rows}
          onApplied={(r) => updateRows(r)}
          onClose={() => setShowMarking(false)}
        />
      )}

      <div className="flex gap-4 h-full">
        <InvoicesSidebar
          filtered={filtered}
          selectedId={selectedId}
          search={search}
          onSelect={setSelectedId}
          onSearchChange={setSearch}
          onNewClick={() => setShowNewDialog(true)}
        />

        <InvoiceDetail
          selected={selected}
          rows={rows}
          totalSum={totalSum}
          onShowImport={() => setShowImport(true)}
          onShowEnrich={() => setShowEnrich(true)}
          onShowMarking={() => setShowMarking(true)}
          onSendToReceiving={handleSendToReceiving}
          onSaveHeader={handleSaveHeader}
          onMergeDuplicates={handleMergeDuplicates}
          onRemoveDuplicates={handleRemoveDuplicates}
        />
      </div>
    </>
  );
}