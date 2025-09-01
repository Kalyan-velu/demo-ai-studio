"use client";
import type React from "react";
import {STYLES} from "@/lib/constants";
import {ChevronDown} from "./icons";

export default function StyleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: (typeof STYLES)[number]) => void;
}) {
  return (
    <div className="mt-3">
      <label htmlFor="style" className="mb-1 block text-sm font-medium">
        Select a style
      </label>
      <div className="relative">
        <select
          id="style"
          value={value}
          onChange={(e) => onChange(e.target.value as any)}
          className="block w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Select a style"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}
