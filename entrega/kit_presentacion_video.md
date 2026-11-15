# FAVALORO · Kit de presentación y video

**The Muds Devs · NASA Space Apps Challenge 2026 · Santiago del Estero**
Desafío: *Create Health Monitoring Software for Astronauts on Space Missions*
Actualizado: 15/11/2026

Todo lo que necesita el equipo para el video promocional, la presentación y la entrega: qué problema resolvemos, todo lo que hace la app, cómo la hicimos, los guiones y la lista de entrega.

---

## 1. El mensaje en una frase

**Cuando la Tierra tarda 20 minutos en contestar, FAVALORO cuida a la tripulación en el momento.**

El jurado tiene que salir pensando tres cosas:

1. **El problema es real y crece:** lejos de la Tierra no hay médico en vivo, y desde Marte un mensaje tarda hasta 24 minutos en llegar.
2. **FAVALORO lo resuelve de punta a punta:** mide solo, charla, detecta temprano, avisa a todos y guía qué hacer, sin depender de la Tierra.
3. **Está hecho y funciona:** una web que cualquiera puede abrir, un brazalete real con ESP32 y reglas basadas en datos de la NASA.

Frase de cierre: *«FAVALORO: salud que no espera a la Tierra.»* · En inglés: *«Health that doesn't wait for Earth.»*

---

## 2. La necesidad

La humanidad vuelve a la Luna con Artemis y se prepara para Marte: misiones de meses o años, cada vez más lejos del hospital más cercano.

| Qué pasa lejos de la Tierra | Por qué importa |
| --- | --- |
| Un mensaje a Marte tarda de 4 a 24 minutos por tramo | Una emergencia no puede esperar la respuesta de un médico en la Tierra |
| La NASA estudia 5 peligros del vuelo espacial: radiación, aislamiento, distancia, gravedad y ambientes hostiles | Afectan el cuerpo y la mente al mismo tiempo |
| La radiación se acumula: la NASA fija un límite de carrera de 600 mSv (NASA-STD-3001) | Hay que medirla todos los días, por persona |
| Sin gravedad se pierde hueso y músculo; los datos OSDR que bajó el equipo muestran −30 % de densidad ósea en 4 semanas con carga lunar (estudio en ratas, OSD-608) | Hay que prevenir, no solo curar al volver |
| La vista puede cambiar en misiones largas (síndrome SANS) | Se detecta temprano solo si se controla seguido |
| Aislamiento, estrés y convivencia en un espacio cerrado | El ánimo y los conflictos ponen en riesgo la misión |
| El CO₂ de cabina y el ruido constante de la nave | Dan dolor de cabeza, cansancio y pérdida de audición |

Hoy gran parte de esto depende de cuestionarios largos y del contacto con la Tierra. **La tripulación necesita una herramienta que mida sola, entienda lo que le pasa, prevenga y actúe en el momento, con o sin señal.**

---

## 3. La solución: qué es FAVALORO

FAVALORO es una aplicación web de monitoreo y prevención de salud para astronautas, con un brazalete propio y un asistente que habla. [Confirmar con el equipo: si el nombre homenajea a René Favaloro, el médico argentino que creó el bypass coronario, decirlo en el video: conecta con el público argentino.]

El detalle completo de cada pantalla de la app y de la web está en `descripcion_app_web.md`.

**Lo que la hace distinta:**

- **Mide sola.** Un brazalete con ESP32 manda pulso, oxígeno y temperatura por Bluetooth estándar. El tripulante no carga nada a mano.
- **Charla.** Lo que ningún sensor mide (ánimo, estrés, sueño percibido, comidas) lo completa un asistente por voz, que entiende frases con errores y llena los formularios solo.
- **Previene.** Compara a cada tripulante con su propio normal, hace tests semanales (vista, memoria, atención, audición) y dice si está apto para una caminata espacial.
- **Actúa en el peor escenario.** Si un valor es peligroso, llama al tripulante con una cuenta regresiva en voz. Si no responde, avisa al compañero más cercano, al oficial médico y a la Tierra.
- **Cuida la cabeza y el corazón.** Diario privado, mensajes con fotos y audios para la familia, y pedido de charla con el psicólogo.
- **Funciona lejos.** Calcula la demora real de comunicación con la Tierra (Luna 1,3 s, Marte hasta 24 min) y sigue funcionando sin conexión con reglas propias.
- **Sin instalar nada y gratis.** Se abre en Chrome o Edge. La IA es de código abierto y corre dentro del navegador.

