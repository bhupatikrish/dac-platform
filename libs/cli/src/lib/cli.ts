import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import { validateTaxonomyDefinition } from '@tmp-dac/tools';
// @ts-ignore
import { validateFrontmatter } from '@tmp-dac/shared-types';
import * as yaml from 'js-yaml';
import { renderMarkdown } from '@tmp-dac/renderer';
// @ts-ignore
import { buildStaticSearchIndex } from '@tmp-dac/search';

export interface CliPreviewOptions {
  /** The root directory of the markdown files (e.g., ./sample-docs) */
  docsDir: string;
  /** The taxonomy configuration file mapping */
  taxonomyPath: string;
}

/**
 * Validates the documentation repository structure before allowing a build or preview.
 * This enforces the presence of docs.yaml and validates it against the platform taxonomy.
 */
export function validateLocalRepository(options: CliPreviewOptions): boolean {
  let isValid = true;

  // 1. Validate Taxonomy
  const taxonomyResult = validateTaxonomyDefinition(options.taxonomyPath);
  if (!taxonomyResult.valid) {
    console.error('❌ Platform Taxonomy is invalid:', taxonomyResult.errors.join(', '));
    return false;
  }

  // 2. Find all docs.yaml and validate frontmatter
  const allDocsYaml = findFiles(options.docsDir, 'docs.yaml');
  let docsProcessed = 0;

  for (const docYaml of allDocsYaml) {
    try {
      const raw = fs.readFileSync(docYaml, 'utf-8');
      const parsed = yaml.load(raw);
      validateFrontmatter(parsed);
      docsProcessed++;
    } catch (e: any) {
      console.error('❌ Invalid frontmatter in ' + docYaml + ': ' + e.message);
      isValid = false;
    }
  }

  if (isValid) {
    console.log('✅ Repository validated successfully. (' + docsProcessed + ' document sites found)');
  }

  return isValid;
}

/** Helper to recursively find files */
function findFiles(dir: string, extensionOrName: string): string[] {
  let results: string[] = [];
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
  return results;
}

/**
 * Executes a standalone Static Site Generation (SSG) process.
 * Crawls a directory of markdown files, compiles them to HTML JSON payloads,
 * and writes the artifacts to a specified output distribution directory.
 */
export async function buildStaticDocs(sourceDir: string, outDir: string): Promise<void> {
  console.log(`[CLI] Starting Static Site Generation...`);
  console.log(`[CLI] Source: ${sourceDir}`);
  console.log(`[CLI] Output: ${outDir}`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const allMarkdownFiles = findFiles(sourceDir, '.md');
  let successCount = 0;

  for (const srcFile of allMarkdownFiles) {
    try {
      const rawMd = fs.readFileSync(srcFile, 'utf-8');
      const parsed = await renderMarkdown(rawMd);

      // Calculate the relative path from the sourceDir
      const relativePath = path.relative(sourceDir, srcFile);
      const outFilePath = path.join(outDir, relativePath).replace('.md', '.html.json');

      // Ensure nested directory structure exists in the outDir
      const targetDir = path.dirname(outFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Also copy the docs.yaml if we're processing an index.md file
      if (srcFile.endsWith('index.md')) {
        const yamlSrcPath = srcFile.replace('index.md', 'docs.yaml');
        if (fs.existsSync(yamlSrcPath)) {
          const yamlOutPath = outFilePath.replace('index.html.json', 'docs.yaml');
          fs.copyFileSync(yamlSrcPath, yamlOutPath);
        }
      }

      fs.writeFileSync(outFilePath, JSON.stringify(parsed));
      console.log(`✅ Built: ${outFilePath}`);
      successCount++;
    } catch (e: any) {
      console.error(`❌ Failed to compile ${srcFile}: ${e.message}`);
    }
  }

  // Copy static image assets
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
  let assetCount = 0;
  for (const ext of imageExtensions) {
    const assetFiles = findFiles(sourceDir, ext);
    for (const assetFile of assetFiles) {
      try {
        const relativePath = path.relative(sourceDir, assetFile);
        const outFilePath = path.join(outDir, relativePath);
        const targetDir = path.dirname(outFilePath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(assetFile, outFilePath);
        console.log(`✅ Copied Asset: ${outFilePath}`);
        assetCount++;
      } catch (e: any) {
        console.error(`❌ Failed to copy asset ${assetFile}: ${e.message}`);
      }
    }
  }

  // Phase 5 Addendum: Always build the static FlexSearch index dynamically alongside the HTML docs.
  try {
    buildStaticSearchIndex(sourceDir, outDir);
  } catch (e) {
    console.warn(`[CLI] Warning: Could not generate static search index map: ${e}`);
  }

  console.log(`\n[CLI] Build Complete. ${successCount} documents generated successfully.`);
}
