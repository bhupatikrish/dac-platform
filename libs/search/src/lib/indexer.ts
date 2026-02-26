import * as fs from 'fs';
import * as path from 'path';
import { Index } from 'flexsearch';
//@ts-ignore
import { validateFrontmatter } from '@tmp-dac/shared-types';
import * as yaml from 'js-yaml';

/**
 * Strips basic markdown syntax to create a clean string of text for the search index.
 * This is a naive implementation; for production it would likely use a regex pass or marked lexer.
 */
function stripMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/[#*`_~\[\]()\-!>]/g, ' ') // Remove markdown characters
        .replace(/\s+/g, ' ')               // Collapse whitespace
        .trim();
}

/** Helper to recursively find files */
function findFiles(dir: string, extensionOrName: string): string[] {
    let results: string[] = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.resolve(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(findFiles(file, extensionOrName));
            } else {
                if (file.endsWith(extensionOrName)) results.push(file);
            }
        });
    } catch (e) { /* ignore missing directories */ }
    return results;
}

/**
 * FlexSearch indexed entry interface
 */
export interface SearchRecord {
    id: string;      // Unique identifier (relative path or URL slug)
    title: string;   // Clean title
    content: string; // The raw searchable text content
    route: string;   // The Angular route payload
}

/**
 * Builds a FlexSearch text index for all markdown files found within the sourceDir.
 * It writes the serialized index chunk directly into the outDir for static hosting.
 */
export function buildStaticSearchIndex(sourceDir: string, outDir: string): void {
    console.log(`[Search] Building Static FlexSearch Index...`);
    const allMarkdownFiles = findFiles(sourceDir, '.md');

    // We use Document indexing in the frontend, but generate a raw JSON dict here 
    // to avoid complex IndexedDB serialization issues in Node environments.
    const records = [];

    for (const srcFile of allMarkdownFiles) {
        try {
            const rawMd = fs.readFileSync(srcFile, 'utf-8');

            // Calculate the document route
            let routePath = path.relative(sourceDir, srcFile).replace('.md', '');
            let title = path.basename(routePath);

            // Attempt to read docs.yaml sibling if it's an index.md file to get a better title
            if (srcFile.endsWith('index.md')) {
                const yamlSrcPath = srcFile.replace('index.md', 'docs.yaml');
                if (fs.existsSync(yamlSrcPath)) {
                    const yamlRaw = fs.readFileSync(yamlSrcPath, 'utf-8');
                    const parsed = yaml.load(yamlRaw) as any;
                    if (parsed && parsed.title) {
                        title = parsed.title;
                    }
                }
                // Normalize the route for 'system/product' level pages
                routePath = routePath.replace(/\/index$/, '');
            }

            const cleanContent = stripMarkdown(rawMd);

            records.push({
                id: routePath,
                title: title,
                content: cleanContent,
                route: `/docs/${routePath}`
            });

        } catch (e: any) {
            console.error(`[Search] Error indexing ${srcFile}: ${e.message}`);
        }
    }

    // We write out a simple JSON array of all documents. 
    // FlexSearch runs in-memory natively in the browser on page load.
    const outPath = path.join(outDir, 'search-index.json');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outPath, JSON.stringify(records));
    console.log(`✅ [Search] Index payload written: ${outPath} (${records.length} documents)`);
}