---

## 4. Todo lo que hace, rol por rol

La app tiene cuatro vistas. Cada rol ve lo que necesita y nada más (privacidad por diseño).

### Tripulante

| Pestaña | Qué hace |
| --- | --- |
| Mi día | Tareas del día, estado general, rachas, nivel y logros (gamificación que premia el hábito de cuidarse, nunca el resultado), brazalete en vivo (pulso, oxígeno, temperatura, respiración, sueño, actividad, dosis de radiación), «¿Estoy apto hoy?», sueño por fases y horario del chequeo diario |
| Mente y estrés | 14 preguntas de salud mental y estrés. El brazalete completa 3 solas; el resto se charla con el asistente o se marca a mano |
| Tests | Vista (rejilla de Amsler para el síndrome SANS), memoria (números), atención (colores) y audición (tres tonos). Ruido del día con gráfico y horas de protectores |
| Familia y diario | Diario privado que se charla por voz; mensajes con fotos y audios para la familia, con la demora real de llegada; mensajes de la familia leídos en voz alta; pedido de charla con el psicólogo; respiración guiada 4-6 y anclaje 5-4-3-2-1 |
| Nutrición | Chequeo de comidas y agua por charla o a mano; masa corporal; semáforo de 14 días |
| Registros | Glucosa y presión llegan solas del dispositivo; el ánimo sale de la charla; test de reacción |
| Historial | Evolución de mente y estrés por día y registros recientes |

### Oficial médico

| Pestaña | Qué hace |
| --- | --- |
| Tripulación | Estado combinado de los tres tripulantes y signos vitales en vivo |
| Ficha clínica | Signos, alerta temprana (NEWS2 adaptado), desvío de cada signo respecto del propio normal, «¿Apto para la tarea?», tests y ruido, sueño por fases y sugerencias |
| Mente / Nutrición | Respuestas detalladas y tendencias |
| Botiquín | Inventario con vencimientos y «quedan pocos», registro de cada uso con hora y tripulante |
| Consulta Tierra | Paquete médico para el cirujano de vuelo (signos, tests, síntomas, foto) con hora de llegada y de respuesta según la demora real |
| Plan NASA | Plan de evaluaciones según los documentos MEDB (en vuelo y al volver, R+0 a R+30) |
| Alertas | Protocolos activos, alertas clínicas y pedidos de charla con el psicólogo (sin ver el diario) |

### Comandante

| Pestaña | Qué hace |
| --- | --- |
| Parte del día | Estado de la tripulación y decisiones sugeridas por prioridad |
| ¿Apto para la tarea? | Para cada tripulante: apto, apto con cuidado o no apto, para caminata espacial y para tarea crítica, con los motivos |
| Reportes | Reporte diario y semanal: enviar a la Tierra, descargar o copiar |
| Decisiones | Registro de decisiones aprobadas |
| Emergencias | Protocolos activos, llamar a un tripulante con escalamiento automático y pasos fijos |
| Evolución | Tendencias de la tripulación |

### Especialista de misión

| Pestaña | Qué hace |
| --- | --- |
| Entorno | Estación Espacial, Luna o Marte: gravedad, radiación, demora de comunicación y peligros |
| Nave | Telemetría de cabina (presión, oxígeno, CO₂, temperatura, humedad) y simulación de falla del depurador de CO₂ |
| Soporte vital | Módulo de nuestros compañeros: motor de correlación que cruza ambiente, agua y biomarcadores, y abre protocolos con checklist |
| Radiación solar | Módulo de nuestros compañeros: 5 escenarios, tasa por ventana, dosis acumulada e histograma de energía (LET) |
| Riesgos | Los 5 peligros del vuelo espacial de la NASA, con nivel por tripulante, más la vigilancia del asistente y botones para probar el peor escenario |

