const fs = require('fs');
const path = require('path');

const dir = '/Users/abdullah/Desktop/Projeler/Lost Website/app/components/dashboard/admin';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace hardcoded backgrounds
    content = content.replace(/background:\s*['"]#(0a0a0c|0a0a0a|050505|000000|0d0d0d)['"]/g, "background: 'var(--surface)'");

    // Replace white borders with var(--border)
    // Examples: border: '1px solid rgba(255,255,255,0.06)'
    content = content.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.0[4-9]\)['"]/g, "border: '1px solid var(--border)'");
    content = content.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.1[0-9]?\)['"]/g, "border: '1px solid var(--border)'");
    content = content.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.2\)['"]/g, "border: '1px solid var(--border)'");

    // There are some specific inputs that use rgba(255,255,255,0.02) background, we can leave them or update to var(--glass)
    content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.02\)['"]/g, "background: 'var(--glass)'");

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', path.basename(filePath));
    }
}

const files = fs.readdirSync(dir);
files.forEach(file => {
    if (file.endsWith('.js')) {
        replaceInFile(path.join(dir, file));
    }
});
console.log('Done replacing colors.');
