# Phase 3: Backend Services & Catalog

## Objective
Stand up the centralized NestJS API to manage documentation metadata, handle S3 publish flows, and maintain the central catalog database.

## Tasks
1. **Backend API Library (`libs/api`)**
   - Develop NestJS services for programmatic AWS S3 interactions (generating presigned URLs, content serving structures).

2. **NestJS Application (`apps/api`)**
   - Scaffold the core NestJS backend application.
   - Provide APIs that Portal apps can consume to discover available domains, systems, and product navigations.
   - **Environment Provider Pattern**: Implement a dynamic Storage Service. In **Local Mode (`NODE_ENV=development`)**, the service scans the local filesystem (`sample-docs/`) to build the catalog in-memory for immediate authoring feedback. In **Production Mode (`NODE_ENV=production`)**, the service queries the centralized Postgres Database and resolves AWS S3 pre-signed URLs.
   - **Quality Standards**: Ensure all API DTOs are well commented, and provide comprehensive unit tests (Vitest) for all NestJS services. Use Postman or supertest to provide integration/E2E level testing on the generated routes.

3. **Implement Catalog Registry & Publish API**
   - Create the `publish API` invoked by CI pipelines.
   - Parse incoming `docs.yaml` metadata upon publish request.
   - Upsert the metadata (domain, system, product, version, S3 path) into the central Database acting as the "Catalog Registry".
   - Setup API routing to support S3 versioning constructs, ensuring paths like `s3://bucket/{domain}/{system}/{product}/{version}/` map properly to Portal routes.
   - Implement cache invalidation hooks.

4. **Setup CI Pipeline Scripts (`scripts/ci`)**
   - Write Jenkins deployment scripts that utilize the `renderer` lib to build HTML.
   - Ensure the scripts call the `publish API` to acquire the pre-signed S3 URL.
   - Execute the upload of static documentation artifacts securely to S3.
