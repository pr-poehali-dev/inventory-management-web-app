import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

async function resizeToWebP(file: File | Blob, size = 650): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const aspect = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (aspect > 1) { sx = (sw - sh) / 2; sw = sh; }
      else if (aspect < 1) { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      resolve(canvas.toDataURL("image/webp", 0.88));
    };
    img.src = url;
  });
}

async function urlToWebP(src: string, size = 650): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const aspect = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (aspect > 1) { sx = (sw - sh) / 2; sw = sh; }
      else if (aspect < 1) { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      resolve(canvas.toDataURL("image/webp", 0.88));
    };
    img.onerror = reject;
    img.src = src;
  });
}

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ProductPhotoUploader({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File | Blob) => {
    setLoading(true);
    const result = await resizeToWebP(file);
    onChange(result);
    setLoading(false);
  }, [onChange]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) await handleFile(blob);
        return;
      }
    }
  }, [handleFile]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const result = await urlToWebP(urlInput.trim());
      onChange(result);
      setUrlInput("");
      setUrlMode(false);
    } catch {
      alert("Не удалось загрузить изображение по ссылке. Возможно, сайт блокирует загрузку.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? "hsl(var(--wms-blue))" : "hsl(var(--border))",
          background: dragOver ? "hsl(var(--wms-blue) / 0.06)" : "hsl(var(--card))",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) await handleFile(file);
        }}
        onClick={() => !value && fileRef.current?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Icon name="Loader2" size={28} className="animate-spin" />
            <span className="text-xs">Обработка…</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="фото" className="w-full h-full object-cover" />
            <button
              className="absolute top-2 right-2 p-1 rounded-md"
              style={{ background: "hsl(var(--background) / 0.85)" }}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >
              <Icon name="X" size={14} className="text-destructive" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground px-4 text-center">
            <Icon name="ImagePlus" size={32} className="opacity-40" />
            <span className="text-xs leading-relaxed">
              Перетащите, вставьте<br />(Ctrl+V) или нажмите
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md border"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
        >
          <Icon name="Upload" size={12} />
          Файл
        </button>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md border"
          style={{
            borderColor: urlMode ? "hsl(var(--wms-blue))" : "hsl(var(--border))",
            color: urlMode ? "hsl(var(--wms-blue))" : "hsl(var(--muted-foreground))",
          }}
        >
          <Icon name="Link" size={12} />
          Ссылка
        </button>
      </div>

      {urlMode && (
        <div className="flex gap-1.5">
          <input
            className="flex-1 px-2 py-1.5 text-xs rounded-md border bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }}
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrl()}
          />
          <button
            type="button"
            onClick={handleUrl}
            className="px-2 py-1.5 text-xs rounded-md font-medium"
            style={{ background: "hsl(var(--wms-blue))", color: "#fff" }}
          >
            Ок
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
