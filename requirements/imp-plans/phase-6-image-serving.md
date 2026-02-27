# Phase 6: Image Serving & E2E Validation Implementation Plan

This phase outlines the approach to efficiently serve embedded static images alongside markdown documents from the `sample-docs` folder, and automatically verify their rendering via Playwright end-to-end tests.

## Proposed Changes

### Component 1: NestJS Static Assets API (`apps/api`)
Currently, the `/api/catalog` route strictly only reads `.md` and `.html.json` files and parses them into memory strings. It does not buffer binary image blobs.
#### [MODIFY] `apps/api/src/app/app.module.ts`
- Install and configure `@nestjs/serve-static` to mount the `sample-docs` root directory to a generic `/api/assets` or `/api/images` route in the backend.
- This ensures any image linked via standard markdown syntax (e.g. `![Architecture](/api/assets/infrastructure/compute/eks/arch.png)`) will successfully resolve to the physical binary file.

### Component 2: Sample Documentation Content (`sample-docs`)
#### [NEW] `sample-docs/infrastructure/compute/eks/architecture.png` (or placeholder image)
- Provision a demo architecture diagram image and place it alongside the EKS documentation folders.
#### [MODIFY] `sample-docs/infrastructure/compute/eks/architecture.md`
- Insert standard markdown image syntax referencing the static backend route.

### Component 3: Markdown Rendering Engine (`libs/renderer`, `libs/cli`)
#### [MODIFY] `libs/renderer/src/lib/renderer.ts`
- Whitelist the `img` tag and `src`/`alt` attributes within the `DOMPurify` configuration used by the markdown parser to ensure the frontend displays the images instead of stripping them.
#### [MODIFY] `libs/cli/src/lib/cli.ts`
- Enhance the `buildStaticDocs` pipeline to identify and recursively copy static image extensions (`.png`, `.jpg`, `.svg`, etc.) to the `dist` output folder alongside the compiled `.html.json` files.

### Component 4: Playwright E2E Validation (`apps/portal-e2e`)
#### [MODIFY] `apps/portal-e2e/src/example.spec.ts`
- Enhance the current navigation tests to specifically traverse to the EKS Architecture page.
- Add an assertion looking for the rendered `<img>` tag and checking that its `complete` property is true and its `naturalWidth` is strictly greater than 0, guaranteeing the browser actually successfully resolved the image asset over the network.

## Verification Plan

### Automated Tests
1. Run `npx nx e2e portal-e2e` to trigger the headless playwright browser stack against the running Angular app.
2. The tests will auto-verify the EKS image loads successfully.
