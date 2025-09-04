export type ItemDetails = {
  src: string; // data URL
  name: string;
  sizeMB: number;
  width: number;
  height: number;
  prompt: string;
  style: "Editorial" | "Streetwear" | "Vintage" | (string & {});
};

export const MAX_FILE_MB = 1;
export const MAX_WIDTH = 1920;
export const HISTORY_KEY = "uploadHistoryV1";
export const STYLES = ["Editorial", "Streetwear", "Vintage"] as const;

export interface GenerateReqBody extends Pick<ItemDetails, "prompt" | "style"> {
  imageDataUrl: string;
}

export interface GeneratedResponse
  extends Pick<ItemDetails, "prompt" | "style"> {
  id: string;
  createdAt: string;
  dataUrl: string;
}
