// ═══════════════════════════════════════════
//  DAK Calculator — datos de configuración
// ═══════════════════════════════════════════

// Credenciales cargadas desde config/credentials.js
// (EMAILJS_CONFIG y ADMIN_CREDENTIALS)

// ── Servicios con nivel (2 tiers: básico / avanzado) ──
const SERVICIOS_BASE = {
    "video-corto":     { basico: 150, avanzado: 350 },
    "video-largo":     { basico: 300, avanzado: 700 },
    "fotos-estudio":   { basico: 200, avanzado: 400 },
    "flyer":           { basico: 80,  avanzado: 200 },
    "branding-manual": { basico: 900, avanzado: 2200 },
    // Web
    "pagina-web":      { basico: 850, avanzado: 2500 },
    // Automatización
    "chatbot-whatsapp":   { basico: 400, avanzado: 1200 },
    "crm-setup":          { basico: 500, avanzado: 1500 },
};

// ── Servicios con precio fijo ──
const PRECIOS_FIJOS = {
    // Video & Foto
    "foto-tematica":       { nombre: "Sesión por temática",    precio: 200 },
    "fotos-eventos":       { nombre: "Cobertura de eventos",   precio: 800 },
    // Diseño
    "tarjetas":            { nombre: "Tarjetas",               precio: 60 },
    "banner":              { nombre: "Banner",                 precio: 80 },
    "volantes":            { nombre: "Diseño de Volantes",     precio: 60 },
    "diptico":             { nombre: "Díptico",                precio: 120 },
    "triptico":            { nombre: "Tríptico",               precio: 180 },
    "portada-fb":          { nombre: "Portada Facebook",       precio: 90 },
    "mockups":             { nombre: "Mockups",                precio: 40 },
    "paneles":             { nombre: "Diseño de paneles",      precio: 180 },
    "branding-rebranding": { nombre: "Rebranding completo",    precio: 2000 },
    // Web
    "landing-page":        { nombre: "Landing page",           precio: 450 },
    "tienda-online":       { nombre: "Tienda online",          precio: 3500 },
    "mantenimiento-web":   { nombre: "Mantenimiento web",      precio: 250 },
    // Marketing
    "ads-meta":            { nombre: "Ads Meta (FB + IG)",     precio: 300 },
    "ads-facebook":        { nombre: "Ads solo Facebook",      precio: 200 },
    "ads-instagram":       { nombre: "Ads solo Instagram",     precio: 300 },
    "seo-basico":          { nombre: "SEO básico",             precio: 300 },
    "seo-avanzado":        { nombre: "SEO avanzado",           precio: 800 },
    "sem-campana":         { nombre: "SEM – Campaña Google",   precio: 4200 },
    // Automatización
    "email-marketing":     { nombre: "Email Marketing",        precio: 350 },
    "auto-redes":          { nombre: "Automatización RRSS",    precio: 300 },
    "dashboard-reportes":  { nombre: "Dashboard & Reportes",   precio: 450 },
};

// ── Perfiles de cliente (multiplicador) ──
const PERFILES_CLIENTE = {
    "bajo":  1.0,
    "medio": 1.2,
    "alto":  1.5
};

// ── Factores extra (precio fijo adicional) ──
const FACTORES_EXTRA = {
    "urgencia-48h":         { nombre: "Urgencia 48h",         precio: 180 },
    "grabacion-fuera-zona": { nombre: "Grabación fuera zona", precio: 240 },
    "revision-extra":       { nombre: "Revisión extra",       precio: 80 },
    "drone-adicional":      { nombre: "Drone adicional",      precio: 250 }
};

// ── Descripciones para tooltips de info (ⓘ) ──
const SERVICE_INFO = {
    "video-corto":         "Simple: talking head, unboxing, testimonio.\nCon producción: motion graphics, multicámara.",
    "video-largo":         "Simple: entrevista, corporativo directo.\nCon producción: cinematográfico, multicámara.",
    "fotos-estudio":       "Básica: fondo liso, producto.\nCon producción: set armado, iluminación profesional.",
    "foto-tematica":       "Sesión con escenografía o temática específica del cliente.",
    "fotos-eventos":       "Cobertura fotográfica completa de eventos sociales o corporativos.",
    "flyer":               "Básico: diseño simple 1 cara.\nAvanzado: doble cara con ilustración.",
    "tarjetas":            "Diseño de tarjetas de presentación personalizadas.",
    "banner":              "Banner digital o para impresión en gran formato.",
    "volantes":            "Volantes publicitarios para campañas de difusión.",
    "diptico":             "Folleto plegable de 2 cuerpos para información detallada.",
    "triptico":            "Folleto plegable de 3 cuerpos, ideal para catálogos.",
    "portada-fb":          "Portada optimizada para perfil o página de Facebook.",
    "mockups":             "Visualización realista de tu diseño aplicado en contexto.",
    "paneles":             "Diseño de paneles publicitarios para exteriores o interiores.",
    "branding-manual":     "Esencial: logo + paleta + tipografía.\nCompleto: manual con todas las aplicaciones.",
    "branding-rebranding": "Rediseño completo de identidad visual de marca.",
    // Web
    "pagina-web":          "Básica: sitio informativo hasta 5 páginas.\nAvanzada: e-commerce, CMS o funcionalidades a medida.",
    "landing-page":        "Página única optimizada para captar leads o promocionar un producto.",
    "tienda-online":       "E-commerce completo con carrito, pasarela de pago y catálogo.",
    "mantenimiento-web":   "Soporte mensual: actualizaciones, backups y correcciones menores.",
    // Marketing
    "ads-meta":            "Gestión de campañas publicitarias en Facebook + Instagram.",
    "ads-facebook":        "Campaña publicitaria exclusiva en Facebook.",
    "ads-instagram":       "Campaña publicitaria exclusiva en Instagram.",
    "seo-basico":          "Optimización on-page, keywords y meta tags.",
    "seo-avanzado":        "SEO técnico, backlinks y estrategia completa.",
    "sem-campana":         "Campaña de Google Ads con optimización continua.",
    // Automatización
    "chatbot-whatsapp":    "Básico: respuestas FAQ, menú interactivo.\nAvanzado: IA conversacional, integración con CRM.",
    "crm-setup":           "Básico: configuración inicial, importación de contactos.\nAvanzado: flujos automatizados, integraciones y reportes.",
    "email-marketing":     "Diseño de plantillas, segmentación y secuencias automatizadas.",
    "auto-redes":          "Programación de publicaciones y reportes de rendimiento.",
    "dashboard-reportes":  "Panel centralizado con métricas clave de tu negocio en tiempo real.",
};

