/* =====================================================================
   FAVALORO · conexión con Gemini (Google AI Studio, nivel gratuito)
   Cada equipo pega su propia clave. Se guarda solo en este navegador.
   Si no hay clave, se agota el límite gratuito o no hay internet,
   el acompañante y el asistente vuelven solos a las reglas.
   Nota: en el nivel gratuito Google puede usar los datos para mejorar sus
   productos. Los datos de esta demo son simulados.
   ===================================================================== */
window.FVAI = (() => {
'use strict';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
let key = '', model = '', lastError = '';
try { key = localStorage.getItem('fv_gemini_key') || ''; model = localStorage.getItem('fv_gemini_model') || ''; } catch (e) { /* sin almacenamiento */ }

/* ---------- IA local, gratis y de código abierto: WebLLM ----------
   Corre un modelo abierto (Qwen o Llama) dentro del navegador con WebGPU.
   La primera vez descarga el modelo (~1 GB) y queda guardado: después
   funciona sin internet y sin clave. Necesita Chrome o Edge con WebGPU y
   abrir la web con iniciar.bat. https://github.com/mlc-ai/web-llm */
const WEBLLM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.82/+esm';
let provider = 'none', local = null, localModel = '', progress = '';
try { provider = localStorage.getItem('fv_ai_provider') || (key ? 'gemini' : 'none'); } catch (e) { /* idem */ }
async function connectLocal(onProgress) {
  if (!navigator.gpu) { lastError = 'Este navegador no tiene WebGPU: usá Chrome o Edge actualizados.'; return status(); }
  provider = 'local';
  try {
    progress = 'Cargando WebLLM…'; if (onProgress) onProgress(progress);
    const webllm = await import(WEBLLM);
    const list = (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) || [];
    const pick = [/^Qwen2\.5-1\.5B-Instruct-q4f16_1/, /^Llama-3\.2-1B-Instruct-q4f16_1/, /^Qwen2\.5-0\.5B-Instruct-q4f16_1/, /Instruct-q4f16_1/]
      .map((re) => list.find((m) => re.test(m.model_id))).find(Boolean);
    if (!pick) throw new Error('no encontré un modelo liviano');
    local = await webllm.CreateMLCEngine(pick.model_id, {initProgressCallback: (r) => { progress = r.text || ''; if (onProgress) onProgress(progress); }});
    localModel = pick.model_id; provider = 'local'; lastError = '';
    try { localStorage.setItem('fv_ai_provider', 'local'); } catch (e) { /* idem */ }
  } catch (e) { lastError = 'No se pudo cargar la IA local: ' + (e.message || e); provider = 'none'; progress = ''; }
  return status();
}
// Si la IA local estaba activa, se vuelve a cargar sola (el modelo ya está guardado en el navegador).
setTimeout(() => { if (provider === 'local' && !local) connectLocal(); }, 1500);
async function askLocal(system, history, json) {
  const msgs = [{role: 'system', content: system + (json ? '\nRespondé únicamente con un objeto JSON válido.' : '')}].concat(history.slice(-12).map((m) => ({role: m.who === 'me' ? 'user' : 'assistant', content: m.t})));
  while (msgs.length > 1 && msgs[1].role !== 'user') msgs.splice(1, 1);
  const r = await local.chat.completions.create(Object.assign({messages: msgs, temperature: 0.5, max_tokens: 400}, json ? {response_format: {type: 'json_object'}} : {}));
  const text = ((r.choices || [])[0] || {}).message ? r.choices[0].message.content.trim() : '';
  if (!text) throw new Error('vacío');
  if (!json) return text;
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text);
}

const enabled = () => (provider === 'local' ? !!local : provider === 'gemini' && !!key && !!model);
const status = () => {
  if (provider === 'local' && local) return 'IA local conectada: ' + localModel.replace(/-q4f16_1-MLC$/, '') + ' (gratis, en tu navegador)';
  if (provider === 'local' && !local && progress) return progress;
  if (provider === 'gemini' && key && model) return 'Conectado a ' + model.replace('models/', '');
  return lastError || 'Sin IA conectada: el acompañante usa reglas.';
};
const needsReload = () => provider === 'local' && !local;

/* Elige un modelo "flash" de texto disponible para esa clave (no se adivina el nombre). */
async function pickModel(k) {
  const r = await fetch(BASE + '/models?pageSize=200', {headers: {'x-goog-api-key': k}});
  if (!r.ok) throw new Error(r.status === 400 || r.status === 403 ? 'La clave no es válida.' : 'Google respondió ' + r.status + '.');
  const j = await r.json();
  const ok = (j.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /flash/i.test(m.name) && !/image|tts|audio|live|embedding|thinking|vision|preview-0/i.test(m.name));
  if (!ok.length) throw new Error('Esta clave no tiene modelos Flash disponibles.');
  ok.sort((a, b) => b.name.localeCompare(a.name, undefined, {numeric: true}));
  const stable = ok.find((m) => !/preview|exp/i.test(m.name)) || ok[0];
  return stable.name;
}
async function connect(k) {
  k = (k || '').trim();
  if (!k) { disconnect(); return status(); }
  try {
    const m = await pickModel(k);
    key = k; model = m; lastError = ''; provider = 'gemini';
    try { localStorage.setItem('fv_gemini_key', k); localStorage.setItem('fv_gemini_model', m); localStorage.setItem('fv_ai_provider', 'gemini'); } catch (e) { /* idem */ }
  } catch (e) { lastError = 'No se pudo conectar: ' + e.message; }
  return status();
}
function disconnect() {
  key = ''; model = ''; lastError = ''; provider = 'none'; local = null; progress = '';
  try { localStorage.removeItem('fv_gemini_key'); localStorage.removeItem('fv_gemini_model'); localStorage.removeItem('fv_ai_provider'); } catch (e) { /* idem */ }
}

/**
 * Una llamada a Gemini. history: [{who:'me'|'bot', t}]. json: pide respuesta en JSON.
 * Devuelve el texto (o el objeto si json) y lanza error si falla, para usar las reglas de respaldo.
 */
async function ask(system, history, json) {
  if (!enabled()) throw new Error('sin clave');
  if (provider === 'local') return askLocal(system, history, json);
  const contents = history.slice(-16).map((m) => ({role: m.who === 'me' ? 'user' : 'model', parts: [{text: m.t}]}));
  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (!contents.length) contents.push({role: 'user', parts: [{text: 'Hola'}]});
  const body = {
    systemInstruction: {parts: [{text: system}]},
    contents,
    generationConfig: Object.assign({temperature: 0.6, maxOutputTokens: 800}, json ? {responseMimeType: 'application/json'} : {}),
  };
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(`${BASE}/${model}:generateContent`, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(body), signal: ctl.signal});
    if (r.status === 429) { lastError = 'Se agotó el límite gratuito por ahora: vuelvo a las reglas.'; throw new Error('limite'); }
    if (!r.ok) { lastError = 'Gemini respondió ' + r.status + ': vuelvo a las reglas.'; throw new Error('http ' + r.status); }
    const j = await r.json();
    const text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('vacío');
    lastError = '';
    if (!json) return text;
    return JSON.parse(text.replace(/^```json\s*|```$/g, ''));
  } finally { clearTimeout(to); }
}

/**
 * Igual que ask, pero va entregando el texto a medida que se genera (onDelta), para que la
 * voz empiece a hablar con la primera frase. Con IA local usa streaming; con Gemini entrega todo junto.
 */
async function askStream(system, history, onDelta, maxTokens) {
  if (!enabled()) throw new Error('sin clave');
  if (provider !== 'local') { const t = await ask(system, history, false); onDelta(t); return t; }
  const msgs = [{role: 'system', content: system}].concat(history.slice(-12).map((m) => ({role: m.who === 'me' ? 'user' : 'assistant', content: m.t})));
  while (msgs.length > 1 && msgs[1].role !== 'user') msgs.splice(1, 1);
  const chunks = await local.chat.completions.create({messages: msgs, temperature: 0.5, max_tokens: maxTokens || 260, stream: true});
  let full = '';
  for await (const c of chunks) { const d = (((c.choices || [])[0] || {}).delta || {}).content || ''; if (d) { full += d; onDelta(d); } }
  if (!full.trim()) throw new Error('vacío');
  return full.trim();
}

return {enabled, status, connect, connectLocal, disconnect, ask, askStream, needsReload, provider: () => provider};
})();
