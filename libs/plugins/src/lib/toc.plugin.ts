import { marked } from 'marked';

/**
 * Interface representing a standard TOC item extracted from headings.
 */
export interface TocItem {
    level: number;
    text: string;
    id: string;
}

/**
 * Injects a heading ID generation and TOC extraction plugin into the Marked instance.
 * @param markedInstance The marked instance to extend.
 * @param onTocGenerated Callback function receiving the extracted TOC array.
 */
export function buildTableOfContentsPlugin(markedInstance: any, onTocGenerated: (toc: TocItem[]) => void) {
    const toc: TocItem[] = [];

    // Override the heading renderer to inject IDs and collect TOC data.
    const renderer = new markedInstance.Renderer();
    renderer.heading = function (this: any, { tokens, depth }: any) {
        // Simplify this standard renderer for Angular/ markedv13
        const text = this.parser.parseInline(tokens);
        const escapedText = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        const unescapedDisplayText = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

        toc.push({
            level: depth,
            text: unescapedDisplayText,
            id: escapedText
        });

        return '<h' + depth + ' id="' + escapedText + '">' + text + '</h' + depth + '>\n';
    };

    markedInstance.use({ renderer });

    // A hook to execute after parsing to emit the TOC state upwards.
    markedInstance.use({
        hooks: {
            postprocess(html: string) {
                onTocGenerated(toc);
                return html;
            }
        }
    });
}
