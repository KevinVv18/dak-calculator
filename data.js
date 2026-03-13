// ═══════════════════════════════════════════
//  DAK Calculator — datos de configuración
// ═══════════════════════════════════════════

// Config EmailJS (opcional — dejar vacío para usar mailto:)
const EMAILJS_CONFIG = {
    serviceId: 'service_juecgni',
    templateId: 'template_4084d0k',
    publicKey: 'ctx4gz79APNTxi7L6'
};

// ── Servicios con nivel de dificultad (precio por unidad) ──
const SERVICIOS_BASE = {
    // Video & Foto
    "video-corto": { facil: 120, medio: 200, dificil: 350 },
    "video-largo": { facil: 250, medio: 400, dificil: 700 },
    "fotos-estudio": { facil: 150, medio: 250, dificil: 400 },
    "fotos-eventos": { facil: 500, medio: 800, dificil: 1200 },
    // Diseño
    "flyer": { facil: 80, medio: 160, dificil: 250 },
    "portada-fb": { facil: 50, medio: 90, dificil: 150 },
    "branding-manual": { facil: 850, medio: 1200, dificil: 2200 },
    "branding-rebranding": { facil: 1000, medio: 1500, dificil: 2500 },
};

// ── Servicios con precio fijo ──
const PRECIOS_FIJOS = {
    "web-basica": { nombre: "Página web básica", precio: 850 },
    "web-avanzada": { nombre: "Página web avanzada", precio: 2500 },
    "ads-meta": { nombre: "Ads Meta (FB + IG)", precio: 300 },
    "ads-facebook": { nombre: "Ads solo Facebook", precio: 200 },
    "ads-instagram": { nombre: "Ads solo Instagram", precio: 300 },
    "seo-basico": { nombre: "SEO básico", precio: 300 },
    "seo-avanzado": { nombre: "SEO avanzado", precio: 800 },
    "sem-campana": { nombre: "SEM – Campaña Google", precio: 4200 },
};

// ── Perfiles de cliente (multiplicador) ──
const PERFILES_CLIENTE = {
    "bajo": 1.0,
    "medio": 1.2,
    "alto": 1.5
};

// ── Factores extra (precio fijo adicional) ──
const FACTORES_EXTRA = {
    "urgencia-48h": { nombre: "Urgencia 48h", precio: 180 },
    "grabacion-fuera-zona": { nombre: "Grabación fuera zona", precio: 240 },
    "revision-extra": { nombre: "Revisión extra", precio: 80 },
    "drone-adicional": { nombre: "Drone adicional", precio: 250 }
};

// ── Categorías del wizard (Step 2) — define tabs y sus servicios ──
const CATEGORIAS = [
    {
        id: "video-foto", label: "🎬 Video & Foto",
        servicios: [
            { tipo: "nivel", key: "video-corto", label: "Videos cortos", unidad: "videos" },
            { tipo: "nivel", key: "video-largo", label: "Videos largos", unidad: "videos" },
            { tipo: "nivel", key: "fotos-estudio", label: "Sesión en estudio", unidad: "sesiones" },
            { tipo: "nivel", key: "fotos-eventos", label: "Cobertura de eventos", unidad: "sesiones" },
        ]
    },
    {
        id: "diseno", label: "🎨 Diseño",
        servicios: [
            { tipo: "nivel", key: "flyer", label: "Flyers", unidad: "flyers" },
            { tipo: "nivel", key: "portada-fb", label: "Portadas Facebook", unidad: "portadas" },
            { tipo: "nivel", key: "branding-manual", label: "Manual de marca", unidad: "manuales" },
            { tipo: "nivel", key: "branding-rebranding", label: "Rebranding completo", unidad: "proyectos" },
        ]
    },
    {
        id: "web", label: "🌐 Web",
        servicios: [
            { tipo: "fijo", key: "web-basica", label: "Página web básica" },
            { tipo: "fijo", key: "web-avanzada", label: "Página web avanzada" },
        ]
    },
    {
        id: "marketing", label: "📈 Marketing",
        servicios: [
            { tipo: "fijo", key: "ads-meta", label: "Ads Meta (FB + IG)" },
            { tipo: "fijo", key: "ads-facebook", label: "Ads solo Facebook" },
            { tipo: "fijo", key: "ads-instagram", label: "Ads solo Instagram" },
            { tipo: "fijo", key: "seo-basico", label: "SEO básico" },
            { tipo: "fijo", key: "seo-avanzado", label: "SEO avanzado" },
            { tipo: "fijo", key: "sem-campana", label: "SEM – Campaña Google" },
        ]
    },
    {
        id: "personalizado", label: "⚙️ Personalizado", tipo: "personalizado"
    }
];
