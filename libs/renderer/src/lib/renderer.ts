import { Marked } from 'marked';
// Ignore the ts errors inside renderer for now since plugins isn't technically fully linked yet during this phase
import { buildTableOfContentsPlugin, buildMermaidPlugin, TocItem } from '@tmp-dac/plugins';
import DOMPurify from 'isomorphic-dompurify';
import { buildShikiPlugin } from './plugins/shiki.plugin';

/**
 * The structured output of the unified Markdown rendering process.
 */
export interface RenderedDocument {
  /** The final HTML string to be injected into the Portal UI. */
  html: string;
  /** The extracted structure of headings for the Right-hand column navigation. */
  toc: TocItem[];
}

/**
 * Core wrapper around Marked.js.
 * Configures all enterprise plugins and parses a raw markdown string.
 * @param markdown The raw markdown content from the file.
 * @returns An object containing the HTML and the extracted TOC.
 */
export async function renderMarkdown(markdown: string): Promise<RenderedDocument> {
  const m = new Marked();

  let extractedToc: TocItem[] = [];

  // 1. Inject Mermaid diagram wrapper plugin
  buildMermaidPlugin(m);

  // 2. Inject TOC / Heading ID Generation plugin
  buildTableOfContentsPlugin(m, (toc) => {
    extractedToc = toc;
  });

  // 3. Inject asynchronous Shiki Syntax Highlighting plugin
  buildShikiPlugin(m);

  // Execute parse (resolves custom async WalkTokens)
  const rawHtml = await m.parse(markdown);

  // Strip malicious XSS execution contexts from user generated documentation
  const html = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['mermaid', 'img'], // Ensure our custom mermaid wrappers and standard images survive
    ADD_ATTR: ['class', 'src', 'alt', 'style'] // Preserve inline Shiki CSS theme vars and token styles
  });

  return {
    html,
    toc: extractedToc
  };
}
