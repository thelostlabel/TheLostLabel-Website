import { watch } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';

// This script watches for file changes and runs 'npm run deploy' automatically.
// Run with: node scripts/watch-node.mjs

console.log('🔄 Watcher started! Monitoring files for changes...');
console.log('🚀 Changes will be automatically pushed to the server.');

let timeout;
const debounceDeploy = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        console.log('⚡ Change detected! Deploying...');
        exec('npm run deploy', (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Deployment failed: ${error.message}`);
                return;
            }
            if (stderr) console.error(`⚠️ stderr: ${stderr}`);
            console.log(`✅ ${stdout}`);
        });
    }, 500); // Wait 500ms after last change to avoid multiple rapid deploys
};

// Watch directories recursively
watch('./', { recursive: true }, (eventType, filename) => {
    if (filename &&
        !filename.includes('node_modules') &&
        !filename.includes('.next') &&
        !filename.includes('.git') &&
        !filename.includes('.log')) {
        debounceDeploy();
    }
});
