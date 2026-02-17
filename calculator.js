// Lógica de la calculadora
// Config editable (copia de data.js); la calculadora usa CONFIG
const CONFIG_STORAGE_KEY = 'dak-calculator-config';

function getConfigInicial() {
    try {
        const guardado = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (guardado) {
            const parsed = JSON.parse(guardado);
            return {
                serviciosBase: parsed.serviciosBase || JSON.parse(JSON.stringify(SERVICIOS_BASE)),
                perfilesCliente: parsed.perfilesCliente || JSON.parse(JSON.stringify(PERFILES_CLIENTE)),
                factoresExtra: parsed.factoresExtra || JSON.parse(JSON.stringify(FACTORES_EXTRA))
            };
        }
    } catch (e) {}
    return {
        serviciosBase: JSON.parse(JSON.stringify(SERVICIOS_BASE)),
        perfilesCliente: JSON.parse(JSON.stringify(PERFILES_CLIENTE)),
        factoresExtra: JSON.parse(JSON.stringify(FACTORES_EXTRA))
    };
}

const CONFIG = getConfigInicial();

const SERVICIOS_BASE_KEYS = [
    { key: 'video-corto', label: 'Video corto' },
    { key: 'video-largo', label: 'Video largo' },
    { key: 'flyer', label: 'Flyer' },
    { key: 'portada-fb', label: 'Portada FB' }
];
const NIVELES = ['facil', 'medio', 'dificil'];
const NIVELES_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };

function seleccionarPerfilCliente(perfil) {
    const select = document.getElementById('perfil-cliente');
    if (!select) return;
    select.value = perfil;
    document.querySelectorAll('.perfil-card').forEach(card => {
        card.classList.toggle('perfil-card--activo', card.dataset.perfil === perfil);
    });
    const inputSection = document.querySelector('.input-section');
    if (inputSection) {
        inputSection.classList.remove('input-section--perfil-pendiente');
    }
    calcularTotal();
}

function calcularTotal() {
    // Obtener valores de los inputs
    const perfilCliente = document.getElementById('perfil-cliente').value;
    const cantidadVideosCortos = parseInt(document.getElementById('cantidad-videos-cortos').value) || 0;
    const nivelVideosCortos = document.getElementById('nivel-videos-cortos').value;
    const cantidadVideosLargos = parseInt(document.getElementById('cantidad-videos-largos').value) || 0;
    const nivelVideosLargos = document.getElementById('nivel-videos-largos').value;
    const cantidadFlyers = parseInt(document.getElementById('cantidad-flyers').value) || 0;
    const nivelFlyers = document.getElementById('nivel-flyers').value;
    const cantidadPortadasFb = parseInt(document.getElementById('cantidad-portadas-fb').value) || 0;
    const nivelPortadasFb = document.getElementById('nivel-portadas-fb').value;
    const urgenciaChecked = document.getElementById('urgencia').checked;
    const grabacionFueraZonaChecked = document.getElementById('grabacion-fuera-zona').checked;
    const revisionExtraChecked = document.getElementById('revision-extra').checked;
    const droneAdicionalChecked = document.getElementById('drone-adicional').checked;
    
    // 1. Calcular subtotal base
    let subtotalBase = 0;
    
    // Calcular costo de videos cortos (solo si el checkbox está marcado)
    const checkboxVideoCorto = document.getElementById('checkbox-video-corto').checked;
    if (checkboxVideoCorto && cantidadVideosCortos > 0) {
        const precioVideoCorto = CONFIG.serviciosBase["video-corto"][nivelVideosCortos];
        subtotalBase += cantidadVideosCortos * precioVideoCorto;
    }
    
    // Calcular costo de videos largos (solo si el checkbox está marcado)
    const checkboxVideoLargo = document.getElementById('checkbox-video-largo').checked;
    if (checkboxVideoLargo && cantidadVideosLargos > 0) {
        const precioVideoLargo = CONFIG.serviciosBase["video-largo"][nivelVideosLargos];
        subtotalBase += cantidadVideosLargos * precioVideoLargo;
    }
    
    // Calcular costo de flyers
    if (cantidadFlyers > 0) {
        const precioFlyer = CONFIG.serviciosBase["flyer"][nivelFlyers];
        subtotalBase += cantidadFlyers * precioFlyer;
    }
    
    // Calcular costo de portadas FB
    if (cantidadPortadasFb > 0) {
        const precioPortadaFb = CONFIG.serviciosBase["portada-fb"][nivelPortadasFb];
        subtotalBase += cantidadPortadasFb * precioPortadaFb;
    }
    
    // 2. Aplicar multiplicador del perfil de cliente
    const multiplicador = CONFIG.perfilesCliente[perfilCliente];
    const subtotalConMultiplicador = subtotalBase * multiplicador;
    
    // 3. Calcular extras
    let extrasTotal = 0;
    const extrasDetalles = [];
    
    // Urgencia 48h (ahora es checkbox)
    if (urgenciaChecked) {
        extrasTotal += CONFIG.factoresExtra["urgencia-48h"].precio;
        extrasDetalles.push({
            nombre: CONFIG.factoresExtra["urgencia-48h"].nombre,
            precio: CONFIG.factoresExtra["urgencia-48h"].precio
        });
    }

    // Grabación fuera zona
    if (grabacionFueraZonaChecked) {
        extrasTotal += CONFIG.factoresExtra["grabacion-fuera-zona"].precio;
        extrasDetalles.push({
            nombre: CONFIG.factoresExtra["grabacion-fuera-zona"].nombre,
            precio: CONFIG.factoresExtra["grabacion-fuera-zona"].precio
        });
    }

    // Revisión extra
    if (revisionExtraChecked) {
        extrasTotal += CONFIG.factoresExtra["revision-extra"].precio;
        extrasDetalles.push({
            nombre: CONFIG.factoresExtra["revision-extra"].nombre,
            precio: CONFIG.factoresExtra["revision-extra"].precio
        });
    }

    // Drone adicional
    if (droneAdicionalChecked) {
        extrasTotal += CONFIG.factoresExtra["drone-adicional"].precio;
        extrasDetalles.push({
            nombre: CONFIG.factoresExtra["drone-adicional"].nombre,
            precio: CONFIG.factoresExtra["drone-adicional"].precio
        });
    }
    
    // 4. Calcular total final
    const totalFinal = subtotalConMultiplicador + extrasTotal;
    
    // Actualizar la interfaz
    actualizarInterfaz(subtotalBase, multiplicador, subtotalConMultiplicador, extrasTotal, extrasDetalles, totalFinal);
}

