/**
 * MkDocs Material-compatible Content Tabs Pre-Processor
 *
 * Transforms `=== "Label"` syntax into semantic HTML wrapper divs
 * BEFORE the Markdown is passed to Marked.js for parsing.
 *
 * This is a pure string → string transform — no AST manipulation.
 * The de-indented Markdown content inside each panel is left for
 * Marked.js to parse normally (code blocks, lists, etc.).
 */

const TAB_MARKER_REGEX = /^=== "(.+)"$/;

/**
 * Pre-process raw Markdown to convert MkDocs-style content tabs
 * into HTML wrapper divs that Marked.js will pass through.
 *
 * @param markdown The raw Markdown string.
 * @returns The transformed Markdown with tab blocks replaced by HTML.
 */
export function preprocessContentTabs(markdown: string): string {
    const lines = markdown.split('\n');
    const result: string[] = [];

    let tabGroupIndex = 0;
    let i = 0;

    while (i < lines.length) {
        const match = lines[i].match(TAB_MARKER_REGEX);

        if (!match) {
            result.push(lines[i]);
            i++;
            continue;
        }

        // We found the start of a tab group — collect all consecutive tabs
        const tabs: { label: string; contentLines: string[] }[] = [];

        while (i < lines.length) {
            const tabMatch = lines[i].match(TAB_MARKER_REGEX);
            if (!tabMatch) break;

            const label = tabMatch[1];
            const contentLines: string[] = [];
            i++; // move past the === line

            // Collect indented content lines belonging to this tab
            while (i < lines.length) {
                const nextTabMatch = lines[i].match(TAB_MARKER_REGEX);
                if (nextTabMatch) break; // next tab marker starts

                // A completely blank line (no spaces) could be:
                // - A separator between tabs (if next non-blank line is a tab marker or EOF) → break
                // - Part of the content (blank line within indented content) → keep
                if (lines[i] === '') {
                    // Look ahead: if the next non-blank line is a tab marker or EOF, this blank ends the content
                    let lookAhead = i + 1;
                    while (lookAhead < lines.length && lines[lookAhead] === '') {
                        lookAhead++;
                    }

                    if (lookAhead >= lines.length) {
                        // EOF after blank lines — end of tab content
                        break;
                    }

                    const nextNonBlank = lines[lookAhead];
                    if (nextNonBlank.match(TAB_MARKER_REGEX)) {
                        // Next real line is another tab marker — blank is just a separator, skip it
                        i++;
                        break;
                    }

                    if (!nextNonBlank.startsWith('    ')) {
                        // Next real line is NOT indented — we've left the tab group entirely
                        break;
                    }

                    // Otherwise this blank line is part of the indented content
                    contentLines.push('');
                    i++;
                    continue;
                }

                if (lines[i].startsWith('    ')) {
                    // De-indent by 4 spaces
                    contentLines.push(lines[i].substring(4));
                    i++;
                } else {
                    // Non-indented, non-blank line — tab group is over
                    break;
                }
            }

            tabs.push({ label, contentLines });
        }

        // Emit the HTML for this tab group
        const groupId = tabGroupIndex++;

        result.push(`<div class="content-tabs" data-tab-group="${groupId}">`);
        result.push(`<div class="content-tabs-labels">`);
        tabs.forEach((tab, idx) => {
            const activeClass = idx === 0 ? ' active' : '';
            result.push(`<button class="content-tab-label${activeClass}" data-tab-index="${idx}">${tab.label}</button>`);
        });
        result.push(`</div>`);

        tabs.forEach((tab, idx) => {
            const activeClass = idx === 0 ? ' active' : '';
            result.push(`<div class="content-tab-panel${activeClass}" data-tab-index="${idx}">`);
            result.push('');
            result.push(tab.contentLines.join('\n'));
            result.push('');
            result.push(`</div>`);
        });

        result.push(`</div>`);
    }

    return result.join('\n');
}
