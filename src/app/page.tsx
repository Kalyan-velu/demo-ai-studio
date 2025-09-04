"use client";

import Image from "next/image";

import type {ComponentProps} from "react";
import {useMemo, useRef, useState} from "react";
import Histories from "@/app/components/history";
import {useFetch} from "@/hooks/use-fetch";
import {useHistory} from "@/hooks/use-history";
import {
  type GeneratedResponse,
  type GenerateReqBody,
  type ItemDetails,
  MAX_FILE_MB,
  MAX_WIDTH,
  type STYLES,
} from "@/lib/constants";
import {addSuffix, blobToDataURL, dataUrlToBlob, downscaleImage, getImageDims,} from "@/lib/image";
import {cn, fileSizeMB, isSupported} from "@/lib/utils";
import DropZone from "./components/dropzone";
import EmptyPreview from "./components/empty-preview";
import {WarningIcon} from "./components/icons";
import LiveSummaryCard from "./components/live-summary-card";
import StyleSelect from "./components/style-select";

const validateBody = (
  data: GenerateReqBody,
):
  | { isValid: false; reason: string }
  | {
      isValid: true;
      data: GenerateReqBody;
    } => {
  if (!data.imageDataUrl) {
    return {
      isValid: false,
      reason: "No image selected",
    };
  }
  if (!data.prompt || data.prompt.trim() === "") {
    return {
      isValid: false,
      reason: "Prompt can't be empty.",
    };
  }
  return {
    isValid: true,
    data,
  };
};

export default function Page() {
  const {
    loading: generating,
    execute,
    abort,
    aborted,
  } = useFetch<GeneratedResponse>();

  const [item, setItem] = useState<ItemDetails | null>();
  const { appendHistory } = useHistory();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] =
    useState<(typeof STYLES | (string & {}))[number]>("Editorial");
  const [oversize, setOversize] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleFile(file: File | Blob, forcedName?: string) {
    if (file instanceof File && !isSupported(file)) {
      alert("Only PNG and JPG files are supported.");
      return;
    }

    const sizeOk = fileSizeMB(file) <= MAX_FILE_MB;
    setOversize(!sizeOk);

    // Read to data URL for preview/history
    const dataUrl = await blobToDataURL(file);
    const dims = await getImageDims(dataUrl);

    const item: ItemDetails = {
      src: dataUrl,
      name:
        forcedName ??
        (file instanceof File ? file.name : `image-${Date.now()}.jpg`),
      sizeMB: fileSizeMB(file),
      width: dims.width,
      height: dims.height,
      prompt,
      style,
    };
    setItem(item);
  }

  async function handleDownscale() {
    if (!item) return;
    // Convert current.src back to Image and downscale
    const blob = await dataUrlToBlob(item.src);
    const resultBlob = await downscaleImage(blob, MAX_WIDTH, 0.9);
    await handleFile(resultBlob, addSuffix(item.name, "-1920w.jpg"));
    setOversize(fileSizeMB(resultBlob) > MAX_FILE_MB); // re-evaluate
  }

  const liveSummary = useMemo(() => {
    return {
      prompt,
      style,
      thumb: item?.src ?? "",
      name: item?.name ?? "No image selected",
    };
  }, [prompt, style, item?.src, item?.name]);

  const generateImage = async () => {
    try {
      if (generating) {
        return;
      }
      if (!item) {
        alert("Please add an image.");
        return;
      }

      const validate = validateBody({
        imageDataUrl: item?.src,
        prompt,
        style: style,
      });
      if (!validate.isValid) {
        alert(validate.reason);
        return;
      }
      const res = await execute(`/api/generate`, {
        method: "POST",
        body: JSON.stringify(validate.data),
      });
      if ("data" in res && res.data) {
        appendHistory(res.data);
      }
    } catch (e) {
      console.log(e);
      alert("Something went wrong. Please try again.");
    }
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
              <WarningIcon />
              <div className="flex-1">
                <p className="font-medium">
                  Large file detected ({item?.sizeMB ?? 0} MB). Consider
                  downscaling to max width {MAX_WIDTH}px before submitting.
                </p>
                <p className="text-slate-700">
                  This can reduce upload time and improve performance.
                </p>
              </div>
              <button
                type={"button"}
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
            hasImage={!!item?.src}
          >
            {item?.src ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
                {/* Using next/image for optimization */}
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt={item?.name || "Uploaded image preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-contain bg-slate-100"
                />
                <div className="absolute left-2 top-2 rounded-md bg-white/80 px-2 py-1 text-xs font-medium shadow">
                  {`${item.width || 0}"×"${item.height || 0}`} • {item.sizeMB}{" "}
                  MB
                </div>
              </div>
            ) : (
              <EmptyPreview />
            )}
          </DropZone>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            className="sr-only"
          />
          <p className="text-xs text-slate-600">
            Supported: PNG, JPG. Max size: {MAX_FILE_MB}MB. Drag & drop or click
            “Upload Image”.
          </p>

          <LiveSummaryCard
            image={liveSummary.thumb}
            prompt={liveSummary.prompt}
            style={liveSummary.style}
            title={liveSummary.name}
          />
        </div>

        <aside className="md:col-span-2 space-y-4">
          <div className="">
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
            <StyleSelect value={style} onChange={setStyle} />
            <div className="flex mt-4 gap-2">
              <button
                onClick={generateImage}
                type={"button"}
                className="flex-1  bg-blue-600 text-white rounded-lg p-2 flex items-center justify-center  gap-x-2"
              >
                {generating ? (
                  <>
                    <SpinnerIcon className={" size-5"} /> Processing...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
              <button
                disabled={aborted || !generating}
                type={"button"}
                onClick={abort}
                className="flex-1 bg-red-600 disabled:bg-red-200 text-white rounded-lg p-2"
              >
                Abort
              </button>
            </div>
            <Histories
              onSelect={async (item, forcedName) => {
                setPrompt(item.prompt);
                setStyle(item.style);
                await handleFile(item.file, forcedName);
              }}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

const SpinnerIcon = ({ className, ...props }: ComponentProps<"svg">) => {
  return (
    <svg
      className={cn("animate-spin text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <title>Spinner</title>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
