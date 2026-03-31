const fs = require('fs');
const path = require('path');

const files = [
    'e:/Escritorio/RPM/RPM/frontend/src/context/AuthContext.jsx',
    'e:/Escritorio/RPM/RPM/frontend/src/pages/admin/DatosEmpresa.jsx',
    'e:/Escritorio/RPM/RPM/frontend/src/pages/admin/Usuarios.jsx',
    'e:/Escritorio/RPM/RPM/frontend/src/pages/admin/ListaInventario.jsx'
];

function updateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern 1: `${API_BASE_URL}${someVar.someProp}`
    // Replacement: (someVar.someProp?.startsWith('http') ? someVar.someProp : `${API_BASE_URL}${someVar.someProp}`)
    
    // AuthContext.jsx specific
    content = content.replace(
        /const logoFullUrl = res\.data\.logoUrl \? `\${API_BASE_URL}\${res\.data\.logoUrl}` : null;/g,
        "const logoFullUrl = res.data.logoUrl?.startsWith('http') ? res.data.logoUrl : (res.data.logoUrl ? `${API_BASE_URL}${res.data.logoUrl}` : null);"
    );

    // DatosEmpresa.jsx specific
    content = content.replace(
        /setCurrentLogo\(`\${API_BASE_URL}\${res\.data\.logoUrl}`\)/g,
        "setCurrentLogo(res.data.logoUrl?.startsWith('http') ? res.data.logoUrl : `${API_BASE_URL}${res.data.logoUrl}`)"
    );
    content = content.replace(
        /setCurrentLogo\(`\${API_BASE_URL}\${res\.data\.empresa\.logoUrl}`\)/g,
        "setCurrentLogo(res.data.empresa?.logoUrl?.startsWith('http') ? res.data.empresa.logoUrl : `${API_BASE_URL}${res.data.empresa.logoUrl}`)"
    );

    // Usuarios.jsx specific
    content = content.replace(
        /setFotoPreview\(user\.fotoUrl \? `\${API_BASE_URL}\${user\.fotoUrl}` : null\);/g,
        "setFotoPreview(user.fotoUrl?.startsWith('http') ? user.fotoUrl : (user.fotoUrl ? `${API_BASE_URL}${user.fotoUrl}` : null));"
    );
    content = content.replace(
        /src={`\${API_BASE_URL}\${user\.fotoUrl}`}/g,
        "src={user.fotoUrl?.startsWith('http') ? user.fotoUrl : `${API_BASE_URL}${user.fotoUrl}`}"
    );

    // ListaInventario.jsx specific (Already has some logic, but let's make it consistent)
    content = content.replace(
        /src={art\.imagen\.startsWith\('http'\) \? art\.imagen : `\${API_BASE_URL}\/\${art\.imagen}`}/g,
        "src={art.imagen?.startsWith('http') ? art.imagen : `${API_BASE_URL}${art.imagen?.startsWith('/') ? '' : '/'}${art.imagen}`}"
    );

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${path.basename(filePath)}`);
}

files.forEach(updateFile);
