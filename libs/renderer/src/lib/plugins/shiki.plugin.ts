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
                    token.text = shikiHtml;
                } catch (e) {
                    console.warn(`[Shiki] Failed to highlight language: ${lang}. Falling back to raw text.`, e);
                    // If language isn't loaded or fails, we gracefully fallback
                    token.type = 'html';
                    token.text = `<pre class="shiki"><code>${token.text}</code></pre>`;
                }
            }
        }
    });
}
