# Usage Guide: Enterprise Documentation Platform

Welcome to the Enterprise Documentation Platform! This guide explains how you can contribute documentation alongside your code using our Docs-as-Code philosophy.

## Table of Contents
1. [What is Docs-as-Code?](#what-is-docs-as-code)
2. [Setting Up Your Documentation](#setting-up-your-documentation)
3. [The `docs.yaml` File](#the-docsyaml-file)
4. [Previewing Changes Locally](#previewing-changes-locally)
5. [Publishing Documentation](#publishing-documentation)

---

## What is Docs-as-Code?

We believe technical documentation should be treated with the same rigorous care as software code. Instead of using disparate wikis or Word documents, you will author your documentation in **Markdown** directly within your software repositories.

Our platform will automatically discover, render, index, and publish your documentation to a single, easily navigable Enterprise Portal.

## Setting Up Your Documentation

To integrate your repository into the platform, create a dedicated folder (e.g., `/docs`) at the root of your repository. 

Place all your `.md` documentation files inside this folder, structuring them in a way that makes logical sense for your project. However, the root of your `/docs` folder **must** contain a `docs.yaml` metadata file.

## The `docs.yaml` File

The `docs.yaml` acts as the map providing the platform with critical routing, ownership, and taxonomic information about your documentation. This is what populates the Enterprise Portal navigation.

Here is an example `docs.yaml`:

```yaml
title: "Amazon S3 Implementation Guide"
description: "Core architectural decisions and usage guides for the S3 object storage wrapper."
owner: "team-storage-ninjas@enterprise.com"
version: "v1.2.0"
# Taxonomy Requirements
domain: "Infrastructure"
system: "Object Store"
product: "S3"
```

**Note:** The `domain` and `system` fields are strictly validated during CI builds against the central catalog. Ensure they match exactly!

## Previewing Changes Locally

Because our platform adds rich features (like Mermaid.js diagramming, Table of Contents, and custom enterprise styling), you may want to see exactly how your Markdown will look on the live site before you merge your PR.

You can utilize the platform CLI to spin up a local preview server:

1. Navigate to your repository root.
2. Run the platform preview command: `npx @enterprise/docs-cli preview ./docs`
3. A local browser tab will open mirroring the exact rendering engine and UI layout of the production portal. E2E Hot-reloading is enabled, so as you save your Markdown files, the preview will update instantly!

## Publishing Documentation

You do not need to manually push your documentation to the portal. Our pipeline takes care of this automatically!

When your Pull Request is merged into your main branch, an enterprise Jenkins pipeline step executes the following string of events:
1. Validates your `docs.yaml` against the taxonomy.
2. Runs inclusive-language and broken-link checkers.
3. Renders your Markdown into static HTML.
4. Generates a local FlexSearch index for your site.
5. Communicates with our NestJS API to acquire a secure upload URL, pushing your documentation safely to S3.

Congratulations, your docs are now live and searchable by the entire enterprise!
