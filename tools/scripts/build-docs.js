const path = require('path');
const { buildStaticDocs } = require('../../dist/libs/cli');

async function buildAll() {
    const cwd = process.cwd();

    // Process sample-docs
    await buildStaticDocs(
        path.join(cwd, 'sample-docs'),
        path.join(cwd, 'dist', 'sample-docs')
    );

    // Process platform docs
    await buildStaticDocs(
        path.join(cwd, 'docs'),
        path.join(cwd, 'dist', 'docs')
    );
}

buildAll().catch(err => {
    console.error(err);
    process.exit(1);
});
