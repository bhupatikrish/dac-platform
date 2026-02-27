# Performance Test Results — Comprehensive EKS Guide

**Test Date:** 2026-02-26  
**Document:** `sample-docs/infrastructure/compute/eks/comprehensive-guide.md`

---

## Document Profile

| Metric | Value |
|--------|-------|
| Source file (Markdown) | 1,917 lines / 49 KB |
| Output file (HTML JSON) | 336 KB |
| Rendered HTML length | 325,989 characters |
| TOC entries extracted | 52 headings |

### Feature Breakdown

| Feature | Count |
|---------|-------|
| Content tab groups | 9 |
| Tab buttons | 27 |
| Tab panels | 27 |
| Mermaid diagrams | 8 |
| Shiki-highlighted code blocks | 48 |
| Copy-to-clipboard buttons | 48 |
| Markdown tables | 8 |
| Languages highlighted | bash, yaml, hcl, json, powershell |

---

## Build Performance

### Full Site Build (86 documents)

| Metric | Value |
|--------|-------|
| Total wall time | **2.64 seconds** |
| User CPU time | 3.00 seconds |
| System CPU time | 0.36 seconds |
| CPU utilization | 126% (multi-core) |
| Avg per document | ~30 ms |

### File Size Comparison (EKS pages)

| Page | Source | Output | Ratio |
|------|--------|--------|-------|
| comprehensive-guide.md | 49 KB | 336 KB | 6.9x |
| sdk-quickstart.md | 2 KB | 13 KB | 6.5x |
| setup.md | 0.4 KB | 2.1 KB | 5.3x |
| index.md | 0.2 KB | 0.4 KB | 2.0x |
| architecture.md | 0.2 KB | 0.3 KB | 1.5x |

The comprehensive guide is **26x larger** than the next biggest EKS page (sdk-quickstart), making it a strong stress test for the rendering pipeline.

### Search Index Impact

| Metric | Value |
|--------|-------|
| Total indexed documents | 86 |
| Index payload size | Regenerated successfully |

---

## Observations

1. **Build time is fast.** Processing 86 documents (including a 49 KB markdown file with 48 Shiki-highlighted code blocks and 8 Mermaid diagrams) completes in under 3 seconds, with multi-core utilization at 126%.

2. **Shiki highlighting dominates output size.** The 6.9x blowup ratio from source to output is primarily due to Shiki's inline CSS variables for dual-theme syntax highlighting (each token gets `--shiki-light` and `--shiki-dark` properties).

3. **Content tabs work correctly at scale.** 9 tab groups with 27 panels were all properly pre-processed and rendered — tabs, Shiki code blocks, and copy buttons all co-exist without interference.

4. **Mermaid diagrams pass through cleanly.** All 8 Mermaid diagrams are wrapped in `<div class="mermaid">` and rely on client-side rendering, adding negligible build overhead.

5. **TOC extraction is comprehensive.** 52 headings were extracted with correct IDs and hierarchy, providing full right-hand navigation for the long-form document.

---

## Browser Performance Metrics

Measured using the browser Performance API after navigating to the comprehensive guide page in the portal (`http://localhost:4200`).

### Page Load Timing

| Metric | Value |
|--------|-------|
| **Response End** (HTML received) | 7.6 ms |
| **DOM Interactive** | 21.6 ms |
| **DOM Content Loaded** | 187.1 ms |
| **Load Event End** | 230.4 ms |
| **First Paint** | 260 ms |
| **First Contentful Paint (FCP)** | 260 ms |

### DOM Complexity

| Metric | Value |
|--------|-------|
| Total DOM elements | 6,811 |
| Content tab groups | 9 |
| Mermaid diagrams | 8 |
| Shiki code blocks | 48 |
| Copy-to-clipboard buttons | 48 |

### Network Transfer

| Metric | Value |
|--------|-------|
| Total resources loaded | 57 |
| Total transfer size | 178.1 KB |

### Page Screenshot

![Comprehensive Guide page rendered in the portal](/Users/krishnabhupathi/.gemini/antigravity/brain/9a999569-ce5c-4b24-905a-6763538dd0be/page_screenshot.png)

---

## Observations

1. **Build time is fast.** Processing 86 documents (including a 49 KB markdown file with 48 Shiki-highlighted code blocks and 8 Mermaid diagrams) completes in under 3 seconds, with multi-core utilization at 126%.

2. **Browser rendering is excellent.** Despite 6,811 DOM elements, First Contentful Paint is only **260ms** — well within the "good" threshold of <1.8s recommended by Google's Core Web Vitals.

3. **Shiki highlighting dominates output size.** The 6.9x blowup ratio from source to output is primarily due to Shiki's inline CSS variables for dual-theme syntax highlighting (each token gets `--shiki-light` and `--shiki-dark` properties).

4. **Content tabs work correctly at scale.** 9 tab groups with 27 panels were all properly pre-processed and rendered — tabs, Shiki code blocks, and copy buttons all co-exist without interference.

5. **Mermaid diagrams pass through cleanly.** All 8 Mermaid diagrams are wrapped in `<div class="mermaid">` and rely on client-side rendering, adding negligible build overhead.

6. **Efficient network transfer.** Only 178 KB transferred across 57 resources for a page with 48 code blocks, 8 diagrams, and 9 tab groups — the pre-built HTML JSON approach avoids runtime markdown parsing overhead.

---

## Recommendations

- **No performance concerns** at this document size. The pipeline handles 1,900+ line pages with complex features comfortably.
- For documents significantly larger (5,000+ lines), consider splitting into multiple pages linked by the sidebar navigation.
- The 336 KB output payload is reasonable for modern browsers, but could be reduced in the future by externalizing Shiki theme CSS into a shared stylesheet rather than inlining per-token.