### El asistente (en todas las vistas)

- Se abre con un toque, saluda en voz alta y queda escuchando solo: se charla de corrido.
- Entiende frases cortas y con errores («me duele el pexo», «tengo fibre») y pregunta dónde duele si no queda claro.
- Si no entiende al tripulante tres veces, pregunta «¿estás bien?» y, si no responde, avisa al equipo (puede ser confusión o falta de oxígeno).
- Hace el chequeo diario charlando y lo guarda solo.
- Guía cada protocolo paso a paso: «Paso 2 de 4… decime listo».
- Alertas con sonido (suave, pitidos o alarma según la gravedad) y en voz alta. Se pueden silenciar 15 minutos.
- Avisa a todos cuando un compañero muestra señales de tensión que pueden terminar en conflicto, sin mostrar sus datos de salud.

### Vigilancia automática y peor escenario

- Cada pocos segundos revisa nave, radiación, botiquín y signos de cada tripulante, y abre protocolos.
- **Crisis:** si alguien tiene el oxígeno bajo o una emergencia de salud mental, el asistente lo llama al instante. Hay cuenta regresiva en voz en su pantalla y en la de todos. Si no responde en 30 s: alarma en su módulo, compañero más cercano, oficial médico y Control de Misión.
- Si un protocolo crítico no avanza en 90 s, escala solo.
- Si el brazalete real se desconecta, abre un protocolo para ir a verlo.

### Para todos

- Modo oscuro (la estética de la misión), modo claro o automático; letra normal, grande o muy grande; alto contraste para baja visión. Se adapta a compu y celular.

---

## 5. Cómo funciona por dentro

- **Web sin instalación:** HTML, CSS y JavaScript puros. Se abre con `iniciar.bat` en la compu o con un link https para compartir.
- **Brazalete:** ESP32 + sensor MAX30102 (pulso y oxígeno) + MLX90614 (temperatura). Usa los servicios Bluetooth estándar de salud: pulso 0x180D, oxímetro 0x1822, termómetro 0x1809 y presión 0x1810. La web se conecta con Web Bluetooth.
- **Voz:** reconocimiento y síntesis de voz del navegador (Web Speech API). Conversación continua: el micrófono queda abierto y no se escucha a sí mismo.
- **IA gratis y de código abierto:** WebLLM corre un modelo abierto (Qwen 2.5 o Llama 3.2) dentro del navegador, sin clave ni costo. Opcional: Gemini. Sin IA, todo sigue funcionando con reglas.
- **Sonidos:** generados en el navegador (Web Audio), sin archivos.
- **Datos:** se guardan en el navegador del dispositivo. Las fotos y los audios, en la base del navegador (IndexedDB).
- **Comunicación con la Tierra:** modelo con la velocidad de la luz y las ventanas reales (relés en la Estación Espacial, enlace continuo en la Luna, pases de orbitadores en Marte).

---

## 6. Datos de la NASA y agencias asociadas que usamos

| Fuente | Para qué la usamos |
| --- | --- |
| NASA-STD-3001 Vol. 1 y 2 | Límite de radiación de carrera (600 mSv), CO₂ de cabina (3 mmHg), límites de ruido |
| NASA Human Research Program · los 5 peligros | Pestaña Riesgos y vigilancia del asistente |
| Medical Data Available for Request (catálogo MEDB/MR) | Qué dato médico oficial corresponde a cada medición |
| MEDB N3.06 (nutrición) y MR013S, MR042S, MEDB 1.5, 1.8, 1.15 | Planillas de nutrición y neurológicas del equipo, plan de evaluaciones |
| OCHMO-TB-020 (radiación) y OCHMO-TB-004 (CO₂) | Recomendaciones de protección |
| NASA OSDR · OSD-608 y OSD-596 | Pérdida ósea según la gravedad y locomoción con gravedad artificial (datos crudos procesados por el equipo) |
| Agencia Espacial Canadiense (CANS) | Neutrones: cerca del 30 % de la radiación en la Estación Espacial |
| Fotos Apollo 11 y Luna LRO (dominio público, NASA) | Imágenes del sitio |

