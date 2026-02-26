# Phase 5: Search & Telemetry

## Objective
Incorporate static text-based document search capabilities and prepare telemetry event pipelines for platform observability and analytics.

## Tasks
1. **Develop Search Library (`libs/search`)**
   - Integrate `FlexSearch` configurations to dynamically index static markdown documents efficiently.
   - Provide tooling to group indexes scoped to individual document sites to avoid bleeding into global scope (as requested).
   - **Static Index Generation**: Search indices should ALWAYS be generated statically via the CLI as part of the documentation build process (`buildStaticDocs()`), even in local mode. The Angular Portal will simply fetch the pre-compiled static `.json` search index payloads instead of building the index dynamically in-browser.
   - **Quality Standards**: Given the algorithmic nature of search configurations, provide thorough Vitest unit testing and code comments to explain indexing thresholds, tokenization logic, and edge case query resolution.

2. **Integrate Search into CI Pipelines (`scripts/ci`)**
   - Modify the Jenkins script to invoke the `search` library during the build phase.
   - Generate the search index payload locally before publishing.
   - Upload the search index via the preset S3 workflow alongside the HTML assets.

3. **Surface Search in Portal Theme (`libs/theme`)**
   - Hook up the Header UI search box to query the localized FlexSearch indexes.
   - Display visual search results dynamically mimicking the visual style of Backstage search.
   - **Modern Dialog Layout**: Utilize the native HTML5 `<dialog>` element and its `::backdrop` pseudo-element to guarantee perfect background masking for both Light and Dark themes.
   - **Result Categorization**: Group search results by Domain/System categories directly in the dropdown instead of rendering a flat list.
   - Provide direct linking from search results traversing to the correct page subsection.

4. **Establish Telemetry Structure (`libs/telemetry`)**
   - Implement event capturing utilities for Portal consumer behaviour.
   - Create foundational hooks for tracking:
     - Most Active Pages (Page Views).
     - Search Queries with No Results.
     - Feedback events (from the Footer Helpfulness ratings).
