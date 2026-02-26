import { describe, it, expect } from 'vitest';
import { validateTaxonomyDefinition } from './taxonomy-validator';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('Taxonomy Governance Validation', () => {

    const goodTaxonomy = `
domains:
  - id: infra
    title: Infrastructure
    systems:
      - id: db
        title: Databases
  `;

    const duplicateDomainTaxonomy = `
domains:
  - id: infra
    title: Infrastructure
    systems:
      - id: db
        title: Databases
  - id: infra
    title: Infra2
    systems:
      - id: db2
        title: DB2
  `;

    function writeTempYaml(content: string, filename: string): string {
        const tempPath = path.join(tmpdir(), filename);
        fs.writeFileSync(tempPath, content, 'utf-8');
        return tempPath;
    }

    it('should pass cleanly for a valid taxonomy setup', () => {
        const p = writeTempYaml(goodTaxonomy, 'valid-taxonomy.yaml');
        const result = validateTaxonomyDefinition(p);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        fs.unlinkSync(p);
    });

    it('should invalidate taxonomies with duplicate domain IDs', () => {
        const p = writeTempYaml(duplicateDomainTaxonomy, 'dup-taxonomy.yaml');
        const result = validateTaxonomyDefinition(p);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Duplicate domain ID found: 'infra'");
        fs.unlinkSync(p);
    });
});
