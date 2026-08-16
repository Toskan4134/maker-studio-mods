# Publicar un mod

Recorrido práctico de cero a un mod vivo e instalable en el Marketplace de Maker Studio. Debería tomar unos 25 minutos la primera vez. Los mods siguientes te toman 10.

El mod de ejemplo — **TU_MOD** (`com.TU_USUARIO.TU_MOD`) — lleva la cuenta de cuántos días seguidos has abierto el editor.

Sustituye tu propio handle de GitHub, id de mod y nombre sobre la marcha.

> ¿Ya conoces el flujo y solo quieres la especificación? Salta a [Publicar — la referencia](#publicar-un-mod) más abajo.

---

## Antes de empezar

Necesitarás:

- Una cuenta de GitHub **pública**.
- Maker Studio instalado localmente (para probar el mod).
- Git en tu máquina. PowerShell en Windows, o bash en macOS/Linux.

Clona el repo del registro localmente — copiarás de su `examples/` y cogerás el template de workflow:

```powershell
gh repo clone Toskan4134/maker-studio-mods
cd maker-studio-mods
```

(¿Sin `gh`? `git clone https://github.com/Toskan4134/maker-studio-mods.git` funciona igual.)

---

## Paso 1 — Crea la carpeta de tu mod

Un mod es una carpeta con tres archivos: `manifest.json` (metadatos), `index.js` (tu código) y `README.md`. El inicio más rápido es copiar uno de los [`examples/mods/`](../../examples/mods/) del registro y editarlo. Aquí lo construiremos desde cero para que veas cada pieza.

Crea la carpeta en cualquier sitio fuera del clon del registro — tu mod necesita su propio repo. En tu Desktop:

```powershell
mkdir ms-TU_MOD
cd ms-TU_MOD
```

Añade los tres archivos.

### `manifest.json`

```json
{
  "id": "com.TU_USUARIO.TU_MOD",
  "name": "TU_MOD",
  "version": "1.0.0",
  "authors": [{ "name": "TU_USUARIO", "url": "https://github.com/TU_USUARIO" }],
  "description": "Tracks how many days in a row you've opened the editor.",
  "tags": ["tools", "ui"],
  "apiVersion": "1.0.0",
  "main": "index.js",
  "permissions": ["ui.toasts"]
}
```

El `id` es reverse-DNS (debe contener un `.`). `permissions` declara cada capacidad de la API que usa tu código — los revisores lo cotejan con el código. En `authors`, `url` es opcional, y también vale un `"author": "TU_USUARIO"` a secas.

Los `tags` son las palabras de búsqueda y filtrado del Marketplace, y los eliges tú — hasta 8. Escríbelos como mejor se lean (`"Terrain Tags"`, `"Essentials 19.1"`); al publicar se normalizan al `^[a-z0-9-]+$` que guarda el registro (`terrain-tags`, `essentials-19-1`). Si omites el campo, los tags los elige quien mantiene el registro al revisar.

### `index.js`

Un starter que loguea, muestra un toast y añade un item de menú:

```js
export function activate(ctx) {
  ctx.log.info("TU_MOD activated");

  ctx.ui.showToast({
    message: "Hello from TU_MOD!",
    level: "info",
  });

  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "TU_MOD — Say Hi",
    handler: () => {
      ctx.ui.showToast({ message: "Hi from TU_MOD!" });
    },
  });
}

export function deactivate() {
  // Los Disposables registrados vía ctx se limpian solos. Nada más que hacer.
}
```

### `README.md`

Una nota corta para ti mismo — cualquier cosa sirve. Los pasos de build + release se cubren más adelante en esta guía (consulta [Publicar](#publicar-un-mod) más abajo).

Ahora deberías tener:

```
ms-TU_MOD/
├── manifest.json
├── index.js
└── README.md
```

---

## Paso 2 — Escribe la lógica de tu mod

Abre `index.js` y sustituye el starter por tu característica real. Para TU_MOD podría ser:

```js
const STORAGE_KEY = "streak";

export async function activate(ctx) {
  const today = new Date().toISOString().slice(0, 10);
  const prev = await ctx.storage.get(STORAGE_KEY, { lastDay: null, count: 0 });

  let count = prev.count;
  if (prev.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    count = prev.lastDay === yesterday ? prev.count + 1 : 1;
    await ctx.storage.set(STORAGE_KEY, { lastDay: today, count });
  }

  ctx.ui.showToast({
    message: `🔥 ${count}-day streak — keep going!`,
    level: "info",
    durationMs: 4000,
  });
}
```

La superficie completa de la Mod API (cada método en `ctx`) está en la carpeta `docs/` — consulta [api-reference.md](../api-reference.md) para la referencia narrativa, [quick-reference.md](../quick-reference.md) para la chuleta de una página, y [mod-api.d.ts](../mod-api.d.ts) para los tipos TypeScript que puedes meter en tu editor para autocompletado.

Abre `manifest.json` y declara los permisos que usas realmente. TU_MOD usa `ctx.storage` (no necesita permiso — es mod-local) y `ctx.ui.showToast` (necesita `ui.toasts`):

```json
"permissions": ["ui.toasts"]
```

---

## Paso 3 — Prueba localmente

Suelta la carpeta de tu mod en el directorio global de mods y reinicia el editor.

**Windows:**
```powershell
Copy-Item -Recurse C:\Users\TU_USUARIO\Desktop\ms-TU_MOD "$env:APPDATA\maker-studio\Mods\TU_MOD"
```
**macOS:** `~/Library/Application Support/maker-studio/Mods/TU_MOD/`
**Linux:** `~/.local/share/maker-studio/Mods/TU_MOD/`

Arranca Maker Studio → **Mods → Mod Manager**. Tu mod aparece en la pestaña **Installed** con el badge **global**. Abre cualquier proyecto — el toast debería dispararse.

Si el mod falla al cargar, expande su fila en el Mod Manager para ver los logs de error. Arregla, luego pulsa **Reload** en la fila (no hace falta reinicio completo).

Repite edita → reload hasta que funcione.

Cuando termines de probar, borra la copia de prueba:
```powershell
Remove-Item -Recurse "$env:APPDATA\maker-studio\Mods\TU_MOD"
```

---

## Paso 4 — Coloca el workflow de GitHub Actions (recomendado)

El registro trae un workflow en [`templates/publish.yml`](../../templates/publish.yml). Se encarga de zipear el mod, calcular el SHA-256, crear el GitHub Release e imprimir el diff exacto del PR al registro. Cópialo en tu repo de mod:

```powershell
mkdir .github\workflows
Copy-Item C:\path\to\maker-studio-mods\templates\publish.yml .github\workflows\publish.yml
```

Commitéalo ya junto con tu código. No hay secrets que configurar —el `GITHUB_TOKEN` por defecto basta para publicar un release en tu propio repo.

Si prefieres construir los releases a mano, sáltate este paso y haz `Compress-Archive` + `Get-FileHash` a mano en el Paso 6. El resto del flujo es idéntico.

---

## Paso 5 — Crea el repo de GitHub para tu mod

Web: <https://github.com/new>

- Owner: tu cuenta
- Repository name: `ms-TU_MOD` (o lo que quieras)
- Visibility: **Public**
- No lo inicialices con README / .gitignore / license — vas a pushear los tuyos.

Pulsa **Create repository**. Copia la URL del repo (p. ej. `https://github.com/TU_USUARIO/ms-TU_MOD.git`).

---

## Paso 6 — Pushea y taguea el release

```powershell
cd C:\Users\TU_USUARIO\Desktop\ms-TU_MOD

git init
git add .
git commit -m "v1.0.0 — initial release"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ms-TU_MOD.git
git push -u origin main

# Taguea el release. El tag debe coincidir exactamente con la versión del manifest — sin la 'v'.
git tag v1.0.0
git push --tags
```

### Si copiaste el Action del template

Pushear el tag dispara `.github/workflows/publish.yml`. Abre la pestaña **Actions** en tu repo de mod:

1. Mira la ejecución. Zipea, hashea y crea el GitHub Release automáticamente.
2. Abre el paso final `Print registry PR block`. Imprime algo como:
   ```
   "version": "1.0.0",
   "assetName": "com.TU_USUARIO.TU_MOD-1.0.0.zip",
   "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
   ```
3. Copia esas tres líneas. Las pegarás en el PR al registro del Paso 7.

### Si lo haces a mano

```powershell
$zip = "com.TU_USUARIO.TU_MOD-1.0.0.zip"
Compress-Archive -Path manifest.json,index.js,README.md -DestinationPath $zip
$sha = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
Write-Host "sha256: $sha"

gh release create v1.0.0 $zip `
  --title "v1.0.0" `
  --notes "Initial release. Tracks daily editor-open streak."
```

Guarda `$sha` en algún sitio — lo necesitarás en el Paso 7.

---

## Paso 7 — Envía al registro

Este es el único paso que toca el repo maker-studio-mods. Dos caminos.

### Camino A — UI web de GitHub (cero git local)

1. Ve a <https://github.com/Toskan4134/maker-studio-mods/blob/main/index.json>
2. Pulsa el **icono de lápiz** (arriba a la derecha de la vista del archivo) — **Edit this file**.
3. GitHub hace auto-fork del registro a tu cuenta por detrás. Sin comandos `git`.
4. Añade tu entrada de mod dentro del array `"mods": [ ... ]`:
   ```json
   {
     "id": "com.TU_USUARIO.TU_MOD",
     "name": "TU_MOD",
     "authors": [{ "name": "TU_USUARIO", "url": "https://github.com/TU_USUARIO" }],
     "repo": "TU_USUARIO/ms-TU_MOD",
     "version": "1.0.0",
     "assetName": "com.TU_USUARIO.TU_MOD-1.0.0.zip",
     "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
     "description": "Tracks how many days in a row you've opened the editor.",
     "tags": ["stats", "motivation"],
     "homepage": "https://github.com/TU_USUARIO/ms-TU_MOD",
     "apiVersion": "1.0.0",
     "permissions": ["ui.toasts"]
   }
   ```
   Sustituye `version`, `assetName` y `sha256` por lo que imprimió el Paso 6. Si ya hay entradas, añade la tuya como último item (no olvides la coma después de la anterior).
5. Actualiza también `updatedAt` al timestamp ISO-8601 actual.
6. Baja hasta **Propose changes**. El mensaje de commit puede ser cualquiera — `add: com.TU_USUARIO.TU_MOD` sirve.
7. **Create pull request** → rellena el template del PR (se autocarga). Envía.

### Camino B — Fork local (para power users / varios mods)

```powershell
gh repo fork Toskan4134/maker-studio-mods --clone --remote
cd maker-studio-mods
git checkout -b add-TU_MOD
# edita index.json igual que arriba
git add index.json
git commit -m "add: com.TU_USUARIO.TU_MOD"
git push origin add-TU_MOD
gh pr create --fill
```

---

## Paso 8 — Espera el CI, responde a la revisión

Cuando se abre el PR, el workflow de CI del registro ejecuta estas comprobaciones:

| Comprobación | Qué hace |
|--------------|----------|
| **Schema validation** | `index.json` coincide con `schema/index.schema.json` (campos requeridos, patrón de id válido, forma semver, sha256 de 64 hex) |
| **Duplicate id check** | Ningunas dos entradas comparten el mismo `id` |
| **Release asset check** | El repo que listaste tiene un release en el tag fijado `v{version}` que contiene un asset que coincide con `assetName` |
| **Hash check** | El maintainer (o CI, si está disponible) verifica que el `sha256` listado coincide con los bytes reales del release |

¿Todo en verde? El maintainer revisa y mergea. Si algo está en rojo, pulsa la comprobación fallida para ver el mensaje exacto. Arreglos comunes:

| Error | Causa | Solución |
|-------|-------|----------|
| `should match pattern "^[a-zA-Z0-9._-]+$"` para `id` | Usaste espacios o caracteres raros en el id | Edita a solo letras/dígitos/`._-` |
| `repo has no release at tag v{version}` | Olvidaste publicar el Release en el Paso 6 | Publica el release, pushea el PR otra vez |
| `release has no asset named '<assetName>'` | El zip se llama distinto de lo que afirma tu PR | Vuelve a subir el zip con el nombre correcto, o arregla `assetName` en el PR |
| `sha256 doesn't match release asset` | Editaste o reconstruiste el zip después de calcular el hash | Vuelve a descargar del release, recalcula `sha256sum`, actualiza el PR |

Pushea arreglos a la misma rama — CI se reejecuta automáticamente. Una vez mergeado, estás vivo en ~1 hora (el editor cachea el index durante ese tiempo).

---

## Paso 9 — Verifica en el editor

Abre Maker Studio → **Mods → Mod Manager → Marketplace** → pulsa **Refresh** (fuerza un fetch inmediato).

- Tu tarjeta debería aparecer, fijada a `v1.0.0`.
- Pulsa **Install**. Un diálogo de consentimiento lista tus permisos declarados. Acepta.
- El editor descarga desde tu release, verifica que el SHA-256 coincide con el registro e instala.
- Espera el toast "Installed TU_MOD v1.0.0".
- Cambia a la pestaña **Installed** — tu mod está cargado y activo.

Eso es todo. Has publicado un mod.

---

## Publicar actualizaciones

Cada release posterior repite el mismo bucle — subir versión, taguear, pushear y luego un PR al registro que solo cambie `version`, `assetName` y `sha256`. Consulta [Publicar una actualización](#5--publicar-una-actualizacin) para los pasos canónicos.

---

## Tropiezos comunes la primera vez

- **Olvidaste pasar el repo a público.** El default para los repos nuevos de GitHub puede ser Private. Settings → General → Visibility → Change → Public.

El resto — tag/versión sin coincidir, zips con carpeta profunda, hashes obsoletos, permisos sin coincidir — se cubre en [Errores comunes](#8--errores-comunes) y [Motivos de rechazo](#motivos-de-rechazo).

---

## Dónde pedir ayuda

Abre una [discusión en el registro](https://github.com/Toskan4134/maker-studio-mods/discussions) para preguntas generales, o abre un [issue](https://github.com/Toskan4134/maker-studio-mods/issues) para un bug concreto en las docs o el schema.

---

# Publicar un mod

Referencia de punta a punta para meter tu mod en el Marketplace de Maker Studio. Salta a la sección que necesites:

1. [De un vistazo](#de-un-vistazo)
2. [El repo de tu mod](#1--el-repo-de-tu-mod)
3. [Convención de release](#2--convencin-de-release)
4. [Automatizar releases](#3--automatizar-releases-con-github-actions)
5. [Envío al registro](#4--listarse-en-el-registro)
6. [Actualizar](#5--publicar-una-actualizacin)
7. [Eliminar o renombrar](#6--eliminar-o-renombrar-un-mod)
8. [Lo que ven los usuarios](#7--lo-que-ven-los-usuarios)
9. [Errores comunes](#8--errores-comunes)
10. [Motivos de rechazo](#motivos-de-rechazo)

El Marketplace es server-less pero **no trust-on-first-use**. El `index.json` del registro fija cada mod a una `version` exacta y al SHA-256 de su asset de release. El editor descarga el tag fijado (`/releases/tags/v{version}`), hashea los bytes localmente y se niega a instalar si no coinciden. Así que mantienes la propiedad de tu repo de mod, pero **cada nuevo release necesita un PR aquí** — ese PR es la frontera de seguridad.

## De un vistazo

Tu mod debe:

1. Vivir en un repo de GitHub **público** que te pertenezca.
2. Tener un `manifest.json` en la raíz con al menos estos campos:
   - `id` (reverse-DNS, p. ej. `com.yourname.modname`) — identidad permanente
   - `name` (legible por humanos)
   - `version` (semver, debe coincidir con el tag de release)
   - `apiVersion` (la Mod API mínima que tu mod necesita, p. ej. `"1.0.0"`)
   - `main` (ruta relativa al archivo JS de entrada, p. ej. `"index.js"`)
3. Taguear cada release `vX.Y.Z` coincidiendo exactamente con `manifest.json#version` (sin la `v` inicial).
4. Adjuntar un asset zip llamado `<modId>-<version>.zip` a cada GitHub Release, con el `manifest.json` en la raíz del zip (o envuelto en una sola carpeta top-level — el installer la elimina automáticamente).
5. Cargar limpiamente en la última versión de Maker Studio (prueba soltando la carpeta descomprimida en `%APPDATA%/maker-studio/Mods/` y reiniciando).

Recomendado:

- Coloca [`templates/publish.yml`](../../templates/publish.yml) en tu repo de mod en `.github/workflows/publish.yml`. Construye el zip, calcula el SHA-256, adjunta ambos como assets de release e imprime el bloque exacto de `index.json` que necesitas para el PR.
- Parte de una de las carpetas de [`examples/mods/`](../../examples/mods/) — la forma más rápida de aprender la API y evitar errores comunes.
- Proporciona un cuerpo de release-notes claro — se convierte en el changelog que se muestra a los usuarios.
- Proporciona un icono (PNG de 64×64) alojado en tu repo o como asset de release.
- Declara cada capacidad que uses en el array `permissions` del manifest. Los usuarios ven la lista antes de instalar — el uso no declarado es una bandera roja.

## 1 — El repo de tu mod

Tu mod necesita un `manifest.json` y al menos un archivo JavaScript. Un layout típico de repo:

```
ms-my-mod/
├── manifest.json
├── index.js
├── README.md
└── (cualquier asset que necesites)
```

### Mínimo de `manifest.json`

```json
{
  "id": "com.yourname.mymod",
  "name": "My Mod",
  "version": "1.0.0",
  "apiVersion": "1.0.0",
  "main": "index.js",
  "authors": [{ "name": "Your Name", "url": "https://your-site-or-handle" }],
  "description": "What it does in one sentence.",
  "permissions": ["ui.toasts"]
}
```

Reglas de campos:

| Campo | Requerido | Notas |
|-------|-----------|-------|
| `id` | sí | Reverse-DNS, permanente. No puede cambiar una vez publicado |
| `name` | sí | Se muestra en el Mod Manager y en las tarjetas del Marketplace |
| `version` | sí | Semver. Debe coincidir con el tag de release (sin la `v` inicial) |
| `apiVersion` | sí | Mod API mínima que tu mod necesita — la versión que introdujo la API más nueva que llama. Los editores anteriores se niegan a instalarlo o cargarlo |
| `main` | sí | Ruta relativa al entry JS. Sin `..` ni rutas absolutas |
| `authors` | recomendado | Array de `{ name, url? }`. Se muestran como enlaces clicables |
| `description` | recomendado | Las descripciones largas se truncan en la tarjeta |
| `homepage` | opcional | Homepage del mod, separada de la URL del autor |
| `dependencies` | opcional | `{ "other.mod.id": "^1.0.0" }` — el loader hace topo-sort |
| `permissions` | opcional | Consulta [Permisos](#permisos) más abajo |

### Archivo entry del mod

Un mod exporta una función `activate(ctx)` y opcionalmente `deactivate()`:

```js
export function activate(ctx) {
  ctx.log.info("My Mod loaded");

  ctx.ui.showToast({ message: "Hello!" });

  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "My Mod — Do Thing",
    handler: () => ctx.ui.showToast({ message: "Did the thing." }),
  });
}

export function deactivate() {
  // Los Disposables registrados vía ctx se limpian solos. Nada más que hacer.
}
```

El argumento `ctx` expone la API completa del editor: `editor`, `map`, `tileset`, `events`, `tools`, `menu`, `commands`, `ui`, `bus`, `fs`, `storage`, `log`, `lifecycle`, `stats`, `keybinds`, `selectors`, `projectData`.

Dos formas de aprenderla:

- Lee los mods de ejemplo incluidos en [`examples/mods/`](../../examples/mods/) — cada carpeta trae un README con recorrido que explica qué superficie de API usa.
- Lee la documentación de referencia de la API en la carpeta `docs/` —[api-reference.md](../api-reference.md), [events-reference.md](../events-reference.md), [quick-reference.md](../quick-reference.md). Para autocompletado en el IDE, coloca [mod-api.d.ts](../mod-api.d.ts) junto a tu `index.js`.

### Permisos

Se declaran en `manifest.json#permissions`. Los usuarios ven la lista antes de instalar.

| Permiso | Qué concede |
|---------|-------------|
| `fs.mod` | Leer/escribir dentro de la carpeta del propio mod |
| `fs.project` | Leer assets del proyecto (carpeta del juego) |
| `fs.write.project` | Escribir dentro del proyecto (modificar datos del juego) |
| `events.cancel.save` | Cancelar operaciones de guardado vía el evento `save.before` |
| `ui.dialogs` | Mostrar diálogos |
| `ui.toasts` | Mostrar toasts |

Declara cada permiso que uses realmente. El uso no declarado es una bandera roja para revisores y usuarios.

## 2 — Convención de release

Cada release en tu repo debe seguir estas reglas:

- **Git tag**: `vX.Y.Z` (semver). Ejemplo: `v1.2.0`.
- **`manifest.json#version`** debe coincidir con el tag sin la `v` inicial. Si no coinciden, el editor se niega a instalar.
- **Asset zip**: llamado `<modId>-<version>.zip`. Ejemplo: `com.yourname.mymod-1.2.0.zip`. El registro fija este nombre exacto — los typos son un fallo de instalación en seco.
- **Layout del zip**: el `manifest.json` vive en la raíz del zip. Puedes zipear el contenido de tu carpeta de mod directamente, o zipear la carpeta misma — el installer elimina automáticamente una sola carpeta top-level.
- **SHA-256**: el editor se niega a instalar bytes que no coincidan con el SHA-256 que fija tu entrada del registro. Calcúlalo después de construir el zip — `sha256sum <modId>-<version>.zip` en macOS/Linux, `Get-FileHash <modId>-<version>.zip -Algorithm SHA256` en Windows.
- **Cuerpo del release**: este markdown se convierte en el changelog que se muestra en la tarjeta del Marketplace.

### Construir el zip en Windows

```powershell
Compress-Archive -Path manifest.json,index.js,README.md -DestinationPath com.yourname.mymod-1.2.0.zip
Get-FileHash com.yourname.mymod-1.2.0.zip -Algorithm SHA256
```

### Construir el zip en macOS/Linux

```bash
zip -r com.yourname.mymod-1.2.0.zip manifest.json index.js README.md
sha256sum com.yourname.mymod-1.2.0.zip
```

Prueba antes de publicar: descomprime en `%APPDATA%/maker-studio/Mods/com.yourname.mymod/`, reinicia el editor, confirma que el mod carga en el Mod Manager.

## 3 — Automatizar releases con GitHub Actions

El registro trae un workflow listo para usar en [`templates/publish.yml`](../../templates/publish.yml). Colócalo en tu repo de mod en `.github/workflows/publish.yml` y hace todo el baile del lado del release por ti:

1. Se dispara cuando pusheas un tag que coincide con `v*.*.*`.
2. Lee `manifest.json#version` y se niega a continuar si no coincide con el tag.
3. Zipea el repo (excluyendo `.git`, `.github`, zips existentes) como `<modId>-<version>.zip`.
4. Calcula `sha256sum`, escribe un `SHA256SUMS.txt`.
5. Crea el GitHub Release para el tag y sube ambos archivos como assets.
6. Imprime el bloque exacto de 3 líneas (`"version"`, `"assetName"`, `"sha256"`) que pegas en el PR de tu entrada del registro.

El `GITHUB_TOKEN` por defecto basta — no hay secrets extra que configurar. Hay un job de seguimiento opcional comentado en el template que abre automáticamente el PR al registro si configuras un secret `REGISTRY_PAT` — ver el paso 4.

## 4 — Listarse en el registro

Publica el primer GitHub Release en tu repo de mod (pushea el tag `v1.0.0`). Si copiaste el Action del template, construye el zip y calcula el SHA-256 automáticamente; si no, ejecuta `sha256sum <modId>-1.0.0.zip` tú mismo.

Luego abre un PR que añada una entrada al array `mods` en [`index.json`](../../index.json):

```json
{
  "id": "com.yourname.mymod",
  "name": "My Mod",
  "authors": [{ "name": "Your Name", "url": "https://your-site-or-twitter" }],
  "repo": "your-github-handle/ms-my-mod",
  "version": "1.0.0",
  "assetName": "com.yourname.mymod-1.0.0.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "description": "One-line pitch of what the mod does.",
  "tags": ["tools", "ui"],
  "icon": "https://raw.githubusercontent.com/your-github-handle/ms-my-mod/main/icon.png",
  "homepage": "https://your-site-or-twitter",
  "minStudioVersion": "2.0.0",
  "apiVersion": "1.0.1"
}
```

Omite `icon`, `homepage`, `minStudioVersion`, `tags` si no aplican. `id`, `name`, `authors`, `repo`, `version`, `assetName`, `sha256` son obligatorios — el editor no instalará sin ellos.

Mantén `apiVersion` idéntica a la de tu `manifest.json` (el job automático de PR la copia por ti). El editor la lee de la tarjeta y bloquea Install / Update cuando ofrece una Mod API más antigua, así que un valor demasiado alto esconde tu mod de editores que sí podrían ejecutarlo, y uno demasiado bajo deja pasar la instalación solo para que el mod acabe como `error` en el Mod Manager.

Tres formas de abrir el PR:

- **Automática:** activa el job `registry-pr` del Action de plantilla (forkea el registro, añade un secret `REGISTRY_PAT` y pon tu `FORK_OWNER`). A partir de ahí cada release abre el PR por ti — añadiendo esta entrada la primera vez y actualizando `version`/`assetName`/`sha256` después. Rellena todos los campos desde tu `manifest.json`, incluidos los `tags`; `icon` y `minStudioVersion` los añadimos nosotros al revisar.
- **La más fácil (sin git local):** abre [`index.json`](../../index.json) en github.com → icono de lápiz → pega tu entrada en el array `mods` (incluyendo `version`, `sha256` y `assetName` de tu release) → **Propose changes** → PR cross-repo. Actualiza también `updatedAt` al timestamp ISO-8601 actual.
- **Fork local (power users / varios mods):**

  ```powershell
  gh repo fork Toskan4134/maker-studio-mods --clone --remote
  cd maker-studio-mods
  git checkout -b add-my-mod
  # edita index.json igual que arriba
  git add index.json
  git commit -m "add: com.yourname.mymod"
  git push origin add-my-mod
  gh pr create --fill
  ```

El template del PR te pide confirmar: probado en el último editor, sin código ofuscado, permisos justificados, hash que coincide con el zip de release. Rellénalo.

Una vez mergeado, tu mod está vivo en una hora para todo el que use el Marketplace.

## 5 — Publicar una actualización

Cada nueva versión necesita un PR al registro — esta es la frontera de seguridad (consulta la [introducción](#publicar-un-mod) para ver por qué importa el pin).

Por cada nueva versión:

1. Sube `manifest.json#version` (p. ej. `1.2.0` → `1.2.1`).
2. Commitea, taguea `v1.2.1`, pushea el tag. Si copiaste el Action del template, construye, hashea y publica el GitHub Release automáticamente.
3. Abre un PR aquí que **solo cambie `version`, `assetName` y `sha256`** en tu entrada. El Action imprime el diff exacto a copiar.
4. Tras el merge, los usuarios ven la actualización en su próxima comprobación (en ~1 hora). Hasta el merge, los usuarios siguen instalando la versión aprobada previamente — esa es la garantía de seguridad, no un bug.

## 6 — Eliminar o renombrar un mod

Si abandonas un mod o quieres retirarlo: abre un PR a este repo eliminando tu entrada de `index.json`. El mod deja de aparecer en el Marketplace, pero quien ya lo tuviera instalado lo conserva hasta que lo desinstale manualmente.

Si quieres renombrar o reestructurar: **no puedes cambiar el `id`**. Publica bajo un id nuevo y pide a los usuarios que migren. Las instalaciones antiguas del id antiguo no se ven afectadas.

## 7 — Lo que ven los usuarios

Cuando alguien pulsa **Install** en tu mod ve:

- Tu icono, nombre y autor.
- Un chip **Verified** si los maintainers de este registro han marcado el mod como curado (independiente de la integridad — el pin SHA-256 siempre aplica).
- La lista exacta de capacidades que declara el array `permissions` de tu manifest.
- Un botón Cancel / Install.

Mantén tus `permissions` al mínimo — cada permiso extra asusta a los usuarios.

## 8 — Errores comunes

- **El tag no coincide con la versión del manifest** → el installer se niega. `manifest.json#version` debe igualar el tag sin la `v`.
- **El zip envuelve todo en una carpeta profunda** → solo se elimina automáticamente el wrapping de un nivel. No zipees `Documents/my-mod/manifest.json`.
- **`assetName` en el registro no coincide con el asset real del release** → la instalación falla con "release has no asset named ...".
- **El SHA-256 en el registro no coincide con el zip subido** → la instalación falla con "sha256 mismatch". Recalcula después de cada rebuild.
- **Pusheaste un tag nuevo pero olvidaste el PR al registro** → los usuarios no verán la nueva versión. Por diseño.
- **`manifest.id` no coincide con lo que hay en `index.json`** → el installer rechaza con "manifest id mismatch".

## Motivos de rechazo

Los PR pueden rechazarse por:

- El mod no carga en el último Maker Studio.
- `sha256` en el PR no coincide con el asset real del release en GitHub.
- JS ofuscado o minificado sin fuente.
- Llamadas de red ocultas a dominios desconocidos.
- Los permisos del manifest no coinciden con lo que el código usa realmente.
- Nombre/descripción engañosos.
- Conflictos de licencia (tu repo de mod debe estar disponible abiertamente; el mod mismo puede ser cualquier licencia OSI).
