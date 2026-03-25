const fs = require('fs');

// AuthContext.jsx
let authPath = 'e:/Escritorio/RPM/RPM/frontend/src/context/AuthContext.jsx';
if (fs.existsSync(authPath)) {
    let authContent = fs.readFileSync(authPath, 'utf8');
    authContent = authContent.replace(/document\.title = `\${res\.data\.nombre} - RPM`;/g, 'document.title = `${res.data.nombre}`;');
    fs.writeFileSync(authPath, authContent);
    console.log('Updated AuthContext.jsx');
}

// ListaInventario.jsx
let invPath = 'e:/Escritorio/RPM/RPM/frontend/src/pages/admin/ListaInventario.jsx';
if (fs.existsSync(invPath)) {
    let invContent = fs.readFileSync(invPath, 'utf8');
    invContent = invContent.replace(/const { user } = useAuth\(\);/g, 'const { user, empresa } = useAuth();');
    invContent = invContent.replace(/- RPM v2\.0`/g, "- ${empresa?.nombre || 'RPM'}`");
    fs.writeFileSync(invPath, invContent);
    console.log('Updated ListaInventario.jsx');
}
