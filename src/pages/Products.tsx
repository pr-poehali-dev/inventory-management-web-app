import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Product, SupplierArticle, MOCK_PRODUCTS } from "./products/products.types";
import ProductList from "./products/ProductList";
import ProductDetail from "./products/ProductDetail";
import ProductPrintModal from "./products/ProductPrintModal";

export type { Product, SupplierArticle };

interface Props {
  onNavigate?: (page: string) => void;
}

function goToLabelsWithProduct(p: Product) {
  try {
    const raw = localStorage.getItem("labels_settings");
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem("labels_settings", JSON.stringify({
      ...existing,
      data: {
        ...(existing.data ?? {}),
        productName: p.name,
        article: p.manufacturerArticle || p.id,
        price: p.salePrice.toLocaleString("ru-RU"),
        barcode: p.barcodes[0] || "",
      },
    }));
  } catch (_) { /* ignore */ }
}

export default function Products({ onNavigate }: Props) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Product | null>(null);
  const [printTarget, setPrintTarget] = useState<Product | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRowClick(p: Product) {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setSelected(p);
      setEditing(false);
      setForm(null);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
      }, 230);
    }
  }

  function startEdit(p: Product) {
    setForm({ ...p });
    setEditing(true);
    setSelected(p);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
  }

  function saveEdit() {
    if (!form) return;
    setProducts((prev) => prev.map((p) => (p.id === form.id ? form : p)));
    setSelected(form);
    setEditing(false);
    setForm(null);
  }

  function setF<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function addSupplierArticle() {
    setForm((prev) =>
      prev ? { ...prev, supplierArticles: [...prev.supplierArticles, { supplierName: "", article: "" }] } : prev
    );
  }

  function removeSupplierArticle(i: number) {
    setForm((prev) =>
      prev ? { ...prev, supplierArticles: prev.supplierArticles.filter((_, idx) => idx !== i) } : prev
    );
  }

  function setSupplierArticle(i: number, key: keyof SupplierArticle, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const arr = [...prev.supplierArticles];
      arr[i] = { ...arr[i], [key]: value };
      return { ...prev, supplierArticles: arr };
    });
  }

  function handleGoToLabels(p: Product) {
    goToLabelsWithProduct(p);
    onNavigate?.("labels");
  }

  return (
    <div className="relative h-full">
      <ProductList
        products={products}
        selectedId={selected?.id ?? null}
        onRowClick={handleRowClick}
        onEdit={startEdit}
        onPrint={setPrintTarget}
      />

      {/* Карточка товара — перекрывает список абсолютно */}
      {selected && (
        <div className="absolute inset-0 z-20">
          <ProductDetail
            product={selected}
            editing={editing}
            form={form}
            onStartEdit={() => startEdit(selected)}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onClose={() => { cancelEdit(); setSelected(null); }}
            onGoToLabels={() => handleGoToLabels(form ?? selected)}
            setF={setF}
            addSupplierArticle={addSupplierArticle}
            removeSupplierArticle={removeSupplierArticle}
            setSupplierArticle={setSupplierArticle}
          />
        </div>
      )}

      {printTarget && (
        <ProductPrintModal product={printTarget} onClose={() => setPrintTarget(null)} />
      )}
    </div>
  );
}