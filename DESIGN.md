---
name: Calculadora DAK
description: La cotización escribiéndose delante del prospecto, no una página de precios.
colors:
  mesa: "#E4E0EB"
  fondo: "#E4E0EB"
  hoja: "#FFFFFF"
  hoja-honda: "#F4F1F8"
  hoja-alta: "#F3EBFC"
  morado: "#7A00C2"
  morado-tinta: "#6D00AF"
  morado-claro: "#9B2BE0"
  teal: "#00625F"
  alarma: "#B4003C"
  logro: "#0A6B45"
  tinta: "#14101C"
  tinta-2: "rgba(20, 16, 28, .70)"
  tinta-3: "rgba(20, 16, 28, .64)"
  tinta-tenue: "rgba(20, 16, 28, .40)"
  filete: "rgba(20, 16, 28, .14)"
  filete-medio: "rgba(20, 16, 28, .26)"
  filete-vivo: "rgba(185, 62, 255, .45)"
typography:
  display:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(28px, 4.4vw, 52px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.02em"
  headline:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.02em"
  title:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.02em"
  cifra:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.02em"
  body:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: ".14em"
rounded:
  nada: "0"
  min: "2px"
  base: "4px"
  caja: "6px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "20px"
  e6: "24px"
  e8: "32px"
  e10: "40px"
  e14: "56px"
components:
  accion-principal:
    backgroundColor: "{colors.morado}"
    textColor: "#ffffff"
    rounded: "{rounded.base}"
    padding: "0 20px"
    height: "44px"
    typography: "{typography.body}"
  accion-principal-hover:
    backgroundColor: "{colors.morado-claro}"
    textColor: "#1A0033"
  accion-segunda:
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.base}"
    padding: "0 20px"
    height: "44px"
  accion-segunda-hover:
    textColor: "{colors.tinta}"
  partida:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.nada}"
    padding: "12px 12px 12px 8px"
    height: "44px"
  partida-activa:
    backgroundColor: "{colors.hoja-alta}"
    textColor: "{colors.tinta}"
  hoja:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.caja}"
    width: "400px"
  hoja-totales:
    backgroundColor: "{colors.hoja-alta}"
    textColor: "{colors.tinta}"
    padding: "16px 20px"
  campo-texto:
    backgroundColor: "{colors.hoja-honda}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.base}"
    padding: "8px 12px"
    height: "40px"
    typography: "{typography.body}"
  sello:
    textColor: "{colors.morado-tinta}"
    rounded: "{rounded.min}"
    padding: "3px 10px"
    typography: "{typography.label}"
  etiqueta-mes:
    textColor: "{colors.teal}"
    rounded: "{rounded.min}"
    padding: "0 5px"
    typography: "{typography.label}"
---

# Design System: Calculadora DAK

> **Subordinado.** Este mundo hereda de `DAK_WP/DESIGN.md`, el documento de
> `dakagency.net`, que **manda sobre esta superficie**. Su sección «Lo que este
> mundo NO es» rige aquí entera y no se repite abajo: nada de cuadrícula tileada
> de fondo, texto con degradado, bordes de acento laterales de más de 1px, rebote
> elástico, animar `width`/`max-height`/`margin`, ni halos de color sin
> desplazamiento haciendo de sombra. Lo que sigue solo añade lo que esta
> superficie resolvió aparte.
>
> Describe **lo construido**, no lo deseado. Donde hay deuda, se dice que es deuda.

## Overview
> **Revisión del 2026-09-04, tarde.** El mundo nació con fondo casi negro porque el
> sistema padre lo pide, y el resultado se parecía demasiado a lo que había antes:
> «fondo negro con morado encima» y sensación de plantilla generada. Dos cosas lo
> causaban y las dos están corregidas. Una, un  morado haciendo de
> luz ambiental: el mismo truco que los orbes, más disimulado, y la firma más clara
> del fondo generado. Dos, cero material: se declaró un mundo de documento y se
> renderizó con rellenos planos.
>
> Ahora es **papel sobre escritorio**, que además es lo que la dirección pedía desde
> el principio: una cotización es de papel, y el fondo oscuro venía de la marca, no
> del mundo. El morado y el teal se bajaron hasta que aguantan AA sobre blanco; el
>  de marca da 3.2 sobre papel y no vale ni para texto grande.


**Creative North Star: «La cotización»**

