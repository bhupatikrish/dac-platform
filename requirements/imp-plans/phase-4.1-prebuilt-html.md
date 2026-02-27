# Phase 4.1: Pre-built HTML Delivery

Introduce a Static Site Generation (SSG) toggle that allows the NestJS API to serve pre-compiled HTML payloads from disk instead of rendering Markdown at runtime. This decouples build-time compilation from request-time processing, dramatically improving production serve latency.

## Proposed Changes

---

### Component 1: Environment Configuration

#### [NEW] `.env`

Add `SERVE_PREBUILT_HTML=true` toggle to the root `.env` file. When enabled, the NestJS backend reads pre-compiled `.html.json` payloads from `/dist` instead of invoking `renderMarkdown()` at request time.

---

### Component 2: CLI Static Site Generator (`@tmp-dac/cli`)

#### [MODIFY] [cli.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/cli/src/lib/cli.ts)

Extract the `renderMarkdown()` call into a standalone `buildStaticDocs(sourceDir, outDir)` function:

1. Recursively crawl all `.md` files under `sourceDir`
2. For each file, invoke `renderMarkdown()` to produce the `RenderedDocument` JSON (HTML + TOC)
3. Serialize each result to `[outDir]/[relative-path].html.json`
4. Copy static binary assets (`.png`, `.jpg`, `.svg`) to `outDir` alongside compiled files

This produces a complete `/dist/sample-docs/` folder that mirrors the source hierarchy with pre-compiled payloads.

---

### Component 3: NestJS Backend Toggle (`@tmp-dac/backend`)

#### [MODIFY] [local-disk.service.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/backend/src/lib/storage/local-disk.service.ts)

When `SERVE_PREBUILT_HTML` is enabled:
- Instead of loading raw `.md` files and calling `renderMarkdown()`, directly read `.html.json` from `/dist`
- Return the pre-compiled JSON payload as-is to the Angular frontend
- Bypass all Markdown processing, Shiki highlighting, and plugin execution at runtime

When `SERVE_PREBUILT_HTML` is disabled (development mode):
- Continue using the existing JIT rendering pipeline with `renderMarkdown()`

---

### Component 4: Angular Frontend (`apps/portal`)

#### [MODIFY] [document.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/document.ts)

Update the `DocumentComponent` to detect when the backend response is pre-compiled HTML:
- If the response contains a `html` field, bypass the client-side `renderMarkdown()` pipeline
- Directly inject the pre-compiled HTML via `bypassSecurityTrustHtml()`
- This eliminates duplicate rendering when the backend has already compiled the Markdown

---

## Verification Plan

### Automated Tests
1. Run `node tools/scripts/build-docs.js` and verify `/dist/sample-docs/` contains `.html.json` files
2. Restart the API with `SERVE_PREBUILT_HTML=true` and verify pages render identically
3. Confirm no regressions by running `npx nx e2e portal-e2e`

### Manual Verification
1. Compare page load times between JIT and pre-built modes
2. Verify Mermaid diagrams, images, and code blocks render correctly in both modes