Referencias adicionales usadas como base (no son datos de NASA): NEWS2 del Royal College of Physicians (puntaje de alerta temprana, adaptado y no validado para vuelo espacial) y el estudio «Journals» de la NASA sobre diarios de astronautas, como fundamento del diario.

---

## 7. Cómo lo trabajamos

1. **Investigación.** Leímos los recursos del desafío, los estándares NASA-STD-3001, los peligros del Human Research Program y los documentos médicos MEDB. Bajamos datos crudos de NASA OSDR y los resumimos.
2. **Trabajo en módulos.** Cada parte del equipo armó una pieza: planillas de salud mental y nutrición en Excel, el módulo de soporte vital (motor de correlación) y el monitor de radiación. La app integra sus datos y reglas, con diseño propio.
3. **Hardware real.** Diseñamos el brazalete con ESP32 y sensores baratos, con servicios Bluetooth estándar para que cualquier dispositivo médico compatible se pueda conectar.
4. **Diseño.** Una estética cinematográfica (la Tierra saliendo sobre la Luna, interfaz tipo HUD). Iteramos varias veces con capturas reales hasta que nada quedara cortado en compu ni en celular.
5. **Voz e IA.** Primero probamos Gemini; como cuesta dinero, elegimos una IA de código abierto que corre en el navegador. Ajustamos la voz para que suene amable y la charla para que sea fluida.
6. **Pensando en el peor escenario.** Agregamos escalamiento automático, protocolos guiados, llamadas de crisis con cuenta regresiva y avisos cuando alguien no puede comunicarse.
7. **Prevención y bienestar.** Sumamos tests semanales, línea base personal, «¿apto para la tarea?», ruido, botiquín, consulta con la Tierra, diario y familia.
8. **Accesibilidad.** Modo claro y oscuro, letra grande y alto contraste, siguiendo WCAG 2.1 AA.
9. **Uso de IA en el desarrollo.** Usamos Claude (Anthropic) como asistente para programar, investigar y redactar. Las decisiones, los datos y las pruebas son del equipo.

---

## 8. Guion del video de 30 segundos (para la entrega)

Space Apps pide un video de 30 s o hasta 7 diapositivas. Este guion va con subtítulos en inglés.

| Tiempo | Imagen | Voz (ES) | Subtítulo (EN) |
| --- | --- | --- | --- |
| 0–4 s | Inicio: la Tierra saliendo sobre la Luna | «Desde Marte, pedir ayuda tarda 20 minutos.» | "From Mars, a call for help takes 20 minutes." |
| 4–9 s | Escaneo con la mira sobre el traje | «FAVALORO mide solo con un brazalete…» | "FAVALORO measures on its own with a wristband…" |
| 9–14 s | El asistente hablando y llenando el chequeo | «…y charla para entender lo que ningún sensor mide.» | "…and talks to understand what no sensor can." |
| 14–19 s | ¿Apto para la tarea? y test de la vista | «Previene: dice quién está apto para salir de la nave.» | "It prevents: it tells who is fit to go outside." |
| 19–25 s | Crisis: cuenta regresiva en rojo y alarma | «Y si alguien no responde, avisa a todos hasta la Tierra.» | "If someone doesn't answer, it alerts everyone, all the way to Earth." |
| 25–30 s | Logo animado | «FAVALORO. Salud que no espera a la Tierra.» | "FAVALORO. Health that doesn't wait for Earth." |

---

## 9. Guion del video promocional de 2 minutos

Tono: documental de misión espacial, emocional al principio y ágil en la demo. Música épica suave que crece; silencio en la crisis.

