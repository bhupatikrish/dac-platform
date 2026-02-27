# Phase 10: Landing Page Navigation Polish

Overhaul the Global Landing Page (`/`) sidebar to support deep, hierarchical navigation matching the Documentation Page layout. Instead of displaying a flat list of Domains, the sidebar expands into nested Domain → System tree structures with smooth scrolling interactions.

## Proposed Changes

---

### Component 1: Angular Template (`apps/portal`)

#### [MODIFY] [landing.html](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/landing.html)

Refactor the left sidebar from a flat domain list into a recursive `<details>` / `<summary>` tree:

1. Wrap each domain in a `<details class="nav-group">` with the domain title as `<summary>`
2. Nest `<ng-container *ngFor="let system of domain.children">` inside each domain group
3. Render system names as sidebar links with `(click)="scrollToSystem(system.name, $event)"` bindings
4. Re-use the `nav-tree`, `nav-group`, `nav-group-title`, and `nav-group-children` CSS classes from `document.css`

---

### Component 2: Landing Component Logic

#### [MODIFY] [landing.ts](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/landing.ts)

Add a `scrollToSystem(systemId: string, event: Event)` method:
- Prevent default link behavior
- Use `document.getElementById(systemId)` to locate the system section in the dashboard
- Execute a smooth `window.scrollTo()` with a sticky header offset (80px)

Ensure each system section in the dashboard has a matching `[id]="system.name"` attribute for anchor targeting.

---

### Component 3: Landing Page Styles

#### [MODIFY] [landing.css](file:///Users/krishnabhupathi/Documents/code/dac/dac-platform/apps/portal/src/app/landing.css)

Align the sidebar CSS classes between `landing.css` and `document.css`:
- Import the same `nav-group`, `nav-group-title`, `nav-group-children` visual patterns
- Apply `position: sticky; top: 72px; height: calc(100vh - 72px); overflow-y: auto;` to the sidebar for fixed scrolling
- Ensure consistent hover effects, active states, and typography across both page layouts

---

## Verification Plan

### Automated Tests
1. Run `npx nx e2e portal-e2e` to ensure no navigation regressions

### Manual Verification
1. Navigate to `http://localhost:4200/` and verify domains expand to show systems
2. Click a system in the sidebar and verify smooth scrolling to the corresponding dashboard section
3. Verify the sidebar remains fixed while the dashboard scrolls
4. Toggle light/dark theme and confirm consistent styling
