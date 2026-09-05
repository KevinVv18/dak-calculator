// ═══════════════════════════════════════════
//  CONFIGURACIÓN PÚBLICA — SÍ va al repositorio
//
//  Las tres claves de EmailJS son públicas por diseño: viajan en el JS que
//  descarga cualquier visitante, y EmailJS las protege por dominio permitido,
//  no por secreto. Tenerlas en config/credentials.js, que está en .gitignore,
//  no las ocultaba de nadie: solo hacía que NO se desplegaran.
//
//  Consecuencia real hasta el 2026-09-03: config/credentials.js daba 404 en
//  producción, EMAILJS_CONFIG quedaba undefined, y enviarCotizacion() caía al
//  fallback mailto:, que abre el correo DEL PROPIO PROSPECTO con una cotización
//  dirigida a sí mismo. El botón principal del embudo no llegaba nunca a DAK.
//
//  Lo que sí es secreto (usuario y contraseña de admin) sigue en
//  config/credentials.js, fuera del repo.
// ═══════════════════════════════════════════

const EMAILJS_CONFIG = {
    serviceId: 'service_juecgni',
    templateId: 'template_4084d0k',
    publicKey: 'ctx4gz79APNTxi7L6'
};
