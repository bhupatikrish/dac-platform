# Platform Documentation Implementation Plan (Phase 7)

This document outlines the strategy for creating comprehensive technical documentation for the "Docs as Code" (DAC) platform itself, demonstrating the platform's capabilities while providing a guide for developers and authors.

## Proposed Changes

### Component 1: Taxonomy Updates (`taxonomy/taxonomy.yaml`)
To properly house the DAC platform documentation, we will introduce a new taxonomy category.
- **Domain:** `Application Lifecycle Management`
- **System:** `Documentation Portal`
- **Product Name:** `Docs as Code`

### Component 2: Platform Documentation Structure (`/docs`)
We will create a new `/docs` directory at the root of the monorepo to act as the primary documentation site for the platform.

#### 1. `docs/docs.yaml` (Metadata)
Configure the site's frontmatter to map to the new taxonomy, setting the owner to `platform-engineering@acme.corp` and version to `v1.0.0`.

#### 2. `docs/index.md` (Landing Page)
An overview of the Docs-as-Code philosophy, the core requirements met (from `requirements-table.md`), and the value proposition of the unified discovery portal.

#### 3. `docs/architecture/overview.md`
High-level architectural breakdown of the federated content strategy.
- **Mermaid Diagram:** Visualizing the relationship between the Markdown Repos, the Nx Monorepo (Angular + NestJS), and the CLI compiler.
- Details on the separation of concerns between `api`, `portal`, `renderer`, `search`, and `telemetry`.

#### 4. `docs/guides/authoring.md` (User Guide)
A comprehensive guide for technical writers.
- How to structure the `docs.yaml` file.
- Supported Markdown features (Standard Markdown, Tables, Code Blocks).
- How to embed Mermaid ` ```mermaid ` diagrams.
- How to include static image assets directly from the repository.

#### 5. `docs/guides/development.md` (Runbook)
Steps for platform developers to maintain the system.
- How to run the monorepo locally (`npx nx serve portal`, `npx nx serve api`).
- Explain "Local Mode" (reading direct from disk) vs. "Production Mode" (S3 / Static Site Generation).

#### 6. `docs/guides/preview-cli.md`
Documentation on using the `@tmp-dac/cli` for local authoring preview without running the entire backend suite.

### Component 3: Backend & UI Integration for `/docs`
Currently, the application strictly looks inside `/sample-docs`. We need to enhance the platform to load both `/sample-docs` and `/docs` in local mode.
- **Backend API (`apps/api`):** Modify `LocalDiskStorageService` to recursively crawl an array of root directories (`['sample-docs', 'docs']`) when compiling the catalog tree so both folders appear in the site navigation.
- **Static Assets (`apps/api/src/app.module.ts`):** Modify `ServeStaticModule` or the API controller to serve images from the `/docs` folder as well.
- **CLI Compiler (`libs/cli`):** Update the SSG builder to process both directories if needed for validation.

## Verification Plan

### Manual Verification
1. Run `npx nx serve api` and `npx nx serve portal`.
2. Open the Portal. Verify the left navigation now contains the new "Engineering Enablement -> Developer Portals" hierarchy alongside the existing "Infrastructure" category.
3. Click on the new `Docs as Code (DAC)` product tile.
4. Verify the `architecture` tab successfully renders the custom Mermaid diagrams.
5. Verify the search bar automatically indexes the new platform documentation and returns correct routing paths.
