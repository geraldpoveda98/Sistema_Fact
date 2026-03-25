const fs = require('fs');
const path = require('path');

const srcDir = 'e:/Escritorio/RPM/RPM/frontend/src';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(srcDir, (filePath) => {
    if (!filePath.endsWith('.jsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let relativePath = path.relative(path.dirname(filePath), path.join(srcDir, 'config')).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    let hasHostname = content.includes('window.location.hostname');
    let hasApiBaseUrl = content.includes('apiBaseUrl');

    if (hasHostname || hasApiBaseUrl) {
        // Remove existing definitions
        content = content.replace(/const apiBaseUrl = \(import\.meta\.env\.VITE_API_URL \|\| `http:\/\/\${window\.location\.hostname}:5000`\);/g, '');
        content = content.replace(/const apiBaseUrl = `http:\/\/\${window\.location\.hostname}:5000`;/g, '');
        
        // Replace usages of apiBaseUrl or the literal
        content = content.replace(/\${apiBaseUrl}/g, '${API_BASE_URL}');
        content = content.replace(/\{apiBaseUrl\}/g, '{API_BASE_URL}');
        content = content.replace(/apiBaseUrl \+/g, 'API_BASE_URL +');
        content = content.replace(/`http:\/\/\${window\.location\.hostname}:5000/g, '`${API_BASE_URL}');
        
        // Final catch-all for any missed ${window.location.hostname}:5000
        content = content.replace(/`http:\/\/\${window\.location\.hostname}:5000\/api\/usuarios\/login`/g, '`${API_BASE_URL}/api/usuarios/login`');

        // Add import at the top if not already there
        if (!content.includes('API_BASE_URL')) {
             // If we replaced something, it should have API_BASE_URL now
        }
        if (content.includes('API_BASE_URL') && !content.includes('from \'' + relativePath + '\'')) {
            content = `import { API_BASE_URL } from '${relativePath}';\n` + content;
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
});
