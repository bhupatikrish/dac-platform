# Phase 12: Content Tabs Plugin

Implement MkDocs Material-compatible content tabs using the `=== "Tab Title"` syntax. Tabs allow authors to group alternative code blocks, instructions, or arbitrary content into switchable panels — a critical UX pattern for multi-language examples and platform-specific guides.

## MkDocs Syntax Reference

The plugin must parse consecutive `=== "Label"` blocks in Markdown. Indented content beneath each marker becomes the panel body:

```markdown
=== "Python"

    ```python
    print("Hello, World!")
    ```

=== "JavaScript"

    ```javascript
    console.log("Hello, World!");
    ```

=== "Go"

    ```go
    fmt.Println("Hello, World!")
    ```
```

Key rules:
- `===` must be at the start of a line, followed by a space and a quoted label
- Content beneath must be indented by 4 spaces (standard MkDocs convention)
- Consecutive `===` blocks are grouped into a single tab container
- Tabs can hold **any content** (code blocks, lists, paragraphs, nested tabs)
- A blank line (without indentation) breaks the tab group

## User Review Required

> [!IMPORTANT]
> This plugin introduces a **Markdown pre-processor** — a new pattern in our pipeline. Unlike existing plugins (Mermaid, TOC, Shiki) that hook into Marked.js's token pipeline, the `===` syntax is not standard Markdown and cannot be intercepted by `walkTokens` or renderer overrides. We must transform the raw Markdown **before** Marked.js parses it.

> [!NOTE]
> Tab switching behavior will be implemented via lightweight vanilla JavaScript injected into the global stylesheet scope (similar to how the copy-to-clipboard button works via `@HostListener` event delegation in `document.ts`). No external dependencies are needed.

---

## Proposed Changes

### Component 1: Tabs Pre-Processor (`@tmp-dac/plugins`)

#### [NEW] [tabs.plugin.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/plugins/src/lib/tabs.plugin.ts)

A **pre-processing function** that transforms `=== "Label"` blocks into semantic HTML **before** passing the Markdown to Marked.js.

**Algorithm:**
1. Split the raw Markdown into lines
2. Scan for lines matching `^=== "(.*)"$` regex
3. Group consecutive tab markers into a tab set
4. For each tab set, collect the 4-space-indented content beneath each `===` marker and de-indent it by 4 spaces
5. Emit structured HTML wrapping:

```html
<div class="content-tabs">
  <div class="content-tabs-labels">
    <button class="content-tab-label active" data-tab-index="0">Python</button>
    <button class="content-tab-label" data-tab-index="1">JavaScript</button>
    <button class="content-tab-label" data-tab-index="2">Go</button>
  </div>
  <div class="content-tab-panel active" data-tab-index="0">

{de-indented markdown content for Python}

  </div>
  <div class="content-tab-panel" data-tab-index="1">

{de-indented markdown content for JavaScript}

  </div>
  <div class="content-tab-panel" data-tab-index="2">

{de-indented markdown content for Go}

  </div>
</div>
```

The de-indented Markdown content remains as raw Markdown — Marked.js will still parse it (code blocks, lists, etc.) because the panels are outputted as standard text between HTML wrapper tags.

**Key design decisions:**
- This is a **pure string → string** transform — no AST manipulation needed
- Each tab set gets a unique `data-tab-group` index so multiple tab groups on one page don't interfere
- The first tab in each group is marked `active` by default

#### [MODIFY] [index.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/plugins/src/index.ts)

Export the new `preprocessContentTabs` function.

---

### Component 2: Renderer Integration (`@tmp-dac/renderer`)

#### [MODIFY] [renderer.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/renderer/src/lib/renderer.ts)

Call `preprocessContentTabs(markdown)` **before** passing the string to `m.parse()`. This ensures the `===` syntax is converted to HTML wrapper divs before Marked.js tokenization begins.

```diff
+import { preprocessContentTabs } from '@tmp-dac/plugins';

 export async function renderMarkdown(markdown: string): Promise<RenderedDocument> {
+  // Pre-process MkDocs-style content tabs before tokenization
+  const preprocessed = preprocessContentTabs(markdown);
+
   const m = new Marked();
   // ... existing plugin registration ...
-  const rawHtml = await m.parse(markdown);
+  const rawHtml = await m.parse(preprocessed);
```

#### [MODIFY] [renderer.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/renderer/src/lib/renderer.ts) — DOMPurify Config

Add `div` and `button` to `ADD_TAGS` and `data-tab-index`, `data-tab-group` to `ADD_ATTR` so the tab wrapper HTML survives sanitization.

---

### Component 3: Frontend Tab Interaction (`apps/portal`)

#### [MODIFY] [document.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/document.ts)

Extend the existing `@HostListener('click')` to intercept clicks on `.content-tab-label` buttons:
1. Read the `data-tab-index` and `data-tab-group` from the clicked label
2. Within that tab group, remove `.active` from all labels and panels
3. Add `.active` to the matching label and panel

This follows the exact same event delegation pattern already established for the copy-to-clipboard button.

#### [MODIFY] [styles.css](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/styles.css)

Add global CSS for `.content-tabs`, `.content-tabs-labels`, `.content-tab-label`, and `.content-tab-panel` classes. These must be in the global stylesheet (not component-scoped) because the HTML is dynamically injected.

**Visual design targets (MkDocs Material parity):**

| Property | Value |
|----------|-------|
| Tab bar | Horizontal row of buttons sitting flush on top of the content panel |
| Active tab | Bottom border accent (`--color-brand-primary`), bolder text |
| Inactive tab | Muted text color, no border |
| Tab hover | Subtle background highlight |
| Panel | No extra border, content flows naturally below the tab bar |
| Tab bar border | A thin `1px solid` bottom border spans the full width, active tab's accent overlays it |
| Transition | Smooth opacity/color fade on tab switch |
| Dark mode | Automatically inherits theme via CSS variables |

---

### Component 4: Sample Documentation

#### [MODIFY] Sample docs (e.g. EKS setup or a new demo page)

Add a sample Markdown file or append to an existing page demonstrating content tabs with:
1. Multi-language code blocks (Python / JS / Go)
2. Non-code content tabs (ordered list vs unordered list)

---

## Verification Plan

### Automated Tests

1. **Unit test the pre-processor:** Create `tabs.plugin.spec.ts` in `libs/plugins` to validate:
   - Single tab group parsing
   - Multiple tab groups on one page
   - Nested content (code blocks inside tabs)
   - Edge cases: tabs at end of file, empty tabs, single-tab groups
   
2. **E2E Browser Tests:** Extend `apps/portal-e2e` to:
   - Navigate to a page with content tabs
   - Assert that `.content-tabs` is rendered in the DOM
   - Click a tab label and assert the corresponding panel becomes visible
   - Assert the previously active panel is hidden

### Manual Verification

1. Run `node tools/scripts/build-docs.js` to compile updated documentation
2. Visit the sample page in the browser and verify:
   - Tab labels render horizontally
   - Clicking switches visible content
   - Code blocks inside tabs are still Shiki-highlighted
   - Light/dark theme toggle works correctly on tabs
   - Copy-to-clipboard still works inside tabbed code blocks
