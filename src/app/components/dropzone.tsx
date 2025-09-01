"use client";
import {useState} from "react";
import type React from "react";
import {cn} from "@/lib/utils";

export function DropZone({
  hasImage,
  onDrop,
  onBrowseClick,
  children,
}: {
  hasImage: boolean;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        setActive(false);
        onDrop(e);
      }}
      role="region"
      aria-label="Image upload area"
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-2",
        active && "ring-2 ring-blue-600",
      )}
    >
      {children}
      {!hasImage && (
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={onBrowseClick}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Choose file
          </button>
        </div>
      )}
    </div>
  );
}
export default DropZone;
