# Estados a comprobar en cada fase

Lista de paridad funcional del rediseño. El aspecto cambia; el comportamiento no.
Se repasa entera al cerrar cada fase. Complementa a `oraculo.js`, que cubre los números.

Servidor local: `node <scratchpad>/servidor-calculadora.cjs` → http://localhost:3456
Modo admin: solo funciona en local. `config/credentials.js` está en `.gitignore` y **da 404 en
producción**, así que en `plan.dakagency.net` el admin no existe.

## Calculadora (`index.html`)

| # | Estado | Qué tiene que pasar |
|---|---|---|
| 1 | Vacío | Sidebar muestra el estado vacío, total S/ 0, ningún bloque de recurrencia |
| 2 | Solo servicios de pago único | Aparece solo el bloque «Pago único». **Nunca un «S/ 0 /mes»** |
| 3 | Solo servicios mensuales | Aparece solo el bloque «Al mes» |
| 4 | Mixto | Los dos bloques, cada uno con su total, sin cifra combinada dominante |
| 5 | Servicio con tiers | Segmentado básico/avanzado cambia el precio; el stepper suma y resta |
| 6 | Cantidad escrita a mano | Aceptar el valor al escribir; corregir vacío o < 1 al perder el foco |
| 7 | Extras | Los 4 factores suman **siempre al bloque de pago único** |
| 8 | Ítem personalizado | Se añade con nombre, precio y recurrencia; se puede borrar |
| 9 | Borrar desde el sidebar | La × deselecciona la tarjeta del catálogo y recalcula |
| 10 | Tooltip ⓘ | Legible con ratón **y en táctil** |
| 11 | Envío de cotización | Email válido exigido; llega a DAK (no al buzón del prospecto) |
| 12 | Cooldown de envío | No se puede spamear el botón |
| 13 | Admin: login | Credenciales correctas muestran perfil, ajustes y logout |
| 14 | Admin: perfil | ×1.0 / ×1.2 / ×1.5 aplican a los **dos** bloques y aparece la fila de perfil |
| 15 | Admin: ajustes | Editar un precio, aplicar, y ver el cambio reflejado |
| 16 | Admin: restaurar | Vuelve a los valores de `data.js` |
| 17 | Admin: logout | Se ocultan perfil y ajustes; el toggle de «aproximado» se bloquea |
| 18 | No admin: toggle bloqueado | Aparece el aviso de permisos, no cambia el estado |

## Agendar (overlay y `agendar.html`)

| # | Estado | Qué tiene que pasar |
|---|---|---|
| 19 | Cargando | Spinner mientras se pide `/api/disponibilidad` |
| 20 | Error de red | Mensaje claro y botón de reintentar |
| 21 | Calendario | Cambio de mes; días sin hueco deshabilitados |
| 22 | Día elegido | Se listan las horas de ese día |
| 23 | Hora elegida | Se habilita «Confirmar» y aparece el resumen |
| 24 | Reserva real | Se crea el evento en Google Calendar y llega el enlace de Meet |
| 25 | `agendar.html` standalone | Funciona sin venir de la calculadora |
| 26 | `agendar.html?embed=1` | Modo incrustado + `postMessage` al padre |
| 27 | Params de la selección | Llegan nombre, email, servicios, `total_unico` y `total_mensual` |

## Responsive y accesibilidad

| # | Estado | Qué tiene que pasar |
|---|---|---|
| 28 | 375×812 | Las 6 categorías colapsadas **caben en una pantalla** |
| 29 | Primera categoría | Abierta por defecto en móvil |
| 30 | Barra flotante móvil | Dos cifras, etiquetas ≥ 11px, área táctil 44×44 |
| 31 | Objetivos táctiles | Ninguno bajo 24×24 |
| 32 | Tamaño de texto | Nada de texto funcional bajo 11px |
| 33 | Teclado | Foco visible y recorrido completo sin ratón |
| 34 | `prefers-reduced-motion` | Se detiene toda animación decorativa |
| 35 | Contraste | AA contando el alpha |

## Red y consola

| # | Estado | Qué tiene que pasar |
|---|---|---|
| 36 | Consola | Cero errores en carga y en interacción |
| 37 | CSP | Cero violaciones |
| 38 | Terceros | Ninguna petición a `cdn.tailwindcss.com` ni a Google Fonts |
| 39 | Poppins | Cargada de verdad (`document.fonts`), no el fallback del sistema |
