# Phase 2: Local Authoring Experience

## Objective
Enable documentation authors to preview their markdown content locally with the full portal experience before committing changes.

## Tasks
1. **Implement Plugins Library (`libs/plugins`)**
   - Develop plugins for Table of Contents (TOC) generation.
   - Implement Mermaid.js rendering engine (lazy-load client-side only on pages with ```mermaid blocks).
   - Create "Edit-this-Page" link generators and helpfulness rating widget schemas.
   - **Quality Standards**: Add unit tests (Vitest) confirming HTML modifications are accurately parsed and edge-case Markdown inputs behave correctly. Include robust inline comments explaining regular expression matches or string manipulation.

2. **Implement Markdown Renderer (`libs/renderer`)**
   - Integrate `markedjs` to parse and render Markdown into HTML.
   - Inject the plugin functionalities from `libs/plugins` into the rendering pipeline.
   - Add logic to process and prepare static assets (images, stylesheets) during build.

3. **Develop CLI Package (`libs/cli` & `apps/cli`)**
   - Build a CLI tool exportable package to preview documentation changes locally natively.
   - Implement metadata validation: Verify `docs.yaml` strictly against the central taxonomy API.
   - Add logic to extract the "last updated" timestamp from Git commit history during build time for the freshness badges.

4. **Develop Local Preview App (`libs/preview` & `apps/preview`)**
   - Build an Angular shell app specifically for local authoring preview.
   - Integrate the `renderer` and `cli` tools to watch and build `sample-docs` locally for instant visual feedback.
   - **Quality Standards**: Add E2E tests using Playwright confirming the local preview server correctly hot-reloads and that the base shell behaves responsively. Validate the CLI validations log clear errors using Vitest.
