import Image from "next/image";
import {Fragment} from "react";
import {useHistory} from "@/hooks/use-history";
import type {ItemDetails} from "@/lib/constants";
import {cn} from "@/lib/utils";

export default function Histories({
  onSelect,
}: {
  onSelect: (
    item: ItemDetails & { file: Blob | File },
    forcedName?: string,
  ) => void;
}) {
  const { history, resetHistory, onHistorySelect } = useHistory();

  return (
    <Fragment>
      <div className="my-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">History</h3>
        <button
          type={"button"}
          className="text-sm text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
          onClick={resetHistory}
        >
          Clear
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-600">No uploads yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 ">
          {history.map((item) => (
            <li key={item.id}>
              <button
                type={"button"}
                aria-label={`Restore from history: ${item.id}`}
                onClick={async () => {
                  const selectedItem = await onHistorySelect(item);
                  if (selectedItem) onSelect(selectedItem);
                }}
                className={cn(
                  "group block w-full overflow-hidden rounded-lg border",
                  "border-slate-200 bg-white text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                )}
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.dataUrl || "/placeholder.svg"}
                    alt={item.id}
                    fill
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-2">
                  {/*<p className="line-clamp-1 text-sm font-medium">*/}
                  {/*  {item.name}*/}
                  {/*</p>*/}
                  <p className="text-xs text-slate-600 capitalize">
                    {item.style}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Fragment>
  );
}
