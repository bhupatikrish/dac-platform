# CLI Local Preview

If you are a technical writer who simply wants to preview how your markdown renders in the grand unified portal *without* booting the entire Angular and NestJS stack, you can use our CLI!

## Usage

From your terminal, execute the builder script against your local documentation workspace:

```bash
node tools/scripts/build-docs.js
```

### What this does:
1. **Validates Taxonomy:** It ensures your `docs.yaml` matches the Enterprise Architecture standards dynamically mapping your `domain` and `system` fields.
2. **Generates the Payload:** It statically compiles your Markdown layout using the exact same `DOMPurify` pipeline that production uses, creating `.html.json` files in the `/dist` directory.
3. **Bundles Assets:** Recursively copies all local `.png` and `.jpg` image blobs over to the output directory so they behave flawlessly over HTTP.
4. **Builds Search Indices:** Initializes the static `flexsearch` document blobs for local query testing.