Esta superficie no es una página de precios. Es el documento de cotización
escribiéndose delante del prospecto mientras elige. De ahí sale todo lo demás:
las esquinas casi rectas, la estructura por filetes de 1px en vez de cajas con
fondo, los importes siempre pegados al borde derecho, el sello en lugar de una
insignia. La categoría entera vende con rejilla de tarjetas de plan y un
interruptor mensual/anual; aquí eso está rechazado por tesis, porque mezclar un
activo de pago único con una gestión mensual en una sola cifra es la confusión
que el producto existe para deshacer.

La composición es de dos columnas: a la izquierda el catálogo como **índice de
partidas regladas**, a la derecha **la hoja**, un panel de 400px pegado al scroll
con folio, bloques y totales. Papel sobre escritorio, densa y de alto contraste. El color aparece
poco y siempre significa algo: el morado es acción y marca, el teal es una unidad
de medida —«cada mes»— y nunca decoración.

Hay una segunda razón, material, detrás de casi cada decisión: el dueño del
negocio va a darle a «Guardar en PDF». Los navegadores no imprimen fondos salvo
que se marque la casilla de gráficos, y esa casilla no la controlamos. Todo lo que
tiene que sobrevivir a la impresión está hecho con filete y borde, nunca con
relleno.

**Key Characteristics:**
- Documento, no vitrina: filas regladas y filetes de 1px como recurso estructural.
- Dos cifras separadas, nunca una combinada dominante.
- Importes alineados a la derecha, sin excepción.
- Radios de 0 a 6px. Nada redondo.
- Una sola curva de movimiento y un solo momento animado.
- Poppins autoalojada, sin segunda familia.

## Colors

Paleta heredada de `dakagency.net` y reorganizada por **planos**: el escritorio,
la hoja y lo hundido dentro de la hoja. Los ratios están medidos contando el
alpha, que es la regla dura del sistema padre.

### Primary
- **Morado DAK** (`morado`): superficies, bordes, casillas marcadas, día y hora
  elegidos, botón principal. Da 4.49:1 sobre el fondo, así que **no vale como
  texto**.
- **Morado tinta** (`morado-tinta`): el mismo tono ya legible (5.14:1). Es el
  único morado que puede llevar letra: iconos de sección, sello REFERENCIAL,
  cursor de texto y anillo de foco.
- **Morado claro** (`morado-claro`): solo el hover del botón principal, donde el
  texto se invierte a `#1A0033`.

### Secondary
- **Teal** (`teal`): la segunda luz, y aquí tiene un trabajo semántico exacto:
  marca la recurrencia. Rótulo del bloque mensual, su cifra, la etiqueta `/MES`,
  la barra fija del móvil y el aviso de coste recurrente. En ningún otro sitio.

### Tertiary
- **Alarma** (`alarma`): notas de error y el hover del botón de quitar una línea.
- **Logro** (`logro`): notas de éxito y el sello OFICIAL del modo admin.

### Neutral
- **Escritorio** (`mesa`): gris con un punto de violeta. NO lleva ninguna luz
  radial anclada arriba a la izquierda, al 10% de morado.
- **Hoja** (`hoja`): el papel. Tiene que despegarse del escritorio.
- **Hoja honda** (`hoja-honda`): campos, pies de ventana y detalle desplegado.
- **Hoja alta** (`hoja-alta`): fila activa y bloque de totales.
- **Tinta** (`tinta`, `tinta-2`, `tinta-3`): texto principal, secundario y suelo.
- **Tinta tenue** (`tinta-tenue`): 3.15:1. **Nunca texto**; solo filetes y el
  icono del estado vacío.
- **Filetes** (`filete`, `filete-medio`, `filete-vivo`): la estructura entera.

### Named Rules
**La regla del alpha.** El contraste se calcula contando la opacidad. `tinta-3` es
el suelo de texto del sistema; por debajo se pintan filetes, no letras.

**La regla del teal.** El teal significa «cada mes». Si un elemento no habla de
recurrencia, no lleva teal.

**La regla del filete.** La estructura la llevan líneas de 1px, no cajas con
fondo. Un fondo puede desaparecer al imprimir; una línea no.

## Typography

**Familia única:** Poppins, autoalojada en 400/600/700, solo subconjunto latin.
Sin serif, sin mono, sin segunda familia de display. Lo dice el sistema padre y
aquí se cumple aun cuando duele.

**Character:** geométrica y compacta. El énfasis lo dan el peso y el tamaño, nunca
un segundo tipo ni un degradado.

