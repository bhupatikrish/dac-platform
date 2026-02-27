# Phase 8: MkDocs-style Hierarchical Navigation

This phase addresses the requirement for natively supporting deep, structured left-navigation matching the traditional `mkdocs.yml` `nav:` API, replacing the default alphabetical crawler algorithm.

## Proposed Changes

### Component 1: Metadata API (`libs/shared-types`)
#### [MODIFY] `libs/shared-types/src/lib/catalog.ts`
- Introduce the recursive `NavItem` type standard (e.g. `export type NavItem = string | { [key: string]: string | NavItem[] };`).
- Inject `nav?: NavItem[]` into the global `MarkdownMetadata` schema schema so it automatically types incoming `docs.yaml` buffers.

### Component 2: Nested Rendering Backend (`libs/backend`)
#### [MODIFY] `libs/backend/src/lib/storage/local-disk.service.ts`
- When mapping a product repository, check if `meta.nav` exists.
- If it does exist, halt the recursive disk crawler and instead construct the `DocumentNode` tree synthetically using a strictly ordered parsing algorithm that extracts Group nodes and File nodes from the `meta.nav` tree.
- Map the parsed labels back directly into the `name` property so the frontend natively renders the custom group headers without logic changes.

### Component 3: Angular Recursive UI (`apps/portal`)
#### [MODIFY] `apps/portal/src/app/app.routes.ts`
- Convert the simplistic `/:page` catch to an Angular wildcard `children: [{ path: '**', component: Document }]`. This allows the router to resolve infinite nesting depth (e.g. `/architecture/compute/networks/vpcs/overview`).

#### [MODIFY] `apps/portal/src/app/document.ts`
- Refactor the `this.route.paramMap` logic to dynamically assemble `this.pageName` from the raw `UrlSegment[]` array rather than a single string.
- Provide a `stripExt(path)` helper.

#### [MODIFY] `apps/portal/src/app/document.html` & `document.css`
- Wrap the sidebar rendering block into an `<ng-template #navTree let-nodes>`.
- Expand it to recursively call itself when it encounters an object of `type === 'directory'`.
- Implement a dropdown `<span class="toggle">` to manage `.expanded` state transitions gracefully using Angular interpolation.
