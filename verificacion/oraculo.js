// ════════════════════════════════════════════════════════════════════
//  Oráculo de cálculo — red de regresión de la calculadora DAK
//
//  No hay tests en este repo. Esto es lo más cercano: siete escenarios
//  fijos con el total que producía el código el 2026-09-03, antes de
//  separar pago único de mensual (commit 47f6039).
//
//  INVARIANTE que el split NO puede romper:
//      unico.total + mensual.total === totalFinal de esta tabla
//  para cualquier escenario. Si no cuadra al céntimo, el split está mal.
//
//  Uso: abrir la calculadora y pegar este archivo en la consola.
//       Vuelve a ejecutarse en cada fase del rediseño.
// ════════════════════════════════════════════════════════════════════

(function () {
  const ESCENARIOS = [
    { id: 'E1-vacio', desc: 'Nada seleccionado',
      perfil: 'bajo', servicios: [], extras: [], custom: [],
      esperado: { subtotalBase: 0, multiplicador: 1, extrasTotal: 0, totalFinal: 0 } },

    { id: 'E2-solo-unico', desc: 'Web avanzada x1 + landing + 3 flyers básicos',
      perfil: 'bajo',
      servicios: [['pagina-web', 1, 'avanzado'], ['landing-page'], ['flyer', 3, 'basico']],
      extras: [], custom: [],
      esperado: { subtotalBase: 3190, multiplicador: 1, extrasTotal: 0, totalFinal: 3190 } },

    { id: 'E3-solo-mensual', desc: 'Ads Meta + SEO básico + mantenimiento web',
      perfil: 'bajo',
      servicios: [['ads-meta'], ['seo-basico'], ['mantenimiento-web']],
      extras: [], custom: [],
      esperado: { subtotalBase: 850, multiplicador: 1, extrasTotal: 0, totalFinal: 850 } },

    { id: 'E4-mixto-extras', desc: 'Web básica + Ads Meta + SEM + urgencia + drone, perfil Crecimiento',
      perfil: 'medio',
      servicios: [['pagina-web', 1, 'basico'], ['ads-meta'], ['sem-campana']],
      extras: ['urgencia-48h', 'drone-adicional'], custom: [],
      esperado: { subtotalBase: 5350, multiplicador: 1.2, extrasTotal: 430, totalFinal: 6850 } },

    { id: 'E5-custom-corp', desc: 'Video largo x2 producción + dashboard + 2 ítems custom, perfil Corporativo',
      perfil: 'alto',
      servicios: [['video-largo', 2, 'avanzado'], ['dashboard-reportes']],
      extras: [], custom: [['Locución en off', 300], ['Traducción de subtítulos', 150]],
      esperado: { subtotalBase: 2300, multiplicador: 1.5, extrasTotal: 0, totalFinal: 3450 } },

    { id: 'E6-todo-mensual-alto', desc: 'Los 10 servicios que pasan a mensual, perfil Corporativo',
      perfil: 'alto',
      servicios: [['mantenimiento-web'], ['ads-meta'], ['ads-facebook'], ['ads-instagram'],
                  ['seo-basico'], ['seo-avanzado'], ['email-marketing'], ['auto-redes'],
                  ['sem-campana'], ['dashboard-reportes']],
      extras: [], custom: [],
      esperado: { subtotalBase: 7450, multiplicador: 1.5, extrasTotal: 0, totalFinal: 11175 } },

    { id: 'E7-catalogo-completo', desc: 'Un servicio por categoría, tiers avanzados, todos los extras',
      perfil: 'medio',
      servicios: [['video-corto', 4, 'avanzado'], ['fotos-eventos'], ['branding-manual', 1, 'avanzado'],
                  ['triptico'], ['tienda-online'], ['mantenimiento-web'], ['seo-avanzado'],
                  ['chatbot-whatsapp', 1, 'avanzado'], ['crm-setup', 1, 'basico'], ['auto-redes']],
      extras: ['urgencia-48h', 'grabacion-fuera-zona', 'revision-extra', 'drone-adicional'],
      custom: [['Sesión extra de fotos', 220]],
      esperado: { subtotalBase: 11350, multiplicador: 1.2, extrasTotal: 750, totalFinal: 14370 } },
  ];

  function limpiar() {
    document.querySelectorAll('input[type=checkbox][id^="chk-"]').forEach(c => (c.checked = false));
    document.querySelectorAll('input[type=checkbox][id^="extra-"]').forEach(c => (c.checked = false));
    CATEGORIAS.forEach(cat => (cat.servicios || []).forEach(s => {
      const q = document.getElementById('qty-' + s.key); if (q) q.value = '1';
      const l = document.getElementById('lvl-' + s.key); if (l) l.value = 'basico';
    }));
    itemsPersonalizados.length = 0;
    const sel = document.getElementById('perfil-cliente'); if (sel) sel.value = 'bajo';
  }

  function aplicar(e) {
    limpiar();
    e.servicios.forEach(([key, qty, lvl]) => {
      const c = document.getElementById('chk-' + key); if (c) c.checked = true;
      if (qty != null) { const q = document.getElementById('qty-' + key); if (q) q.value = String(qty); }
      if (lvl) { const l = document.getElementById('lvl-' + key); if (l) l.value = lvl; }
    });
    e.extras.forEach(k => { const c = document.getElementById('extra-' + k); if (c) c.checked = true; });
    e.custom.forEach(([nombre, precio], i) =>
      itemsPersonalizados.push({ id: Date.now() + i, nombre, precio, recurrencia: 'unico' }));
    const sel = document.getElementById('perfil-cliente'); if (sel) sel.value = e.perfil;
  }

  // Tras el split, calcularTotal() devuelve {unico,mensual} y ya no `totalFinal`.
  // Este lector acepta las dos formas para que el oráculo sirva antes y después.
  function totalDe(t) {
    if (t.unico || t.mensual) {
      return {
        totalFinal: (t.unico?.total || 0) + (t.mensual?.total || 0),
        subtotalBase: (t.unico?.base || 0) + (t.mensual?.base || 0),
        extrasTotal: (t.unico?.extras || 0) + (t.mensual?.extras || 0),
        multiplicador: t.multiplicador,
        detalle: `único ${t.unico?.total || 0} + mensual ${t.mensual?.total || 0}`,
      };
    }
    return {
      totalFinal: t.totalFinal, subtotalBase: t.subtotalBase,
      extrasTotal: t.extrasTotal, multiplicador: t.multiplicador, detalle: 'forma antigua',
    };
  }

  const filas = [];
  let fallos = 0;

  ESCENARIOS.forEach(e => {
    aplicar(e);
    const real = totalDe(calcularTotal());
    const ok = ['subtotalBase', 'multiplicador', 'extrasTotal', 'totalFinal']
      .every(k => Math.abs(real[k] - e.esperado[k]) < 0.005);
    if (!ok) fallos++;
    filas.push({
      escenario: e.id, ok: ok ? 'OK' : 'FALLA',
      esperado: e.esperado.totalFinal, real: real.totalFinal,
      base: `${e.esperado.subtotalBase} / ${real.subtotalBase}`,
      extras: `${e.esperado.extrasTotal} / ${real.extrasTotal}`,
      detalle: real.detalle,
    });
  });

  limpiar();
  if (typeof actualizarSidebar === 'function') actualizarSidebar();

  console.table(filas);
  console.log(fallos === 0
    ? `✅ ${ESCENARIOS.length}/${ESCENARIOS.length} escenarios cuadran.`
    : `❌ ${fallos} de ${ESCENARIOS.length} escenarios NO cuadran.`);
  return { fallos, filas };
})();
