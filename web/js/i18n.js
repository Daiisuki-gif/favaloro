/* =====================================================================
   FAVALORO · idiomas (inglés por defecto, español como traducción)
   El código y las vistas están escritos en español. Este módulo traduce
   la pantalla al inglés en el lugar: recorre los textos y atributos
   visibles, busca cada frase en el diccionario (o en un patrón para las
   frases con números) y la reemplaza. Un observador traduce también lo
   que la app dibuja después, sin tocar el resto del código.
   Lo que escribe la persona (diario, chat) lleva data-noi18n y no se toca.
   ===================================================================== */
'use strict';
window.FVI18N = (() => {
  let lang = 'en';
  try { lang = localStorage.getItem('fv_lang') || 'en'; } catch (e) { /* sin almacenamiento */ }

  /* ---------- Diccionario: frase en español → inglés ---------- */
  const EN = {
    // Cabecera e inicio
    'Escaneo': 'Scan', 'Datos': 'Data', 'Roles': 'Roles', 'Ingresar': 'Sign in', 'Menú': 'Menu',
    'Monitoreo de salud para astronautas': 'Health monitoring for astronauts',
    'Deslizá para despejar el polvo': 'Scroll to clear the dust',
    'Reloj de misión': 'Mission clock', 'Tierra': 'Earth', 'Sobre el horizonte': 'Above the horizon',
    'Base lunar · Mare Tranquillitatis · 0.67°N 23.47°E': 'Lunar base · Mare Tranquillitatis · 0.67°N 23.47°E',
    'Pulso': 'Pulse', 'lpm': 'bpm', 'Astronauta 1 · simulado': 'Astronaut 1 · simulated',
    'Escaneo biométrico': 'Biometric scan', 'Apuntá. FAVALORO mide.': 'Aim. FAVALORO measures.',
    'Mové la mira sobre el traje: cuando pasa por un sensor, lo enfoca y te muestra lo que mide en vivo. En el celular, tocá un punto.': 'Move the scope over the suit: when it passes a sensor, it locks on and shows what it measures live. On a phone, tap a point.',
    'Foto: NASA · Apollo 11 (AS11-40-5903), dominio público': 'Photo: NASA · Apollo 11 (AS11-40-5903), public domain',
    'Casco': 'Helmet', 'Cabeza': 'Head', 'Tensiómetro': 'Blood pressure cuff', 'Brazo izquierdo': 'Left arm',
    'Dosímetro': 'Dosimeter', 'Pecho': 'Chest', 'Glucómetro': 'Glucometer', 'Mano izquierda': 'Left hand',
    'Nutrición': 'Nutrition', 'Abdomen': 'Abdomen', 'Brazalete': 'Wristband', 'Muñeca derecha': 'Right wrist',
    'Test de reacción y ánimo en la app. Ojos: examen médico.': 'Reaction test and mood in the app. Eyes: medical exam.',
    'Registro: se mide y se carga en la app.': 'Log: measured and entered in the app.',
    'Mide solo la radiación acumulada del día.': 'Measures the day’s accumulated radiation on its own.',
    'Registro: una gota de sangre en ayunas.': 'Log: one drop of blood, fasting.',
    'Registro diario de comidas y agua.': 'Daily log of meals and water.',
    'Mide solo pulso, oxígeno, temperatura y respiración.': 'Measures pulse, oxygen, temperature and breathing on its own.',
    'Recorrido del dato': 'The data’s journey', 'Del pulso al médico, dibujado mientras bajás.': 'From pulse to doctor, drawn as you scroll.',
    'Distancia recorrida': 'Distance traveled',
    'Brazalete → app': 'Wristband → app', 'App → antena de la base': 'App → base antenna', 'Luna → Tierra': 'Moon → Earth', 'Control → médico': 'Control → doctor',
    'El brazalete manda pulso, oxígeno y temperatura por Bluetooth a la app del astronauta.': 'The wristband sends pulse, oxygen and temperature over Bluetooth to the astronaut’s app.',
    'La app arma el semáforo de salud y lo sube a la red del hábitat.': 'The app builds the health traffic light and uploads it to the habitat network.',
    '384.400 km a la velocidad de la luz hasta el Control de Misión.': '384,400 km at the speed of light to Mission Control.',
    'El médico de vuelo ve las alertas y responde antes de que sean un problema.': 'The flight surgeon sees the alerts and responds before they become a problem.',
    'BRAZALETE': 'WRISTBAND', 'ANTENA': 'ANTENNA', 'BASE LUNAR': 'LUNAR BASE', 'TIERRA · CONTROL': 'EARTH · CONTROL', 'MÉDICO': 'DOCTOR',
    'Una app, cuatro miradas': 'One app, four views', 'Cada uno ve lo que necesita.': 'Everyone sees what they need.',
    'El brazalete mide solo. Cada tripulante registra su día en un minuto: cómo durmió, cómo se siente, cuánto estrés tiene y qué comió. Con eso, cada rol ve su propia vista.': 'The wristband measures on its own. Each crewmember logs their day in a minute: how they slept, how they feel, how stressed they are and what they ate. With that, each role gets its own view.',
    'Ingresar a FAVALORO →': 'Enter FAVALORO →',
    'Demo con datos simulados. No reemplaza una evaluación médica.': 'Demo with simulated data. Not a substitute for a medical evaluation.',
    'FAVALORO · The Muds Devs · NASA Space Apps 2026': 'FAVALORO · The Muds Devs · NASA Space Apps 2026',
    'Fotos: NASA (dominio público) · Paisaje: pack SELENE': 'Photos: NASA (public domain) · Landscape: SELENE pack',
    'Volver a la superficie ↑': 'Back to the surface ↑',
    'Hecho para el NASA Space Apps Challenge 2026 · con datos abiertos de la NASA': 'Made for the NASA Space Apps Challenge 2026 · built with NASA open data',
    // Roles
    'Comandante': 'Commander', 'Especialista de misión': 'Mission specialist', 'Oficial médico': 'Medical officer', 'Tripulante': 'Crewmember',
    'Reporte diario de la tripulación, decisiones y qué hacer en una emergencia.': 'Daily crew report, decisions and what to do in an emergency.',
    'Entornos hostiles y características de la nave, y los riesgos que traen para la tripulación.': 'Hostile environments and spacecraft conditions, and the risks they bring to the crew.',
    'Vista médica completa y detallada de cada tripulante, con rangos y alertas clínicas.': 'Full, detailed medical view of each crewmember, with ranges and clinical alerts.',
    'Tu control diario: lo que mide el brazalete, cómo te sentís y qué comiste.': 'Your daily check: what the wristband measures, how you feel and what you ate.',
    'Ingresar como comandante →': 'Sign in as commander →', 'Ingresar como especialista de misión →': 'Sign in as mission specialist →',
    'Ingresar como oficial médico →': 'Sign in as medical officer →', 'Ingresar como tripulante →': 'Sign in as crewmember →',
    // Ingreso
    '← Volver al inicio': '← Back to home', 'Ingreso a la misión': 'Mission sign-in', '¿Quién está a bordo?': 'Who’s on board?',
    'Elegí tu rol. Cada uno ve lo que necesita para cuidar a la tripulación.': 'Choose your role. Each one sees what it needs to look after the crew.',
    'Demo sin contraseñas · los datos quedan en este navegador': 'Demo without passwords · data stays in this browser',
    'Elegí un rol': 'Choose a role', 'Entrar como comandante →': 'Enter as commander →', 'Entrar como especialista de misión →': 'Enter as mission specialist →',
    'Entrar como oficial médico →': 'Enter as medical officer →', 'Entrar como tripulante →': 'Enter as crewmember →',
    'Astronauta 1 · Ingeniera de vuelo': 'Astronaut 1 · Flight engineer', 'Astronauta 2 · Comandante': 'Astronaut 2 · Commander', 'Astronauta 3 · Piloto': 'Astronaut 3 · Pilot',
    'Astronauta 1': 'Astronaut 1', 'Astronauta 2': 'Astronaut 2', 'Astronauta 3': 'Astronaut 3', 'Ingeniera de vuelo': 'Flight engineer', 'Piloto': 'Pilot',
    // Barra de la app
    'Pedir ayuda': 'Ask for help', 'Ayuda pedida ✓': 'Help requested ✓', 'Salir': 'Sign out', 'Base lunar · tripulación de 3': 'Lunar base · crew of 3',
    'Mi día': 'My day', 'Mente y estrés': 'Mind & stress', 'Tests': 'Tests', 'Familia y diario': 'Family & diary', 'Registros': 'Logs', 'Historial': 'History',
    'Parte del día': 'Daily report', '¿Apto para la tarea?': 'Fit for the task?', 'Reportes': 'Reports', 'Decisiones': 'Decisions', 'Emergencias': 'Emergencies', 'Evolución': 'Trends',
    'Entorno': 'Environment', 'Nave': 'Spacecraft', 'Soporte vital': 'Life support', 'Radiación solar': 'Solar radiation', 'Riesgos': 'Risks',
    'Tripulación': 'Crew', 'Ficha clínica': 'Medical chart', 'Mente': 'Mind', 'Botiquín': 'Medical kit', 'Consulta Tierra': 'Earth consult', 'Plan NASA': 'NASA plan', 'Alertas': 'Alerts',
    'Estación Espacial': 'Space Station', 'Base lunar': 'Lunar base', 'Hábitat en Marte': 'Mars habitat',
    // Asistente (marco)
    'Asistente': 'Assistant', 'Asistente FAVALORO': 'FAVALORO assistant', 'Listo para charlar': 'Ready to talk', 'Hablando…': 'Speaking…', 'Escuchando…': 'Listening…', 'Pensando…': 'Thinking…',
    'Alertas: con sonido': 'Alerts: sound on', 'Voz: sí': 'Voice: on', 'Voz: no': 'Voice: off', 'Cerrar': 'Close',
    'Charla': 'Chat', 'Guía': 'Guide', 'Emergencia': 'Emergency', 'Ajustes': 'Settings',
    'Hablar': 'Talk', 'Escuchando': 'Listening', 'O escribí acá…': 'Or type here…', 'Enviar': 'Send', 'Escribile al asistente': 'Write to the assistant',
    'Responde con los datos de la misión · no reemplaza al médico': 'Answers with mission data · not a substitute for a doctor',
    'Silenciar el sonido y la voz de las alertas por 15 minutos': 'Mute alert sound and voice for 15 minutes',
    'Preguntas rápidas': 'Quick questions', 'Secciones del asistente': 'Assistant sections', 'Secciones': 'Sections',
    // Llamada de emergencia
    'Llamada de emergencia': 'Emergency call', '¿Estás bien?': 'Are you OK?', 'segundos para responder': 'seconds to answer',
    'Estoy bien': 'I’m OK', 'Necesito ayuda': 'I need help',
    'Si nadie responde, FAVALORO avisa al compañero más cercano, al oficial médico y a Control de Misión.': 'If nobody answers, FAVALORO alerts the nearest crewmate, the medical officer and Mission Control.',
    // Vista (accesibilidad)
    'Vista': 'Display', 'Tema': 'Theme', 'Oscuro': 'Dark', 'Claro': 'Light', 'Automático': 'Automatic',
    'Tamaño de letra': 'Text size', 'Normal': 'Normal', 'Grande': 'Large', 'Muy grande': 'Extra large', 'Contraste': 'Contrast', 'Alto': 'High',
    'Se guarda en este dispositivo y vale para el inicio, el ingreso y la app. La foto de portada del inicio queda siempre como foto del espacio.': 'Saved on this device for the home page, sign-in and app. The home cover photo always stays a space photo.',
    'Vista: tema, tamaño de letra y contraste': 'Display: theme, text size and contrast', 'Principal': 'Main', 'Rol': 'Role',
    // Indicadores
    'Oxígeno en sangre': 'Blood oxygen', 'Temperatura': 'Temperature', 'Respiración': 'Breathing', 'Sueño anoche': 'Sleep last night', 'Despertares': 'Awakenings',
    'Actividad física': 'Physical activity', 'Radiación hoy': 'Radiation today', 'Dosis de carrera': 'Career dose', 'Glucosa': 'Glucose', 'Presión arterial': 'Blood pressure',
    'Tiempo de reacción': 'Reaction time', 'Ánimo': 'Mood', 'Hidratación': 'Hydration', 'rpm': 'br/min', 'vasos': 'glasses', 'de 5': 'of 5', 'de 600 mSv': 'of 600 mSv',
    '60–100 lpm en reposo': '60–100 bpm at rest', '95 % o más': '95 % or more', '12–20 por minuto': '12–20 per minute', '7 h o más': '7 h or more', '2 o menos': '2 or fewer',
    '45 min o más': '45 min or more', '70–99 mg/dL en ayunas': '70–99 mg/dL fasting', 'menos de 120/80 mmHg': 'under 120/80 mmHg', 'menos de 350 ms': 'under 350 ms',
    'solo registro': 'log only', 'menos de 600 mSv · NASA-STD-3001': 'under 600 mSv · NASA-STD-3001', '4 o 5 de 5': '4 or 5 of 5', '6 vasos o más': '6 glasses or more',
    'Registro': 'Log', 'Test': 'Test',
    'Inicio: la Tierra saliendo sobre la Luna': 'Home: Earth rising over the Moon',
    'Astronauta del Apollo 11 parado sobre la superficie de la Luna, con el traje espacial completo.': 'Apollo 11 astronaut standing on the surface of the Moon in a full spacesuit.',
    'El camino del dato: del brazalete a la app, a la antena de la base, a la Tierra y al médico, dibujado en cuatro tramos.': 'The data’s path: from the wristband to the app, to the base antenna, to Earth and to the doctor, drawn in four legs.',
  };

  /* ---------- Frases con números: patrón → traducción ---------- */
  const RX = [
    [/^Día (\d+) · (\d\d:\d\d) · (.+)$/, (m, d, h, e) => `Day ${d} · ${h} · ${tr(e)}`],
    [/^(.+) · Tramo (\d)\/(\d)$/, (m, w, a, b) => `${tr(w)} · Leg ${a}/${b}`],
    [/^(.+) · enfocado$/, (m, w) => `${tr(w)} · locked`],
    // «Sensor, lugar» (etiquetas de los sensores del escaneo).
    [/^([^,·]+), ([^,·]+)$/, (m, a, b) => (EN[a] && EN[b] ? `${EN[a]}, ${EN[b]}` : m)],
    // Números con coma decimal y puntos de miles (formato argentino) → formato inglés.
    [/^-?\d{1,3}(\.\d{3})+$/, (m) => m.replace(/\./g, ',')],
    [/^-?\d+,\d+$/, (m) => m.replace(',', '.')],
  ];
  const WHEN = {'1 s': '1 s', 'Al instante': 'Instantly', '1,3 s': '1.3 s', 'En vivo': 'Live'};
  Object.assign(EN, WHEN);

  // Diccionario adicional que cargan las otras etapas (vistas por rol, asistente).
  // Las frases con números fijos («pausa de 10 minutos») también se guardan como plantilla,
  // así siguen encontrándose cuando la app arma la frase con otro valor en el medio.
  const TOK = /\{#\}|\d+(?:[.,]\d+)*/g;
  function add(dict, rx, last) {
    for (const k in dict || {}) {
      EN[k] = dict[k];
      if (/\d/.test(k)) {
        const a = k.match(TOK) || [], b = String(dict[k]).match(TOK) || [];
        const tk = k.replace(TOK, '{#}');
        if (a.length === b.length && EN[tk] == null) EN[tk] = String(dict[k]).replace(TOK, '{#}');
      }
    }
    if (rx) RX.push(...rx);
    if (last) LAST.push(...last);
  }
  // Reglas generales («Título: texto», «Frase.»): se prueban al final, después de partir el texto en segmentos.
  const LAST = [];
  const viaLast = (k) => { for (const [r, f] of LAST) { if (r.test(k)) { const v = k.replace(r, f); if (v !== k) return v; } } return null; };

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  // Frases con números: se buscan como plantilla («3 de 14» → «{#} de {#}») y los números
  // vuelven en el mismo orden, pasados a formato inglés (coma decimal → punto; punto de miles → coma).
  const NUM = /\d+(?:[.,]\d+)*/g;
  const tpl = (k) => k.replace(NUM, '{#}');
  const enNum = (n) => (/,/.test(n) ? n.replace(/\./g, '\u0000').replace(',', '.').replace(/\u0000/g, ',') : /^\d{1,3}(\.\d{3})+$/.test(n) ? n.replace(/\./g, ',') : n);
  function fromTpl(k) {
    const t = EN[tpl(k)]; if (t == null) return null;
    const nums = k.match(NUM) || []; let i = 0;
    return t.replace(/\{#\}/g, () => enNum(nums[i++] ?? ''));
  }
  function lookup(k) {
    let v = EN[k];
    if (v == null && /\d/.test(k)) v = fromTpl(k);
    if (v == null) for (const [r, f] of RX) { if (f && r.test(k)) { v = k.replace(r, f); if (v === k) v = null; else break; } }
    return v;
  }
  // Textos compuestos (reportes, listas con «·»): se traducen por partes y se conservan los separadores.
  const SEP = /(\n+|\s+-\s+|\s+·\s+|(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚ¿¡[]))/;
  function bySegments(s) {
    const parts = String(s).split(SEP); if (parts.length < 2) return null;
    let hit = 0;
    const out = parts.map((p, i) => {
      if (i % 2) return p; // separador
      const k = norm(p); if (!k) return p;
      const v = lookup(k) ?? viaLast(k); if (v == null) return p;
      hit++; return p.replace(/\S[\s\S]*\S|\S/, () => v);
    });
    return hit ? out.join('') : null;
  }
  function tr(s) {
    if (lang !== 'en' || s == null) return s;
    const k = norm(String(s)); if (!k) return s;
    const v = lookup(k);
    if (v == null) { const seg = bySegments(s) ?? viaLast(k); return seg == null ? s : seg; }
    // Conserva los espacios de los bordes (separan textos en línea).
    const lead = String(s).match(/^\s*/)[0], tail = String(s).match(/\s*$/)[0];
    return lead + v + tail;
  }

  /* ---------- Traducción de la pantalla ---------- */
  const ATTR = ['aria-label', 'placeholder', 'title', 'alt'];
  const orig = new WeakMap(); // nodo de texto → {src, out}
  const origA = new WeakMap(); // elemento → {attr: {src, out}}
  const skip = (el) => !el || el.closest('script, style, textarea, [data-noi18n]');
  function doText(n) {
    if (skip(n.parentElement)) return;
    const cur = n.nodeValue, rec = orig.get(n);
    if (rec && cur === rec.out) return;
    const src = cur, out = tr(src);
    orig.set(n, {src, out});
    if (out !== src) n.nodeValue = out;
  }
  function doAttrs(el) {
    // Los campos de texto no se traducen por dentro, pero su texto de ayuda (placeholder) sí.
    if (!el || el.closest('script, style, [data-noi18n]')) return;
    let recs = origA.get(el); if (!recs) { recs = {}; origA.set(el, recs); }
    for (const a of ATTR) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a), rec = recs[a];
      if (rec && cur === rec.out) continue;
      const out = tr(cur); recs[a] = {src: cur, out};
      if (out !== cur) el.setAttribute(a, out);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || skip(root)) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  // Vuelve al español: restituye el texto original de cada nodo traducido.
  function unwalk(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const r = orig.get(n); if (r && n.nodeValue === r.out) n.nodeValue = r.src; orig.delete(n); }
      else { const recs = origA.get(n); if (recs) { for (const a in recs) if (n.getAttribute(a) === recs[a].out) n.setAttribute(a, recs[a].src); origA.delete(n); } }
    }
  }
  const mo = new MutationObserver((list) => {
    if (lang !== 'en') return;
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
  });

  function apply(quiet) {
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'FAVALORO · Health monitoring for astronauts' : 'FAVALORO · Monitoreo de salud para astronautas';
    if (!document.body) return;
    if (lang === 'en') walk(document.body); else unwalk(document.body);
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
      b.textContent = lang === 'en' ? 'ES' : 'EN';
      b.setAttribute('aria-label', lang === 'en' ? 'Ver en español' : 'View in English');
      b.setAttribute('lang', lang === 'en' ? 'es' : 'en');
    });
    if (!quiet) document.dispatchEvent(new CustomEvent('fv:lang', {detail: lang}));
  }
  function set(l) {
    lang = l === 'es' ? 'es' : 'en';
    try { localStorage.setItem('fv_lang', lang); } catch (e) { /* idem */ }
    // Se observa de nuevo antes de avisar al resto: lo que se redibuje al cambiar de idioma también se traduce.
    mo.disconnect(); apply(true); start();
    document.dispatchEvent(new CustomEvent('fv:lang', {detail: lang}));
  }
  // Se carga en <head>: observa el documento entero, así lo que el navegador va leyendo del HTML
  // ya se traduce antes de mostrarse (sin un destello en español).
  function start() { mo.observe(document.documentElement, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR}); }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang-toggle]'); if (b) { e.preventDefault(); set(lang === 'en' ? 'es' : 'en'); } });
  document.documentElement.lang = lang;
  start();
  document.addEventListener('DOMContentLoaded', () => apply());

  return {
    get lang() { return lang; }, set, tr, add,
    // Para revisar la cobertura: ¿hay traducción para esta frase?
    has: (s) => lookup(norm(String(s))) != null || bySegments(s) != null || viaLast(norm(String(s))) != null, tpl,
    // Para la voz: idioma del reconocimiento y la síntesis.
    speechLang: () => (lang === 'en' ? 'en-US' : 'es-AR'),
  };
})();
