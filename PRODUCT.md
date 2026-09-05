# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Principal: el prospecto, solo.** Dueño o dueña de un negocio pequeño en Chiclayo y el resto de
Lambayeque —salón de belleza, consultorio dental, distribuidor mayorista, inmobiliaria de lotes,
centro de estimulación temprana, limpieza a domicilio, domótica—. Micro y pequeña empresa: de 21 a
825 seguidores reales, de cinco días a más de una década de antigüedad. Llega **casi siempre desde
el móvil**, por un enlace de WhatsApp o desde un post del blog de DAK. Muchos vienen de leer
«¿Cuánto cuesta contratar una agencia de marketing en Perú?», que promete «un estimado en un par de
minutos». Su trabajo es uno: hacerse una idea de cuánto cuesta esto antes de hablar con nadie, sin
tener que pedir una reunión para averiguar un precio.

**Secundario: el equipo comercial de DAK**, con un modo admin que desbloquea el multiplicador por
perfil de cliente, el ajuste de precios y el paso de «presupuesto aproximado» a «cotización
oficial». Es herramienta interna y hoy solo funciona en local.

## Product Purpose

Traducir el catálogo de servicios de DAK a una cifra que el prospecto entiende sin ayuda, y llevarlo
a una conversación. No sustituye a la propuesta: la precede. Éxito es que alguien que no conocía los
precios salga sabiendo dos números —lo que paga una vez y lo que paga cada mes— y con una reunión
agendada.

## Positioning

DAK vende separando el dinero en tres capas y diciéndolo en voz alta: la **pauta se paga directo a
Meta** y no pasa por la agencia; el **honorario mensual** va a DAK; los **activos** (web, dominio,
identidad) son pago único y se cotizan aparte. El argumento que repiten los informes es literal: la
web «es un activo, no un servicio mensual».

Una calculadora que devuelve un único número mezclando las dos cosas contradice ese argumento. La
que las separa lo demuestra antes de que nadie lo explique. Ese es el mecanismo: **la propia
herramienta de precios es la prueba de cómo cobra la agencia.**

## Operating Context

- El prospecto suele haber recibido antes un **informe de marca** en `analisis.dakagency.net`, que
  ya separa pauta, honorario y activos y presenta rangos como «escenarios, no una promesa».
- Entradas reales a esta superficie: posts del blog sobre precios, `ChatWidget`, `CTASection` y el
  footer del blog en la web principal. `agendar.html` se enlaza directa y por separado, así que hay
  prospectos que la ven sin pasar nunca por la calculadora.
- Móvil primero, y en condiciones de red peruanas.
- El CTA constante de DAK en todo el circuito comercial es WhatsApp `+51 906 765 040`.

## Capabilities and Constraints

- Sitio estático sin paso de build, servido tal cual está en el repo. **La página está en
  Hostinger** (`u567580447`, `domains/plan.dakagency.net/public_html/`); **solo `/api` está en
  Vercel**. Son dos orígenes distintos y toda llamada a la API es cross-origin.
- Catálogo de 34 servicios en 6 categorías. Dos formas de precio: con dos tiers (básico/avanzado) o
  precio fijo. Más 4 recargos de producción y un ítem libre.
- **Cada servicio es de pago único o mensual.** Diez son mensuales: mantenimiento web, los tres de
  ads, los dos de SEO, SEM, email marketing, automatización RRSS y dashboard.
- Funciones serverless en `/api` contra Google Calendar: disponibilidad real y creación del evento
  con enlace de Meet.
- Envío de la cotización por EmailJS.
- Precios ajustables en caliente por el admin, persistidos en `localStorage` con versionado.
- El gate de admin compara usuario y contraseña en JavaScript de cliente. **No es seguridad**, y su
  archivo no se despliega, así que en producción el modo admin no existe.

## Brand Commitments

- Identidad de `dakagency.net`: fondo `#030106`, morado `#B024FF` (`#B93EFF` cuando es texto, por
  contraste AA), teal `#00C8C8`, tipografía Poppins.
- `DESIGN.md` de la web principal manda, incluida su lista «Lo que este mundo NO es»: nada de
  cuadrícula tileada de fondo, texto con degradado, bordes de acento laterales de más de 1px, rebote
  elástico, animar `width`/`max-height`/`margin`, ni halos de color sin desplazamiento como sombra.
- Interfaz en **español de Perú**. El registro comercial de DAK es de usted, frases cortas, sin
  anglicismos de agencia y sin la palabra «solución».
- Logotipo DAK en `assets/logo.svg`.

## Evidence on Hand

- Precios reales y vigentes en `js/data.js`. **No se inventa ninguno y no se cambia ninguno.**
- Siete informes de marca reales en `_analisis-microsite/` del repo `DAK_WP`, con los rangos que DAK
  usa de verdad: pauta de S/ 350 a S/ 5.000 al mes según rubro, honorario de S/ 1.200 a 1.800 al mes.
  **Esas cifras son de los informes, no de esta calculadora**, y no deben aparecer aquí como si
  fueran suyas.
- Disponibilidad real de agenda vía Google Calendar.
- **No hay** testimonios, casos de éxito, logos de clientes ni métricas de resultados en este repo.
  No se fabrican.

## Product Principles

1. **Dos números, nunca uno.** Lo que se paga una vez y lo que se paga cada mes van separados
   siempre: en pantalla, en el email y en lo que se pasa a la reunión. Un total combinado como cifra
   dominante reintroduce justo la confusión que el producto existe para deshacer.
2. **Un bloque vacío no se dibuja.** Si no hay servicios mensuales, no aparece un «S/ 0 /mes». Un
   cero inventado es peor que un hueco.
3. **La cifra es una referencia declarada, no una factura.** El prospecto tiene que entender que es
   un estimado antes de leer el número, no después.
4. **El coste que aparece más tarde se dice ahora.** Si un servicio de pago único arrastra un gasto
   recurrente, se advierte en su ficha, sin inventar importes.
5. **Se puede terminar en el móvil, de pie y con una mano.** Es donde ocurre de verdad.

## Accessibility & Inclusion

Contraste AA contando el alpha. Texto funcional nunca por debajo de 11px. Área táctil de 44×44 donde
el espaciado lo permita, nunca por debajo de 24×24. `prefers-reduced-motion` detiene toda animación
decorativa. Los tooltips de información tienen que poder leerse en táctil, no solo en hover.

## Decisiones resueltas

- **La acción principal es agendar la reunión.** Es la única que hoy deja rastro comprobable: crea
  el evento en Google Calendar con su enlace de Meet y su invitación. El envío del presupuesto por
  email es secundario. WhatsApp no entra en esta superficie por ahora.
- **DAK no se enteraba de que alguien cotizaba, y hay que arreglarlo.** La cotización se envía al
  email del propio prospecto y no había ninguna llamada que avisara a DAK. Se añade un segundo envío
  a DAK con cada cotización.
- **Chatbot y CRM Setup son de pago único, con salvedad escrita en su ficha.** Texto aprobado, sin
  cifras: Chatbot — «El montaje se paga una vez. El nivel con IA conversacional consume una API que
  se factura aparte según el uso.» CRM Setup — «El montaje se paga una vez. Sin una gestión mensual
  que lo mantenga al día, un CRM deja de servir en pocas semanas.»

## Decisiones abiertas

- **La escritura de leads en el MySQL de `admin.dakagency.net`.** `AGENTS.md` dice que la
  calculadora alimenta esos leads, pero no existe tal integración en el código. El aviso a DAK se
  resuelve por correo; conectar el MySQL es trabajo aparte y no entra en este rediseño.
