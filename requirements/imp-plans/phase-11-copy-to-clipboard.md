# Phase 11: Code Block Copy to Clipboard

Add a "Copy to Clipboard" button on Shiki-highlighted code blocks. Because Markdown content is sanitized and dynamically injected via `innerHTML`, standard Angular `(click)` bindings cannot be attached directly. This requires an HTML injection + Event Delegation architecture.

## Proposed Changes

---

### Component 1: Shiki Plugin HTML Injection (`@tmp-dac/renderer`)

#### [MODIFY] [shiki.plugin.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/renderer/src/lib/plugins/shiki.plugin.ts)

Wrap each Shiki-compiled `<pre>` block inside a `<div class="code-block-wrapper">` container and prepend a `<button class="copy-button">` with an inline SVG clipboard icon:

```html
<div class="code-block-wrapper">
    <button class="copy-button" aria-label="Copy code">
        <svg><!-- clipboard icon --></svg>
    </button>
    <pre class="shiki">...</pre>
</div>
```

Apply the same wrapping to the fallback (non-highlighted) code path.

---

### Component 2: DOMPurify Sanitization (`@tmp-dac/renderer`)

#### [MODIFY] [renderer.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/renderer/src/lib/renderer.ts)

Update the `DOMPurify.sanitize()` configuration to whitelist the SVG elements and attributes used by the copy button icon:
- `ADD_TAGS`: `button`, `svg`, `path`, `rect`, `polyline`
- `ADD_ATTR`: `aria-label`, `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `points`, `x`, `y`, `width`, `height`, `rx`, `ry`

---

### Component 3: Angular Event Delegation (`apps/portal`)

#### [MODIFY] [document.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/document.ts)

Add a `@HostListener('click', ['$event'])` on the `DocumentComponent`:
1. Check if the click target (or its ancestor) has the `.copy-button` class using `target.closest('.copy-button')`
2. Traverse up to the `.code-block-wrapper` and locate the sibling `<pre>` element
3. Extract the visible text via `preElement.innerText`
4. Write to clipboard using `navigator.clipboard.writeText(codeText)`
5. Provide micro-feedback by swapping the SVG icon to a green checkmark for 2,000ms

---

### Component 4: Global CSS Styles (`apps/portal`)

#### [MODIFY] [styles.css](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/styles.css)

Add global styles for `.code-block-wrapper` and `.copy-button` (must be global, not component-scoped, because the HTML is injected dynamically):

- `.code-block-wrapper`: `position: relative; margin: 1.5rem 0;`
- `.copy-button`: `position: absolute; top: 8px; right: 8px; background: transparent; border: none; opacity: 0;`
- `.code-block-wrapper:hover .copy-button`: `opacity: 1;`
- `.copy-button:hover`: Subtle background highlight

> [!IMPORTANT]
> These styles **must** live in the global `styles.css`, not the component-scoped `document.css`. Angular View Encapsulation strips `_ngcontent` attributes from dynamically injected DOM, causing scoped styles to be ignored.

---

## Verification Plan

### Automated Tests
1. Build documentation: `node tools/scripts/build-docs.js`
2. Run E2E tests: `npx nx e2e portal-e2e`
3. Browser subagent: Navigate to a code block page, hover to reveal button, click to verify clipboard write, confirm checkmark animation

### Manual Verification
1. Verify copy button appears on hover in both light and dark mode
2. Click the button and paste somewhere to confirm clipboard content matches the code
3. Verify the checkmark feedback animation plays for ~2 seconds
4. Confirm no visual regression on Mermaid diagrams (they should not get copy buttons)
