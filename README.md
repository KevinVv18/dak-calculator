# Calculadora DAK

`plan.dakagency.net` — el prospecto arma su presupuesto y ve, por separado, **lo que se paga una
vez** y **lo que se paga cada mes**.

Sitio estático desplegado en Vercel. **No hay paso de build**: lo que está en el repo es lo que se
sirve.

## Por qué dos cifras y no una

DAK vende separando el dinero en capas y diciéndolo en voz alta: la pauta se paga directo a Meta, el
honorario mensual va a la agencia, y los activos —web, dominio, identidad— son pago único. Sus
informes de marca lo repiten: la web «es un activo, no un servicio mensual».

Hasta septiembre de 2026 esta calculadora sumaba las dos cosas en un único TOTAL FINAL, así que una
web de S/ 2.500 que se paga una vez y una gestión de ads de S/ 300 al mes salían como el mismo
número. Contradecía al informe que el prospecto acababa de leer. Ahora no.

## Estructura

    index.html          la calculadora
    agendar.html        la pantalla de agendar, enlazada aparte desde la web y el chat
    css/tokens.css      el sistema: color con sus ratios, tipografía, espaciado, movimiento
    css/base.css        reset, Poppins autoalojada, superficies del navegador
    css/cotizacion.css  el mundo visual
    js/comun.js         utilidades que usan las dos superficies
    js/data.js          catálogo y precios. Aquí y en ningún otro sitio
    js/calendario.js    el calendario, compartido por las dos superficies
    js/calculator.js    la calculadora
    js/agendar.js       arranque de agendar.html
    js/config.public.js claves de EmailJS. Son públicas por diseño y SÍ van al repo
    api/                funciones serverless de Google Calendar
    verificacion/       la red de regresión

Las decisiones visuales están en `DESIGN.md`, que se subordina al `DESIGN.md` de la web principal.
La verdad de producto, en `PRODUCT.md`.

## Desarrollo

No hace falta build. Cualquier servidor estático sobre la raíz vale; `.claude/launch.json` usa el
puerto 3456, que está en la lista blanca de CORS de `api/`.

El **modo admin** —multiplicador por perfil y ajuste de precios— necesita `config/credentials.js`,
que está en `.gitignore` y **nunca se despliega**. Es decir: solo funciona en local, a propósito.
Copiá `config/credentials.example.js` para tenerlo.

Ojo: comparar usuario y contraseña en JavaScript de cliente **no es seguridad**. Cualquiera que abra
el inspector las ve. Es un obstáculo cosmético para que nadie toque los precios por accidente.

## Verificación

No hay tests. Lo que hay es una red de regresión, y hay que usarla:

- `verificacion/oraculo.js` — siete escenarios de cálculo con su total. Se pega en la consola del
  navegador con la calculadora abierta. El invariante es que `único + mensual` siga dando
  exactamente el mismo total que antes del split, al céntimo.
- `verificacion/estados.md` — 39 estados de paridad funcional para repasar antes de mergear.

## Cambiar precios

Solo en `js/data.js`. Los importes no viven en ningún otro sitio.

La **recurrencia** (`recurrencia: "mensual"`) va en el descriptor de `CATEGORIAS`, nunca dentro de
`PRECIOS_FIJOS` ni `SERVICIOS_BASE`: `getConfig()` hace un merge superficial por clave y
`aplicarAjustes()` persiste el `CONFIG` entero, así que un campo nuevo ahí dentro se perdería en
cualquier navegador con precios guardados y el servicio volvería a «único» sin avisar.

Si se añade un servicio con niveles, no hay que tocar nada más: la lista del modal de ajustes se
deriva de `CATEGORIAS`.
