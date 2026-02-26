import { describe, it, expect } from 'vitest';
import { Marked } from 'marked';
import { buildMermaidPlugin } from './mermaid.plugin';
import { buildTableOfContentsPlugin, TocItem } from './toc.plugin';

describe('Mermaid Plugin', () => {
  it('should format mermaid code blocks into div.mermaid', async () => {
    // Isolated marked instance
    const m = new Marked();
    buildMermaidPlugin(m);

    const input = [
      '```mermaid',
      'graph TD;',
      '    A-->B;',
      '```'
    ].join('\n');
    const html = await m.parse(input);
    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain('graph TD;');
    expect(html).not.toContain('<pre><code');
  });

  it('should ignore non-mermaid code blocks', async () => {
    const m = new Marked();
    buildMermaidPlugin(m);

    const input = [
      '```js',
      'console.log("hi");',
      '```'
    ].join('\n');
    const html = await m.parse(input);
    expect(html).toContain('<pre><code class="language-js">');
    expect(html).not.toContain('<div class="mermaid">');
  });
});

describe('TOC Plugin', () => {
  it('should extract headers and add IDs to HTML', async () => {
    const m = new Marked();
    let emittedToc: TocItem[] = [];

    buildTableOfContentsPlugin(m, (toc) => {
      emittedToc = toc;
    });

    const input = [
      '# Main Title',
      'Some text',
      '## Sub Section!',
      'More info.'
    ].join('\n');

    const html = await m.parse(input);

    // Assert HTML modifications
    expect(html).toContain('<h1 id="main-title">Main Title</h1>');
    expect(html).toContain('<h2 id="sub-section">Sub Section!</h2>');

    // Assert TOC data extraction
    expect(emittedToc).toHaveLength(2);
    expect(emittedToc[0]).toEqual({ level: 1, text: 'Main Title', id: 'main-title' });
    expect(emittedToc[1]).toEqual({ level: 2, text: 'Sub Section!', id: 'sub-section' });
  });
});
