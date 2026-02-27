import { createHighlighter, HighlighterCore } from 'shiki';

// Global singleton so we don't reload WASM engines on every markdown file request
let highlighterInstance: HighlighterCore | null = null;

/**
 * Initializes and caches the Shiki engine with dual themes (Light / Dark).
 * It loads the standard web languages by default.
 */
async function getShikiHighlighter() {
    if (!highlighterInstance) {
        highlighterInstance = await createHighlighter({
            themes: ['github-light', 'github-dark'],
            langs: [
                'typescript', 'javascript', 'json', 'yaml', 'html', 'css',
                'bash', 'shell', 'python', 'go', 'java', 'csharp', 'sql', 'markdown',
                'hcl', 'terraform'
            ],
        });
    }
    return highlighterInstance;
}

/**
 * Injects an asynchronous Shiki tokenization plugin into a Marked.js instance.
 * When Marked encounters a ```code``` block, this override executes.
 * 
 * @param markedInstance The initialized Marked object.
 */
export function buildShikiPlugin(markedInstance: any) {
    markedInstance.use({
        async: true, // Crucial: Shiki inherently runs asynchronously
        walkTokens: async (token: any) => {
            // We must hook into walkTokens to perform the asynchronous highlighting
            // before the synchronous renderer phase executes.
            // We also explicitly skip 'mermaid' blocks so the dedicated Mermaid plugin can process them.
            if (token.type === 'code' && token.lang !== 'mermaid') {
                const highlighter = await getShikiHighlighter();
                const lang = token.lang || 'text';

                try {
                    // Tell Shiki to render the raw string into HTML structure,
                    // applying dual themes via CSS variables.
                    const shikiHtml = highlighter.codeToHtml(token.text, {
                        lang: lang,
                        themes: {
                            light: 'github-light',
                            dark: 'github-dark',
                        },
                        // We strip the default inline background color so we can manage it globally in CSS
                        // but we keep the inline token text colors.
                        defaultColor: false
                    });

                    // Replace the raw markdown text inside the token with the final Shiki HTML.
                    // By mutating the type to 'html', we trick the core Marked renderer into
                    // bypassing the standard <pre><code> wrapping logic and blindly trusting our string!
                    token.type = 'html';
                    token.text = `
<div class="code-block-wrapper">
    <button class="copy-button" aria-label="Copy code">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    </button>
    ${shikiHtml}
</div>`;
                } catch (e) {
                    console.warn(`[Shiki] Failed to highlight language: ${lang}. Falling back to raw text.`, e);
                    // If language isn't loaded or fails, we gracefully fallback
                    token.type = 'html';
                    const escapedText = token.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    token.text = `
<div class="code-block-wrapper">
    <button class="copy-button" aria-label="Copy code">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    </button>
    <pre class="shiki"><code>${escapedText}</code></pre>
</div>`;
                }
            }
        }
    });
}
