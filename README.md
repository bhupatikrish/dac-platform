# Docs as Code (DAC) Platform

This repository contains the "Docs as Code" Enterprise Documentation Platform. It provides a robust, federated architecture for aggregating markdown documentation across different organizational domains, rendering them statically or dynamically, and presenting them via a seamless Angular portal.

## Workspace Structure

The project is structured as an [Nx workspace](https://nx.dev) containing several applications and libraries.

### Applications (`apps/`)
- **`portal`**: The frontend Angular application. It provides the UI for navigating the taxonomy, reading documents, and conducting global searches.
- **`api`**: The backend NestJS application. It serves as the taxonomy router, dynamically fetching and compiling markdown content or statically serving pre-built HTML payloads.
- **`portal-e2e`**: Playwright end-to-end testing suite for the portal application.

### Libraries (`libs/`)
- **`backend`**: Contains the core storage adapters (like `LocalDiskStorageService`) for reading documentation file trees and taxonomy metadata.
- **`cli`**: The command-line tool (`@tmp-dac/cli`) used for Ahead-of-Time (AOT) static site generation (compiling Markdown to HTML payloads) and search indexing.
- **`renderer`**: The markdown parsing engine utilizing `marked.js` and `DOMPurify` to safely convert markdown string to HTML and extract Table of Contents.
- **`search`**: Responsible for crawling documentation and generating the static `flexsearch` index payload for the frontend.
- **`telemetry`**: Angular service for tracking page views, search analytics, and user feedback.
- **`theme`**: The core CSS design system variables and themes (Light/Dark mode) for the portal UI.
- **`portal-ui`**: Shared Angular UI components (like the `EnvironmentService` for API communication).
- **`shared-types`**: TypeScript interfaces and DTOs shared between the frontend and backend.

### Documentation Repositories
- **`docs/`**: The platform's own documentation repository (self-hosted). Contains internal architecture explanations, guides, and runbooks. 
- **`sample-docs/`**: A sample repository demonstrating how an external engineering team might structure their infrastructure or security documentation.
- **`taxonomy/`**: Contains the global `taxonomy.yaml` file defining the Enterprise `Domain -> System -> Product` hierarchy governance.

## Getting Started Locally

### Prerequisites
Make sure you have Node and npm installed.

```sh
npm install
```

### 1. Build Static Assets (Search Index & Pre-compiled HTML)
Before starting the servers, run the CLI build script to generate the static payload distributions from both the `/docs` and `/sample-docs` folders.

```sh
node tools/scripts/build-docs.js
```
This will compile markdown into `dist/docs` and `dist/sample-docs` respectively, and construct the `search-index.json`.

### 2. Start the Backend API
Start the NestJS data provider:
```sh
npx nx serve api
```
*(By default it runs on http://localhost:3000)*

### 3. Start the Frontend Portal
In a new terminal, start the Angular UI:
```sh
npx nx serve portal
```
Visit `http://localhost:4200` in your browser to view the platform!

## Environments
The API determines whether to serve dynamic files or static assets via the `SERVE_PREBUILT_HTML` environment variable:
- **JIT Development (false)**: The backend pulls bare `.md` files and renders HTML on-the-fly per request (useful for live local authoring).
- **AOT Production (true)**: The backend functionally serves the pre-compiled `.html.json` physical artifacts constructed by the CLI tool.

## Finding Documentation
The absolute best place to learn exactly how this platform is architected and how to construct documents for it is natively hosted inside the platform itself! 
Spin up the local application as shown above, and click into **Docs as Code** under the **Application Lifecycle Management** -> **Documentation Portal** grouping in the landing page sidebar!
