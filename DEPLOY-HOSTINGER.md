# Guía para subir Calculadora DAK a Hostinger

## Opción 1: File Manager (Más fácil)

1. **Accede a hPanel de Hostinger**
   - Ve a https://hpanel.hostinger.com
   - Inicia sesión con tus credenciales

2. **Abre File Manager**
   - En el panel, busca "File Manager" o "Administrador de archivos"
   - Navega a `public_html` (o la carpeta de tu dominio)

3. **Sube los archivos**
   - Haz clic en "Upload" o "Subir"
   - Selecciona estos archivos desde tu carpeta local:
     - `index.html`
     - `styles.css`
     - `calculator.js`
     - `data.js`
     - `assets/logo.svg` (crea la carpeta `assets` primero si no existe)

4. **Verifica**
   - Visita tu dominio (ej: `tudominio.com`)
   - La calculadora debería estar funcionando

## Opción 2: FTP/SFTP (Recomendado)

### Usando FileZilla (gratis)

1. **Descarga FileZilla**
   - https://filezilla-project.org/download.php?type=client

2. **Obtén credenciales FTP**
   - En hPanel → "FTP Accounts" o "Cuentas FTP"
   - Anota: Host, Usuario, Contraseña, Puerto (generalmente 21 para FTP o 22 para SFTP)

3. **Conecta**
   - Abre FileZilla
   - Host: `ftp.tudominio.com` o la IP que te dio Hostinger
   - Usuario: tu usuario FTP
   - Contraseña: tu contraseña FTP
   - Puerto: 21 (FTP) o 22 (SFTP)
   - Clic en "Conectar"

4. **Sube archivos**
   - Panel izquierdo: tu carpeta local `DAK-APP`
   - Panel derecho: navega a `public_html` o carpeta de tu dominio
   - Arrastra estos archivos:
     ```
     index.html
     styles.css
     calculator.js
     data.js
     assets/logo.svg
     ```

5. **Verifica**
   - Visita tu dominio en el navegador

## Opción 3: GitHub + Hostinger (Avanzado)

Si Hostinger soporta Git:

1. **Conecta Git en hPanel**
   - Ve a "Git" o "Version Control" en hPanel
   - Conecta tu repositorio: `https://github.com/KevinVv18/dak-calculator.git`
   - Configura el directorio de deploy

2. **Pull automático**
   - Cada vez que hagas push a GitHub, Hostinger puede hacer pull automático

## Estructura de archivos en Hostinger

```
public_html/
├── index.html
├── styles.css
├── calculator.js
├── data.js
├── assets/
│   └── logo.svg
└── package.json (opcional)
```

## Notas importantes

- **No subas `node_modules/`** - No es necesario para producción
- **No subas `.git/`** - Opcional, pero no necesario
- **HTTPS**: Asegúrate de tener SSL activado en Hostinger (gratis con Let's Encrypt)
- **Subdominio**: Si quieres usar `calculadora.tudominio.com`, crea un subdominio en hPanel y sube los archivos ahí

## Solución de problemas

- **404 Error**: Verifica que `index.html` esté en la raíz de `public_html`
- **Logo no aparece**: Verifica que la ruta `assets/logo.svg` sea correcta
- **Estilos no cargan**: Verifica que `styles.css` esté en la misma carpeta que `index.html`

## Comandos útiles (si tienes acceso SSH)

```bash
cd public_html
git clone https://github.com/KevinVv18/dak-calculator.git .
# O simplemente copia los archivos manualmente
```
