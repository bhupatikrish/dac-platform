const fs = require('fs');
const path = require('path');

const sampleProducts = [
    { title: 'Global Identity Access', domain: 'security', system: 'identity-access', name: 'roles', description: 'Enterprise RBAC framework for managing application authorization profiles.' },
    { title: 'Elastic Compute provisioning', domain: 'infrastructure', system: 'compute', name: 'eks', description: 'Managed AWS EKS Cluster deployment standard and modules.' }
];

const docsDir = path.join(__dirname, 'sample-docs');
if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
}

function processSite(product) {
    const productDir = path.join(docsDir, product.domain, product.system, product.name);
    fs.mkdirSync(productDir, { recursive: true });

    const yaml = [
        'title: "' + product.title + '"',
        'description: "' + product.description + '"',
        'owner: "team-' + product.name + '@acme.corp"',
        'version: "v1.0.0"',
        'domain: "' + product.domain + '"',
        'system: "' + product.system + '"',
        'product: "' + product.name + '"'
    ].join('\n');

    const index = [
        '# ' + product.title,
        '',
        product.description,
        '',
        '## Overview',
        'This product documentation site contains all the reference architecture, APIs, and setup guides.'
    ].join('\n');

    const setup = [
        '# Setup & Installation',
        '',
        'Here is how you can set up ' + product.title + ' for your application.',
        '',
        '## Prerequisites',
        '1. Valid Enterprise credentials.',
        '2. Terraform installed locally.',
        '',
        '## Steps',
        'Run the following terraform module to provision your resources.',
        '```hcl',
        'module "provision_' + product.name + '" {',
        '  source = "terraform.enterprise.com/' + product.domain + '/' + product.name + '"',
        '  version = "~> 1.0"',
        '}',
        '```'
    ].join('\n');

    const arch = [
        '# Architecture',
        '',
        'The following diagram explains the architecture of ' + product.name + '.',
        '',
        '```mermaid',
        'graph TD;',
        '    Client-->API;',
        '    API-->Database;',
        '```'
    ].join('\n');

    fs.writeFileSync(path.join(productDir, 'docs.yaml'), yaml);
    fs.writeFileSync(path.join(productDir, 'index.md'), index);
    fs.writeFileSync(path.join(productDir, 'setup.md'), setup);
    fs.writeFileSync(path.join(productDir, 'architecture.md'), arch);
}

sampleProducts.forEach(processSite);
console.log("Documents regenerated.");