### Hierarchy
- **Display** (700, `clamp(28px, 4.4vw, 52px)`, 1.15, `-.02em`): el único `h1`, la
  promesa de la portada. Limitado a 18ch para que no se convierta en párrafo.
- **Headline** (700, 19px): el título de la hoja y de las ventanas modales.
- **Title** (700, 16px): nombre de categoría en el catálogo.
- **Cifra** (700, 26px): los dos totales y la suma de cada bloque.
- **Body** (400/600, 14px, 1.55): filas de partida, botones, campos. La bajada de
  portada sube a 16px y se limita a 62ch.
- **Label** (600, 11px, `.14em`, mayúsculas): rótulos de bloque, de campo, cuenta
  de sección, folio y sellos. 11px es el suelo absoluto de texto funcional.

### Named Rules
**La regla del borde derecho.** Poppins **no tiene cifras tabulares**: su «1» mide
12,8px y su «0» 25,13px, y `font-variant-numeric: tabular-nums` no lo arregla
porque el subconjunto latin no trae la característica. Como meter una segunda
familia solo para las cifras está prohibido por el sistema padre, la columna de
importes se sostiene con `min-width: 104px` y `text-align: right`. La declaración
`tabular-nums` se queda por si algún día el subconjunto la trae, pero **no es lo
que alinea nada**. Es deuda declarada, no un logro.

**La regla del calificador aparte.** «desde» no es parte del importe: va en su
propia línea, a 11px y en `tinta-3`, para que todas las cifras empiecen en el
mismo sitio.

**La regla del suelo.** Texto funcional nunca por debajo de 11px. Sin excepciones.

## Layout

Rejilla de dos columnas, `minmax(0, 1fr) 400px`, con 40px de separación y ancho
máximo de 1460px. La columna derecha es `sticky` a 78px con
`max-height: calc(100vh - 88px)` y scroll propio: la hoja no se va de la pantalla
mientras se elige.

El ritmo de espaciado es base 4 (4/8/12/16/20/24/32/40/56). El padding interno de
la hoja y de sus bloques es 20px; el de las filas del catálogo, 12px.

**Responsive.** A 1080px la rejilla colapsa a una columna y la hoja deja de ser
`sticky`. A 720px aparece la **barra fija inferior** con las dos cifras y el botón
de agendar, y las cabeceras de sección se convierten en una lista con filete
inferior y 48px de alto —antes eran seis títulos flotando en casi mil píxeles de
vacío, porque el margen seguía ahí con el cuerpo plegado—.

**Impresión.** `@media print` apaga cabecera, barra, pie de la hoja y la columna
del catálogo; el cuerpo pasa a fondo blanco y tinta negra, la hoja pierde sombra y
el sello pasa a borde negro.

### Named Rules
**La regla del pliegue.** Las dos cifras viven **fijas encima de las acciones**, no
dentro de sus bloques. El contrato de dirección pedía «dos bloques cerrados con su
total», y así se construyó primero: dentro del scroll quedaban por debajo del
pliegue, que era justo el defecto a corregir. Repetir la cifra dentro del bloque en
un panel de 400px es ruido. Cada bloque conserva su suma; los totales que mandan
están anclados.

**La regla del área táctil.** 44×44 donde el espaciado lo permite; nunca por debajo
de 24×24. Las filas de partida tienen `min-height: 44px`.

## Elevation & Depth

Sistema **tonal con tres sombras contadas**. La profundidad la hacen los planos de
superficie y los filetes; la sombra solo aparece donde algo flota de verdad sobre
otra cosa.

### Shadow Vocabulary
- **Hoja** (`box-shadow: 0 18px 48px -14px rgba(0,0,0,.8)`): la hoja y las ventanas
  modales.
- **Flotante** (`box-shadow: 0 -8px 28px -10px rgba(0,0,0,.7)`): la barra fija del
  móvil, proyectando hacia arriba.
- **Botón principal** (`box-shadow: 0 8px 22px -10px rgba(176,36,255,.9)`): la
  única sombra de color del sistema. Lleva 8px de desplazamiento y 22px de
  desenfoque, así que es profundidad y no halo.

**Desenfoque de fondo.** `backdrop-filter: blur()` en tres sitios y solo tres:
cabecera pegajosa (10px), barra fija del móvil (12px) y velo de modal (4px).

### Named Rules
**La regla del desplazamiento.** Toda sombra lleva offset y desenfoque. Un halo
centrado no es profundidad.

