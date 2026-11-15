/* =====================================================================
   FAVALORO · datos y reglas compartidas
   Todo se guarda en este navegador (localStorage), así los cuatro roles
   ven la misma tripulación. Los datos de salud son simulados y los
   umbrales son orientativos: deben validarlos los médicos de la misión.
   Fuentes de las reglas: monitor del brazalete (The Muds Devs) y app de
   salud mental y nutrición de nuestra compañera.
   ===================================================================== */
window.FV = (() => {
'use strict';
const LS = 'favaloro_v1';
const DAY = 864e5;

/* ---------------- tripulación y roles ---------------- */
const CREW = [
  {id: 'a1', name: 'Astronauta 1', job: 'Ingeniera de vuelo', sc: 'normal'},
  {id: 'a2', name: 'Astronauta 2', job: 'Especialista científico', sc: 'estres'},
  {id: 'a3', name: 'Astronauta 3', job: 'Piloto', sc: 'fatiga'},
];
const ROLES = {
  cmd: {n: 'Comandante', d: 'Reporte diario de la tripulación, decisiones y qué hacer en una emergencia.', ico: 'M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z'},
  esp: {n: 'Especialista de misión', d: 'Entornos hostiles y características de la nave, y los riesgos que traen para la tripulación.', ico: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4l2 6-2 6-2-6z'},
  med: {n: 'Oficial médico', d: 'Vista médica completa y detallada de cada tripulante, con rangos y alertas clínicas.', ico: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z'},
  crew: {n: 'Tripulante', d: 'Tu control diario: lo que mide el brazalete, cómo te sentís y qué comiste.', ico: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z'},
};

/* ---------------- brazalete: escenarios simulados ---------------- */
const SC = {
  normal: {hr: 72, spo2: 98, temp: 36.7, rr: 15, sleep: 7.4, wake: 1, act: 52},
  estres: {hr: 104, spo2: 97, temp: 37.0, rr: 21, sleep: 6.1, wake: 3, act: 22},
  fatiga: {hr: 64, spo2: 96, temp: 36.5, rr: 14, sleep: 4.9, wake: 5, act: 10},
  fiebre: {hr: 116, spo2: 93, temp: 38.4, rr: 24, sleep: 6.4, wake: 4, act: 4},
  hipoxia: {hr: 114, spo2: 88, temp: 36.9, rr: 26, sleep: 6.1, wake: 3, act: 6},
};
const live = {};
CREW.forEach((c) => { live[c.id] = {...SC[c.sc], dose: 0.21, h: {hr: [], spo2: [], temp: [], rr: []}, real: {}, override: null}; });
const drift = (c, t, n) => c + (t - c) * 0.18 + (Math.random() - 0.5) * n;
/* Lectura real de un dispositivo Bluetooth: pisa la simulación de ese dato mientras siga llegando. */
function setReal(uid, k, val) { const v = live[uid]; v[k] = val; v.real[k] = Date.now(); }
const isReal = (uid, k) => Date.now() - (live[uid].real[k] || 0) < 15000;
/* Para probar los avisos: cambia el escenario de un tripulante por un rato. */
function simulate(uid, sc, secs) { live[uid].override = {sc, until: Date.now() + secs * 1000}; }
function tick() {
  CREW.forEach((c) => {
    const v = live[c.id], ov = v.override && v.override.until > Date.now() ? v.override.sc : null, b = SC[ov || c.sc];
    const dr = (k, n, cap) => { if (!isReal(c.id, k)) v[k] = cap ? Math.min(cap, drift(v[k], b[k], n)) : drift(v[k], b[k], n); };
    dr('hr', 4); dr('spo2', 0.6, 100); dr('temp', 0.05); dr('rr', 1.2);
    v.sleep = b.sleep; v.wake = b.wake; v.act = drift(v.act, b.act, 0.6); v.dose += 0.0004 * envOf().radK;
    ['hr', 'spo2', 'temp', 'rr'].forEach((k) => { v.h[k].push(v[k]); if (v.h[k].length > 40) v.h[k].shift(); });
  });
  tickShip();
}
for (let i = 0; i < 30; i++) CREW.forEach((c) => { const v = live[c.id], b = SC[c.sc]; v.hr = drift(v.hr, b.hr, 4); v.spo2 = Math.min(100, drift(v.spo2, b.spo2, 0.6)); v.temp = drift(v.temp, b.temp, 0.05); v.rr = drift(v.rr, b.rr, 1.2); ['hr', 'spo2', 'temp', 'rr'].forEach((k) => v.h[k].push(v[k])); });

/* Rangos orientativos de la demo: 0 en rango · 1 a vigilar · 2 alerta · null sin dato. */
const R = {
  hr: (v) => (v >= 60 && v <= 100 ? 0 : (v >= 50 && v < 60) || (v > 100 && v <= 120) ? 1 : 2),
  spo2: (v) => (v >= 95 ? 0 : v >= 92 ? 1 : 2),
  temp: (v) => (v >= 36.1 && v <= 37.2 ? 0 : v > 37.2 && v <= 38 ? 1 : v < 35.5 || v > 38 ? 2 : 1),
  rr: (v) => (v >= 12 && v <= 20 ? 0 : (v > 20 && v <= 24) || (v >= 10 && v < 12) ? 1 : 2),
  sleep: (v) => (v >= 7 ? 0 : v >= 6 ? 1 : 2),
  wake: (v) => (v <= 2 ? 0 : v <= 4 ? 1 : 2),
  act: (v) => (v >= 45 ? 0 : v >= 20 ? 1 : 2),
  glu: (v) => (v == null ? null : v >= 70 && v <= 99 ? 0 : v >= 100 && v <= 125 ? 1 : 2),
  bp: (s, d) => (s == null || d == null ? null : s >= 140 || d >= 90 || s < 90 ? 2 : s >= 120 || d >= 80 ? 1 : 0),
  react: (v) => (v == null ? null : v < 350 ? 0 : v <= 500 ? 1 : 2),
};
const RANGE = {hr: '60–100 lpm en reposo', spo2: '95 % o más', temp: '36,1–37,2 °C', rr: '12–20 por minuto', sleep: '7 h o más', wake: '2 o menos', act: '45 min o más', glu: '70–99 mg/dL en ayunas', bp: 'menos de 120/80 mmHg', react: 'menos de 350 ms', dose: 'solo registro'};
/* ---------------- Sueño: fases de la noche ----------------
   El brazalete estima las fases con el movimiento (actigrafía, como el Actiwatch que usa la NASA)
   y la variabilidad del pulso, en bloques de 5 minutos: despierto, ligero (N1–N2), profundo (N3) y REM.
   Es una estimación, no una polisomnografía. Referencias de adultos: profundo 13–23 %, REM 20–25 %,
   eficiencia 85 % o más, dormirse en menos de 30 min. */
const SLEEP_P = {
  normal: {deep: 0.2, rem: 0.23, lat: 12, wlen: 1},
  estres: {deep: 0.11, rem: 0.17, lat: 38, wlen: 2},
  fatiga: {deep: 0.12, rem: 0.14, lat: 8, wlen: 2},
  fiebre: {deep: 0.1, rem: 0.12, lat: 30, wlen: 2},
};
const STAGES = {W: 'Despierto', R: 'REM', L: 'Ligero', D: 'Profundo'};
function sleepNight(id) {
  const c = CREW.find((x) => x.id === id), v = live[id];
  const ov = v.override && v.override.until > Date.now() ? v.override.sc : null;
  const p = SLEEP_P[ov || c.sc] || SLEEP_P.normal, E = 5, CYC = 18; // bloques de 5 min · ciclos de 90 min
  const nSleep = Math.round(v.sleep * 60 / E), nC = Math.max(1, Math.round(nSleep / CYC));
  const dW = [], rW = [];
  for (let k = 0; k < nC; k++) { dW.push(Math.max(0.05, 1 - k * 0.32)); rW.push(0.45 + k * 0.3); }
  const sd = dW.reduce((a, b) => a + b, 0), sr = rW.reduce((a, b) => a + b, 0);
  const lat = Math.round(p.lat / E), hyp = Array(lat).fill('W');
  let left = nSleep;
  for (let k = 0; k < nC && left > 0; k++) {
    const len = k === nC - 1 ? left : Math.min(left, CYC);
    left -= len;
    let deep = Math.round(nSleep * p.deep * dW[k] / sd), rem = Math.round(nSleep * p.rem * rW[k] / sr);
    while (deep + rem > len - 2 && (deep || rem)) { if (deep >= rem) deep--; else rem--; }
    const light = len - deep - rem, l1 = Math.ceil(light * 0.55);
    hyp.push(...Array(l1).fill('L'), ...Array(deep).fill('D'), ...Array(light - l1).fill('L'), ...Array(rem).fill('R'));
  }
  // Despertares repartidos a lo largo de la noche.
  for (let j = v.wake; j >= 1; j--) {
    const pos = Math.round(lat + j * (hyp.length - lat) / (v.wake + 1));
    hyp.splice(pos, 0, ...Array(p.wlen).fill('W'));
  }
  const min = {W: 0, L: 0, D: 0, R: 0};
  hyp.forEach((s) => { min[s] += E; });
  const asleep = min.L + min.D + min.R, bed = hyp.length * E;
  const pct = {L: min.L / asleep, D: min.D / asleep, R: min.R / asleep};
  const eff = asleep / bed, remLat = (hyp.indexOf('R') - lat) * E;
  const issues = [];
  if (v.sleep < 6) issues.push('corto');
  if (v.wake >= 3 || eff < 0.85) issues.push('interrumpido');
  if (pct.D < 0.13) issues.push('poco profundo');
  if (pct.R < 0.18) issues.push('poco REM');
  if (p.lat > 30) issues.push('le cuesta dormirse');
  const tipo = !issues.length ? 'Reparador' : v.sleep < 6 && v.wake >= 4 ? 'Corto y fragmentado' : issues.includes('poco profundo') && issues.includes('le cuesta dormirse') ? 'Liviano, con dificultad para dormirse' : issues.includes('poco profundo') ? 'Liviano: poco sueño profundo' : issues.includes('interrumpido') ? 'Interrumpido' : 'Mejorable';
  const s = !issues.length ? 0 : v.sleep < 5 || (pct.D < 0.13 && v.wake >= 4) || issues.length >= 4 ? 2 : 1;
  return {hyp, E, start: 23 * 60, min, pct, asleep, bed, eff, lat: p.lat, remLat, issues, tipo, s, wake: v.wake};
}
const STATE = ['En rango', 'A vigilar', 'Alerta', 'Emergencia'];
const color = (s) => (s === null || s === undefined ? 'var(--none)' : s === 'i' ? 'var(--earth)' : ['var(--ok)', 'var(--warn)', 'var(--bad)', 'var(--bad)'][s]);
const label = (s) => (s === null || s === undefined ? 'Sin dato' : s === 'i' ? 'Registro' : STATE[s]);
const worst = (a) => { const v = a.filter((x) => x !== null && x !== undefined && x !== 'i'); return v.length ? Math.max(...v) : null; };
const f1 = (n) => n.toFixed(1).replace('.', ',');

/* ---------------- salud mental (cuestionario de la compañera) ---------------- */
const Q = [
  {d: 'sleep', t: '¿Cuántas horas dormiste anoche?', o: ['Menos de 4', '4 a 5', '6', '7 a 9', 'Más de 9'], lv: [2, 2, 1, 0, 1]},
  {d: 'sleep', t: '¿Cuánto tardaste en dormirte?', o: ['Menos de 20 min', '20 a 40 min', 'Más de 40 min'], lv: [0, 1, 2]},
  {d: 'sleep', t: '¿Cuántas veces te despertaste durante la noche?', o: ['0 o 1', '2 o 3', '4 o más'], lv: [0, 1, 2]},
  {d: 'sleep', t: 'Al despertar, ¿te sentiste descansado?', s: 'good', a: 'Nada', b: 'Totalmente'},
  {d: 'mood', t: '¿Cómo estuvo tu ánimo hoy?', s: 'good', a: 'Muy mal', b: 'Muy bien'},
  {d: 'mood', t: '¿Tuviste ganas e interés por lo que hacés?', s: 'good', a: 'Ninguno', b: 'Mucho'},
  {d: 'mood', t: '¿Te sentiste triste o vacío?', s: 'bad', a: 'Nada', b: 'Muchísimo'},
  {d: 'mood', t: '¿Sentiste que nada va a mejorar?', s: 'bad', a: 'Nada', b: 'Muchísimo'},
  {d: 'anx', t: '¿Te sentiste nervioso o tenso?', s: 'bad', a: 'Nada', b: 'Muchísimo'},
  {d: 'anx', t: '¿Tuviste preocupaciones que no lográs frenar?', s: 'bad', a: 'Ninguna', b: 'Muchísimas'},
  {d: 'anx', t: '¿Notaste corazón acelerado, falta de aire o temblores sin motivo?', s: 'bad', a: 'Nunca', b: 'Todo el tiempo'},
  {d: 'str', t: '¿Te sentiste sobrepasado por las tareas?', s: 'bad', a: 'Nada', b: 'Totalmente'},
  {d: 'str', t: '¿Estuviste irritable o con poca paciencia?', s: 'bad', a: 'Nada', b: 'Muchísimo'},
  {d: 'str', t: '¿Quisiste aislarte de tus compañeros?', s: 'bad', a: 'Nada', b: 'Totalmente'},
];
Q.forEach((q) => { if (q.s) { q.o = ['1', '2', '3', '4', '5']; q.lv = q.s === 'good' ? [2, 2, 1, 0, 0] : [0, 0, 1, 2, 2]; } });
const DOM = {sleep: ['Sueño', 0.3], mood: ['Ánimo', 0.3], anx: ['Ansiedad', 0.25], str: ['Estrés y convivencia', 0.15]};
const RISK = [0, 45, 85];
const stOf = (i) => (i > 65 ? 3 : i > 45 ? 2 : i > 25 ? 1 : 0);
function calc(ans) {
  const by = {}; let any = false, crit = 0;
  Q.forEach((q, i) => { if (ans[i] === undefined) return; any = true; const l = q.lv[ans[i]]; (by[q.d] = by[q.d] || []).push(l); if (l === 2) crit++; });
  let w = 0, tot = 0; const ds = {};
  for (const d in by) { const r = by[d].map((l) => RISK[l]); ds[d] = 0.6 * r.reduce((a, b) => a + b) / r.length + 0.4 * Math.max(...r); w += DOM[d][1]; tot += DOM[d][1] * ds[d]; }
  const idx = w ? Math.round(tot / w) : null;
  const cd = Object.keys(by).filter((d) => by[d].includes(2)).length, why = [];
  if (idx !== null && idx > 65) why.push('El nivel de malestar general es muy alto.');
  if (ans[0] === 0) why.push('Durmió menos de 4 horas.');
  if (ans[7] === 4) why.push('Siente que nada va a mejorar, en grado máximo.');
  if (cd >= 2) why.push('Hay respuestas preocupantes en ' + cd + ' áreas a la vez.');
  let s = null;
  if (!any) s = null; else if (why.length) s = 3; else if (!crit && idx <= 25) s = 0; else if (!crit && idx <= 45) s = 1; else s = 2;
  return {s, idx, ds, why, any};
}

/* ---------------- nutrición (umbrales provisorios de la planilla) ---------------- */
const NQ = [['ap', 'Apetito de hoy', ['Normal', 'Disminuido', 'Muy bajo']], ['me', '¿Comiste tus comidas del día?', ['Todas', 'Algunas', 'Casi ninguna']], ['fl', 'Líquidos que tomaste', ['Suficientes', 'Pocos', 'Muy pocos']], ['gi', 'Molestias digestivas', ['Ninguna', 'Leves', 'Marcadas']]];
const NCFG = {lossW: 2, lossB: 5};

/* ---------------- entornos y nave (especialista de misión) ---------------- */
// Valores orientativos de referencia: radiación diaria medida por ISS (~0,5 mSv), Chang'e 4 en la Luna (~1,4 mSv) y Curiosity en Marte (~0,7 mSv).
const ENV = {
  iss: {n: 'Estación Espacial', sub: 'Órbita baja, 400 km', g: 'Microgravedad (~0 g)', gk: 1, rad: '≈ 0,5 mSv/día', radK: 1, lat: 'Menos de 1 s', latK: 0, dist: '400 km', ext: '−157 a +121 °C', haz: 'Desechos orbitales y radiación de la anomalía del Atlántico Sur'},
  luna: {n: 'Base lunar', sub: 'Mare Tranquillitatis', g: '0,16 g', gk: 0.8, rad: '≈ 1,4 mSv/día', radK: 2.6, lat: '1,3 s', latK: 1, dist: '384.400 km', ext: '−173 a +127 °C', haz: 'Polvo lunar abrasivo y tormentas solares sin campo magnético'},
  marte: {n: 'Hábitat en Marte', sub: 'Cráter Jezero', g: '0,38 g', gk: 0.6, rad: '≈ 0,7 mSv/día', radK: 1.4, lat: '4 a 24 min', latK: 2, dist: '55 a 400 millones de km', ext: '−125 a +20 °C', haz: 'Tormentas de polvo, percloratos en el suelo y aislamiento total'},
};
const ship = {p: 101.2, o2: 21.0, co2: 2.6, t: 22.4, hu: 46};
function tickShip() {
  ship.p = drift(ship.p, 101.3, 0.15); ship.o2 = drift(ship.o2, 21, 0.08); ship.co2 = Math.max(0.5, drift(ship.co2, state.co2Target || 2.6, 0.12));
  ship.t = drift(ship.t, 22.5, 0.1); ship.hu = drift(ship.hu, 47, 0.8);
}
const SHIPR = {
  p: (v) => (v >= 97 && v <= 103 ? 0 : v >= 94 && v <= 105 ? 1 : 2),
  o2: (v) => (v >= 19.5 && v <= 23.5 ? 0 : v >= 18 && v <= 25 ? 1 : 2),
  co2: (v) => (v <= 3 ? 0 : v <= 4 ? 1 : 2),
  t: (v) => (v >= 18 && v <= 27 ? 0 : v >= 15 && v <= 30 ? 1 : 2),
  hu: (v) => (v >= 25 && v <= 70 ? 0 : v >= 15 && v <= 80 ? 1 : 2),
};

/* ---------------- guía de emergencias (asistente de ayuda de la compañera) ---------------- */
const AL = [
  {n: 'Leve', c: 'var(--ok)', d: 'Molestias pasajeras que no impiden trabajar. Se resuelven con cuidados simples.', it: [
    ['Dormiste mal', 'Mantené horarios fijos de sueño.|Bajá luces y pantallas una hora antes de dormir.|Evitá la cafeína en las 6 horas previas.|Anotalo en tu próximo chequeo.'],
    ['Ánimo bajo o extrañás a tu familia', 'Hablá o escribí a tierra: un mensaje corto ya ayuda.|Compartí un rato con un compañero, sin tema de trabajo.|Si pasan 2 días y no mejora, pasá a Moderado.'],
    ['Estrés por las tareas', 'Frená 2 minutos: inhalá 4 segundos, exhalá 6, repetí 5 veces.|Dividí lo pendiente en pasos chicos.|Si te sobrepasa, pedile al Comandante que reparta la carga.']]},
  {n: 'Moderado', c: 'var(--warn)', d: 'Algo persiste o se repite y empieza a afectar el día. Avisar hoy o mañana.', it: [
    ['Varios días durmiendo menos de 5 horas', 'Avisar al médico de a bordo hoy o mañana.|Evitar tareas críticas con mucho sueño.|Siesta corta de 20 minutos si se puede.'],
    ['Ansiedad o irritabilidad que no baja', 'Respiración lenta y ejercicio.|Conferencia con apoyo psicológico en los próximos días.|Repetir el chequeo mañana.'],
    ['Come muy poco o baja de peso hace 2 días o más', 'Registrar lo que come en Nutrición.|Avisar al médico de a bordo.|Comidas pequeñas y frecuentes, y líquidos.']]},
  {n: 'Grave', c: 'var(--org)', d: 'No puede funcionar con normalidad. Avisar ahora al médico de a bordo y no quedarse solo.', it: [
    ['Siente que nada va a mejorar o que no puede más', 'Avisar hoy al médico de a bordo y a apoyo psicológico.|Que un compañero de confianza lo acompañe.|Dejar las tareas críticas hasta la evaluación.'],
    ['Ataque de pánico', 'Sentarse y apoyar bien los pies: pasa en pocos minutos.|Inhalar 4 segundos y exhalar 6.|Nombrar 5 cosas que ve y 3 que puede tocar.'],
    ['Dolor fuerte, fiebre o vómitos repetidos', 'Avisar ya al médico de a bordo.|Reposo y líquidos en sorbos.|No automedicarse.']]},
  {n: 'Emergencia', c: 'var(--bad)', d: 'Riesgo para la vida. Actuar primero, explicar después.', it: [
    ['No respira, inconsciente, dolor de pecho fuerte o sangrado intenso', 'Activar la alarma: médico de a bordo y Comandante de inmediato.|Avisar a Control de Misión.|Si no respira, reanimación y equipo médico.|Para un sangrado: presión fuerte con un paño limpio.'],
    ['Alguien quiere hacerse daño', 'Quedarse con la persona, escuchar con calma y sin juzgar.|No dejarla sola ni un momento.|Avisar ya al médico de a bordo y al Comandante, y pedir conferencia urgente con apoyo psicológico.'],
    ['Fuego, humo, fuga o pérdida de presión', 'Activar la alarma y avisar a toda la tripulación y a Control de Misión.|Seguir el procedimiento: equipos de protección, aislar el módulo, ir a la zona segura.|Recuento de tripulantes.']]},
];

/* ---------------- estado guardado ---------------- */
let state = {checks: [], nutri: [], regs: [], decisions: [], calls: [], sent: [], env: 'luna', co2Target: 2.6, session: null};
function load() { try { const o = JSON.parse(localStorage.getItem(LS) || 'null'); if (o) state = {...state, ...o}; } catch (e) { /* sin almacenamiento: queda en memoria */ } }
let saveVer = 0;
function save() { saveVer++; try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) { /* idem */ } }
const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dayOf = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dl = (k) => k.slice(8) + '/' + k.slice(5, 7);
const fmt = (t) => new Date(t).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});

/* Datos de demostración: 10 días de historia por tripulante, coherentes con su escenario. */
function seed() {
  const now = Date.now();
  state.checks = state.checks.filter((c) => !c.demo); state.nutri = state.nutri.filter((c) => !c.demo); state.regs = state.regs.filter((c) => !c.demo);
  // Astronauta 1 en rango, Astronauta 2 a vigilar (estrés), Astronauta 3 en alerta (mal sueño).
  const base = {a1: 14, a2: 28, a3: 38}, trend = {a1: 0, a2: 0.9, a3: 1.6};
  CREW.forEach((c, k) => {
    for (let d = 9; d >= 0; d--) {
      const idx = Math.max(3, Math.min(92, Math.round(base[c.id] + trend[c.id] * (9 - d) + Math.sin(d * 2.1 + k) * 6)));
      const ds = {sleep: Math.min(100, Math.max(0, idx + (c.sc === 'fatiga' ? 18 : 2) + Math.round(Math.sin(d + k) * 6))), mood: Math.max(0, idx - 4), anx: Math.min(100, idx + (c.sc === 'estres' ? 12 : 3)), str: Math.min(100, Math.max(0, idx + Math.round(Math.cos(d + k) * 8)))};
      state.checks.push({id: 'demo-c-' + c.id + d, uid: c.id, ts: now - d * DAY - 3600e3, idx, s: stOf(idx), ds, demo: true});
      const low = c.sc === 'fatiga' && d <= 3;
      state.nutri.push({id: 'demo-dq-' + c.id + d, uid: c.id, kind: 'dq', ts: now - d * DAY, ap: low ? 2 : c.sc === 'estres' && d % 3 === 0 ? 1 : 0, me: low ? 2 : 0, fl: low ? 1 : 0, gi: 0, water: low ? 3 : c.sc === 'estres' ? 5 : 7, demo: true});
      state.regs.push({id: 'demo-r-' + c.id + d, uid: c.id, ts: now - d * DAY, glu: Math.round(c.sc === 'estres' ? 104 + Math.sin(d) * 6 : 90 + Math.sin(d + k) * 5), sys: c.sc === 'estres' ? 128 : 116, dia: c.sc === 'estres' ? 82 : 75, react: Math.round(c.sc === 'fatiga' ? 430 + d * 6 : c.sc === 'estres' ? 360 : 300), mood: c.sc === 'normal' ? 4 : c.sc === 'estres' ? 3 : 2, demo: true});
    }
    const kg0 = [62, 78, 71][k], kg1 = c.sc === 'fatiga' ? kg0 * 0.965 : kg0 - 0.3;
    state.nutri.push({id: 'demo-m0-' + c.id, uid: c.id, kind: 'mass', ts: now - 40 * DAY, kg: kg0, demo: true});
    state.nutri.push({id: 'demo-m1-' + c.id, uid: c.id, kind: 'mass', ts: now - 2 * DAY, kg: Math.round(kg1 * 10) / 10, demo: true});
  });
  state.seeded = true; save();
}

/* ---------------- lecturas por tripulante ---------------- */
const checksOf = (id) => state.checks.filter((c) => c.uid === id).sort((a, b) => a.ts - b.ts);
const lastCheck = (id) => checksOf(id).pop() || null;
const nutriOf = (id, k) => state.nutri.filter((x) => x.uid === id && x.kind === k).sort((a, b) => a.ts - b.ts);
/** Último valor conocido de cada registro (un día puede tener solo glucosa y otro solo el test). */
const lastReg = (id) => state.regs.filter((r) => r.uid === id).sort((a, b) => a.ts - b.ts).reduce((o, r) => {
  ['glu', 'sys', 'dia', 'react', 'mood'].forEach((k) => { if (r[k] != null) o[k] = r[k]; });
  o.demo = r.demo; o.ts = r.ts; return o;
}, {});
const regsOf = (id) => state.regs.filter((r) => r.uid === id).sort((a, b) => a.ts - b.ts);

/** Indicadores del tripulante: brazalete en vivo + registros + test. */
function ind(id) {
  const v = live[id], r = lastReg(id), dq = nutriOf(id, 'dq').pop() || {};
  return {
    hr: {n: 'Pulso', val: Math.round(v.hr), u: 'lpm', s: R.hr(v.hr), src: 'Brazalete', r: RANGE.hr},
    spo2: {n: 'Oxígeno en sangre', val: Math.round(v.spo2), u: '%', s: R.spo2(v.spo2), src: 'Brazalete', r: RANGE.spo2},
    temp: {n: 'Temperatura', val: f1(v.temp), u: '°C', s: R.temp(v.temp), src: 'Brazalete', r: RANGE.temp},
    rr: {n: 'Respiración', val: Math.round(v.rr), u: 'rpm', s: R.rr(v.rr), src: 'Brazalete', r: RANGE.rr},
    sleep: {n: 'Sueño anoche', val: f1(v.sleep), u: 'h', s: R.sleep(v.sleep), src: 'Brazalete', r: RANGE.sleep},
    wake: {n: 'Despertares', val: v.wake, u: '', s: R.wake(v.wake), src: 'Brazalete', r: RANGE.wake},
    act: {n: 'Actividad física', val: Math.round(v.act), u: 'min', s: R.act(v.act), src: 'Brazalete', r: RANGE.act},
    dose: {n: 'Radiación hoy', val: v.dose.toFixed(2).replace('.', ','), u: 'mGy', s: 'i', src: 'Dosímetro', r: RANGE.dose},
    career: {n: 'Dosis de carrera', val: Math.round(careerDose(id)), u: 'de 600 mSv', s: careerStatus(careerDose(id)), src: 'Dosímetro', r: 'menos de 600 mSv · NASA-STD-3001'},
    glu: {n: 'Glucosa', val: r.glu ?? '—', u: 'mg/dL', s: R.glu(r.glu), src: 'Glucómetro', r: RANGE.glu},
    bp: {n: 'Presión arterial', val: r.sys ? r.sys + '/' + r.dia : '—', u: 'mmHg', s: R.bp(r.sys, r.dia), src: 'Tensiómetro', r: RANGE.bp},
    react: {n: 'Tiempo de reacción', val: r.react ?? '—', u: 'ms', s: R.react(r.react), src: 'Test', r: RANGE.react},
    mood: {n: 'Ánimo', val: r.mood ?? '—', u: 'de 5', s: r.mood == null ? null : r.mood >= 4 ? 0 : r.mood === 3 ? 1 : 2, src: 'Registro', r: '4 o 5 de 5'},
    water: {n: 'Hidratación', val: dq.water ?? '—', u: 'vasos', s: dq.water == null ? null : dq.water >= 6 ? 0 : dq.water >= 3 ? 1 : 2, src: 'Registro', r: '6 vasos o más'},
  };
}
/** Sistemas del cuerpo para la vista médica (mismo mapa que el monitor original). */
const ZONES = [
  {z: 'brain', t: 'Cerebro y descanso', k: ['sleep', 'wake', 'react', 'mood'], risk: 'Sueño inadecuado; cambios de comportamiento'},
  {z: 'eyes', t: 'Ojos', k: [], risk: 'Síndrome neuro-ocular (SANS): requiere examen con equipo médico'},
  {z: 'heart', t: 'Corazón', k: ['hr', 'bp'], risk: 'Adaptaciones cardiovasculares'},
  {z: 'lungs', t: 'Pulmones', k: ['spo2', 'rr'], risk: 'Hipoxia'},
  {z: 'gut', t: 'Digestión y nutrición', k: ['glu', 'water'], risk: 'Alimentación y nutrición inadecuadas'},
  {z: 'temp', t: 'Temperatura', k: ['temp'], risk: 'Respuestas alteradas del sistema inmune'},
  {z: 'bones', t: 'Huesos y músculos', k: ['act'], risk: 'Pérdida ósea y muscular'},
  {z: 'rad', t: 'Radiación', k: ['dose', 'career'], risk: 'Cánceres inducidos por radiación (límite de carrera 600 mSv, NASA-STD-3001)'},
];

/** Semáforo nutricional. */
function nsum(id) {
  const dq = nutriOf(id, 'dq'), m = nutriOf(id, 'mass'), sig = [];
  const sc = dq.map((x) => x.ap + x.me + x.fl);
  let il = 0;
  if (sc.length >= 3 && sc.slice(-3).every((v) => v >= 4)) il = 2; else if (sc.slice(-5).filter((v) => v >= 3).length >= 3) il = 1;
  if (il) sig.push({l: il, x: il > 1 ? 'Baja sostenida de ingesta: 3 días seguidos con apetito, comidas o líquidos muy reducidos.' : 'Ingesta baja en 3 de los últimos 5 chequeos.'});
  const pct = m.length > 1 ? (m[m.length - 1].kg - m[0].kg) / m[0].kg * 100 : null;
  let wl = 0; if (pct !== null) { if (pct <= -NCFG.lossB) wl = 2; else if (pct <= -NCFG.lossW) wl = 1; }
  if (wl) sig.push({l: wl, x: 'Pérdida de peso de ' + Math.abs(pct).toFixed(1).replace('.', ',') + ' % respecto al valor base.'});
  // Regla R07 de la planilla nutricional (MEDB N3.06 §3.5): masa corporal cada 30 días.
  const massDays = m.length ? Math.floor((Date.now() - m[m.length - 1].ts) / DAY) : null;
  if (massDays === null || massDays > 30) sig.push({l: 1, x: massDays === null ? 'Todavía no hay masa corporal registrada (regla R07: cada 30 días, MEDB N3.06).' : 'Masa corporal sin medir hace ' + massDays + ' días (regla R07: cada 30 días, MEDB N3.06).'});
  const has = dq.length || m.length;
  return {s: has ? Math.max(0, ...sig.map((x) => x.l)) : null, sig, il, wl, pct, dq, m, massDays};
}
/** Estado combinado: salud mental + nutrición + brazalete (regla de cruce de la compañera). */
function combined(id) {
  const c = lastCheck(id), n = nsum(id), I = ind(id), mh = c ? c.s : null, ds = (c && c.ds) || {}, f = [];
  const vit = worst(['hr', 'spo2', 'temp', 'rr'].map((k) => I[k].s));
  if (n.il || n.wl) f.push('ingesta o peso en descenso');
  if (ds.mood > 25) f.push('ánimo bajo');
  if (ds.sleep > 25 || I.sleep.s >= 1) f.push('mal sueño');
  const b = Math.max(mh === null ? 0 : Math.min(mh, 2), n.s || 0, vit || 0);
  let s = b;
  if (f.length >= 3) s = Math.max(s, 2); else if (f.length === 2 && (n.il || n.wl)) s = Math.max(s, 1);
  if (mh === 3) s = 3;
  return {s, f, mh, n, c, vit, I, escalated: s > b && mh !== 3};
}

/** Decisiones sugeridas para el comandante, de la más urgente a la menos. */
function suggestions() {
  const out = [];
  CREW.forEach((m) => {
    const c = combined(m.id), I = c.I;
    if (c.mh === 3) out.push({p: 3, who: m.name, t: 'Activar protocolo de emergencia de salud mental: médico de a bordo ya, no dejarlo solo y suspender tareas críticas.'});
    else if (c.mh === 2) out.push({p: 2, who: m.name, t: 'Charla privada hoy y conferencia con apoyo psicológico; evitar tareas críticas hasta la evaluación.'});
    if (I.spo2.s === 2 || I.temp.s === 2 || I.hr.s === 2) out.push({p: 3, who: m.name, t: 'Signos vitales en alerta (' + ['hr', 'spo2', 'temp'].filter((k) => I[k].s === 2).map((k) => I[k].n.toLowerCase()).join(', ') + '): evaluación médica inmediata.'});
    if (c.f.includes('mal sueño')) out.push({p: 1, who: m.name, t: 'Ajustar turnos para priorizar descanso: durmió ' + I.sleep.val + ' h y tiene ' + I.wake.val + ' despertares.'});
    if (c.n.il || c.n.wl) out.push({p: c.n.s, who: m.name, t: 'Seguimiento de comidas y líquidos; aviso al equipo de nutrición.' + (c.n.pct !== null ? ' Peso ' + c.n.pct.toFixed(1).replace('.', ',') + ' %.' : '')});
    if (I.react.s >= 1) out.push({p: 1, who: m.name, t: 'Tiempo de reacción lento (' + I.react.val + ' ms): no asignar maniobras ni EVA hoy.'});
  });
  (state.eclssAlerts || []).filter((a) => a.estado === 'ACTIVA').forEach((a) => out.push({p: a.lvl, who: 'Nave (ECLSS)', t: a.t + ': ' + a.dx}));
  const e = envOf();
  if (e.radK >= 2.5) out.push({p: 1, who: 'Toda la tripulación', t: 'Radiación elevada en ' + e.n + ': limitar las caminatas espaciales y revisar el refugio para tormentas solares.'});
  if (SHIPR.co2(ship.co2) >= 1) out.push({p: SHIPR.co2(ship.co2), who: 'Nave', t: 'CO₂ de cabina en ' + f1(ship.co2) + ' mmHg: revisar los depuradores; puede causar dolor de cabeza y menos concentración.'});
  return out.sort((a, b) => b.p - a.p);
}

/** Riesgos para la tripulación según el entorno, la nave y los datos de salud (5 peligros de NASA HRP). */
function risks() {
  const e = envOf(), lvl = (n) => Math.max(0, Math.min(2, n));
  const mentalBad = CREW.filter((m) => (lastCheck(m.id) || {}).s >= 2).map((m) => m.name);
  const poorSleep = CREW.filter((m) => combined(m.id).f.includes('mal sueño')).map((m) => m.name);
  const co2 = SHIPR.co2(ship.co2);
  return [
    (() => { const top = CREW.map((m) => ({m, d: careerDose(m.id)})).sort((a, b) => b.d - a.d)[0]; return {h: 'Radiación espacial', l: lvl(Math.max(Math.round(e.radK - 0.6), careerStatus(top.d))), why: 'Dosis diaria ' + e.rad + ' en ' + e.n + '. Mayor dosis de carrera: ' + top.m.name + ', ' + Math.round(top.d) + ' de 600 mSv (' + Math.round(top.d / 6) + ' % del límite de NASA-STD-3001). En la ISS, los neutrones son cerca del 30 % de la radiación (Agencia Espacial Canadiense, instrumento CANS).', eff: 'Cáncer a largo plazo, efectos en sistema nervioso y corazón.', who: CREW.filter((m) => careerStatus(careerDose(m.id)) >= 1).map((m) => m.name).join(', ') || 'Toda la tripulación', mit: 'Dosímetro por tripulante, refugio ante tormentas solares, limitar EVA a quien esté más cerca del límite.'}; })(),
    {h: 'Aislamiento y confinamiento', l: lvl(mentalBad.length ? 2 : poorSleep.length ? 1 : 0), why: mentalBad.length ? 'Chequeo de salud mental en alerta: ' + mentalBad.join(', ') + '.' : poorSleep.length ? 'Sueño alterado: ' + poorSleep.join(', ') + '.' : 'Chequeos de salud mental en rango.', eff: 'Estrés, ánimo bajo, conflictos de convivencia y errores.', who: mentalBad.concat(poorSleep).filter((x, i, a) => a.indexOf(x) === i).join(', ') || 'Nadie en este momento', mit: 'Chequeo diario, contacto con la familia, apoyo psicológico y rotación de tareas.'},
    {h: 'Distancia de la Tierra', l: lvl(e.latK), why: 'Demora de comunicación: ' + e.lat + '.', eff: 'Menos ayuda médica en tiempo real; la tripulación debe resolver sola.', who: 'Oficial médico y Comandante', mit: 'Protocolos autónomos, botiquín ampliado y entrenamiento médico cruzado.'},
    {h: 'Campos de gravedad', l: lvl(Math.round(e.gk * 2)), why: 'Gravedad: ' + e.g + '. ' + (state.env === 'luna' ? 'En la NASA, con 20 % de carga (≈ Luna) la densidad ósea bajó 30 % en 4 semanas (OSDR, OSD-608).' : state.env === 'marte' ? 'En la NASA, con 40 % de carga (≈ Marte) la densidad ósea bajó 24 % en 4 semanas (OSDR, OSD-608).' : 'En microgravedad, las moscas de la ISS treparon 52 % contra 74 % en la Tierra (OSDR, OSD-596).'), eff: 'Pérdida ósea y muscular, cambios en la visión (SANS) y mareo.', who: 'Toda la tripulación', mit: '2 h diarias de ejercicio, control de masa corporal y examen de ojos.'},
    {h: 'Ambientes hostiles y cerrados', l: lvl(co2), why: 'CO₂ ' + f1(ship.co2) + ' mmHg, humedad ' + Math.round(ship.hu) + ' %, afuera ' + e.ext + '.', eff: 'Dolor de cabeza, menos concentración, defensas más bajas. ' + e.haz + '.', who: co2 ? 'Toda la tripulación' : 'Nadie en este momento', mit: 'Depuradores de CO₂, control de humedad y trajes revisados antes de cada salida.'},
  ];
}
const envOf = () => ENV[state.env] || ENV.luna;

/* ======================================================================
   ESTÁNDARES DE LA NASA (fuentes verificables)
   - Dosis de carrera: menos de 600 mSv por tripulante (NASA-STD-3001 Vol. 1
     Rev. C, req. V1 4030), para mantener el riesgo de muerte por cáncer
     inducido por radiación por debajo del 3 %.
   - CO₂ de cabina: promedio de 1 h por debajo de 3 mmHg (NASA-STD-3001
     Vol. 2, req. V2 6004), para que los dolores de cabeza sean raros.
   - Los 5 peligros del vuelo espacial: Programa de Investigación Humana (HRP).
   ====================================================================== */
const NASA = {
  careerLimit: 600,
  dayMSv: {iss: 0.5, luna: 1.4, marte: 0.7},
  missionDay: 142,
  prior: {a1: 120, a2: 45, a3: 210}, // dosis de misiones anteriores (simulada)
  sources: [
    {t: 'Recursos del desafío «Create Health Monitoring Software for Astronauts on Space Missions» (Space Apps 2026)', u: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources'},
    {t: 'NASA Human Research Program · Los 5 peligros del vuelo espacial', u: 'https://www.nasa.gov/hrp/hazards/'},
    {t: 'NASA · Medical Data Available for Request (catálogo de datos médicos de astronautas, MEDB/MR)', u: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources'},
    {t: 'NASA MEDB N3.06 · Nutritional Assessments (JSC 28913) · base de la planilla nutricional del equipo', u: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources'},
    {t: 'NASA MR013S, MR042S, MEDB 1.5, 1.8, 1.15 (JSC 28913) · base de la planilla neurológica del equipo', u: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources'},
    {t: 'NASA-STD-3001 Vol. 1 Rev. C · límite de radiación de carrera (600 mSv)', u: 'https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf'},
    {t: 'Technical Brief OCHMO-TB-020 · Protección contra la radiación', u: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf'},
    {t: 'Technical Brief OCHMO-TB-004 · Dióxido de carbono (CO₂)', u: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf'},
    {t: 'NASA OSDR · OSD-608: pérdida ósea según la carga (modelo de gravedad parcial, ratas)', u: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-608'},
    {t: 'NASA OSDR · OSD-596: la gravedad artificial protege parcialmente la locomoción (ISS)', u: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-596'},
    {t: 'Agencia Espacial Canadiense · Monitoreo de radiación y salud de astronautas (CANS)', u: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp', csa: true},
    {t: 'Agencia Espacial Canadiense · Por qué hacemos experimentos científicos en el espacio', u: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp', csa: true},
  ],
  /* Datos crudos de NASA OSDR que bajó el equipo, resumidos (promedios por grupo).
     OSD-608: cambio % de densidad mineral ósea trabecular de tibia en ratas según la carga (PWB = % del peso). n = animales.
     OSD-596: % de moscas que treparon 5 cm, en Tierra, en vuelo con centrífuga de 1 g y en microgravedad. */
  osdr: {
    osd608: [
      {g: 'Tierra (100 % de carga)', pwb: 100, w4: -4.8, n: 13},
      {g: '70 % de carga', pwb: 70, w4: -19.9, n: 11},
      {g: 'Marte (≈ 40 % de carga)', pwb: 40, w4: -24.2, n: 12},
      {g: 'Luna (≈ 20 % de carga)', pwb: 20, w4: -30.1, n: 10},
    ],
    osd596: [{g: 'En la Tierra', v: 74.4, n: 27}, {g: 'En vuelo con centrífuga 1 g', v: 63.2, n: 29}, {g: 'En microgravedad', v: 52.1, n: 27}],
  },
  /* A qué dato médico oficial de la NASA corresponde cada medición (catálogo «Medical Data Available for Request»). */
  trace: {
    hr: 'Clinical Assessment · vitals (MEDB 1.1, MR009) · Inflight CMO Health Status (MEDB 1.2)',
    spo2: 'Inflight CMO Health Status · vitals (MEDB 1.2)',
    temp: 'Clinical Assessment · vitals (MEDB 1.1) · Monitoring during EVA (MEDB 6.2)',
    rr: 'Clinical Assessment · vitals (MEDB 1.1)',
    bp: 'Clinical Assessment · vitals (MEDB 1.1) · Stand / Tilt Test (MR001)',
    sleep: 'Sleep Assessments · Actiwatch y registros de sueño (MEDB N3.07)',
    wake: 'Sleep Assessments · Actiwatch (MEDB N3.07)',
    act: 'On-orbit Strength & Conditioning Monitoring (MEDB 5.2, MR019L)',
    react: 'Neurocognitive Assessment · WinSCAT (MEDB 7.6, MR085L)',
    mood: 'Clinical Data Derived from Private Medical Conferences (MEDB 1.3)',
    glu: 'Laboratory Testing · chemistry profile (MEDB 2.1, MR010)',
    water: 'Nutritional Assessments · dietary intake (MEDB 8.1, N3.02)',
    dose: 'In-flight Radiation Monitoring · dosímetros personales (MEDB 3.1)',
    career: 'Biodosimetry (MEDB 3.2) + In-flight Radiation Monitoring (MEDB 3.1)',
    mass: 'In-flight Body Mass Measurement · MMD (MEDB 1.13)',
  },
  /* Plan de evaluaciones según los documentos MEDB (días: FD = día de vuelo, R+ = después del aterrizaje). */
  plan: [
    {when: 'Cada semana', t: 'Cuestionario de alimentación FFQ (10 min)', src: 'MEDB N3.06 §3.5 · regla R06 (7 días)', fd: null},
    {when: 'Cada mes', t: 'Masa corporal con el MMD', src: 'MEDB 1.13 / N3.06 §3.5 · regla R07 (30 días)', fd: null},
    {when: 'Continuo', t: 'Dosis de radiación con dosímetro personal', src: 'MEDB 3.1', fd: null},
    {when: 'FD 21', t: 'Audiometría en órbita (OOHA, KUDUwave)', src: 'MEDB 1.8', fd: 21},
    {when: 'Mitad de misión', t: 'Segunda audiometría en órbita (OOHA)', src: 'MEDB 1.8', fd: 90},
    {when: 'Cada 3–4 meses', t: 'OOHA recurrente si la misión supera 6 meses', src: 'MEDB 1.8', fd: 180},
    {when: 'R+0', t: 'Evaluación nutricional: sangre, peso, talla y orina', src: 'MEDB N3.06 §3.6', fd: null, post: true},
    {when: 'R+3', t: 'Audiometría convencional y timpanometría', src: 'MEDB 1.8', fd: null, post: true},
    {when: 'R+5 a R+30', t: 'Densitometría DXA (hueso y músculo)', src: 'MEDB 1.11 · regla R12', fd: null, post: true},
    {when: 'R+8', t: 'Posturografía dinámica (equilibrio, SOT/HM/MCT)', src: 'MEDB 1.5', fd: null, post: true},
    {when: 'R+20 a R+30', t: 'Segunda evaluación nutricional', src: 'MEDB N3.06 §3.6', fd: null, post: true},
  ],
};
/** Dosis de carrera en mSv: misiones anteriores + días de esta misión en el entorno actual. */
const careerDose = (id) => (NASA.prior[id] || 0) + NASA.missionDay * (NASA.dayMSv[state.env] || 1);
const careerStatus = (mSv) => (mSv / NASA.careerLimit < 0.5 ? 0 : mSv / NASA.careerLimit < 0.8 ? 1 : 2);

/* ======================================================================
   COMUNICACIÓN CON LA TIERRA · cuánto tarda un mensaje
   La señal viaja a la velocidad de la luz:
   - Estación Espacial: casi en vivo (~0,7 s con los satélites relé TDRS),
     con cortes cortos cuando no hay satélite a la vista.
   - Luna: 1,3 s por tramo (384.400 km). Desde la cara visible hay enlace continuo.
   - Marte: de 4 a 24 min por tramo según dónde esté cada planeta (acá, 12,5 min).
     Desde la superficie se transmite por los orbitadores relé, que pasan unas
     pocas veces por sol: los mensajes esperan el próximo pase. Cada ~26 meses,
     con el Sol en el medio (conjunción), hay unas 2 semanas sin comunicación.
   ====================================================================== */
const COMMS = {
  iss: {oneWay: 0.7, every: 0, len: 0, note: 'Casi en vivo, con cortes breves sin satélite relé.'},
  luna: {oneWay: 1.3, every: 0, len: 0, note: 'Enlace continuo desde la cara visible de la Luna.'},
  marte: {oneWay: 750, every: 4 * 3600e3, len: 15 * 60e3, note: 'Se transmite en los pases de los orbitadores relé (cada ~4 h, 15 min). Rango real: 4 a 24 min por tramo.'},
};
const comms = () => COMMS[state.env] || COMMS.luna;
// Próximo momento en que se puede transmitir (en Marte, el próximo pase del orbitador).
function nextWindow(t) {
  const c = comms(); if (!c.every) return t;
  const into = t % c.every; return into < c.len ? t : t - into + c.every;
}
/* Tiempos de un mensaje: sale en la próxima ventana, tarda el viaje de la luz y, si espera respuesta,
   la Tierra tarda `think` ms en contestar y la respuesta vuelve por la próxima ventana. */
function commsPlan(t, think) {
  const c = comms(), out = nextWindow(t), arrive = out + c.oneWay * 1000;
  const back = think ? nextWindow(arrive + think) : null;
  return {send: out, arrive, replyAt: back !== null ? back + c.oneWay * 1000 : null};
}
const dur = (ms) => { const s = Math.round(ms / 1000); return s < 60 ? s + ' s' : s < 3600 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '') : Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min'; };

/* ======================================================================
   LÍNEA BASE PERSONAL Y PUNTAJE DE ALERTA TEMPRANA
   Cada tripulante tiene su propio "normal" (aprendido de sus primeros días de
   misión). Un valor puede estar dentro del rango general y aun así ser raro
   para esa persona: eso se avisa antes.
   El puntaje de alerta temprana adapta el NEWS2 (Royal College of Physicians,
   Reino Unido), que suma puntos por respiración, oxígeno, temperatura, pulso y
   presión. No está validado para vuelo espacial: es una guía para el médico.
   ====================================================================== */
const BASE = {
  a1: {hr: [68, 4], spo2: [98, 0.7], temp: [36.6, 0.18], rr: [14.5, 1.3]},
  a2: {hr: [76, 5], spo2: [97.5, 0.8], temp: [36.7, 0.2], rr: [16, 1.5]},
  a3: {hr: [60, 4], spo2: [97.2, 0.8], temp: [36.5, 0.2], rr: [13.5, 1.2]},
};
function baseline(id) {
  const b = BASE[id] || BASE.a1, v = live[id], out = {};
  Object.entries(b).forEach(([k, [m, sd]]) => { const z = (v[k] - m) / sd; out[k] = {m, sd, val: v[k], z, s: Math.abs(z) >= 3 ? 2 : Math.abs(z) >= 2 ? 1 : 0}; });
  return out;
}
function news2(id) {
  const v = live[id], r = lastReg(id), pts = [];
  const add = (n, p) => { pts.push([n, p]); return p; };
  const rr = v.rr <= 8 ? 3 : v.rr <= 11 ? 1 : v.rr <= 20 ? 0 : v.rr <= 24 ? 2 : 3;
  const sp = v.spo2 <= 91 ? 3 : v.spo2 <= 93 ? 2 : v.spo2 <= 95 ? 1 : 0;
  const tp = v.temp <= 35 ? 3 : v.temp <= 36 ? 1 : v.temp <= 38 ? 0 : v.temp <= 39 ? 1 : 2;
  const hr = v.hr <= 40 ? 3 : v.hr <= 50 ? 1 : v.hr <= 90 ? 0 : v.hr <= 110 ? 1 : v.hr <= 130 ? 2 : 3;
  const sys = r.sys == null ? 0 : r.sys <= 90 ? 3 : r.sys <= 100 ? 2 : r.sys <= 110 ? 1 : r.sys < 220 ? 0 : 3;
  const total = add('Respiración', rr) + add('Oxígeno', sp) + add('Temperatura', tp) + add('Pulso', hr) + add('Presión', sys);
  const red = pts.some(([, p]) => p === 3);
  const s = total >= 7 ? 3 : total >= 5 ? 2 : red || total >= 1 ? 1 : 0;
  return {total, s, pts, txt: ['Bajo', 'Bajo · vigilar', 'Medio · evaluación médica', 'Alto · respuesta urgente'][s]};
}

/* ======================================================================
   TESTS DE SALUD (vista, cognición y audición) · se guardan por tripulante
   ====================================================================== */
const testsOf = (id, kind) => ((state.tests || {})[id] || []).filter((t) => !kind || t.kind === kind);
const lastTest = (id, kind) => testsOf(id, kind).slice(-1)[0] || null;
function saveTest(id, kind, data) {
  state.tests = state.tests || {}; (state.tests[id] = state.tests[id] || []).push({id: nid(), ts: Date.now(), kind, ...data});
  save(); emit();
}
// Ejemplos previos para que la demo tenga historia (la primera semana de misión).
function seedTests() {
  if (state.testsSeeded) return; state.testsSeeded = true; state.tests = state.tests || {};
  const d = Date.now(), wk = 7 * 864e5;
  [['a1', 7, 92, 0], ['a2', 6, 84, 0], ['a3', 7, 90, 0]].forEach(([id, span, acc]) => {
    const L = state.tests[id] = state.tests[id] || [];
    L.push({id: nid(), ts: d - wk, kind: 'mem', score: span, s: 0, demo: true}, {id: nid(), ts: d - wk, kind: 'att', score: acc, ms: 820, s: 0, demo: true}, {id: nid(), ts: d - wk, kind: 'vis', s: 0, detail: 'Sin cambios', demo: true});
  });
  // Astronauta 3: en el último control notó líneas onduladas en el ojo derecho.
  state.tests.a3.push({id: nid(), ts: d - 2 * 864e5, kind: 'vis', s: 1, detail: 'Ojo derecho: líneas onduladas', demo: true});
  save();
}

/* ======================================================================
   RUIDO Y AUDICIÓN
   NASA-STD-3001 Vol. 2 limita la exposición a ruido en 24 h (nivel equivalente
   de 67 dBA) y pide protección auditiva por encima de 85 dBA. El ruido
   constante de ventiladores y bombas, y el ejercicio en cinta, suman.
   Cada hora del día de cada tripulante, en dBA (simulado), con la cabina
   real del módulo de soporte vital como base.
   ====================================================================== */
const NOISE_LIM = 67;
function noiseDay(id) {
  const cab = (eclss().amb || {}).ruido_db || 52, h = [], prot = ((state.hpd || {})[id] || 0);
  const pro = {a1: [9, 10, 17], a2: [11, 12, 19], a3: [8, 9, 16]}[id] || [9, 10, 17]; // horas de ejercicio y de taller
  for (let i = 0; i < 24; i++) {
    let db = i < 7 ? Math.min(cab, 50) - 1 : cab + 6; // dormir · trabajo normal
    if (i === pro[0] || i === pro[1]) db = 76; // cinta y bicicleta: lo más ruidoso
    if (i === pro[2]) db = 82; // taller con herramientas
    h.push(db);
  }
  // Protectores: restan ~15 dB en las horas más ruidosas (hasta las horas indicadas).
  const loud = h.map((d, i) => [d, i]).sort((a, b) => b[0] - a[0]).slice(0, prot).map(([, i]) => i);
  const eff = h.map((d, i) => (loud.includes(i) ? d - 15 : d));
  const leq = 10 * Math.log10(eff.reduce((a, d) => a + Math.pow(10, d / 10), 0) / 24);
  const s = leq > NOISE_LIM + 3 ? 2 : leq > NOISE_LIM ? 1 : 0;
  return {h, eff, leq, s, prot, sleep: h.slice(0, 7).reduce((a, b) => a + b, 0) / 7};
}

/* ======================================================================
   ¿APTO PARA LA TAREA? · antes de una caminata espacial (EVA) o una tarea crítica
   Cruza sueño, reacción, cognición, signos vitales, puntaje de alerta temprana,
   salud mental, vista, dosis de radiación y tormenta solar.
   0 = apto · 1 = apto con cuidado · 2 = no apto hoy
   ====================================================================== */
function fitness(id, task) {
  const I = ind(id), v = live[id], N = sleepNight(id), E = news2(id), B = baseline(id), lc = lastCheck(id), why = [];
  const flag = (s, t) => why.push({s, t});
  if (v.sleep < 5) flag(2, 'Durmió ' + f1(v.sleep) + ' h (menos de 5)'); else if (v.sleep < 6 || N.s >= 1) flag(1, 'Sueño ' + N.tipo.toLowerCase() + ' (' + f1(v.sleep) + ' h)');
  if (I.react.val !== '—') { const rv = +I.react.val; if (rv > 500) flag(2, 'Reacción lenta: ' + rv + ' ms'); else if (rv >= 350) flag(1, 'Reacción algo lenta: ' + rv + ' ms'); }
  if (E.s >= 2) flag(2, 'Puntaje de alerta temprana ' + E.total + ' (' + E.txt.toLowerCase() + ')'); else if (E.total >= 1) flag(1, 'Puntaje de alerta temprana ' + E.total);
  const off = Object.entries(B).filter(([, x]) => x.s >= 1).map(([k]) => ({hr: 'pulso', spo2: 'oxígeno', temp: 'temperatura', rr: 'respiración'}[k]));
  if (off.length) flag(1, 'Fuera de su propio normal: ' + off.join(', '));
  if (lc && lc.s >= 2) flag(2, 'Chequeo de mente en ' + STATE[lc.s].toLowerCase());
  const mem = testsOf(id, 'mem'), att = testsOf(id, 'att');
  if (mem.length >= 2 && mem[mem.length - 1].score < mem[0].score - 1) flag(1, 'Memoria por debajo de su línea base');
  if (att.length >= 2 && att[att.length - 1].score < att[0].score - 15) flag(1, 'Atención por debajo de su línea base');
  const vis = lastTest(id, 'vis'); if (vis && vis.s >= 1) flag(task === 'eva' ? 1 : 1, 'Cambio en la vista: ' + vis.detail);
  if (task === 'eva') {
    const cd = careerDose(id) / NASA.careerLimit;
    if (cd >= 0.8) flag(2, 'Dosis de carrera al ' + Math.round(cd * 100) + ' % del límite');
    if (state.radStorm) flag(2, 'Tormenta solar en curso');
    if (I.temp.s >= 1) flag(2, 'Temperatura ' + I.temp.val + ' °C');
  }
  const s = why.length ? Math.max(...why.map((x) => x.s)) : 0;
  return {s, why, label: ['Apto', 'Apto con cuidado', 'No apto hoy'][s]};
}

/* ======================================================================
   BOTIQUÍN · inventario con vencimientos
   En el espacio la radiación y las condiciones de guardado degradan algunos
   medicamentos antes de tiempo: la NASA estudia su estabilidad en vuelo.
   Solo inventario: las indicaciones y dosis las decide el oficial médico.
   ====================================================================== */
function seedKit() {
  if (state.kit) return state.kit;
  const d = Date.now(), day = 864e5;
  state.kit = [
    ['Analgésico y antifebril (paracetamol)', 'Dolor y fiebre', 40, 12, 420],
    ['Antiinflamatorio (ibuprofeno)', 'Dolor e inflamación', 30, 10, 300],
    ['Antihistamínico', 'Alergias', 20, 6, 50],
    ['Antiemético (para náuseas y mareo)', 'Mareo espacial', 8, 10, 260],
    ['Hipnótico de corto efecto', 'Insomnio', 24, 8, 210],
    ['Descongestivo nasal', 'Congestión por los fluidos', 12, 4, -10],
    ['Antibiótico de amplio espectro', 'Infecciones', 14, 7, 540],
    ['Gotas lubricantes para ojos', 'Ojo seco', 10, 4, 120],
    ['Epinefrina autoinyectable', 'Alergia grave', 2, 2, 380],
    ['Suero de rehidratación', 'Deshidratación', 18, 8, 700],
  ].map(([n, use, q, min, exp]) => ({id: nid(), n, use, q, min, exp: d + exp * day, log: []}));
  save(); return state.kit;
}
function kitStatus(it) {
  const days = Math.round((it.exp - Date.now()) / 864e5), w = [];
  if (days < 0) w.push([2, 'Vencido hace ' + -days + ' días']); else if (days <= 60) w.push([1, 'Vence en ' + days + ' días']);
  if (it.q <= 0) w.push([2, 'Sin stock']); else if (it.q < it.min) w.push([1, 'Quedan pocos (' + it.q + ', mínimo ' + it.min + ')']);
  return {days, w, s: w.length ? Math.max(...w.map((x) => x[0])) : 0};
}
function kitUse(itemId, uid) { const it = (state.kit || []).find((x) => x.id === itemId); if (!it || it.q <= 0) return; it.q--; it.log.push({ts: Date.now(), uid}); save(); emit(); }

/* ======================================================================
   CONSULTA CON LA TIERRA · paquete médico asincrónico
   El oficial médico arma un paquete (signos, tests, síntomas, foto) y lo
   manda al cirujano de vuelo en la Tierra. Llega con la demora real y la
   respuesta vuelve igual. La respuesta es simulada para la demo.
   ====================================================================== */
function consultReply(c) {
  const t = (c.text || '').toLowerCase(), m = CREW.find((x) => x.id === c.uid).name, E = news2(c.uid);
  const r = ['Recibimos el paquete de ' + m + '.'];
  if (E.s >= 2) r.push('Con un puntaje de alerta temprana de ' + E.total + ', repetir signos vitales cada 30 minutos y no dejarlo solo.');
  if (/vista|ojo|borros/.test(t)) r.push('Por los cambios visuales: hacer fondo de ojo con el equipo de a bordo y tomografía óptica si está disponible; mandar las imágenes.');
  if (/dolor|cabeza/.test(t)) r.push('Revisar el CO₂ del módulo y la hidratación. Si el dolor sigue en 24 h, nueva consulta.');
  if (/sueñ|dorm|cansad/.test(t)) r.push('Ajustar turnos para darle una noche completa de descanso y evitar tareas críticas mañana.');
  if (/oxígeno|aire|respir/.test(t)) r.push('Oxígeno según protocolo de a bordo y control continuo de saturación.');
  if (r.length === 1) r.push('Por ahora, seguir el monitoreo habitual y avisarnos si algo cambia.');
  r.push('Cirujano de vuelo · Control de Misión (respuesta simulada).');
  return r.join(' ');
}
function sendConsult(uid, text, media) {
  state.consults = state.consults || [];
  const t = Date.now(), p = commsPlan(t, 5 * 60e3), fast = state.commsFast !== false;
  // Demo acelerada: los tiempos reales se muestran, pero la demo avanza en segundos.
  const k = fast ? Math.min(1, 25000 / Math.max(1, p.replyAt - t)) : 1;
  const c = {id: nid(), uid, ts: t, text, media: media || [], env: state.env, real: p, demo: {arrive: t + (p.arrive - t) * k, replyAt: t + (p.replyAt - t) * k}};
  c.reply = consultReply(c);
  state.consults.push(c); save(); emit();
  return c;
}
function msgPlan(t) {
  const p = commsPlan(t, 0), fast = state.commsFast !== false, k = fast ? Math.min(1, 12000 / Math.max(1, p.arrive - t)) : 1;
  return {real: p, demo: {arrive: t + (p.arrive - t) * k}};
}

/* ======================================================================
   MÓDULO ECLSS (soporte vital) y MONITOR DE RADIACIÓN SOLAR
   Datos y reglas del módulo de nuestros compañeros (DATOS_PARA_COMPANERA.md).
   Umbrales de EJEMPLO del hackatón, no normativos.
   ====================================================================== */
const ECLSS_NOMINAL = {
  amb: {presion_kpa: 101.1, temperatura_c: 21.5, co2_ppm: 950, o2_porcentaje: 21.0, voc_ppb: 110, ruido_db: 52.0, luz_lux: 480, fase_circadiana: 'DIA'},
  micro: {ubicacion: 'Circuito Agua Potable (WRS-A)', bacterias_ufc: 18, hongos_ufc: 12, patogeno_detectado: 'Ninguno'},
  bio: [{uid: 'a1', cortisol_nmol: 11.4, siga_ug_ml: 135.0, il6_pg_ml: 1.8, carga_viral_ebv: 120}, {uid: 'a2', cortisol_nmol: 12.1, siga_ug_ml: 128.0, il6_pg_ml: 2.1, carga_viral_ebv: 95}],
};
const ECLSS_CRISIS = {
  amb: {presion_kpa: 99.8, temperatura_c: 25.4, co2_ppm: 4350, o2_porcentaje: 20.2, voc_ppb: 410, ruido_db: 76.5, luz_lux: 240, fase_circadiana: 'NOCHE'},
  micro: {ubicacion: 'Circuito Agua Potable (WRS-A)', bacterias_ufc: 340, hongos_ufc: 185, patogeno_detectado: 'Pseudomonas aeruginosa / Aspergillus'},
  bio: [{uid: 'a1', cortisol_nmol: 28.4, siga_ug_ml: 42.0, il6_pg_ml: 8.7, carga_viral_ebv: 24500}, {uid: 'a2', cortisol_nmol: 24.1, siga_ug_ml: 55.0, il6_pg_ml: 6.4, carga_viral_ebv: 14200}],
};
const ECLSS_RULES = [
  {code: 'CORR_BIOFILM_INMUNE', lvl: 3, t: 'Biopelícula microbiana + compromiso inmunológico',
    test: (e) => (e.micro.bacterias_ufc > 100 || e.micro.hongos_ufc > 100) && e.bio.some((b) => b.siga_ug_ml < 60 || b.il6_pg_ml > 5),
    dx: (e) => `Conteo elevado en ${e.micro.ubicacion} (${e.micro.bacterias_ufc} UFC/mL de bacterias, ${e.micro.hongos_ufc} UFC de hongos) junto con caída de sIgA e inflamación (IL-6) en ${e.bio.filter((b) => b.siga_ug_ml < 60 || b.il6_pg_ml > 5).map((b) => CREW.find((c) => c.id === b.uid).name).join(', ')}.`,
    steps: ['Aislar la válvula solenoide del Circuito Hídrico A y conmutar a la Reserva Estéril B.', 'Iniciar ciclo de pasteurización térmica a 85 °C durante 60 min en el Circuito A.', 'Colocar respirador N95 y descontaminar paneles adyacentes con peróxido al 0,5 %.', 'Protocolo profiláctico (zinc, vitamina D3 y probiótico) según indique el oficial médico.', 'Registrar el paquete telemétrico en la cola de transmisión diferida a la Tierra.']},
  {code: 'CORR_CIRCADIANO_VIRAL', lvl: 3, t: 'Disrupción circadiana y acústica + reactivación viral (EBV)',
    test: (e) => (e.amb.ruido_db > 68 || (e.amb.fase_circadiana === 'NOCHE' && e.amb.luz_lux > 50)) && e.bio.some((b) => b.cortisol_nmol > 22 && b.carga_viral_ebv > 10000),
    dx: (e) => `Ruido (${e.amb.ruido_db} dB) y luz (${e.amb.luz_lux} lux en fase ${e.amb.fase_circadiana === 'NOCHE' ? 'noche' : 'día'}) elevaron el cortisol (más de 22 nmol/L) y reactivaron el virus EBV (más de 10.000 copias/mL) en ${e.bio.filter((b) => b.cortisol_nmol > 22 && b.carga_viral_ebv > 10000).map((b) => CREW.find((c) => c.id === b.uid).name).join(', ')}.`,
    steps: ['Forzar filtro espectral ámbar (menos de 550 nm) y activar la cancelación acústica en los módulos de descanso.', 'Resincronizar el sueño (melatonina u otra medida) según indique el oficial médico.', 'Evaluación del oficial médico por la reactivación viral antes de cualquier medicación.', 'Reasignar tareas extravehiculares o de alta carga cognitiva durante las próximas 48 horas.']},
  {code: 'ECLSS_CO2_ALTO', lvl: 2, t: 'Hipercapnia de cabina (CO₂ mayor a 4000 ppm)',
    test: (e) => e.amb.co2_ppm > 4000,
    dx: (e) => `Acumulación de CO₂ (${e.amb.co2_ppm} ppm) en el hábitat principal. Riesgo de fatiga cognitiva.`,
    steps: ['Aumentar el flujo de ventilación hacia los lechos de zeolita regenerativa (CDRA) al 100 %.', 'Verificar la saturación del filtro de aminas sólidas en la bahía ECLSS-2.']},
];
function eclss() { return state.eclss || ECLSS_NOMINAL; }
/* Motor de correlación: crea una alerta por regla si no hay otra activa con el mismo código. */
function runEclss() {
  const e = eclss(); state.eclssAlerts = state.eclssAlerts || [];
  ECLSS_RULES.forEach((r) => {
    if (!r.test(e) || state.eclssAlerts.some((a) => a.code === r.code && a.estado === 'ACTIVA')) return;
    state.eclssAlerts.push({id: nid(), code: r.code, lvl: r.lvl, t: r.t, dx: r.dx(e), ts: Date.now(), estado: 'ACTIVA', pasos: r.steps.map((s, i) => ({orden: i + 1, accion: s, completado: false}))});
  });
  save(); emit();
}
function eclssCrisis(on) {
  if (on) { state.eclss = JSON.parse(JSON.stringify(ECLSS_CRISIS)); runEclss(); }
  else { state.eclss = JSON.parse(JSON.stringify(ECLSS_NOMINAL)); (state.eclssAlerts || []).forEach((a) => { a.estado = 'RESUELTA'; }); save(); emit(); }
}
/* Marca o desmarca un paso; con todos hechos, la alerta queda RESUELTA. */
function eclssStep(id, orden) {
  const a = (state.eclssAlerts || []).find((x) => x.id === id); if (!a) return;
  const p = a.pasos.find((x) => x.orden === orden); if (!p) return;
  p.completado = !p.completado; a.estado = a.pasos.every((x) => x.completado) ? 'RESUELTA' : 'ACTIVA';
  save(); emit();
}
const eclssActive = () => (state.eclssAlerts || []).filter((a) => a.estado === 'ACTIVA');

/* ======================================================================
   VIGILANCIA DE PROTOCOLOS · el asistente cuida el peor escenario
   Cruza la nave, el entorno (radiación) y los signos de cada tripulante.
   Cuando algo se dispara, abre un protocolo con pasos en orden. Los pasos
   se marcan al hacerlos; si un protocolo crítico no avanza, se escala.
   Pasos de ECLSS: módulo del equipo. Resto: guía de emergencias del equipo
   y referencias NASA (STD-3001, TB-004, TB-020).
   ====================================================================== */
const protoMem = () => (state.proto = state.proto || {});
function P(id, lvl, area, t, why, who, steps) {
  const d = protoMem()[id] || {};
  return {id, lvl, area, t, why, who, steps: steps.map((s, i) => ({t: s, done: !!(d.done || [])[i]})), since: d.since || Date.now(), esc: !!d.esc};
}
// Se recalcula como mucho una vez por segundo (o al instante si cambió algo guardado).
let protoCache = null, protoAt = 0;
function protocols() {
  if (protoCache && Date.now() - protoAt < 1000 && protoCache.ver === saveVer) return protoCache.list;
  protoCache = {list: computeProtocols(), ver: saveVer}; protoAt = Date.now();
  return protoCache.list;
}
function computeProtocols() {
  const out = [], e = envOf();
  eclssActive().forEach((a) => out.push({id: 'eclss-' + a.id, ref: a.id, lvl: a.lvl, area: 'Soporte vital (ECLSS)', t: a.t, why: a.dx, who: 'Toda la tripulación', steps: a.pasos.map((p) => ({t: p.accion, done: p.completado})), since: a.ts, esc: !!(protoMem()['eclss-' + a.id] || {}).esc}));
  const co2 = SHIPR.co2(ship.co2);
  if (co2 >= 1) out.push(P('co2', co2 === 2 ? 3 : 2, 'Nave', 'CO₂ de cabina alto', `CO₂ en ${f1(ship.co2)} mmHg: el límite es 3 mmHg en promedio de 1 hora (NASA-STD-3001). Da dolor de cabeza y baja la concentración.`, 'Toda la tripulación',
    ['Revisar los depuradores de CO₂ y subir la ventilación del módulo al máximo.', 'Suspender el ejercicio intenso hasta que el CO₂ baje.', 'Preguntar a cada tripulante por dolor de cabeza, mareo o falta de concentración.', 'Si pasa de 4 mmHg: máscaras de oxígeno y avisar a Control de Misión.']));
  if (SHIPR.p(ship.p) === 2 || SHIPR.o2(ship.o2) === 2) out.push(P('air', 3, 'Nave', 'Pérdida de presión u oxígeno', `Presión ${ship.p.toFixed(1).replace('.', ',')} kPa · oxígeno ${f1(ship.o2)} %.`, 'Toda la tripulación', AL[3].it[2][1].split('|')));
  if (state.radStorm) out.push(P('storm', 3, 'Radiación', 'Tormenta solar en curso', 'El monitor de radiación supera la tasa de referencia de 1500 µSv/día (método del módulo de radiación del equipo).', 'Toda la tripulación',
    ['Toda la tripulación al refugio de mayor blindaje.', 'Suspender y postergar las caminatas espaciales (EVA).', 'Registrar la hora y la dosis de cada dosímetro.', 'Quedarse en el refugio hasta que la tasa vuelva a niveles normales.']));
  else if (e.radK >= 2.5) out.push(P('rad', 1, 'Radiación', 'Radiación elevada en ' + e.n, 'Dosis diaria ' + e.rad + '.', 'Toda la tripulación',
    ['Limitar las caminatas espaciales a lo imprescindible.', 'Revisar que el refugio para tormentas solares esté listo.', 'Controlar la dosis de carrera de cada tripulante.']));
  CREW.forEach((m) => {
    const I = ind(m.id), N = sleepNight(m.id), lc = lastCheck(m.id), v = live[m.id];
    // Peor caso: el brazalete real dejó de mandar datos (se cayó, se descargó o se lo sacó).
    const lastReal = Math.max(0, ...Object.values(v.real || {}));
    if (lastReal && Date.now() - lastReal > 60000) out.push(P('band-' + m.id, 2, 'Salud', 'Sin señal del brazalete · ' + m.name, 'Hace ' + Math.round((Date.now() - lastReal) / 60000) + ' min que no llegan sus signos vitales.', m.name,
      ['Llamarlo para confirmar que está bien.', 'Revisar que el brazalete esté puesto y con batería, y reconectarlo.', 'Si no responde, ir a verlo: la llamada sin respuesta escala sola.']));
    if (careerDose(m.id) / NASA.careerLimit >= 0.8) out.push(P('career-' + m.id, 1, 'Radiación', 'Dosis de carrera cerca del límite · ' + m.name, Math.round(careerDose(m.id)) + ' de 600 mSv (NASA-STD-3001).', m.name, ['No asignarle caminatas espaciales.', 'Priorizar sus turnos en las zonas con más blindaje.', 'Informar al oficial médico.']));
    if (I.spo2.s === 2) out.push(P('spo2-' + m.id, 3, 'Salud', 'Oxígeno en sangre bajo · ' + m.name, `SpO₂ ${I.spo2.val} % (normal 95 % o más).`, m.name,
      ['Que se siente y respire tranquilo; revisar que el sensor esté bien puesto.', 'Revisar el oxígeno y el CO₂ de la cabina.', 'Avisar ya al oficial médico: oxígeno suplementario según indique.', 'No dejarlo solo hasta la evaluación.']));
    if (I.temp.s === 2) out.push(P('temp-' + m.id, 2, 'Salud', 'Fiebre · ' + m.name, `Temperatura ${I.temp.val} °C.`, m.name,
      ['Reposo y líquidos en sorbos.', 'Avisar al oficial médico para evaluarlo hoy.', 'Si tiene tos o síntomas respiratorios: aislarlo para cuidar al resto.', 'No automedicarse.']));
    if (I.hr.s === 2) out.push(P('hr-' + m.id, 2, 'Salud', 'Pulso fuera de rango · ' + m.name, `Pulso ${I.hr.val} lpm en reposo.`, m.name,
      ['Que se siente y descanse 5 minutos, y repetir la medición.', 'Preguntarle por dolor de pecho, mareo o falta de aire: si hay, es emergencia.', 'Avisar al oficial médico.']));
    if (N.s === 2) out.push(P('sleep-' + m.id, 2, 'Salud', 'Fatiga por mal sueño · ' + m.name, `Sueño ${N.tipo.toLowerCase()}: ${f1(v.sleep)} h, ${N.wake} despertares, ${Math.round(N.pct.D * 100)} % de sueño profundo.`, m.name,
      ['No asignarle maniobras ni caminatas espaciales hoy.', 'Siesta corta de 20 minutos si el plan lo permite.', 'Revisar luz y ruido de su módulo de descanso.', 'Avisar al oficial médico si se repite mañana.']));
    /* Riesgo de conflicto: varias señales de tensión juntas (estrés y ansiedad del chequeo, pulso
       alto, mal sueño, cortisol alto). Avisa a TODA la tripulación para prevenir roces o peleas,
       pero a los compañeros no les muestra los datos de salud de la persona (privacidad, MEDB R14). */
    const ds = (lc && lc.ds) || {}, bio = (eclss().bio || []).find((b) => b.uid === m.id);
    const sig = [ds.str > 35 && 'estrés alto', ds.anx > 35 && 'ansiedad', I.hr.s >= 1 && 'pulso alto en reposo', N.s >= 1 && 'mal sueño', bio && bio.cortisol_nmol > 22 && 'cortisol alto'].filter(Boolean);
    if (sig.length >= 3) {
      const p = P('conflict-' + m.id, sig.length >= 4 ? 3 : 2, 'Convivencia', 'Riesgo de tensión o conflicto · ' + m.name, 'Señales juntas: ' + sig.join(', ') + '. Aumenta la irritabilidad y el riesgo de discusiones con compañeros.', 'Toda la tripulación',
        ['Comandante: charla breve y en privado con ' + m.name + ', sin exponerlo frente al grupo.', 'Evitar hoy tareas en pareja que generen roce y repartir la carga de trabajo.', 'Compañeros: bajar el tono, darle espacio y dejar los temas sensibles para otro día.', 'Pausa de 10 minutos: respiración lenta (inhalar 4, exhalar 6) o ejercicio.', 'Si hay una discusión fuerte o amenazas: separar a las personas y avisar ya al oficial médico y al Comandante.']);
      p.whyPublic = 'El asistente detectó tensión alta en ' + m.name + '. Para cuidar su privacidad no se muestran sus datos de salud: solo cómo ayudar a la convivencia.';
      p.subject = m.id;
      out.push(p);
    }
    const E = news2(m.id);
    if (E.s >= 2) out.push(P('news-' + m.id, E.s, 'Salud', 'Puntaje de alerta temprana ' + E.total + ' · ' + m.name, 'Suma de respiración, oxígeno, temperatura, pulso y presión (NEWS2 adaptado): ' + E.txt.toLowerCase() + '.', m.name,
      ['Repetir los signos vitales y confirmar que el brazalete esté bien puesto.', 'Avisar al oficial médico para evaluarlo ahora.', 'Controlar los signos cada 30 minutos mientras siga alto.', 'Si sube a 7 o más: respuesta urgente y consulta con la Tierra.']));
    const vis = lastTest(m.id, 'vis');
    if (vis && vis.s >= 1) out.push(P('vis-' + m.id, 1, 'Salud', 'Cambio en la vista · ' + m.name, vis.detail + '. En misiones largas puede ser el síndrome SANS (los fluidos suben a la cabeza).', m.name,
      ['Repetir el test de la vista en 48 h.', 'Oficial médico: examen de ojos con el equipo de a bordo.', 'Evitar tareas de mucha precisión visual hasta la revisión.', 'Mandar el resultado en la próxima consulta con la Tierra.']));
    const nz = noiseDay(m.id);
    if (nz.s >= 1) out.push(P('noise-' + m.id, 1, 'Salud', 'Mucho ruido acumulado · ' + m.name, `Exposición de hoy: ${Math.round(nz.leq)} dBA (límite de 24 h: ${NOISE_LIM} dBA).`, m.name,
      ['Usar protectores auditivos en el ejercicio y en el taller.', 'Bajar el tiempo cerca de ventiladores y bombas.', 'Hacer el chequeo rápido de audición.']));
    if (lc && lc.s >= 2) out.push(P('mind-' + m.id, lc.s, 'Salud mental', 'Chequeo de mente en ' + STATE[lc.s].toLowerCase() + ' · ' + m.name, 'Último chequeo de salud mental: ' + lc.idx + ' de 100.', m.name, AL[2].it[0][1].split('|')));
  });
  const kitBad = (state.kit || []).filter((it) => kitStatus(it).s >= 1);
  if (kitBad.length) out.push(P('kit', kitBad.some((it) => kitStatus(it).s === 2) ? 2 : 1, 'Botiquín', 'Botiquín: ' + kitBad.length + ' medicamento' + (kitBad.length > 1 ? 's' : '') + ' a revisar', kitBad.map((it) => it.n.split(' (')[0] + ': ' + kitStatus(it).w.map((w) => w[1].toLowerCase()).join(', ')).join(' · ') + '.', 'Oficial médico',
    ['Separar los vencidos para que nadie los use.', 'Pedir reposición en el próximo envío de carga.', 'Revisar si hay un reemplazo en el botiquín para cada uno.']));
  return out.sort((a, b) => b.lvl - a.lvl);
}
/* Marca o desmarca un paso de un protocolo. */
function protoStep(id, i) {
  if (id.startsWith('eclss-')) { eclssStep(id.slice(6), i + 1); return; }
  const m = protoMem(), d = m[id] = m[id] || {since: Date.now(), done: []};
  d.done = d.done || []; d.done[i] = !d.done[i];
  save(); emit();
}
/* Lleva la cuenta de cuándo empezó cada protocolo, olvida los que ya no están y marca los escalados. */
function protoTrack(list) {
  const m = protoMem(), now = Date.now(), ids = new Set(list.map((p) => p.id));
  list.forEach((p) => { const d = m[p.id] = m[p.id] || {since: now, done: []}; d.seen = now; });
  Object.keys(m).forEach((k) => { if (!ids.has(k) && now - (m[k].seen || 0) > 60000) delete m[k]; });
}
function protoEscalate(id) { const m = protoMem(); (m[id] = m[id] || {since: Date.now(), done: []}).esc = true; save(); }
function radStorm(on) { state.radStorm = !!on; save(); emit(); }

// Monitor de radiación solar: escenarios del módulo, con los valores exactos que calcula su pipeline (ventanas de 600 s).
const RAD = {
  umbral: 1500, limite: 50, cortes: [0.25, 0.6, 1.0], nombres: ['Normal', 'Precaución', 'Alerta', 'Crítico'],
  escenarios: [
    {k: 'leo', n: 'Órbita baja · actividad tranquila', eventos: 10821, tasaMax: 197, acum: 0.002, nivel: 0},
    {k: 'saa', n: 'Órbita baja · anomalía del Atlántico Sur', eventos: 56538, tasaMax: 2419, acum: null, nivel: 0, nota: 'Pico transitorio de 2419 µSv/día; la última ventana volvió a normal.'},
    {k: 'spe', n: 'Tormenta solar (SPE)', eventos: 101933, tasaMax: 4614, acum: 0.223, nivel: 1},
    {k: 'gcr', n: 'Espacio profundo · rayos cósmicos (GCR)', eventos: 5890, tasaMax: 1467, acum: null, nivel: 0},
    {k: 'full', n: 'Misión completa · 6 horas', eventos: 159946, tasaMax: 1942, acum: 0.168, nivel: 1},
  ],
  pasos: [
    ['No se detectan valores inusuales. Continuar con el monitoreo habitual.'],
    ['Seguir las mediciones con atención y revisar la próxima ventana.', 'Verificar que el detector y los datos cargados sean correctos.'],
    ['Avisar al responsable de la misión.', 'Postergar actividades no esenciales con exposición.', 'Verificar el detector para descartar una falla en la medición.'],
    ['Suspender las actividades con exposición y avisar de inmediato al responsable.', 'Pasar a la zona de mayor blindaje disponible.', 'Registrar la hora y los valores, y seguir el protocolo de emergencia.'],
  ],
};
const radLevel = (frac) => (frac < RAD.cortes[0] ? 0 : frac < RAD.cortes[1] ? 1 : frac < RAD.cortes[2] ? 2 : 3);
/* Serie por ventana de 600 s para graficar. La forma de cada escenario (relativa a su pico)
   reproduce el perfil del archivo del módulo: cantidad de ventanas, ventana del pico, tasa
   máxima y nivel de la última ventana. Después se aplica el mismo cálculo del pipeline:
   acumulado += tasa × 600 s, fracciones contra 1500 µSv/día y 50 mSv, nivel = máx(tasa, acumulado). */
RAD.ventanaS = 600;
RAD.perfil = {
  leo: [.08, .1, 1, .09, .07, .06, .08, .07, .06, .07, .06, .08],
  saa: [.07, .06, .08, .07, .09, .07, .2, .55, 1, .62, .25, .09, .07, .06, .08, .07, .06, .07],
  spe: [.05, .06, .05, .12, .3, .55, .8, .95, 1, .92, .82, .7, .58, .45, .34, .25, .18, .14],
  gcr: [.42, .5, .38, .62, .45, 1, .4, .55, .47, .36, .52, .2],
  full: [.06, .07, .05, .08, .06, .07, .06, .09, .3, .62, .48, .15, .07, .06, .08, .07, .06, .07, .09, .15, .3, .5, .72, .88, .97, 1, .93, .84, .74, .65, .57, .5, .44, .39, .34, .31],
};
function radSeries(k) {
  const s = RAD.escenarios.find((x) => x.k === k) || RAD.escenarios[0], p = RAD.perfil[s.k];
  let acc = 0;
  const pts = p.map((f, i) => {
    const tasa = Math.round(s.tasaMax * f);
    acc += tasa / 86400 * RAD.ventanaS / 1000; // µSv/día × s → mSv
    return {ventana: i + 1, tasa, acum: acc};
  });
  // Si el módulo informa el acumulado final, la curva se ajusta a ese valor exacto.
  const k2 = s.acum !== null && acc > 0 ? s.acum / acc : 1;
  pts.forEach((q) => {
    q.acum *= k2;
    q.nTasa = radLevel(q.tasa / RAD.umbral); q.nAcum = radLevel(q.acum / RAD.limite);
    q.nivel = Math.max(q.nTasa, q.nAcum);
  });
  const peor = pts.reduce((a, b) => (b.nivel > a.nivel ? b : a), pts[0]);
  const pico = pts.reduce((a, b) => (b.tasa > a.tasa ? b : a), pts[0]);
  return {s, pts, peor, pico, ultima: pts[pts.length - 1]};
}
/* Histograma de LET con el mismo modelo del simulador del módulo: 97 % partículas ligeras
   (energía log-normal ~110 keV) y 3 % iones pesados (~2000 keV), detector de silicio de 300 µm.
   LET_agua = energía / (300 µm / cos ángulo) × 0,53 · Q(L) según ICRP 60. */
RAD.letBordes = [0, 1, 2, 5, 10, 20, 50, 100, 1000];
const qICRP = (L) => (L < 10 ? 1 : L <= 100 ? 0.32 * L - 2.2 : 300 / Math.sqrt(L));
function radLET(k) {
  const s = RAD.escenarios.find((x) => x.k === k) || RAD.escenarios[0];
  let seed = 7 + s.eventos % 97;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const N = 6000, B = RAD.letBordes, cnt = B.slice(1).map(() => 0);
  let dTot = 0, hTot = 0, hHeavy = 0;
  for (let i = 0; i < N; i++) {
    const heavy = rnd() < 0.03;
    const E = heavy ? 2000 * Math.exp(0.5 * gauss()) : 110 * Math.exp(0.35 * gauss());
    const ang = rnd() * 70 * Math.PI / 180;
    const L = E / (300 / Math.cos(ang)) * 0.53, Q = qICRP(L);
    const b = B.findIndex((x, j) => j > 0 && L < x) - 1;
    cnt[b < 0 ? cnt.length - 1 : b]++;
    dTot += E; hTot += E * Q; if (heavy) hHeavy += E * Q;
  }
  return {bordes: B, cuentas: cnt.map((c) => Math.round(c / N * s.eventos)), eventos: s.eventos, aportePesados: hHeavy / hTot, qMedio: hTot / dTot};
}

/* ======================================================================
   LLAMADA DE EMERGENCIA Y ESCALAMIENTO
   Si el tripulante no responde en 30 s, el aviso sube por pasos:
   alarma en su módulo → compañero más cercano → oficial médico →
   Control de Misión. Si responde "necesito ayuda", se salta directo al
   médico y al comandante.
   ====================================================================== */
const CALL_S = 30;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const onChange = (fn) => listeners.add(fn);
function nearest(uid) { const o = CREW.filter((c) => c.id !== uid); return o.find((c) => combined(c.id).s <= 1) || o[0]; }
function startCall(uid, from, reason) {
  if (state.calls.some((c) => c.uid === uid && c.status === 'ringing')) return;
  state.calls.push({id: nid(), uid, from, reason: reason || '', crisis: !!reason, ts: Date.now(), deadline: Date.now() + CALL_S * 1000, status: 'ringing', steps: []});
  save(); emit();
}
function sos(uid, reason) {
  const c = {id: nid(), uid, from: reason ? 'asistente' : 'self', reason: reason || '', ts: Date.now(), deadline: Date.now(), status: 'help', steps: []};
  escalateHelp(c); state.calls.push(c); save(); emit();
}
function escalateHelp(c) {
  const who = CREW.find((x) => x.id === c.uid).name, t = Date.now();
  c.steps.push({ts: t, t: c.reason ? 'El asistente dio aviso por ' + who + ': ' + c.reason : who + ' pidió ayuda.'}, {ts: t, t: 'Oficial médico avisado: va al módulo de ' + who + ' con el equipo médico.'}, {ts: t, t: 'Comandante avisado.'});
}
function answerCall(id, ok) {
  const c = state.calls.find((x) => x.id === id); if (!c || c.status !== 'ringing') return;
  c.status = ok ? 'ok' : 'help'; c.answered = Date.now();
  if (ok) c.steps.push({ts: Date.now(), t: CREW.find((x) => x.id === c.uid).name + ' respondió: está bien.'}); else escalateHelp(c);
  save(); emit();
}
function closeCall(id) { const c = state.calls.find((x) => x.id === id); if (c) { c.closed = true; save(); emit(); } }
function tickCalls() {
  let ch = false; const now = Date.now();
  state.calls.forEach((c) => {
    if (c.status === 'ringing' && now >= c.deadline) { c.status = 'noresp'; ch = true; }
    if (c.status !== 'noresp') return;
    const who = CREW.find((x) => x.id === c.uid).name, n = nearest(c.uid).name;
    const plan = [[0, 'Sin respuesta en ' + CALL_S + ' s. Suena la alarma en el módulo de ' + who + '.'], [5, 'Aviso a ' + n + ', el compañero más cercano: ir a ver a ' + who + '.'], [10, 'Oficial médico avisado: preparar el equipo médico.'], [15, 'Control de Misión avisado (la respuesta tarda ' + envOf().lat + ').']];
    plan.forEach(([s, t], i) => { if (c.steps.length <= i && now >= c.deadline + s * 1000) { c.steps.push({ts: now, t}); ch = true; } });
  });
  if (ch) { save(); emit(); }
}
const activeCalls = () => state.calls.filter((c) => !c.closed && (c.status === 'ringing' || c.status === 'noresp' || c.status === 'help'));

/* ======================================================================
   REPORTES DEL COMANDANTE (diario y semanal)
   ====================================================================== */
function report(kind) {
  const now = Date.now(), from = kind === 'semana' ? now - 7 * DAY : now - DAY, e = envOf(), L = [];
  const fecha = (t) => new Date(t).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'});
  L.push('FAVALORO · ' + (kind === 'semana' ? 'REPORTE SEMANAL' : 'REPORTE DIARIO'));
  L.push((kind === 'semana' ? fecha(from) + ' al ' + fecha(now) : fecha(now)) + ' · ' + e.n + ' · Día de misión 142');
  L.push('');
  L.push('TRIPULACIÓN');
  CREW.forEach((m) => {
    const c = combined(m.id), I = c.I, ch = checksOf(m.id).filter((x) => x.ts >= from);
    let line = '- ' + m.name + ' (' + m.job + '): ' + STATE[c.s].toUpperCase();
    if (kind === 'semana' && ch.length) {
      const avg = Math.round(ch.reduce((a, x) => a + x.idx, 0) / ch.length), d = ch[ch.length - 1].idx - ch[0].idx;
      line += ' · malestar promedio ' + avg + '/100 (' + (d > 3 ? 'empeora ' : d < -3 ? 'mejora ' : 'estable ') + (d > 0 ? '+' : '') + d + ') · ' + ch.filter((x) => x.s >= 2).length + ' días en alerta';
    } else if (c.c) line += ' · malestar ' + c.c.idx + '/100';
    line += ' · pulso ' + I.hr.val + ' lpm, SpO2 ' + I.spo2.val + ' %, sueño ' + I.sleep.val + ' h';
    if (c.n.pct !== null) line += ' · peso ' + (c.n.pct > 0 ? '+' : '') + f1(c.n.pct) + ' %';
    if (c.f.length) line += ' · señales: ' + c.f.join(', ');
    L.push(line);
  });
  L.push('');
  const sg = suggestions();
  L.push('ALERTAS Y RECOMENDACIONES');
  if (sg.length) sg.forEach((x) => L.push('- [' + ['Baja', 'Media', 'Alta', 'Urgente'][Math.min(x.p, 3)] + '] ' + x.who + ': ' + x.t)); else L.push('- Sin alertas.');
  L.push('');
  const dec = state.decisions.filter((d) => d.ts >= from);
  L.push('DECISIONES DEL COMANDANTE (' + dec.length + ')');
  if (dec.length) dec.forEach((d) => L.push('- ' + fmt(d.ts) + ' · ' + d.text)); else L.push('- Sin decisiones registradas.');
  L.push('');
  const cl = state.calls.filter((c) => c.ts >= from);
  L.push('LLAMADAS DE EMERGENCIA (' + cl.length + ')');
  if (cl.length) cl.forEach((c) => L.push('- ' + fmt(c.ts) + ' · ' + CREW.find((x) => x.id === c.uid).name + ': ' + ({ok: 'respondió bien', help: 'pidió ayuda', noresp: 'no respondió, se escaló', ringing: 'llamando'}[c.status]))); else L.push('- Ninguna.');
  L.push('');
  L.push('RIESGOS DEL ENTORNO');
  risks().forEach((r) => L.push('- ' + r.h + ': ' + ['bajo', 'medio', 'alto'][r.l] + '. ' + r.why));
  L.push('');
  L.push('Datos simulados de demostración. Umbrales orientativos, a validar por el equipo médico.');
  return L.join('\n');
}
function sendReport(kind) {
  const text = report(kind);
  state.sent.push({id: nid(), kind, ts: Date.now(), text});
  save(); emit();
}

/* ======================================================================
   ASESOR (por reglas): alertas, recomendaciones y respuestas por tema
   ====================================================================== */
// Temas que reconoce en una pregunta libre. Contenido de guía tomado de los protocolos de salud de la misión.
const TOPICS = [
  {k: ['cabeza', 'migraña', 'jaqueca'], t: 'Dolor de cabeza', g: 1, a: 'Tomá agua, hacé una pausa de 10 minutos y descansá la vista. En la nave puede deberse a CO₂ alto: el CO₂ está en ' + 'CO2VAL' + ' mmHg. Si dura más de 24 h o empeora, avisá al oficial médico. No te automediques.'},
  {k: ['dormir', 'sueño', 'insomnio', 'dormí', 'cansad'], t: 'Sueño', g: 1, a: 'Horarios fijos, luces y pantallas bajas una hora antes, nada de cafeína 6 h antes. Si llevás varios días durmiendo menos de 5 h, avisá al oficial médico y evitá tareas críticas.'},
  {k: ['ansie', 'nervios', 'pánico', 'panico', 'angustia', 'tenso'], t: 'Ansiedad o pánico', g: 2, a: 'Sentate y apoyá bien los pies: pasa en pocos minutos. Inhalá 4 segundos, exhalá 6. Nombrá 5 cosas que ves y 3 que podés tocar. Pedí que alguien te acompañe y avisá al oficial médico.'},
  {k: ['triste', 'familia', 'solo', 'ánimo', 'animo', 'extraño'], t: 'Ánimo bajo', g: 1, a: 'Escribí o hablá con tu familia: un mensaje corto ya ayuda. Compartí un rato con un compañero, sin hablar de trabajo. Si en 2 días no mejora, avisá al oficial médico.'},
  {k: ['hambre', 'comer', 'comida', 'apetito', 'peso'], t: 'Poco apetito', g: 1, a: 'Porciones chicas de lo que más te gusta y líquidos en sorbos. Registralo en Nutrición. Si comés muy poco 2 días seguidos o bajás de peso, avisá al oficial médico.'},
  {k: ['mareo', 'mareado', 'mareada', 'náusea', 'nausea', 'vómito', 'vomito', 'vomitar'], t: 'Mareo o náuseas', g: 2, a: 'Sentate o recostate y tomá líquidos en sorbos. No hagas tareas de riesgo hasta sentirte estable. Avisá hoy al oficial médico.'},
  {k: ['fiebre', 'temperatura', 'calor', 'escalofr'], t: 'Fiebre', g: 2, a: 'Reposo y líquidos. Si la temperatura pasa 38 °C o aparecen dificultad para respirar, confusión o desmayo, es una emergencia: avisá ya al oficial médico.'},
  {k: ['respirar', 'aire', 'ahogo', 'oxígeno', 'oxigeno'], t: 'Falta de aire', g: 3, a: 'Si te falta el aire de golpe: avisá YA al oficial médico y al Comandante. Revisá la lectura de oxígeno del brazalete y la presión de cabina. No te quedes solo.'},
  {k: ['pecho', 'corazón', 'corazon', 'palpita'], t: 'Dolor de pecho', g: 3, a: 'Dolor fuerte de pecho es una emergencia: activá la alarma, avisá al oficial médico y al Comandante, y quedate quieto hasta que llegue el equipo médico.'},
  {k: ['sangr', 'herida', 'corte'], t: 'Sangrado', g: 3, a: 'Presioná fuerte con un paño limpio y no lo saques. Avisá al oficial médico. Si no para, es una emergencia: activá la alarma.'},
  {k: ['inconsciente', 'desmay', 'no responde', 'no respira'], t: 'Persona que no responde', g: 3, a: 'Activá la alarma y avisá al oficial médico y al Comandante. Si no respira, empezá reanimación si sabés hacerlo y pedí el equipo médico. Si respira, no lo dejes solo. Desde la app podés llamar al tripulante: si no contesta en 30 s, FAVALORO escala solo.'},
  {k: ['fuego', 'humo', 'fuga', 'presión', 'presion', 'despresur'], t: 'Fuego o pérdida de presión', g: 3, a: 'Activá la alarma y avisá a toda la tripulación y a Control de Misión. Equipos de protección, aislar el módulo e ir a la zona segura. Recuento de tripulantes. No vuelvas al módulo sin autorización del Comandante.'},
  {k: ['daño', 'suicid', 'no puedo más', 'no puedo mas', 'matar'], t: 'Riesgo de hacerse daño', g: 3, a: 'Si sos vos: decíselo ahora a la persona más cercana, eso ya es un paso enorme. Si es otra persona: quedate con ella, escuchala sin juzgar y no la dejes sola. Avisá ya al oficial médico y al Comandante y pedí apoyo psicológico urgente.'},
  {k: ['radiación', 'radiacion', 'tormenta solar', 'dosis'], t: 'Radiación', g: 1, a: 'Hoy la dosis del entorno es ' + 'RADVAL' + '. Ante una tormenta solar, todos al refugio blindado y se suspenden las caminatas espaciales.'},
  {k: ['estrés', 'estres', 'sobrepas', 'tareas', 'carga'], t: 'Estrés', g: 1, a: 'Frená 2 minutos: inhalá 4 s, exhalá 6 s, 5 veces. Dividí lo pendiente en pasos chicos. Si te sobrepasa, pedile al Comandante que reparta la carga.'},
];
TOPICS.push(
  {k: ['panza', 'estomago', 'barriga', 'abdomen', 'colico', 'diarrea'], t: 'Dolor de panza', g: 1, a: 'Recostate un rato y tomá líquidos en sorbos. Comé liviano. Si el dolor es muy fuerte, no se va en unas horas o tenés fiebre o vómitos, avisá al oficial médico.'},
  {k: ['espalda', 'cintura', 'lumbar', 'muscul', 'contractura', 'calambre', 'rodilla', 'hombro', 'cuello'], t: 'Dolor de espalda o músculos', g: 1, a: 'En baja gravedad la columna se estira y los músculos se cargan: hacé los estiramientos del plan de ejercicio y calor local si hay. Si te duele al moverte o aparece hormigueo, avisá al oficial médico.'},
  {k: ['tos', 'garganta', 'resfri', 'mocos', 'congestion'], t: 'Tos o garganta', g: 1, a: 'Tomá líquidos tibios y descansá la voz. Usá barbijo para cuidar al resto en el módulo cerrado. Si aparece fiebre o falta de aire, avisá al oficial médico.'},
  {k: ['vista', 'ojos', 'ojo', 'borroso', 'veo mal'], t: 'Cambios en la vista', g: 2, a: 'En el espacio la vista puede cambiar (síndrome SANS). Avisá hoy al oficial médico para un control de ojos y evitá tareas que requieran precisión visual hasta la revisión.'},
  {k: ['oido', 'oidos', 'zumbido', 'escucho mal'], t: 'Oídos', g: 1, a: 'El ruido constante de la nave cansa el oído: usá protectores cuando puedas. Si escuchás menos o tenés zumbido que no se va, avisá al oficial médico para una audiometría.'},
  {k: ['golpe', 'golpee', 'cai', 'caida', 'torci', 'esguince', 'fractura'], t: 'Golpe o lesión', g: 2, a: 'Quedate quieto y no fuerces la zona. Frío local si hay. Avisá al oficial médico para que lo revise. Si hay deformidad, mucho dolor o no podés moverlo, es urgente.'},
);
// Normaliza lo que escribe o dice la persona: sin tildes, sin signos, sin letras repetidas.
const norm = (q) => String(q).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ0-9 ]/g, ' ').replace(/(.)\1{2,}/g, '$1').replace(/([a-zñ])\1+\b/g, '$1').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({length: a.length + 1}, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/* Busca el tema aunque la frase venga con errores de tipeo o del reconocimiento de voz:
   primero coincidencia directa y, si no hay, palabras parecidas (una o dos letras de diferencia). */
// Palabras comunes que no deben confundirse con un tema ("tengo" no es "tenso").
const STOP = new Set(['tengo', 'tenes', 'tiene', 'siento', 'estoy', 'mucho', 'mucha', 'poco', 'poca', 'algo', 'como', 'cuando', 'donde', 'porque', 'ahora', 'todo', 'toda', 'bien', 'malo', 'mala', 'nada', 'esto', 'esta', 'este', 'tanto', 'hace', 'hago', 'quiero', 'puedo', 'tambien', 'agente', 'gente']);
function topicAnswer(q) {
  const s = norm(q), words = s.split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
  let tp = TOPICS.find((x) => x.k.some((k) => s.includes(norm(k))));
  let fuzzy = false;
  if (!tp) {
    // Si habla de dolor, primero se busca entre los dolores (para no confundir «pexo» con «peso»).
    const pain = /dol|duel/.test(s), PAIN = ['Dolor de cabeza', 'Dolor de pecho', 'Dolor de panza', 'Dolor de espalda o músculos', 'Golpe o lesión', 'Cambios en la vista', 'Oídos'];
    // La palabra más parecida (la de menos diferencias; a igualdad, la clave más larga).
    let best = null;
    TOPICS.filter((x) => !pain || PAIN.includes(x.t)).forEach((x) => x.k.forEach((k) => {
      const kk = norm(k); if (kk.includes(' ') || kk.length < 4) return;
      words.forEach((w) => { const d = lev(w, kk), lim = kk.length >= 7 || pain ? 2 : 1; if (d <= lim && (!best || d < best.d || (d === best.d && kk.length > best.l))) best = {x, d, l: kk.length}; });
    }));
    if (best) { tp = best.x; fuzzy = true; }
  }
  if (!tp) return null;
  // Si lo adivinó por parecido, dice qué entendió para que la persona pueda corregirlo.
  return {t: tp.t, g: tp.g, fuzzy, a: (fuzzy ? 'Entendí: ' + tp.t.toLowerCase() + '. Si no era eso, decímelo con otras palabras. ' : '') + tp.a.replace('CO2VAL', f1(ship.co2)).replace('RADVAL', envOf().rad)};
}

load();
state.calls = state.calls || []; state.sent = state.sent || [];
if (!state.seeded) seed();
seedTests(); seedKit();
setInterval(() => { tick(); tickCalls(); }, 1000);
// Otra pestaña abierta (por ejemplo, el tripulante) cambió algo: recargar y avisar.
addEventListener('storage', (e) => { if (e.key === LS) { load(); emit(); } });

return {CREW, ROLES, SC, live, R, RANGE, sleepNight, STAGES,
  COMMS, comms, commsPlan, nextWindow, dur, baseline, news2, testsOf, lastTest, saveTest, seedTests, noiseDay, NOISE_LIM, fitness, seedKit, kitStatus, kitUse, sendConsult, msgPlan, STATE, color, label, worst, f1, Q, DOM, calc, stOf, NQ, ENV, ship, SHIPR, AL, ZONES,
  get state() { return state; }, save, seed, nid, dayOf, dl, fmt, DAY,
  checksOf, lastCheck, nutriOf, regsOf, lastReg, ind, nsum, combined, suggestions, risks, envOf,
  CALL_S, startCall, sos, answerCall, closeCall, activeCalls, onChange, report, sendReport, topicAnswer, TOPICS,
  setReal, isReal, simulate, NASA, careerDose,
  eclss, eclssCrisis, eclssStep, eclssActive, RAD, radLevel, radSeries, radLET, protocols, protoStep, protoTrack, protoEscalate, radStorm};
})();
