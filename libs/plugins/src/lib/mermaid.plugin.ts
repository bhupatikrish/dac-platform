import { marked } from 'marked';

/**
 * Injects Mermaid support by wrapping \`\`\`mermaid code blocks in a specific
 * div class that the client-side mermaid library looks for to lazy-load and render.
 * @param markedInstance The marked instance to extend.
 */
export function buildMermaidPlugin(markedInstance: any) {
    const renderer = new markedInstance.Renderer();

    // Override code blocks exactly aiming for 'mermaid' tagged blocks.
    renderer.code = function ({ text, lang }: any) {
        if (lang === 'mermaid') {
            return '<div class="mermaid">\n' + text + '\n</div>\n';
        }

        // Fallback to standard pre code block if not mermaid
        // Markjs v17 naturally escapes html entities in code blocks. Let's make sure it's rendering raw string text.
        const unescapedText = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        return '<pre><code class="language-' + lang + '">' + unescapedText + '</code></pre>\n';
    };

    markedInstance.use({ renderer });
}
