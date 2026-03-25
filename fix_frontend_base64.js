const fs = require('fs');

const files = [
    'e:/Escritorio/RPM/RPM/frontend/src/context/AuthContext.jsx',
    'e:/Escritorio/RPM/RPM/frontend/src/pages/admin/DatosEmpresa.jsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // pattern: someVar = res.data.logoUrl ? `${API_BASE_URL}${res.data.logoUrl}` : null;
        content = content.replace(/res\.data\.logoUrl \? `\${API_BASE_URL}\${res\.data\.logoUrl}` : null/g, 
            "res.data.logoUrl?.startsWith('data:') ? res.data.logoUrl : (res.data.logoUrl ? `${API_BASE_URL}${res.data.logoUrl}` : null)");
        
        // also for DatosEmpresa.jsx line 38
        content = content.replace(/setCurrentLogo\(`\${API_BASE_URL}\${res\.data\.logoUrl}`\)/g,
            "setCurrentLogo(res.data.logoUrl.startsWith('data:') ? res.data.logoUrl : `${API_BASE_URL}${res.data.logoUrl}`)");
            
        // also for DatosEmpresa.jsx line 112
        content = content.replace(/setCurrentLogo\(`\${API_BASE_URL}\${res\.data\.empresa\.logoUrl}`\)/g,
            "setCurrentLogo(res.data.empresa.logoUrl.startsWith('data:') ? res.data.empresa.logoUrl : `${API_BASE_URL}${res.data.empresa.logoUrl}`)");

        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
