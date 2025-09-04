import {UploadIcon} from "./icons";

export default function EmptyPreview() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
      <div className="text-center">
        <UploadIcon className="mx-auto mb-2 h-6 w-6 text-slate-500" />
        <p className="text-sm text-slate-700">Drag & drop or click to upload an image</p>
        <p className="text-xs text-slate-500">PNG/JPG, up to 10MB</p>
      </div>
    </div>
  );
}