// ── Categorías del wizard (Step 2) ──
const CATEGORIAS = [
    {
        id: "video-foto", label: "🎬 Video & Foto",
        servicios: [
            { tipo: "nivel", key: "video-corto",   label: "Video reel / corto",  unidad: "videos",   tierLabels: { basico: "Simple", avanzado: "Pro" } },
            { tipo: "nivel", key: "video-largo",    label: "Video largo",         unidad: "videos",   tierLabels: { basico: "Simple", avanzado: "Pro" } },
            { tipo: "nivel", key: "fotos-estudio",  label: "Sesión en estudio",   unidad: "sesiones", tierLabels: { basico: "Básica", avanzado: "Pro" } },
            { tipo: "fijo",  key: "foto-tematica",  label: "Sesión por temática" },
            { tipo: "fijo",  key: "fotos-eventos",  label: "Cobertura de eventos" },
        ]
    },
    {
        id: "diseno", label: "🎨 Diseño",
        servicios: [
            { tipo: "nivel", key: "flyer",              label: "Flyers",              unidad: "flyers",   tierLabels: { basico: "Básico", avanzado: "Avanzado" } },
            { tipo: "fijo",  key: "tarjetas",           label: "Tarjetas" },
            { tipo: "fijo",  key: "banner",             label: "Banner" },
            { tipo: "fijo",  key: "volantes",           label: "Diseño de Volantes" },
            { tipo: "fijo",  key: "diptico",            label: "Díptico" },
            { tipo: "fijo",  key: "triptico",           label: "Tríptico" },
            { tipo: "fijo",  key: "portada-fb",         label: "Portada Facebook" },
            { tipo: "fijo",  key: "mockups",            label: "Mockups" },
            { tipo: "fijo",  key: "paneles",            label: "Diseño de paneles" },
            { tipo: "nivel", key: "branding-manual",    label: "Manual de marca",     unidad: "manuales", tierLabels: { basico: "Esencial", avanzado: "Completo" } },
            { tipo: "fijo",  key: "branding-rebranding", label: "Rebranding completo" },
        ]
    },
    {
        id: "web", label: "🌐 Web",
        servicios: [
            { tipo: "nivel", key: "pagina-web",       label: "Página web",          unidad: "sitios",  tierLabels: { basico: "Básica", avanzado: "Avanzada" } },
            { tipo: "fijo",  key: "landing-page",      label: "Landing page" },
            { tipo: "fijo",  key: "tienda-online",     label: "Tienda online" },
            { tipo: "fijo",  key: "mantenimiento-web", label: "Mantenimiento web" },
        ]
    },
    {
        id: "marketing", label: "📈 Marketing",
        servicios: [
            { tipo: "fijo", key: "ads-meta",      label: "Ads Meta (FB + IG)" },
            { tipo: "fijo", key: "ads-facebook",   label: "Ads solo Facebook" },
            { tipo: "fijo", key: "ads-instagram",  label: "Ads solo Instagram" },
            { tipo: "fijo", key: "seo-basico",     label: "SEO básico" },
            { tipo: "fijo", key: "seo-avanzado",   label: "SEO avanzado" },
            { tipo: "fijo", key: "sem-campana",    label: "SEM – Campaña Google" },
        ]
    },
    {
        id: "automatizacion", label: "🤖 Automatización", badge: "NUEVO",
        servicios: [
            { tipo: "nivel", key: "chatbot-whatsapp", label: "Chatbot WhatsApp",       unidad: "bots",    tierLabels: { basico: "FAQ básico", avanzado: "IA + CRM" } },
            { tipo: "nivel", key: "crm-setup",        label: "CRM Setup",              unidad: "setups",  tierLabels: { basico: "Inicial", avanzado: "Completo" } },
            { tipo: "fijo",  key: "email-marketing",   label: "Email Marketing" },
            { tipo: "fijo",  key: "auto-redes",        label: "Automatización RRSS" },
            { tipo: "fijo",  key: "dashboard-reportes", label: "Dashboard & Reportes" },
        ]
    },
    {
        id: "personalizado", label: "✏️ Personalizado", tipo: "personalizado"
    }
];
