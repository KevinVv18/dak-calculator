// Datos transcritos de las imágenes

// 1. SERVICIOS_BASE - Precios por servicio y dificultad
const SERVICIOS_BASE = {
    "video-corto": {
        "facil": 120,
        "medio": 200,
        "dificil": 350
    },
    "video-largo": {
        "facil": 250,
        "medio": 400,
        "dificil": 700
    },
    "flyer": {
        "facil": 100,
        "medio": 180,
        "dificil": 300
    },
    "portada-fb": {
        "facil": 50,
        "medio": 90,
        "dificil": 150
    }
};

// 2. PERFILES_CLIENTE - Multiplicadores por perfil
const PERFILES_CLIENTE = {
    "bajo": 1.0,
    "medio": 1.2,
    "alto": 1.5
};

// 3. FACTORES_EXTRA - Factores adicionales con precios fijos
const FACTORES_EXTRA = {
    "urgencia-48h": {
        "nombre": "Urgencia 48h",
        "precio": 150
    },
    "grabacion-fuera-zona": {
        "nombre": "Grabación fuera zona",
        "precio": 200
    },
    "revision-extra": {
        "nombre": "Revisión extra",
        "precio": 80
    },
    "drone-adicional": {
        "nombre": "Drone adicional",
        "precio": 120
    }
};
