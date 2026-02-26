const fs = require('fs');
const path = require('path');
const https = require('https'); // Or http for local testing
const yaml = require('js-yaml');

/**
 * MOCK CI PIPELINE SCRIPT
 * This script is intended to be executed by Jenkins / GitHub Actions 
 * after the Documentation Site builds successfully.
 * 
 * Usage: node deploy-docs.js /path/to/product/docs
 */
async function deployDocs() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error('Usage: node deploy-docs.js <path-to-docs-folder>');
        process.exit(1);
    }

    const yamlPath = path.join(targetDir, 'docs.yaml');
    if (!fs.existsSync(yamlPath)) {
        console.error(`docs.yaml not found in ${targetDir}`);
        process.exit(1);
    }

    // Parse Frontmatter locally to get routing variables
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const metadata = yaml.load(yamlContent);

    // Hardcode API URL for example purposes
    const apiUrl = process.env.DAC_PUBLISH_API || 'http://localhost:3000/api/publish';

    const payload = JSON.stringify({
        domain: metadata.domain,
        system: metadata.system,
        product: metadata.product,
        frontmatterBase64: Buffer.from(yamlContent).toString('base64'),
        markdownContent: '... (zipped bundle or raw markdown content would go here)'
    });

    console.log(`Publishing ${metadata.product} to Central Catalog Registry...`);

    const req = https.request(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ Publish Successful!');
                console.log(JSON.parse(responseData));
            } else {
                console.error(`❌ Publish Failed: [${res.statusCode}] ${responseData}`);
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Connection Error: ${e.message}`);
        process.exit(1);
    });

    req.write(payload);
    req.end();
}

deployDocs();
