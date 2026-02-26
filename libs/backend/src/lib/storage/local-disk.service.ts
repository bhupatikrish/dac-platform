import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, DocumentNode, MarkdownMetadata } from './storage.provider';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { renderMarkdown } from '@tmp-dac/renderer';

@Injectable()
export class LocalDiskStorageService implements StorageProvider {
    private readonly logger = new Logger(LocalDiskStorageService.name);

    private readonly sourcePaths = [
        path.join(process.cwd(), 'sample-docs'),
        path.join(process.cwd(), 'docs')
    ];
    private readonly distPaths = [
        path.join(process.cwd(), 'dist', 'sample-docs'),
        path.join(process.cwd(), 'dist', 'docs')
    ];

    // Map: "domain/system/product" -> physical directory path (e.g. ".../docs")
    private productMapCache = new Map<string, string>();

    async getDocumentContent(relativePath: string): Promise<string | any> {
        // Ensure mapping is populated
        if (this.productMapCache.size === 0) {
            await this.getCatalogTree();
        }

        const parts = relativePath.split('/');
        if (parts.length < 4) {
             throw new Error("Invalid document path. Expected domain/system/product/page.md");
        }

        const domain = parts[0];
        const system = parts[1];
        const product = parts[2];
        const pageRelative = parts.slice(3).join('/'); // e.g. "architecture/overview.md"

        const taxonomyKey = `${domain}/${system}/${product}`;
        const sourceRoot = this.productMapCache.get(taxonomyKey);

        if (!sourceRoot) {
            throw new Error(`Product mapping not found for taxonomy: ${taxonomyKey}`);
        }

        const usePrebuilt = process.env['SERVE_PREBUILT_HTML'] === 'true';
        let targetFilePath = path.join(sourceRoot, pageRelative);

        if (usePrebuilt) {
            const isSample = sourceRoot.includes('/sample-docs');
            const targetBase = isSample ? 'sample-docs' : 'docs';
            const sourceBaseIndex = sourceRoot.indexOf(targetBase);
            const relativeToRepoRoot = sourceRoot.substring(sourceBaseIndex); // e.g. "sample-docs/infrastructure/compute/eks" or "docs"
            
            targetFilePath = path.join(process.cwd(), 'dist', relativeToRepoRoot, pageRelative.replace('.md', '.html.json'));

            if (!fs.existsSync(targetFilePath)) {
                 throw new Error(`Document artifact not physically found: ${targetFilePath}`);
            }

            this.logger.debug(`Serving pre-built HTML: ${targetFilePath}`);
            const cachedContent = await fs.promises.readFile(targetFilePath, 'utf8');
            return JSON.parse(cachedContent);
        } else {
            if (!fs.existsSync(targetFilePath)) {
                 throw new Error(`Document source not physically found: ${targetFilePath}`);
            }
            const rawMd = await fs.promises.readFile(targetFilePath, 'utf8');
            this.logger.debug(`Compiling markdown on-the-fly: ${targetFilePath}`);
            return await renderMarkdown(rawMd);
        }
    }

    async getCatalogTree(): Promise<DocumentNode[]> {
        const taxonomyTree: DocumentNode[] = [];
        this.productMapCache.clear();

        // Recursively crawl all physical nodes starting from source directories
        for (const root of this.sourcePaths) {
            if (fs.existsSync(root)) {
                await this.findProducts(root, taxonomyTree);
            }
        }
        return taxonomyTree;
    }

    private async findProducts(currentDir: string, taxonomyTree: DocumentNode[]) {
        const metadataPath = path.join(currentDir, 'docs.yaml');
        const hasMetadata = fs.existsSync(metadataPath);

        if (hasMetadata) {
            // This directory represents a Product!
            const fileContents = await fs.promises.readFile(metadataPath, 'utf8');
            let meta: MarkdownMetadata;
            try {
                meta = yaml.load(fileContents) as MarkdownMetadata;
            } catch (e) {
                this.logger.error(`Failed to parse docs.yaml at ${metadataPath}`, e);
                return;
            }

            const domainId = meta.domain || 'unassigned';
            const systemId = meta.system || 'unassigned';
            const productId = meta.product || path.basename(currentDir);

            // Register mapping locally: 'infrastructure/compute/eks' -> '/absolute/path/to/eks'
            this.productMapCache.set(`${domainId}/${systemId}/${productId}`, currentDir);

            // Build hierarchical response for UI
            let domainNode = taxonomyTree.find(d => d.name === domainId);
            if (!domainNode) {
                domainNode = { name: domainId, path: domainId, type: 'directory', children: [] };
                taxonomyTree.push(domainNode);
            }

            let systemNode = domainNode.children!.find(s => s.name === systemId);
            if (!systemNode) {
                systemNode = { name: systemId, path: `${domainId}/${systemId}`, type: 'directory', children: [] };
                domainNode.children!.push(systemNode);
            }

            // Gather pages recursively into a flat array using standard slashes (Angular Router can handle nested segments safely if configured, but let's flat map display nodes)
            // Wait, if we use slashes, the UI sidebar will just show relative paths.
            // Let's get the pages relative to this current Product root
            const productNode: DocumentNode = {
                name: productId,
                path: `${domainId}/${systemId}/${productId}`,
                type: 'directory',
                metadata: meta,
                children: []
            };

            await this.gatherPages(currentDir, currentDir, productNode.children!);
            systemNode.children!.push(productNode);

        } else {
            // Traverse deeper to find products
            const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await this.findProducts(path.join(currentDir, entry.name), taxonomyTree);
                }
            }
        }
    }

    private async gatherPages(dir: string, baseProductDir: string, targetChildren: DocumentNode[]) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(dir, entry.name);
            const relativeToProduct = path.relative(baseProductDir, fullPath).split(path.sep).join('/');

            if (entry.isDirectory()) {
                await this.gatherPages(fullPath, baseProductDir, targetChildren);
            } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.html.json'))) {
                // Return clean relative path without the HTML JSON suffix
                const cleanRelativePath = relativeToProduct.replace('.html.json', '.md');
                targetChildren.push({
                    name: cleanRelativePath,
                    path: cleanRelativePath,
                    type: 'file'
                });
            }
        }
    }

    async getSearchIndex(): Promise<any> {
        let combinedIndex: any[] = [];
        for (const distRoot of this.distPaths) {
            const fullJsonPath = path.join(distRoot, 'search-index.json');
            if (fs.existsSync(fullJsonPath)) {
                const cachedContent = await fs.promises.readFile(fullJsonPath, 'utf8');
                const parsed = JSON.parse(cachedContent);
                if (Array.isArray(parsed)) {
                    combinedIndex = combinedIndex.concat(parsed);
                }
            }
        }
        return combinedIndex;
    }
}
