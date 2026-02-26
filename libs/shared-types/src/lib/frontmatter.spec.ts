import { describe, it, expect } from 'vitest';
import { validateFrontmatter, FrontmatterValidationError, DocsFrontmatter } from './frontmatter';

describe('Frontmatter Schema Validation', () => {
    const validYaml: DocsFrontmatter = {
        title: 'S3 Object Store',
        description: 'Cloud storage documentation.',
        owner: 'storage-team@example.com',
        version: 'v2.1.0',
        domain: 'infrastructure',
        system: 'object-store',
        product: 's3'
    };

    it('should successfully validate a completely conformant parsed yaml object', () => {
        const result = validateFrontmatter(validYaml);
        expect(result).toStrictEqual(validYaml);
    });

    it('should throw FrontmatterValidationError if a field is completely missing', () => {
        const missingTitle = { ...validYaml };
        delete (missingTitle as any).title;

        expect(() => validateFrontmatter(missingTitle)).toThrowError(FrontmatterValidationError);
        expect(() => validateFrontmatter(missingTitle)).toThrowError(/Missing or invalid required field 'title'/);
    });

    it('should throw FrontmatterValidationError if a field is an empty string', () => {
        const emptySystem = { ...validYaml, system: '    ' };
        expect(() => validateFrontmatter(emptySystem)).toThrowError(/Missing or invalid required field 'system'/);
    });

    it('should throw FrontmatterValidationError if a field is not a string type', () => {
        const numberVersion = { ...validYaml, version: 1.2 };
        expect(() => validateFrontmatter(numberVersion)).toThrowError(/Missing or invalid required field 'version'/);
    });
});
