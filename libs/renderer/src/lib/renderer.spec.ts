import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './renderer';

describe('Markdown Renderer Core', () => {

  it('should render standard markdown cleanly', async () => {
    const raw = '# Hello World\n\nThis is a paragraph.';
    const result = await renderMarkdown(raw);

    expect(result.html).toContain('<h1 id="hello-world">Hello World</h1>');
    expect(result.html).toContain('<p>This is a paragraph.</p>');
    expect(result.toc.length).toBe(1);
  });

  it('should process mermaid blocks successfully', async () => {
    const raw = [
      '```mermaid',
      'graph TD;',
      '  A-->B;',
      '```'
    ].join('\n');
    const result = await renderMarkdown(raw);

    expect(result.html).toContain('<div class="mermaid">');
    expect(result.html).toContain('A--&gt;B;');
  });

  it('should sanitize destructive HTML and XSS payloads', async () => {
    const malicious = [
      '# Evil Hacker',
      'Click [here](javascript:alert("XSS")) to see a magic trick.',
      '<img src="x" onerror="alert(1)">',
      '<script>console.log("Stolen cookies")</script>'
    ].join('\\n');

    const result = await renderMarkdown(malicious);

    // The link javascript context should be neutralized or structuralized
    expect(result.html).not.toContain('javascript:alert');
    // The onerror execution should be stripped
    expect(result.html).not.toContain('onerror=');
    // The script tag should be completely obliterated
    expect(result.html).not.toContain('<script>');

    // Safety check that formatting survives
    expect(result.html).toContain('Evil Hacker');
  });

});
