import { describe, it, expect } from 'vitest';
import { isValidTaxonomyId } from './taxonomy';

describe('Taxonomy Types Validations', () => {
    it('should validate proper kebab-case taxonomy IDs', () => {
        expect(isValidTaxonomyId('infrastructure')).toBe(true);
        expect(isValidTaxonomyId('object-store')).toBe(true);
        expect(isValidTaxonomyId('identity-and-access')).toBe(true);
        expect(isValidTaxonomyId('platform-123')).toBe(true);
    });

    it('should invalidate improper taxonomy IDs', () => {
        expect(isValidTaxonomyId('Infrastructure')).toBe(false); // Capitalized
        expect(isValidTaxonomyId('object store')).toBe(false); // Space
        expect(isValidTaxonomyId('identity_and_access')).toBe(false); // Underscore
        expect(isValidTaxonomyId('-platform')).toBe(false); // Leading dash
        expect(isValidTaxonomyId('platform-')).toBe(false); // Trailing dash
    });
});