function actualizarInterfaz(subtotalBase, multiplicador, subtotalConMultiplicador, extrasTotal, extrasDetalles, totalFinal) {
    // Formatear números con separador de miles
    const formatearNumero = (num) => {
        return new Intl.NumberFormat('es-ES').format(Math.round(num));
    };
    
    // Actualizar subtotal base
    document.getElementById('subtotal-base').textContent = formatearNumero(subtotalBase);
    
    // Actualizar multiplicador aplicado
    document.getElementById('multiplicador-aplicado').textContent = formatearNumero(subtotalConMultiplicador);
    
    // Actualizar extras
    document.getElementById('extras-total').textContent = formatearNumero(extrasTotal);
    
    // Mostrar detalles de extras
    const extrasDetailsDiv = document.getElementById('extras-details');
    if (extrasDetalles.length > 0) {
        extrasDetailsDiv.innerHTML = extrasDetalles.map(extra => 
            `<div class="extra-item">${extra.nombre}: ${formatearNumero(extra.precio)}</div>`
        ).join('');
    } else {
        extrasDetailsDiv.innerHTML = '';
    }
    
    // Actualizar total final
    document.getElementById('total-final').textContent = formatearNumero(totalFinal);
}

// --- Modal Ajustes: ver y editar precios ---
function abrirModalAjustes() {
    document.getElementById('modal-ajustes').setAttribute('aria-hidden', 'false');
    document.getElementById('modal-ajustes').classList.add('modal-ajustes--abierto');
    rellenarModalAjustes();
}

function cerrarModalAjustes() {
    document.getElementById('modal-ajustes').setAttribute('aria-hidden', 'true');
    document.getElementById('modal-ajustes').classList.remove('modal-ajustes--abierto');
}

function rellenarModalAjustes() {
    const sb = document.getElementById('ajustes-servicios-base');
    sb.innerHTML = '';
    SERVICIOS_BASE_KEYS.forEach(({ key, label }) => {
        const bloque = document.createElement('div');
        bloque.className = 'ajustes-bloque';
        bloque.innerHTML = `<strong>${label}</strong>`;
        const filas = NIVELES.map(n => {
            const id = `ajustes-sb-${key}-${n}`;
            const val = CONFIG.serviciosBase[key][n];
            return `<div class="ajustes-fila"><label for="${id}">${NIVELES_LABEL[n]}</label><input type="number" id="${id}" data-sb="${key}" data-nivel="${n}" value="${val}" min="0"></div>`;
        }).join('');
        bloque.innerHTML += `<div class="ajustes-filas">${filas}</div>`;
        sb.appendChild(bloque);
    });

    const pf = document.getElementById('ajustes-perfiles');
    pf.innerHTML = '';
    Object.entries(CONFIG.perfilesCliente).forEach(([key, val]) => {
        const id = `ajustes-pf-${key}`;
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        pf.innerHTML += `<div class="ajustes-fila"><label for="${id}">${label}</label><input type="number" step="0.1" id="${id}" data-pf="${key}" value="${val}" min="0"></div>`;
    });

    const fe = document.getElementById('ajustes-factores-extra');
    fe.innerHTML = '';
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        const id = `ajustes-fe-${key}`;
        fe.innerHTML += `<div class="ajustes-fila"><label for="${id}">${obj.nombre}</label><input type="number" id="${id}" data-fe="${key}" value="${obj.precio}" min="0"></div>`;
    });

}

