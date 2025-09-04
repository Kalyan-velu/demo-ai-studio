# AI Studio

A small Next.js (App Router) app to upload an image (PNG/JPG), optionally downscale it to a max width, choose a style,
and send it to an image generation endpoint. Recent uploads are stored locally and displayed in a history panel for
quick restore.

- Framework: Next.js 15 + React 19
- Styling: Tailwind CSS 4 (via PostCSS)
- Tooling: pnpm, Biome (lint/format)

## Prerequisites

- Node.js 20+ (Recommended)
- pnpm (project is pinned via `packageManager`)
    - Install: `corepack enable` then `corepack prepare pnpm@latest --activate` or install from https://pnpm.io

## Installation

From the project root:

```powershell
pnpm install
```

## Run (Development)

Starts Next.js dev server with Turbopack:

```powershell
pnpm dev
```

Open http://localhost:3000 in your browser.

## Build and Run (Production)

Build with Turbopack and start the server:

```powershell
pnpm build
pnpm start
```

## Testing

There are no automated tests in this repository yet.

- Recommended next step: add Vitest or Jest + React Testing Library and create a `test` script.
- For now, you can use lint as a basic quality gate:

```powershell
pnpm lint
```

Formatting fixes:

```powershell
pnpm format
```

## Design Notes

High-level overview of how the app works.

- App Shell and Page
    - `src/app/page.tsx` is a client component orchestrating the UI/flow:
        - Accepts file via drag-and-drop or file picker.
        - Validates prompt and input, previews the image, and indicates oversize files.
        - Optional downscale to `MAX_WIDTH` using a canvas before sending to the API.
        - Triggers POST to `/api/generate` with `{ imageDataUrl, prompt, style }` and appends the response to history.

- Components (src/app/components)
    - `dropzone.tsx`: Accessible drag-and-drop region + "Choose file" button.
    - `style-select.tsx`: Selects one of the configured styles.
    - `history.tsx`: Renders a grid of recent results; clicking restores an item.
    - `history-provider.tsx`: Context provider persisting recent results in `localStorage` with a size cap.
    - `icons.tsx`: Inline SVG icons.
    - `live-summary-card.tsx`, `empty-preview.tsx` (if present): supporting visual components referenced by the page.

- Hooks (src/hooks)
    - `use-fetch.tsx`: Abstraction over `fetch` with:
        - Abort support via `AbortController`.
        - Retry with exponential backoff (defaults: up to 3 tries, 1s base delay).
        - State tracked: `loading`, `error`, `aborted`, `retryCount`, `retrying`.
    - `use-history.tsx`: Context + hook API consumed by `HistoryProvider` and consumers.

- Lib (src/lib)
    - `constants.ts`: Types and limits
        - `MAX_FILE_MB = 1`, `MAX_WIDTH = 1920`, `STYLES = ["Editorial","Streetwear","Vintage"]`.
    - `image.ts`: Utilities for data URLs, blob conversion, dimension read, and client-side downscale using `<canvas>`.
    - `utils.ts`: UI helpers (Tailwind `cn` merge), file type support check, and file size calc.

- State Management
    - Local component state for current item, prompt, style, and oversize flag.
    - History managed via React Context (`HistoryProvider`) and persisted to `localStorage` under `HISTORY_KEY`.

- Accessibility and UX
    - Drop zone uses roles/labels; buttons and selects include ARIA attributes.
    - Oversize warning with actionable downscale control.
    - Next/Image used for optimized preview rendering.

- API Contract (expected)
    - Endpoint: `POST /api/generate`
    - Request body: `{ imageDataUrl: string, prompt: string, style: "Editorial" | "Streetwear" | "Vintage" }`
    - Response body (example): `{ id: string, createdAt: string, dataUrl: string, prompt: string, style: string }`
    - Error handling: non-OK responses will surface as errors; HTTP 503 with `{ message: "Model overloaded" }` will
      trigger automatic retries in `useFetch`.

## Troubleshooting

- 404 on `/api/generate`:
    - The UI expects this API route to exist. If not implemented yet, add `src/app/api/generate/route.ts` to handle the
      request and return the described payload.
- "Large file detected" warning:
    - Current limit is `MAX_FILE_MB = 1` MB. Either click "Downscale to 1920px" or tune the limit in
      `src/lib/constants.ts`.
- File types supported:
    - PNG and JPG only (see `isSupported` in `src/lib/utils.ts`).

## Scripts

- `pnpm dev` – Run development server (Turbopack)
- `pnpm build` – Build for production (Turbopack)
- `pnpm start` – Start production server
- `pnpm lint` – Biome static checks
- `pnpm format` – Biome formatting (writes changes)