| # | Tiempo | Pantalla o toma | Voz en off | Texto en pantalla |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:10 | Negro. Latido de corazón. Aparece la Tierra saliendo sobre la Luna (inicio de la web) | «A 400 mil kilómetros de casa, un latido cambia de ritmo.» | — |
| 2 | 0:10–0:22 | Mapa de la demora: Luna 1,3 s, Marte 24 min (pantalla Consulta Tierra) | «Desde Marte, una pregunta al médico tarda hasta 24 minutos en llegar. Y otros 24 en volver.» | 4–24 min por tramo |
| 3 | 0:22–0:30 | Pestaña Riesgos: los 5 peligros de la NASA | «Radiación, aislamiento, distancia, gravedad, ambientes hostiles. La tripulación necesita ayuda ahora.» | Los 5 peligros · NASA HRP |
| 4 | 0:30–0:38 | Logo FAVALORO animado | «Por eso creamos FAVALORO.» | FAVALORO |
| 5 | 0:38–0:48 | Brazalete real en la muñeca + Mi día con signos en vivo | «Un brazalete mide pulso, oxígeno y temperatura. Solo. Sin cargar nada.» | Brazalete ESP32 · Bluetooth |
| 6 | 0:48–1:00 | Se abre el asistente, saluda y charla el chequeo de mente | «Y un asistente que habla completa lo que ningún sensor mide: cómo dormiste, cómo te sentís.» | Charla por voz · IA de código abierto |
| 7 | 1:00–1:10 | Tests: rejilla de Amsler, memoria, ¿Apto para la tarea? del Comandante | «Previene: controla la vista, la memoria y dice quién está apto para una caminata espacial.» | Prevención |
| 8 | 1:10–1:25 | Simular hipoxia: cuenta regresiva roja, alarma, voz «quedan 10 segundos» | (silencio, solo alarma y cuenta) «…Y si algo sale mal, no espera.» | Crisis · 30 s |
| 9 | 1:25–1:35 | Banner del Comandante y del médico, protocolo guiado paso a paso | «Avisa a todos y guía qué hacer, paso a paso, aunque la Tierra no conteste.» | Escalamiento automático |
| 10 | 1:35–1:45 | Familia y diario: foto a la familia, diario, respiración guiada | «Y cuida lo que no se ve: el diario, la familia, la mente.» | Bienestar |
| 11 | 1:45–1:52 | Cambio a modo claro y letra grande | «Para todos, en cualquier pantalla.» | Accesible |
| 12 | 1:52–2:00 | Logo + equipo | «FAVALORO. Salud que no espera a la Tierra. The Muds Devs, Santiago del Estero.» | NASA Space Apps 2026 |

---

## 10. Cómo grabar cada demo

**Antes de grabar:**

- Abrir la web en Chrome o Edge con `iniciar.bat` o el link https. Permitir micrófono.
- Grabar pantalla con **OBS Studio** (gratis) o con la Xbox Game Bar de Windows (Win + G).
- Activar la voz del asistente y subir el volumen para que se escuchen la voz y las alarmas.
- Usar resolución 1920×1080, zoom del navegador al 100 % y modo oscuro (salvo la toma de accesibilidad).
- Para mostrar dos roles a la vez, abrir dos pestañas: una como Comandante y otra como Tripulante.

| Toma | Cómo hacerla |
| --- | --- |
| Inicio cinematográfico | Abrir la web y bajar despacio con la rueda del mouse |
| Escaneo del traje | Seguir bajando y pasar el mouse sobre el astronauta |
| Ingreso por rol | Botón «Ingresar», elegir rol y tripulante |
| Asistente que habla | Tripulante → botón «Asistente» abajo a la derecha → decir «sí, hagámoslo» para el chequeo |
| Frases con errores | En el asistente escribir «me duele el pexo» o solo «dolor» |
| ¿Apto para la tarea? | Comandante → pestaña «¿Apto para la tarea?» |
| Test de la vista | Tripulante → «Tests» → rejilla de Amsler |
| Crisis con cuenta regresiva | Especialista → «Riesgos» → botón «Hipoxia en Astronauta 2». En otra pestaña, entrar como Astronauta 2 para ver la llamada |
| Tormenta solar / falla de CO₂ / crisis de soporte vital | Especialista → «Riesgos» → botones de «Probar el peor escenario» |
| Protocolo guiado | En el asistente decir «qué hago» y después «listo» |
| Consulta con la Tierra | Oficial médico → «Consulta Tierra». Para Marte: Especialista → Entorno → Marte |
| Familia y diario | Tripulante → «Familia y diario» → escribir en el diario, adjuntar una foto y enviar |
| Modo claro y letra grande | Botón «Aa» arriba a la derecha |

