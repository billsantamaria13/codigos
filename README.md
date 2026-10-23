# 🚀 CyberShop Códigos (Portal OTP de Streaming)

Portal web de auto-consulta de códigos de acceso para servicios de Streaming (**Netflix, Disney+, HBO Max, Amazon Prime, Crunchyroll, Plex**).
Permite a los usuarios ingresar únicamente con su **Número de Celular** y su **PIN de 4 dígitos** (de la columna `PIN_CLIENTE` de tu Google Sheet).

---

## 📁 Estructura del Proyecto

```text
Web Codigos/
├── backend_appsscript/
│   └── Codigo.gs         <-- El código que pegas en tu Google Sheet (Apps Script)
├── index.html            <-- Página web moderna con Tailwind CSS y logos oficiales
├── config.js             <-- Archivo donde pegas la URL de tu Web App de Apps Script
├── CNAME                 <-- Subdominio: codigos.cybershop.lat (para GitHub Pages)
└── README.md             <-- Esta guía paso a paso
```

---

## 🛠️ PASO 1: Configurar Google Apps Script en tu Hoja "Pantallas"

1. Abre tu hoja de Google Sheets llamada **"Pantallas"**.
2. En la barra superior haz clic en: **Extensiones** > **Apps Script**.
3. Verás un editor de código con un archivo llamado `Código.gs`. **Borra todo su contenido**.
4. Abre el archivo [`backend_appsscript/Codigo.gs`](file:///c:/Users/billy/Documents/Web%20Codigos/backend_appsscript/Codigo.gs) de esta carpeta, **copia todo el código y pégalo** en el editor de Google.
5. Haz clic en el icono de **Guardar** (el disquete 💾 o presiona `Ctrl + S`).

### Implementar como Aplicación Web:
6. En la esquina superior derecha de Apps Script, haz clic en el botón azul **"Implementar"** > **"Nueva implementación"**.
7. En el icono de engranaje (⚙️), selecciona tipo **"Aplicación web"**.
8. Configura estos 3 campos:
   - **Descripción:** `API Portal Codigos`
   - **Ejecutar como:** `Yo (tu correo de Gmail)`
   - **Quién tiene acceso:** **`Cualquier usuario`** *(Imprescindible para que tus clientes puedan consultar sin iniciar sesión en Google).*
9. Haz clic en **"Implementar"**.
10. Google te pedirá autorizar permisos la primera vez:
    - Selecciona tu cuenta de Google.
    - Si te sale aviso de "Google no ha verificado esta app", haz clic en *Configuración avanzada (Advanced)* > *Ir a Proyecto (no seguro)* > *Permitir*.
11. **Copia la "URL de la aplicación web"** (es una URL larga que termina en `/exec`).

---

## ⚙️ PASO 2: Vincular la URL en la Web

1. Abre el archivo [`config.js`](file:///c:/Users/billy/Documents/Web%20Codigos/config.js).
2. Verás esto:
   ```javascript
   window.APP_CONFIG = {
     API_URL: "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT",
     ...
   ```
3. Reemplaza `"PEGA_AQUI_TU_URL_DE_APPS_SCRIPT"` con la URL que copiaste en el paso anterior y guarda el archivo.

---

## 🌐 PASO 3: Subir a GitHub y activar GitHub Pages

1. Crea un nuevo repositorio en tu cuenta de GitHub (ejemplo: `codigos-cybershop` o el nombre que prefieras). Puede ser público.
2. Sube todos los archivos de esta carpeta (`index.html`, `config.js`, `CNAME`, etc.) al repositorio.
3. En tu repositorio de GitHub, ve a:
   - **Settings** (Configuración) > pestaña **Pages** (en el menú lateral izquierdo).
   - En **Build and deployment > Branch**: selecciona `main` (o `master`) y carpeta `/(root)`, luego clic en **Save**.
   - En la sección **Custom domain**: verás que automáticamente detecta `codigos.cybershop.lat` gracias al archivo `CNAME`.
   - Marca la casilla **"Enforce HTTPS"** (puede tardar unos minutos en activarse mientras emite el certificado SSL).

---

## 🌍 PASO 4: Configurar tu subdominio `codigos.cybershop.lat`

En el panel donde compraste o administras el dominio `cybershop.lat` (por ejemplo Cloudflare, GoDaddy, Hostinger, Namecheap, etc.):

1. Entra a la zona de **Registros DNS**.
2. Añade un nuevo registro de tipo **CNAME**:
   - **Tipo:** `CNAME`
   - **Nombre / Host:** `codigos`
   - **Destino / Valor:** `TU_USUARIO_GITHUB.github.io` *(reemplaza con tu nombre de usuario en GitHub).*
   - **TTL:** Automático o 3600.
3. Guarda el registro. ¡Listo! En unos minutos `https://codigos.cybershop.lat` estará en vivo en todo el mundo.

---

## ✨ Características Incluidas en la Web:

- 🔒 **Autenticación doble:** Validación de Celular (Columna I) + PIN de 4 dígitos (Columna L `PIN_CLIENTE`).
- 🎨 **Logos oficiales y diseño elegante:** Netflix, Disney+, HBO Max / Max, Amazon Prime Video, Crunchyroll, Plex.
- ⏱️ **Detección inteligente de códigos:** Extrae el código OTP o el enlace de autorización de hogar de Netflix, calculando cuántos minutos hace que llegó.
- 📋 **Botón de 1 toque para copiar:** Copia el código al portapapeles con confirmación visual.
- 🔄 **Botón de actualización inmediata:** Permite al cliente forzar la búsqueda de correos recién llegados sin esperar.
- 📱 **100% Responsive:** Diseñado con prioridad para teléfonos móviles.