**La regla de la impresión.** Nada estructural puede depender de un fondo. Si al
quitar todos los rellenos el documento deja de leerse, está mal construido.

## Shapes

Un documento tiene bordes, no burbujas. La escala de radios llega a 6px y ahí se
acaba: 0 para las filas del catálogo y los bloques, 2px para casillas, sellos y
anillo de foco, 4px para botones, campos y celdas del calendario, 6px para la hoja
y las ventanas. Nada de píldoras salvo el pulgar de la barra de scroll.

Los contenedores agrupados —el contador de cantidad, el selector de niveles— se
dibujan como una caja con filete exterior y divisiones internas de 1px, como una
tabla, no como botones sueltos.

**Iconos:** SVG dibujados a mano en un `<defs>` inline, `stroke-width: 1.5`,
extremos redondeados, 18px por defecto. Un solo grosor en toda la superficie.
Sustituyen a Material Symbols (cientos de KB por quince glifos, y las ligaduras se
veían como palabras sueltas antes de cargar) y a los emoji, que no son un sistema
de iconos.

### Named Rules
**La regla del acento en 1px.** Los acentos laterales existen —la fila activa lleva
morado a la izquierda— y miden exactamente 1px, el máximo que permite el sistema
padre. La fila inactiva reserva ese 1px transparente para que no salte el layout.

## Components

### Buttons
- **Forma:** radio de 4px, alto mínimo 44px, peso 700, icono y texto centrados.
- **Principal** (`.accion--principal`): fondo morado, texto blanco, sombra de color
  con desplazamiento. En hover pasa a morado claro y el texto se invierte a
  `#1A0033` para conservar contraste. Es «Agendar la reunión».
- **Segunda** (`.accion--segunda`): sin fondo, filete medio de 1px, tinta
  secundaria. En hover el borde se vuelve morado y la tinta sube.
- **Estado activo:** `translateY(1px)`. Es el único desplazamiento de pulsación.
- **Deshabilitado:** opacidad .4 y cursor `not-allowed`. No se cambia el color.
- **Botón de icono:** cuadrado de 44px, radio 4px, tinta al suelo; en hover sube la
  tinta y aparece un fondo blanco al 6%.

### Chips
- **Etiqueta `/MES`:** teal sobre transparente con filete teal al 45%, radio 2px,
  11px en mayúsculas. Marca recurrencia, nunca otra cosa.
- **Sello:** rotado −4°, **borde y nunca fondo**, radio 2px. `REFERENCIAL` en
  morado tinta; `OFICIAL` en verde logro, solo en modo admin.

### Cards / Containers
No hay tarjetas. Hay **la hoja** y hay **ventanas**.
- **La hoja:** fondo `hoja`, filete medio de 1px, radio 6px, sombra de hoja, 400px,
  columna flex con encabezado, cuerpo con scroll, totales fijos y pie.
- **Ventanas modales:** mismo material, ancho `min(640px, 100%)` —o 400px en la
  variante angosta—, `max-height: min(84vh, 760px)`, cabecera y pie con filete y
  fondo hundido, velo negro al 80% con desenfoque de 4px.
- **Panel de agenda:** fondo `hoja`, filete, radio 6px, **sin sombra**. Vive dentro
  de una superficie a pantalla completa y no flota sobre nada.

**Los totales viven fuera de sus bloques, y es deliberado.** El contrato de
dirección decía «dos bloques cerrados con su total», y la construcción se apartó de
eso a propósito. Dentro del scroll del cuerpo, los dos totales quedaban por debajo
del pliegue: con una selección mixta no se llegaba a ver la cifra mensual sin
desplazar, que es justo la mitad de la tesis. Ahora `hoja__totales` está fijo entre
el cuerpo y el pie, y lo que se desplaza es el detalle.

No se repite el subtotal dentro de cada bloque. Los rótulos «Se paga una vez» y
«Se paga cada mes» mapean uno a uno con las cabeceras `PAGO ÚNICO` y `CADA MES`, y
son contiguos: en un panel de 400px, decir la misma cifra dos veces es ruido, no
cierre.

**Las dos casillas existen antes del primer clic**, con una raya en vez de importe.
Enseñan el reparto a quien acaba de llegar. Una raya dice «todavía no»; un `S/ 0`
diría «cuesta cero», que es falso y lo prohíbe el principio 2 de PRODUCT.md.


