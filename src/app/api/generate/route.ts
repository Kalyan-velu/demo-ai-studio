import type {NextRequest} from "next/server";
import type {GeneratedResponse, ItemDetails} from "@/lib/constants";

interface Request extends NextRequest {
  json: () => Promise<{
    imageDataUrl: string;
    prompt: string;
    style: ItemDetails["style"];
  }>;
}

export const POST = async (req: Request) => {
  // Get the AbortSignal from the request
  const { signal } = req;
  const body = await req.json();

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          const shouldError = Math.random() < 0.2;

          if (shouldError) {
            console.log("Simulating model overload error");
            reject(new Error("Model overloaded"));
          } else {
            console.log("Generation complete");
            resolve();
          }
        },
        1000 + Math.random() * 2000,
      );

      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new DOMException("Aborted", "AbortError"));
        });
      }
    });

    return Response.json({
      id: crypto.randomUUID(),
      dataUrl: body.imageDataUrl,
      prompt: body.prompt,
      style: body.style,
      createdAt: new Date().toISOString(),
    } as GeneratedResponse);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response("Request aborted by the client", { status: 499 });
    }

    if (error instanceof Error && error.message === "Model overloaded") {
      return Response.json({ message: "Model overloaded" }, { status: 503 });
    }

    // Handle other errors
    console.error("Error generating image:", error);
    return new Response("Error processing the request", { status: 500 });
  }
};