function aplicarYGuardarAjustes() {
    // Leer valores del modal y aplicar a CONFIG
    document.querySelectorAll('#ajustes-servicios-base input[data-sb]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.serviciosBase[inp.dataset.sb][inp.dataset.nivel] = v;
    });
    document.querySelectorAll('#ajustes-perfiles input[data-pf]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.perfilesCliente[inp.dataset.pf] = v;
    });
    document.querySelectorAll('#ajustes-factores-extra input[data-fe]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.factoresExtra[inp.dataset.fe].precio = v;
    });
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(CONFIG));
    } catch (e) {}
    calcularTotal();
    cerrarModalAjustes();
}

// Mostrar/ocultar opciones de videos según checkbox
function toggleOpcionesVideo(tipo, mostrar) {
    const opciones = document.getElementById(`opciones-video-${tipo}`);
    if (opciones) {
        if (mostrar) {
            opciones.classList.add('mostrar');
        } else {
            opciones.classList.remove('mostrar');
            // Resetear valores cuando se oculta
            if (tipo === 'corto') {
                const cantidad = document.getElementById('cantidad-videos-cortos');
                const nivel = document.getElementById('nivel-videos-cortos');
                if (cantidad) cantidad.value = 0;
                if (nivel) nivel.value = 'medio';
            } else {
                const cantidad = document.getElementById('cantidad-videos-largos');
                const nivel = document.getElementById('nivel-videos-largos');
                if (cantidad) cantidad.value = 0;
                if (nivel) nivel.value = 'medio';
            }
        }
    }
}

// Agregar event listeners a todos los inputs
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('#perfil-cliente, #cantidad-videos-cortos, #nivel-videos-cortos, #cantidad-videos-largos, #nivel-videos-largos, #cantidad-flyers, #nivel-flyers, #cantidad-portadas-fb, #nivel-portadas-fb, #urgencia, #grabacion-fuera-zona, #revision-extra, #drone-adicional');
    inputs.forEach(input => {
        input.addEventListener('input', calcularTotal);
        input.addEventListener('change', calcularTotal);
    });

    // Checkboxes de videos
    const checkboxVideoCorto = document.getElementById('checkbox-video-corto');
    const checkboxVideoLargo = document.getElementById('checkbox-video-largo');
    
    if (checkboxVideoCorto) {
        checkboxVideoCorto.addEventListener('change', function() {
            toggleOpcionesVideo('corto', this.checked);
            calcularTotal();
        });
    }
    
    if (checkboxVideoLargo) {
        checkboxVideoLargo.addEventListener('change', function() {
            toggleOpcionesVideo('largo', this.checked);
            calcularTotal();
        });
    }
    
    // Event listeners para inputs de videos (se agregan dinámicamente cuando se muestran)
    const cantidadVideoCorto = document.getElementById('cantidad-videos-cortos');
    const nivelVideoCorto = document.getElementById('nivel-videos-cortos');
    const cantidadVideoLargo = document.getElementById('cantidad-videos-largos');
    const nivelVideoLargo = document.getElementById('nivel-videos-largos');
    
    if (cantidadVideoCorto) cantidadVideoCorto.addEventListener('input', calcularTotal);
    if (nivelVideoCorto) nivelVideoCorto.addEventListener('change', calcularTotal);
    if (cantidadVideoLargo) cantidadVideoLargo.addEventListener('input', calcularTotal);
    if (nivelVideoLargo) nivelVideoLargo.addEventListener('change', calcularTotal);

    document.getElementById('btn-ajustes').addEventListener('click', abrirModalAjustes);
    document.getElementById('modal-ajustes-cerrar').addEventListener('click', cerrarModalAjustes);
    document.getElementById('modal-ajustes-aplicar').addEventListener('click', aplicarYGuardarAjustes);
    document.getElementById('modal-ajustes').addEventListener('click', function(ev) {
        if (ev.target === this) cerrarModalAjustes();
    });

    document.querySelectorAll('.perfil-card').forEach(card => {
        card.addEventListener('click', function() {
            seleccionarPerfilCliente(this.dataset.perfil);
        });
    });
    
    // Calcular inicialmente
    calcularTotal();
});
