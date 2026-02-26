import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Parsed output of the taxonomy schema validator. 
 */
export interface TaxonomyValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validates the central taxonomy.yaml file to ensure it meets governance standards:
 * - Proper YAML formatting
 * - No duplicate IDs.
 * - Adheres strictly to the Domain -> System structure.
 */
export function validateTaxonomyDefinition(taxonomyFilePath: string): TaxonomyValidationResult {
    const errors: string[] = [];

    try {
        const rawYaml = fs.readFileSync(path.resolve(taxonomyFilePath), 'utf-8');
        const doc = yaml.load(rawYaml) as any;

        if (!doc || !doc.domains || !Array.isArray(doc.domains)) {
            return { valid: false, errors: ['Taxonomy file must contain an array of "domains" at the root.'] };
        }

        const domainIds = new Set<string>();

        doc.domains.forEach((domain: any, dIndex: number) => {
            if (!domain.id || !domain.title) {
                errors.push(`Domain at index ${dIndex} is missing 'id' or 'title'.`);
            } else {
                if (domainIds.has(domain.id)) {
                    errors.push(`Duplicate domain ID found: '${domain.id}'`);
                }
                domainIds.add(domain.id);
            }

            if (domain.systems && Array.isArray(domain.systems)) {
                const systemIds = new Set<string>();
                domain.systems.forEach((system: any, sIndex: number) => {
                    if (!system.id || !system.title) {
                        errors.push(`System at index ${sIndex} inside Domain '${domain.id}' is missing 'id' or 'title'.`);
                    } else {
                        if (systemIds.has(system.id)) {
                            errors.push(`Duplicate system ID found: '${system.id}' within Domain '${domain.id}'`);
                        }
                        systemIds.add(system.id);
                    }
                });
            } else {
                errors.push(`Domain '${domain.id}' is missing a valid 'systems' array.`);
            }
        });

    } catch (e: any) {
        errors.push(`YAML Parsing Exception: ${e.message}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