**Edición:** CapCut o DaVinci Resolve (gratis). Música libre de YouTube Audio Library o Pixabay. Subtítulos en inglés. **No usar logos, banderas ni insignias de la NASA.**

---

## 11. Qué hay que entregar (checklist)

- [ ] **Nombre del proyecto:** FAVALORO
- [ ] **Resumen general** (sección 12)
- [ ] **Demo:** video de 30 s en YouTube (público o no listado) o hasta 7 diapositivas en PDF público. Ya hay una presentación de 7 diapositivas hecha; actualizarla con las funciones nuevas.
- [ ] **Link al proyecto:** repositorio de GitHub con el código, el README y el `iniciar.bat`
- [ ] **Link a la app funcionando:** publicar en GitHub Pages (link fijo y gratis). El link del túnel desde la compu cambia cada vez y depende de que la compu esté prendida: no sirve para el jurado.
- [ ] **Descripción detallada** (sección 12)
- [ ] **Uso de IA** (sección 12)
- [ ] **Datos de la NASA y de agencias asociadas** con links (sección 6)
- [ ] **Informe del proyecto** (ya hay un PDF de investigación en la carpeta raíz; sumarle las funciones nuevas)
- [ ] **Video promocional de 2 min** para redes y la presentación en vivo
- [ ] Revisar que todos los links abran sin iniciar sesión
- [ ] No mostrar caras, nombres ni voces de menores de 18 años
- [ ] Ensayar la demo en vivo con el plan B: video grabado por si falla internet

---

## 12. Textos del formulario (ES / EN)

### Resumen general

**ES**
FAVALORO es una app web de monitoreo y prevención de salud para astronautas en misiones largas, pensada para cuando la Tierra no puede contestar a tiempo. Un brazalete propio con ESP32 mide pulso, oxígeno y temperatura por Bluetooth estándar, sin que el tripulante haga nada. Un asistente por voz charla con cada tripulante y completa solo lo que ningún sensor mide: ánimo, estrés, sueño y comidas. La app compara a cada persona con su propio normal, hace tests semanales de vista, memoria, atención y audición, y dice quién está apto para una caminata espacial. Ante un valor peligroso, llama al tripulante con una cuenta regresiva en voz y, si no responde, avisa al compañero más cercano, al médico y a la Tierra, con la demora real de comunicación. Sus límites salen de la NASA (NASA-STD-3001, los 5 peligros del Human Research Program, MEDB y OSDR). Gratis, accesible y con IA de código abierto dentro del navegador.

**EN**
FAVALORO is a health monitoring and prevention web app for astronauts on long missions, built for when Earth can't answer in time. Our own ESP32 wristband measures heart rate, blood oxygen and temperature over standard Bluetooth, with no effort from the crew. A voice assistant talks with each crewmember and fills in what no sensor can measure: mood, stress, sleep and meals. The app compares each person with their own baseline, runs weekly vision, memory, attention and hearing tests, and tells who is fit for a spacewalk. When a value turns dangerous, it calls the crewmember with a spoken countdown and, if there is no answer, alerts the nearest crewmate, the medical officer and Earth, using real communication delays. Its limits come from NASA (NASA-STD-3001, the Human Research Program's five hazards, MEDB and OSDR). Free, accessible, with open-source AI running in the browser.

### Detalles del proyecto

**Qué hace:** ver sección 4 (copiar los puntos del asistente, vigilancia y prevención).

