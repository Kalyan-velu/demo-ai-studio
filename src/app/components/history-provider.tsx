"use client";
import type React from "react";
import {useCallback, useEffect, useState} from "react";
import {HistoryContext as HistoryContext1} from "@/hooks/use-history";
import {type GeneratedResponse, HISTORY_KEY, type ItemDetails,} from "@/lib/constants";
import {dataUrlToBlob, getImageDims} from "@/lib/image";
import {fileSizeMB} from "@/lib/utils";

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<GeneratedResponse[]>([]);
  const [selected, setSelected] = useState<ItemDetails | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GeneratedResponse[];
          setHistory(parsed);
        } catch (e) {
          console.error("Failed to parse history from localStorage", e);
        }
      }
    }
  }, []);

  const updateHistory = (history: GeneratedResponse[]) => {
    console.log("Saving history to local storage", history);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  };

  const onHistorySelect = useCallback(
    async (
      item: GeneratedResponse | null,
    ): Promise<(ItemDetails & { file: Blob | File }) | null> => {
      if (item) {
        const image = await dataUrlToBlob(item.dataUrl);
        const dims = await getImageDims(item?.dataUrl);
        return {
          ...dims,
          src: item.dataUrl,
          name: item.id,
          prompt: item.prompt,
          style: item.style,
          sizeMB: fileSizeMB(image),
          file: image,
        };
      }
      return null;
    },
    [],
  );

  const appendHistory = (item: GeneratedResponse) => {
    setHistory((prev) => {
      const updated = [item, ...prev];
      if (updated.length > 5) {
        updated.pop();
      }
      updateHistory(updated);
      return updated;
    });
    void onHistorySelect(item);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const removeHistory = useCallback((item: GeneratedResponse) => {
    setHistory((prev) => {
      const updated = prev.filter((i) => i.id !== item.id);
      updateHistory(updated);
      return updated;
    });
  }, []);

  const resetHistory = () => {
    setHistory([]);
    setSelected(null);
    localStorage.removeItem(HISTORY_KEY);
  };

  const value = {
    history,
    selected,
    onHistorySelect,
    appendHistory,
    resetHistory,
    removeHistory,
  };

  return <HistoryContext1 value={value}>{children}</HistoryContext1>;
}
