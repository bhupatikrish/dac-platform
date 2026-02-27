# Phase 13: Angular Architecture Refactor

Extract monolithic `apps/portal` components into shared Nx libraries, modernize to Angular Signals, and clean up code quality. This converts the portal from a single-app monolith into a modular, reusable library architecture following Nx best practices.

## Proposed Changes

### Component 1: Library Extraction

Moved all feature code from `apps/portal/src/app/` into 4 new Nx Angular libraries:

| Library | Path | Contents | Import Path |
|---------|------|----------|-------------|
| `custom-elements` | `libs/custom-elements/` | CopyButtonComponent, ContentTabsComponent, `registerCustomElements()` | `@tmp-dac/custom-elements` |
| `search-ui` | `libs/search-ui/` | SearchComponent + template + styles | `@tmp-dac/search-ui` |
| `doc-viewer` | `libs/doc-viewer/` | Document component + template + styles | `@tmp-dac/doc-viewer` |
| `landing` | `libs/landing/` | Landing component + template + styles | `@tmp-dac/landing` |

Portal app is now a thin shell: `app.ts`, `app.routes.ts`, `app.config.ts`, `app.html`, `app.css`, `main.ts`.

---

### Component 2: SafeHtmlDirective

#### [NEW] [safe-html.directive.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/libs/portal-ui/src/lib/directives/safe-html.directive.ts)

Reusable directive replacing `DomSanitizer.bypassSecurityTrustHtml()` calls:
- Used by Document (doc-viewer) and Preview (preview app) via `[dacSafeHtml]` template binding
- HTML is pre-sanitized by DOMPurify at build time, so the bypass is safe

---

### Component 3: Angular Signals Migration

Converted all 3 feature components from imperative state to reactive Signals:

| Pattern | Before | After |
|---------|--------|-------|
| State management | Mutable class fields | `signal()` |
| Derived state | Manual computation | `computed()` |
| Event handling | `@HostListener` | `fromEvent()` + `takeUntilDestroyed()` |
| Observable → template | `AsyncPipe` + `BehaviorSubject` | `toSignal()` |
| Change detection | `ChangeDetectorRef.detectChanges()` | Automatic (signals) |
| Lifecycle cleanup | `Subscription` + `ngOnDestroy` | `takeUntilDestroyed()` |
| Lifecycle hooks | `OnInit` | Constructor injection |

---

### Component 4: Code Quality Cleanup

- **Removed `CommonModule`** from all standalone components — imported `AsyncPipe`, `NgTemplateOutlet` directly
- **Removed 7+ `console.log` debug calls** from landing, document, and environment service
- **Migrated `*ngIf`/`*ngFor` → `@if`/`@for`** across all 3 feature templates
- **Added `CUSTOM_ELEMENTS_SCHEMA`** to Document component
- **Simplified default page fallback** — uses first page from `docs.yaml` nav instead of searching for `index.md`

---

## Verification Plan

### Automated Tests
```bash
npx nx build portal        # Verify zero errors
npx nx serve portal         # Verify hot-reload and visual correctness
npx nx test plugins         # Verify tabs plugin tests pass
```

### Manual Verification
- Landing page loads catalog tree and displays product cards
- Document page renders HTML, TOC, left nav, and breadcrumbs
- Search modal opens with ⌘K, shows results, keyboard navigation works
- Custom elements (copy button, content tabs) function correctly
- Theme toggle works on both landing and document pages