**Beneficios:**
- Menos tiempo de la tripulación en cuestionarios: el brazalete y la charla completan casi todo.
- Detección temprana con línea base personal y puntaje de alerta.
- Respuesta inmediata aunque no haya conexión con la Tierra.
- Bienestar emocional con privacidad: diario privado y familia.
- Sirve también en la Tierra: bases antárticas, plataformas petroleras, submarinos y zonas rurales sin médico.

**Herramientas:** HTML, CSS, JavaScript, Web Bluetooth, Web Speech API, Web Audio, IndexedDB, WebLLM (Qwen / Llama), Lenis, Arduino IDE, ESP32, MAX30102, MLX90614, Python (servidor local), Cloudflare Tunnel.

### Uso de IA

**ES:** Usamos Claude (Anthropic) como asistente de programación, investigación y redacción. Dentro de la app, el asistente puede usar un modelo abierto (Qwen o Llama vía WebLLM) que corre en el navegador; sin él, funciona con reglas. [Agregar la herramienta con la que se hizo el logo, si se usó IA.] No usamos ni modificamos logotipos ni insignias de la NASA.

**EN:** We used Claude (Anthropic) as a coding, research and writing assistant. Inside the app, the assistant can use an open model (Qwen or Llama via WebLLM) running in the browser; without it, it works with rules. [Add the tool used for the logo, if AI was used.] We did not use or modify NASA logos or insignia.

---

## 13. Preguntas probables del jurado

| Pregunta | Respuesta corta |
| --- | --- |
| ¿Los datos son reales? | La demo usa datos simulados para mostrar todos los casos. El brazalete manda datos reales por Bluetooth, y las reglas y límites salen de documentos de la NASA. |
| ¿Funciona sin internet? | Las reglas, los protocolos y la IA local funcionan sin conexión. El reconocimiento de voz del navegador hoy necesita internet; es el próximo paso. |
| ¿Reemplaza al médico? | No. Ayuda a la tripulación y al oficial médico a detectar y actuar antes. Las dosis y diagnósticos los decide el médico. |
| ¿Por qué es mejor que un cuestionario? | Porque mide solo, pregunta solo lo que falta, entiende frases con errores y compara con el normal de cada persona. |
| ¿Cómo cuidan la privacidad? | Cada rol ve lo suyo. El diario es privado; el médico solo ve que alguien pidió ayuda o una charla, no el contenido. |
| ¿Qué pasa si el tripulante no puede hablar? | Si no responde en 30 s, escala solo: alarma, compañero, médico y Tierra. Si el asistente no lo entiende 3 veces, también avisa. |
| ¿Cuánto cuesta? | El brazalete, unos pocos dólares en sensores. La app y la IA son gratis y de código abierto. |
| ¿Qué tiene de NASA? | NASA-STD-3001, los 5 peligros del Human Research Program, el catálogo médico MEDB, el plan de evaluaciones y datos crudos de OSDR. |
| ¿Sirve en la Tierra? | Sí: bases antárticas, plataformas, submarinos y zonas rurales lejos de un hospital. |

---

## 14. Límites honestos y próximos pasos

**Límites (decirlos con seguridad, suma credibilidad):**

- Los umbrales son orientativos y tienen que validarlos médicos.
- El puntaje de alerta temprana adapta el NEWS2 hospitalario; no está validado para el espacio.
- El test de audición no está calibrado: es una orientación, no una audiometría.
- Las respuestas de la familia y de la Tierra son simuladas en la demo.
- Los datos se guardan en el navegador de cada dispositivo; falta un servidor para sincronizar la tripulación en red.

**Próximos pasos:**

1. Probar el brazalete con más personas y sumar variabilidad del pulso (estrés) y movimiento (sueño real).
2. Reconocimiento de voz totalmente sin conexión.
3. Sincronización entre dispositivos de la nave y paquetes comprimidos para enviar a la Tierra.
4. Validar umbrales con médicos y psicólogos.
5. Llevarlo a la Tierra: bases antárticas y zonas rurales.
