/**
 * Defines the centralized taxonomy hierarchy for the platform documentation.
 * Used for catalog categorization, dynamic navigation, and filtering.
 */
export interface PlatformTaxonomy {
    /** The root domain categories (e.g., Infrastructure, Security). */
    domains: TaxonomyDomain[];
}

/**
 * Represents a high-level Domain categorizing a technical area.
 */
export interface TaxonomyDomain {
    /** Unique domain ID (e.g., 'infrastructure'). */
    id: string;
    /** Human-readable title for the domain (e.g., 'Infrastructure'). */
    title: string;
    /** The systems that belong under this domain. */
    systems: TaxonomySystem[];
}

/**
 * Represents a specific System within a Domain.
 */
export interface TaxonomySystem {
    /** Unique system ID (e.g., 'object-store'). */
    id: string;
    /** Human-readable title for the system (e.g., 'Object Store'). */
    title: string;
}

/**
 * Validates if the given string resembles a valid taxonomy ID (kebab-case alphanumeric).
 * @param id The ID to validate.
 * @returns boolean True if the ID resembles a kebab-case string, false otherwise.
 */
export function isValidTaxonomyId(id: string): boolean {
    const kebabRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return kebabRegex.test(id);
}
