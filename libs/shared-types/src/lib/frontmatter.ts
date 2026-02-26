/**
 * Defines the Frontmatter schema expected inside the 'docs.yaml' file
 * at the root of every federated documentation repository.
 */
export interface DocsFrontmatter {
    /** The human-readable title of the documentation site. */
    title: string;

    /** A brief description of what the documentation covers. */
    description: string;

    /** The team or individual email alias responsible for these documents. */
    owner: string;

    /** The canonical version of the software/product the docs represent (e.g., v1.2.0). */
    version: string;

    /** Technical Domain category according to the centralized taxonomy. */
    domain: string;

    /** Technical System category according to the centralized taxonomy. */
    system: string;

    /** The specific Product this documentation describes. */
    product: string;
}

/**
 * Helper error class thrown during docs.yaml validation failures.
 */
export class FrontmatterValidationError extends Error {
    constructor(message: string) {
        super(`Frontmatter Validation Error: ${message}`);
        this.name = 'FrontmatterValidationError';
    }
}

/**
 * Validates a given parsed YAML object against the strict DocsFrontmatter schema.
 * @param parsedYaml The raw object produced from a YAML parser.
 * @returns The strongly-typed DocsFrontmatter, or throws a FrontmatterValidationError.
 */
export function validateFrontmatter(parsedYaml: any): DocsFrontmatter {
    const requiredFields: (keyof DocsFrontmatter)[] = [
        'title', 'description', 'owner', 'version', 'domain', 'system', 'product'
    ];

    for (const field of requiredFields) {
        if (typeof parsedYaml[field] !== 'string' || parsedYaml[field].trim() === '') {
            throw new FrontmatterValidationError(`Missing or invalid required field '${field}'`);
        }
    }

    return parsedYaml as DocsFrontmatter;
}
