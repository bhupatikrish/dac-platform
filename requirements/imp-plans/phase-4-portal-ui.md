# Phase 4: Portal & UI Architecture

## Objective
Construct the Angular-based unified discovery portal providing the Landing Page and Documentation views with a modern, scalable design.

## Tasks
1. **Styles and Theming System (`libs/theme` & `/static`)**
   - Establish modern, sleek CSS/HTML foundations tracking the latest web.dev specs.
   - Build core UI components: Global Header, Global Footer, Navigation, Breadcrumbs, and Search input.
   - Integrate a Light/Dark mode UI toggle located at the top right of the Header.
   - **System Theme Syncing**: Automatically initialize and sync the Angular portal's theme with the user's OS-level `prefers-color-scheme` via `window.matchMedia` hooks on bootstrap.

2. **Develop Portal Application (`libs/portal` & `apps/portal`)**
   - Implement an environment service pattern to smoothly toggle between **Local Mode** (fetching static markdown assets directly from the Angular dev server's mounted `sample-docs` folder) and **Prod Mode** (fetching metadata and resolving pre-signed S3 URLs from the NestJS Backend Catalog API).
   - **Landing Page Implementation (2-column layout)**:
     - Setup global header reading "Enterprise Documentation".
     - Left column: Dynamic Side navigation traversing the taxonomy (Domain -> System -> filters products).
     - Right column: Interactive Product grids/tiles populated from `docs.yaml` with descriptions.
   - **Documentation Page Implementation (3-column layout)**:
     - Base Layout: Breadcrumbs (Home -> domain -> system -> product).
     - Header updates: Dynamic selected document title + Search box + **Version Dropdown**.
     - Left Column: Specific product documentation section navigation.
     - Middle Column: Rendered active markdown document.
     - Right Column: Rendered Table of Contents.
     - Footer Implementation: Display the extracted "Last Updated" timestamp, feedback logic hooks, and "Edit this Page" links.
   - **Quality Standards**: Author end-to-end Playwright tests confirming navigating between products on the landing page functions as expected, and light/dark mode toggles seamlessly without layout shifts. Add component-level unit tests for all complex UI directives.
