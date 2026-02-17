# Desplegar desde GitHub a Hostinger

## Opción 1: Git en hPanel (Recomendado)

### Paso 1: Activar Git en Hostinger

1. **Accede a hPanel**
   - Ve a https://hpanel.hostinger.com
   - Inicia sesión

2. **Busca "Git" o "Version Control"**
   - En el menú lateral, busca "Git" o "Version Control"
   - Si no lo ves, puede estar en "Advanced" o "Developer Tools"

3. **Crea un repositorio Git**
   - Haz clic en "Create Repository" o "Crear Repositorio"
   - Selecciona tu dominio o subdominio
   - Elige la carpeta donde quieres desplegar (generalmente `public_html`)

### Paso 2: Conectar con GitHub

**Método A: Clonar desde GitHub (Más fácil)**

1. En hPanel → Git, verás opciones para clonar
2. Ingresa la URL de tu repositorio:
   ```
   https://github.com/KevinVv18/dak-calculator.git
   ```
3. Selecciona la rama: `main`
4. Haz clic en "Clone" o "Clonar"
5. Hostinger descargará automáticamente los archivos

**Método B: Conectar repositorio existente**

1. Si ya tienes archivos en `public_html`, puedes inicializar Git ahí:
   ```bash
   cd public_html
   git init
   git remote add origin https://github.com/KevinVv18/dak-calculator.git
   git pull origin main
   ```

### Paso 3: Configurar Auto-Deploy (Opcional)

Si Hostinger tiene "Auto-Deploy" o "Webhooks":

1. En GitHub → tu repositorio → Settings → Webhooks
2. Agrega un webhook:
   - Payload URL: (Hostinger te dará esta URL)
   - Content type: `application/json`
   - Events: `push`
3. Cada vez que hagas `git push`, Hostinger actualizará automáticamente

## Opción 2: SSH + Git (Si tienes acceso SSH)

### Paso 1: Conecta por SSH

1. En hPanel → "SSH Access" o "Acceso SSH"
2. Activa SSH si no está activado
3. Anota tus credenciales SSH

### Paso 2: Clona el repositorio

```bash
# Conecta por SSH a tu servidor
ssh usuario@tu-servidor-hostinger.com

# Ve a public_html
cd public_html

# Clona tu repositorio
git clone https://github.com/KevinVv18/dak-calculator.git .

# O si ya tienes archivos:
git init
git remote add origin https://github.com/KevinVv18/dak-calculator.git
git pull origin main --allow-unrelated-histories
```

### Paso 3: Configurar Auto-Pull (Opcional)

Crea un script que se ejecute automáticamente:

```bash
# Crea un script de deploy
nano ~/deploy.sh
```

Contenido del script:
```bash
#!/bin/bash
cd ~/public_html
git pull origin main
```

Hazlo ejecutable:
```bash
chmod +x ~/deploy.sh
```

## Opción 3: GitHub Actions + FTP (Avanzado)

Si Hostinger no tiene Git integrado, puedes usar GitHub Actions para hacer deploy automático vía FTP.

### Crear workflow de GitHub Actions

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Hostinger
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: ftp.tudominio.com
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./
        server-dir: /public_html/
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          **/README.md
          **/DEPLOY*.md
```

Luego en GitHub:
1. Settings → Secrets → Actions
2. Agrega `FTP_USERNAME` y `FTP_PASSWORD`
3. Cada push hará deploy automático

## Verificación

Después de cualquier método:

1. Visita tu dominio: `https://tudominio.com`
2. Verifica que la calculadora funcione
3. Revisa la consola del navegador (F12) por errores

## Actualizar después de cambios

**Si usas Git en hPanel:**
```bash
# En hPanel → Terminal o SSH
cd public_html
git pull origin main
```

**Si usas GitHub Actions:**
- Solo haz `git push` y se desplegará automáticamente

## Solución de problemas

- **Git no aparece en hPanel**: Contacta al soporte de Hostinger para activarlo
- **Error de permisos**: Asegúrate de que los archivos tengan permisos correctos (644 para archivos, 755 para carpetas)
- **Archivos no se actualizan**: Limpia la caché del navegador (Ctrl+F5)
