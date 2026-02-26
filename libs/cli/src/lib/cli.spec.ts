import { describe, it, expect } from 'vitest';
import { validateLocalRepository } from './cli';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('CLI Local Repository Validation', () => {

  function createTestStructure(): { docsDir: string, taxonomyPath: string, cleanup: () => void } {
    const baseDir = fs.mkdtempSync(path.join(tmpdir(), 'dac-cli-test-'));
    const docDir = path.join(baseDir, 'docs-repo');
    fs.mkdirSync(docDir);

    const taxContent = [
      'domains:',
      '  - id: test-domain',
      '    title: Test Domain',
      '    systems:',
      '      - id: test-system',
      '        title: Test System'
    ].join('\n');

    const taxPath = path.join(baseDir, 'taxonomy.yaml');
    fs.writeFileSync(taxPath, taxContent);

    const docYaml = [
      'title: "Valid App"',
      'description: "Desc"',
      'owner: "owner@x.com"',
      'version: "v1"',
      'domain: "test-domain"',
      'system: "test-system"',
      'product: "app"'
    ].join('\n');
    fs.writeFileSync(path.join(docDir, 'docs.yaml'), docYaml);

    return {
      docsDir: docDir,
      taxonomyPath: taxPath,
      cleanup: () => fs.rmSync(baseDir, { recursive: true, force: true })
    };
  }

  it('should validate successfully for a properly structured repo', () => {
    const { docsDir, taxonomyPath, cleanup } = createTestStructure();

    const isValid = validateLocalRepository({ docsDir, taxonomyPath });
    expect(isValid).toBe(true);

    cleanup();
  });

  it('should fail validation if taxonomy path does not exist', () => {
    const { docsDir, cleanup } = createTestStructure();

    // Point to non-existent taxonomy
    const isValid = validateLocalRepository({ docsDir, taxonomyPath: '/does-not-exist.yaml' });
    expect(isValid).toBe(false);

    cleanup();
  });
});
