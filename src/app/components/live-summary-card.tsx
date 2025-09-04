import Image from "next/image";

export default function LiveSummaryCard({
  image,
  prompt,
  style,
  title,
}: {
  image: string;
  prompt: string;
  style: string;
  title: string;
}) {
  return (
    <div className="rounded-xl mt-8 border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h3 className="text-sm font-semibold">Live Summary</h3>
        <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          Preview
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <div className="relative h-20 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
              {image ? (
                <Image
                  src={image}
                  alt="Summary thumbnail"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  No Image
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <p className="line-clamp-1 text-sm font-medium">{title}</p>
            <p className="text-xs text-slate-600">Style: {style || "—"}</p>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-2">
          <p className="text-xs text-slate-700">
            {prompt?.trim() ? prompt : "No prompt provided yet."}
          </p>
        </div>
      </div>
    </div>
  );
}
