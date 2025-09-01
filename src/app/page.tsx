"use client";

import Image from "next/image";
import type React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {HISTORY_KEY, type HistoryItem, MAX_FILE_MB, MAX_WIDTH, type STYLES,} from "@/lib/constants";
import {addSuffix, blobToDataURL, dataUrlToBlob, downscaleImage, getImageDims,} from "@/lib/image";
import {cn} from "@/lib/utils";
import DropZone from "./components/dropzone";
import EmptyPreview from "./components/EmptyPreview";
import {WarningIcon} from "./components/icons";
import LiveSummaryCard from "./components/LiveSummaryCard";
import StyleSelect from "./components/StyleSelect";

// Color system (4 colors total):
// - Primary: blue-600
// - Neutrals: white, slate-100/200, slate-900
// - Accent: amber-500

export default function Page() {
  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Editorial");
  const [oversize, setOversize] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Load and persist history in localStorage (not a network fetch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        setHistory(parsed);
        if (parsed.length) {
          setCurrent(parsed[0]);
          setPrompt(parsed[0].prompt || "");
          setStyle((parsed[0].style as any) || "Editorial");
        }
      }
    } catch {
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
    } catch {
    }
  }, [history]);
  
  const onBrowseClick = () => inputRef.current?.click();
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  
  function isSupported(file: File) {
    const okType = ["image/png", "image/jpeg"].includes(file.type);
    return okType;
  }
  
  function fileSizeMB(file: File | Blob) {
    return +(file.size / (1024 * 1024)).toFixed(2);
  }
  
  async function handleFile(file: File | Blob, forcedName?: string) {
    // Check type when a File (for Blob downscale result, skip type check)
    if (file instanceof File && !isSupported(file)) {
      alert("Only PNG and JPG files are supported.");
      return;
    }
    
    const sizeOk = fileSizeMB(file) <= MAX_FILE_MB;
    setOversize(!sizeOk);
    
    // Read to data URL for preview/history
    const dataUrl = await blobToDataURL(file);
    const dims = await getImageDims(dataUrl);
    
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      src: dataUrl,
      name:
        forcedName ??
        (file instanceof File
          ? file.name
          : `image-${new Date().getTime()}.jpg`),
      sizeMB: fileSizeMB(file),
      width: dims.width,
      height: dims.height,
      prompt,
      style,
      createdAt: Date.now(),
    };
    
    setCurrent(item);
    setHistory((prev) =>
      [item, ...prev.filter((p) => p.src !== item.src)].slice(0, 12),
    );
  }
  
  async function handleDownscale() {
    if (!current) return;
    // Convert current.src back to Image and downscale
    const blob = await dataUrlToBlob(current.src);
    const resultBlob = await downscaleImage(blob, MAX_WIDTH, 0.9);
    await handleFile(resultBlob, addSuffix(current.name, "-1920w.jpg"));
    setOversize(fileSizeMB(resultBlob) > MAX_FILE_MB); // re-evaluate
  }
  
  const liveSummary = useMemo(() => {
    return {
      prompt,
      style,
      thumb: current?.src ?? "",
      name: current?.name ?? "No image selected",
    };
  }, [prompt, style, current]);
  
  const restoreFromHistory = (item: HistoryItem) => {
    setCurrent(item);
    setPrompt(item.prompt || "");
    setStyle((item.style as any) || "Editorial");
    setOversize(item.sizeMB > MAX_FILE_MB);
    // Move restored item to front
    setHistory((prev) => {
      const without = prev.filter((p) => p.id !== item.id);
      return [item, ...without];
    });
  };
  
  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-4 py-6 grid gap-6 md:grid-cols-5">
        {/* Left: Upload & Preview */}
        <div className="md:col-span-3 space-y-3">
          {/* Oversize indicator */}
          {oversize && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-900"
            >
              <WarningIcon/>
              <div className="flex-1">
                <p className="font-medium">
                  Large file detected ({current?.sizeMB ?? 0} MB). Consider
                  downscaling to max width {MAX_WIDTH}px before submitting.
                </p>
                <p className="text-slate-700">
                  This can reduce upload time and improve performance.
                </p>
              </div>
              <button
                onClick={handleDownscale}
                className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-sm font-medium hover:bg-amber-100"
              >
                Downscale to {MAX_WIDTH}px
              </button>
            </div>
          )}
          
          <DropZone
            onDrop={onDrop}
            onBrowseClick={onBrowseClick}
            hasImage={!!current?.src}
          >
            {current?.src ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
                {/* Using next/image for optimization */}
                <Image
                  src={current.src || "/placeholder.svg"}
                  alt={current?.name || "Uploaded image preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-contain bg-slate-100"
                />
                <div className="absolute left-2 top-2 rounded-md bg-white/80 px-2 py-1 text-xs font-medium shadow">
                  {(current.width || 0) + "×" + (current.height || 0)} •{" "}
                  {current.sizeMB} MB
                </div>
              </div>
            ) : (
              <EmptyPreview/>
            )}
          </DropZone>
          
          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            className="sr-only"
            aria-hidden="true"
          />
          <p className="text-xs text-slate-600">
            Supported: PNG, JPG. Max size: {MAX_FILE_MB}MB. Drag & drop or click
            “Upload Image”.
          </p>
        </div>
        
        {/* Right: Prompt & Style */}
        <aside className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="mb-2 text-base font-semibold">Prompt & Style</h2>
            <label htmlFor="prompt" className="sr-only">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-600"
              rows={4}
            />
            <StyleSelect value={style} onChange={setStyle}/>
          </div>
          
          <LiveSummaryCard
            image={liveSummary.thumb}
            prompt={liveSummary.prompt}
            style={liveSummary.style}
            title={liveSummary.name}
          />
        </aside>
      </section>
      
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">History</h3>
          <button
            className="text-sm text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
            onClick={() => {
              setHistory([]);
              setCurrent(null);
              localStorage.removeItem(HISTORY_KEY);
            }}
          >
            Clear
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">No uploads yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => restoreFromHistory(item)}
                  className={cn(
                    "group block w-full overflow-hidden rounded-lg border",
                    "border-slate-200 bg-white text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  )}
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={item.src || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.style} • {item.sizeMB} MB
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