### Inputs / Fields
- **Campo de texto:** fondo hundido, filete medio de 1px, radio 4px, alto mínimo
  40px. En foco el borde pasa a morado y se retira el outline por defecto.
- **Campo de cifra:** 110px de ancho y alineado a la derecha, por la misma regla del
  borde derecho.
- **Contador:** caja con filete, dos botones de 36px y un valor de 46px separados
  por filetes internos. Las flechas nativas del `number` se quitan.
- **Casilla de partida:** cuadrado dibujado de 18px con filete y radio 2px; al
  marcarse se rellena de morado y aparece el check. No es un checkbox del sistema.
- **Anillo de foco:** `outline: 2px solid` morado tinta con `outline-offset: 2px` y
  radio 2px, sobre todo lo enfocable. Está definido una vez en `base.css`, no por
  componente.

### Navigation
Cabecera `sticky` con fondo del escritorio al 88% y desenfoque de 10px, filete
inferior de 1px. Logo DAK a 26px, separador vertical de 1px y la palabra
«Calculadora» a 12px en mayúsculas espaciadas. A la derecha solo botones de icono.
No hay menú.

### La partida (componente firma)
Una fila del catálogo es **una línea del documento**: rejilla de `18px | 1fr | auto`
alineada a la línea base, filete inferior de 1px, 44px de alto mínimo. Casilla a la
izquierda, nombre en el centro, importe a la derecha con `min-width: 104px`. El pie
de la fila —advertencias de coste recurrente— ocupa las columnas 2 y 3. Activa:
fondo `hoja-alta` y acento izquierdo morado de 1px. No es una tarjeta y no debe
convertirse en una.

### La anotación (componente firma)
Cada línea que entra en la hoja: rejilla `1fr | auto | auto`, 12px, importe a la
derecha, botón de quitar de 26px en tinta tenue que se vuelve alarma en hover. Es
lo que se escribe en el documento cuando el prospecto elige.

## Do's and Don'ts

### Do:
- **Do** alinear todo importe a la derecha y reservarle un ancho mínimo fijo.
- **Do** usar filetes de 1px para estructurar; el fondo es refuerzo, nunca soporte.
- **Do** mantener el teal reservado a la recurrencia mensual.
- **Do** animar **solo `transform` de elementos ya visibles**, con la curva única
  `cubic-bezier(.19, 1, .22, 1)` y las tres duraciones (120/200/320ms).
- **Do** dibujar los iconos como SVG inline a `stroke-width: 1.5`.
- **Do** pensar cada superficie con `@media print` puesto: si al quitar los fondos
  deja de leerse, está mal.
- **Do** dejar los dos totales anclados sobre las acciones, por encima del pliegue.

### Don't:
- **Don't** arrancar una animación de entrada desde `opacity: 0`. Un elemento que
  nace con `hidden` crea su animación **sin reloj**: se queda en
  `playState: "running"` con `currentTime: 0` de forma permanente, el primer
  fotograma es el definitivo y el contenido no aparece nunca. Pasó aquí y dejó
  invisibles el detalle de cada servicio elegido y cada línea de la cotización. Por
  eso `abrir` y `anotar` solo animan `transform`.
- **Don't** introducir una segunda familia tipográfica, ni siquiera para resolver
  las cifras. La restricción viene del sistema padre y es firme.
- **Don't** publicar una línea de validez —«válido hasta»— en el folio. El contrato
  de dirección la mencionaba, pero DAK no publica ninguna: sus informes dicen
  «escenarios de partida, no una promesa» y que la cifra «se recalibra a los 30
  días». Inventarla es fabricar un compromiso comercial, y PRODUCT.md lo prohíbe.
  Ese gesto lo cierran el folio con fecha, la coletilla «los importes son una
  referencia» y el sello REFERENCIAL.
- **Don't** mostrar una cifra combinada dominante que sume pago único y mensual.
- **Don't** dibujar un bloque vacío ni un «S/ 0 /mes».
- **Don't** convertir las filas del catálogo en tarjetas con icono, título y
  párrafo. Es el contenedor perezoso y además mentiría: un servicio es una línea de
  un documento, no un producto en una vitrina.
- **Don't** poner el sello sobre un fondo de color. Borde siempre.
- **Don't** tapar el cuerpo de la hoja con una máscara de desvanecido: apagaba filas
  y botones de quitar que sí funcionan, y un control vivo pintado como
  deshabilitado miente.
- **Don't** bajar del suelo de 11px ni usar `tinta-tenue` como color de texto.
