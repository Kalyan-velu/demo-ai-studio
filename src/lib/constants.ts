export type HistoryItem = {
  id: string;
  src: string; // data URL
  name: string;
  sizeMB: number;
  width: number;
  height: number;
  prompt: string;
  style: string;
  createdAt: number;
};

export const MAX_FILE_MB = 10;
export const MAX_WIDTH = 1920;
export const HISTORY_KEY = "uploadHistoryV1";
export const STYLES = ["Editorial", "Streetwear", "Vintage"] as const;
