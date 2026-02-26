const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function generate() {
    const taxonomyPath = path.join(process.cwd(), 'taxonomy', 'taxonomy.yaml');
    const sampleDocsPath = path.join(process.cwd(), 'sample-docs');

    if (!fs.existsSync(taxonomyPath)) {
        console.error("Taxonomy not found!");
        return;
    }

    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf8');
    const taxonomy = yaml.load(taxonomyContent);

    const docTemplates = [
        { name: 'overview.md', title: 'Overview', content: '# {Product Title} Overview\n\nWelcome to the {Product Title} documentation.' },
        { name: 'architecture.md', title: 'Architecture', content: '# Architecture\n\nHere is the architecture for {Product Title}.' },
        { name: 'usage-guide.md', title: 'Usage Guide', content: '# Usage Guide\n\nStep-by-step instructions for using {Product Title}.' },
        { name: 'technical-guide.md', title: 'Technical Guide', content: '# Technical Guide\n\nDeep dive into the technical implementation details.' },
        { name: 'api-reference.md', title: 'API Reference', content: '# API Reference\n\nComprehensive API documentation.' },
        { name: 'faq.md', title: 'FAQs', content: '# Frequently Asked Questions\n\nCommonly asked questions and troubleshooting.' }
    ];

    for (const domain of taxonomy.domains) {
        if (!domain.systems) continue;

        for (const system of domain.systems) {
            // Generate 1-2 products per system
            const productCount = Math.floor(Math.random() * 2) + 1; // 1 or 2

            for (let i = 1; i <= productCount; i++) {
                const productId = `${system.id}-product-${i}`;
                const productTitle = `${system.title} Product ${i}`;

                const productDir = path.join(sampleDocsPath, domain.id, system.id, productId);

                // Ensure directory exists
                fs.mkdirSync(productDir, { recursive: true });

                // Write docs.yaml
                const navArray = docTemplates.map(t => {
                    const obj = {};
                    obj[t.title] = t.name;
                    return obj;
                });

                const docsYaml = {
                    title: productTitle,
                    description: `Documentation for ${productTitle}`,
                    owner: `team-${productId}@acme.corp`,
                    version: "v1.0.0",
                    domain: domain.id,
                    system: system.id,
                    product: productId,
                    nav: navArray
                };

                fs.writeFileSync(path.join(productDir, 'docs.yaml'), yaml.dump(docsYaml));

                // Write 6 markdown files
                for (const t of docTemplates) {
                    const content = t.content.replace(/{Product Title}/g, productTitle);
                    fs.writeFileSync(path.join(productDir, t.name), content);
                }

                console.log(`✅ Scaffolded ${domain.id}/${system.id}/${productId}`);
            }
        }
    }
}

generate().then(() => console.log('Done!')).catch(console.error);
