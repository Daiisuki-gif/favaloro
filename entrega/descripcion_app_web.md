# FAVALORO · Contexto y descripción detallada de la app y la web

**The Muds Devs · NASA Space Apps Challenge 2026 · Santiago del Estero**
Desafío: *Create Health Monitoring Software for Astronauts on Space Missions*
Actualizado: 15/11/2026

Este documento describe todo lo que hay en FAVALORO, pantalla por pantalla. Sirve de base para el video, la presentación, el informe y para responder preguntas del jurado.

---

## 1. Contexto

### El desafío

NASA Space Apps 2026 pide crear un software de monitoreo de salud para astronautas en misiones espaciales. Las misiones van a la Luna (programa Artemis) y, más adelante, a Marte: duran meses o años y están cada vez más lejos de la Tierra.

### El problema

- **La Tierra tarda en contestar.** Un mensaje tarda unos 0,7 s desde la Estación Espacial, 1,3 s desde la Luna y de 4 a 24 minutos desde Marte, en cada sentido. Desde la superficie de Marte, además, hay que esperar el pase de un satélite relé.
- **El cuerpo y la mente sufren a la vez.** La NASA estudia 5 peligros del vuelo espacial: radiación, aislamiento y confinamiento, distancia de la Tierra, cambios de gravedad y ambientes hostiles y cerrados.
- **Mucho depende de cuestionarios** que el tripulante tiene que llenar, y del contacto con médicos en la Tierra.

### La idea

Una sola herramienta que mida sola, converse con el tripulante, prevenga problemas, actúe en el peor escenario y funcione aunque la Tierra no conteste. Cada integrante de la tripulación ve lo que necesita según su rol.

### Para quién es

| Rol | Qué necesita |
| --- | --- |
| Tripulante | Registrar su día sin perder tiempo y saber cómo está |
| Oficial médico | Ver el detalle clínico de cada uno, detectar temprano y consultar a la Tierra |
| Comandante | Saber el estado de la tripulación, decidir y reportar a la Tierra |
| Especialista de misión | Vigilar el entorno, la nave y los riesgos para la tripulación |

---

## 2. Cómo se usa

- Es una **web**: se abre en Chrome o Edge, en compu o celular. No hay que instalar nada.
- En la compu del equipo se abre con `web/iniciar.bat` (levanta un servidor local en `http://localhost:8080`).
- Para compartirla por internet, `web/compartir.bat` crea un link https temporal desde la compu (Cloudflare Tunnel, gratis). Para la entrega conviene un link fijo en GitHub Pages.
- El micrófono y el Bluetooth solo funcionan con `localhost` o con https.
- **Datos de la demo:** tres tripulantes simulados en una base lunar, cada uno con un perfil distinto.
  - **Astronauta 1** (ingeniera de vuelo): en rango.
  - **Astronauta 2** (especialista científico): estrés alto.
  - **Astronauta 3** (piloto): mal sueño y fatiga.

---

## 3. La web de inicio (landing)

Estética de película espacial: oscura, con interfaz tipo HUD (como el visor de un casco). Tipografías Michroma (títulos), Manrope (texto) e IBM Plex Mono (datos).

| Sección | Qué se ve |
| --- | --- |
| Cabecera | Logo FAVALORO animado (latido en la línea del corazón, estrellas que titilan, brillo que lo cruza). Se achica al bajar. Menú: Escaneo, Datos, Roles, Ingresar |
| 1 · La Tierra sale sobre la Luna | Al bajar, se despeja el polvo del lente, la Tierra sube detrás del horizonte lunar, aparece el título FAVALORO y suben el astronauta y el suelo. HUD con reloj de misión, elevación de la Tierra y pulso en vivo |
| 2 · Escaneo biométrico | Foto real del Apollo 11 (NASA, dominio público) fundida con el fondo. Una mira sigue al puntero y se engancha en los sensores del traje: casco, tensiómetro, dosímetro, glucómetro, nutrición y brazalete. Cada uno muestra lo que mide en vivo |
| 3 · Recorrido del dato | Animación del camino de un dato: brazalete → app → antena de la base lunar → la Tierra → médico. La Luna y la Tierra son fotos reales de la NASA |
| 4 · Roles | Las cuatro vistas de la app, con botón para ingresar |
| Pie | Créditos de fotos y del equipo |

---

## 4. Ingreso

- Se elige el rol (Tripulante, Oficial médico, Comandante o Especialista de misión) y, si es tripulante, quién.
- Cada pestaña del navegador guarda su propia sesión: se pueden abrir dos roles a la vez para mostrar cómo se comunican.
- Botón **Aa** para el modo claro u oscuro, el tamaño de letra y el contraste.

---

## 5. La app: barra superior y elementos comunes

- **Barra superior:** logo, rol y nombre, reloj de misión (día 142, hora y entorno), botón «Pedir ayuda» (solo tripulantes), botón **Aa** y «Salir».
- **Pestañas** por rol.
- **Botón «Asistente»** abajo a la derecha, con un punto de color según la alerta más grave y la cantidad de alertas.
- **Cartel de llamadas:** al Comandante y al médico les aparece arriba cada llamada de emergencia, con cuenta regresiva y el paso a paso del escalamiento.
- **Datos en vivo:** los signos se actualizan cada pocos segundos sin parpadeos.

---

## 6. Vista del tripulante

### Mi día
- **Tu día:** lista de registros del día (brazalete, mente y estrés, nutrición, glucosa y presión, test de reacción) con lo hecho y lo que falta.
- **Cómo estás:** estado combinado (en rango, a vigilar, alerta o emergencia) que cruza mente, nutrición y brazalete.
- **Vigilancia del asistente:** si hay protocolos que lo involucran, aparecen arriba con sus pasos.
- **Tus logros (gamificación):** racha de días seguidos con registros, nivel por puntos (de «Cadete» a «Comandante de su salud»), misión de la semana (chequeo de mente 5 de 7 días) y 8 logros con anillo de progreso: Día completo, Tres días seguidos, Semana en órbita, Mente en orden, Ojo de halcón (test de visión), Cabeza despierta (memoria y atención), Oído atento (audición) y Diario de a bordo. Cada logro pendiente tiene un botón «Ir →» a la pantalla donde se consigue. Al ganar uno aparece un aviso breve y el asistente lo felicita en voz alta (si las alertas no están silenciadas). Los puntos premian el hábito de cuidarse, nunca el resultado: un valor fuera de rango no resta, para que nadie esconda un síntoma por no perder la racha.
- **Tu brazalete:** pulso, oxígeno, temperatura y respiración con mini gráficos, más sueño, actividad, dosis de radiación del día y dosis de carrera. Botón para conectar un brazalete real por Bluetooth.
- **¿Estoy apto hoy?:** para caminata espacial y para tarea crítica, con los motivos.
- **Tu sueño anoche · fases:** tipo de sueño (reparador, liviano, interrumpido, corto y fragmentado), horas dormido, eficiencia, cuánto tardó en dormirse, despertares, gráfico de la noche (despierto, REM, ligero, profundo), porcentaje de cada fase contra lo normal y consejos.
- **Tu acompañante:** hora del chequeo diario, avisos del navegador y botones para probar (simular pulso alto, abrir el chequeo ahora).

### Mente y estrés
- 14 preguntas en 4 grupos: sueño, ánimo, ansiedad, y estrés y convivencia.
- El brazalete completa solo 3 (horas de sueño, despertares, pulso en reposo).
- **Modo charla:** el asistente pregunta de a una, con opciones para tocar o decir. Entiende números, palabras («un poco», «bastante»), errores de tipeo, emojis y «saltear». Si duda, pregunta «¿quisiste decir…?».
- **Modo a mano:** botones por pregunta.
- **Tu chequeo:** puntaje de 0 a 100, estado, dominios y qué hacer si sale en emergencia.

### Tests
- **Vista:** rejilla de Amsler por ojo, más dos preguntas (borroso de cerca, dolor de cabeza al despertar). Si hay cambios, avisa al médico por el síndrome SANS.
- **Memoria:** números que aparecen y hay que escribir en orden; cada vez son más.
- **Atención:** palabras de colores pintadas de otro color; hay que tocar el color de la letra.
- **Audición:** tres tonos (1, 4 y 8 kHz) suaves y, si no se escuchan, más fuertes. Es orientativo, no está calibrado.
- **Ruido de hoy:** exposición equivalente de 24 h contra el límite de 67 dBA, gráfico por hora y horas de protectores auditivos.
- Todo se compara con la primera semana del mismo tripulante.

### Familia y diario
- **Mi diario:** privado. El asistente propone preguntas suaves («¿A quién extrañás hoy?») y responde con empatía; se charla por voz o escrito y se guarda. Si aparece riesgo de hacerse daño, avisa al médico sin mostrar lo escrito.
- **Para tu familia:** mensaje con ideas para empezar, fotos (cámara o galería) y audios de hasta 1 minuto. Muestra cuándo llega según la demora real.
- **De tu familia:** mensajes recibidos (simulados), con lectura en voz alta.
- **Apoyo psicológico:** pedido de charla privada con el psicólogo (el médico solo ve que se pidió), respiración guiada 4-6 con un círculo que respira y anclaje 5-4-3-2-1 con voz.

### Nutrición
- Chequeo de apetito, comidas, líquidos, molestias digestivas y vasos de agua, charlado o a mano.
- Semáforo de 14 días y masa corporal con cambio porcentual.

### Registros
- Glucosa y presión llegan solas (simulado o tensiómetro Bluetooth real).
- El ánimo de 1 a 5 sale del chequeo charlado.
- Test de reacción de 3 intentos (menos de 350 ms en rango).

### Historial
- Gráfico de mente y estrés por día y tabla de registros recientes.

---

## 7. Vista del oficial médico

- **Tripulación:** estado de los tres y tabla de signos en vivo.
- **Ficha clínica** (se elige el tripulante):
  - signos vitales del brazalete;
  - alerta temprana (NEWS2 adaptado) con puntos por signo;
  - desvío de cada signo respecto de su propio normal;
  - ¿apto para la tarea?;
  - tests y ruido comparados con su base;
  - sueño por fases;
  - sugerencias sin dosis.
- **Mente y Nutrición:** respuestas y tendencias de cada tripulante.
- **Botiquín:** 10 medicamentos de ejemplo con cantidad, mínimo, vencimiento y estado (vencido, vence pronto, quedan pocos). Registro de uso con tripulante y hora. Solo inventario: las dosis las decide el médico.
- **Consulta Tierra:** muestra la demora de ida, de ida y vuelta y la próxima ventana. Se arma un paquete que adjunta solos los signos, la alerta temprana y los tests, más síntomas y foto. Cada consulta muestra sus pasos: enviada, llega a la Tierra y respuesta. La respuesta es simulada. Tiene un modo «demo acelerada».
- **Plan NASA:** evaluaciones en vuelo y después del regreso (R+0 a R+30) según los documentos MEDB.
- **Alertas:** protocolos activos, pedidos de charla con el psicólogo y alertas clínicas con su rango.

---

## 8. Vista del Comandante

- **Parte del día:** estado de cada tripulante y decisiones sugeridas por prioridad, para aprobar.
- **¿Apto para la tarea?:** una tarjeta por tripulante para caminata espacial y tarea crítica, con motivos, y quién está apto para una caminata hoy.
- **Reportes:** reporte diario y semanal con estado, alertas, decisiones, llamadas y riesgos. Se envía a la Tierra (simulado), se descarga o se copia.
- **Decisiones:** registro de lo aprobado y decisiones propias.
- **Emergencias:** protocolos activos, botón para llamar a cada tripulante, pasos fijos y guía por gravedad (leve, moderado, grave, emergencia).
- **Evolución:** tendencias de la tripulación.

---

## 9. Vista del especialista de misión

- **Entorno:** Estación Espacial, Base lunar o Hábitat en Marte. Cambia la gravedad, la radiación, la demora de comunicación y los peligros, y con eso toda la app.
- **Nave:** presión, oxígeno, CO₂, temperatura y humedad en vivo, y simulación de falla del depurador de CO₂.
- **Soporte vital (módulo del equipo):** ambiente del hábitat, agua potable, biomarcadores de la tripulación y un motor de correlación que abre protocolos con checklist (CO₂ alto, ruido y luz con reactivación viral, contaminación del agua con baja inmunidad). Botón para simular una crisis.
- **Radiación solar (módulo del equipo):** 5 escenarios (órbita tranquila, anomalía del Atlántico Sur, tormenta solar, rayos cósmicos, misión completa), con gráfico de tasa por ventana de 10 minutos contra la referencia de 1500 µSv/día, dosis acumulada, histograma de energía de las partículas y qué hacer por nivel.
- **Riesgos:** vigilancia del asistente con protocolos activos, botones para probar el peor escenario (tormenta solar, falla de CO₂, crisis de soporte vital, hipoxia), los 5 peligros con su nivel, exposición por tripulante y fuentes NASA.

---

## 10. El asistente

Está en todas las vistas, con el mismo diseño de charla: burbujas, botón grande «Hablar» y campo para escribir.

- **Pestañas del panel:** Charla, Alertas (con cantidad), Emergencia o Guía, y Ajustes (voz e IA).
- **Estado visible:** un círculo que late en verde cuando escucha y hace ondas cuando habla.
- **Voz automática:** al abrirlo saluda, resume lo importante y queda escuchando. La voz es femenina y amable, con estilos a elegir (dulce, calma, natural, ágil).
- **Charla fluida:** el micrófono queda abierto, no se escucha a sí mismo y responde al instante en emergencias. Con IA, empieza a hablar desde la primera frase.
- **Entiende errores:** tolera faltas de ortografía y del reconocimiento de voz, y aclara lo que entendió.
- **Chequeo diario:** lo ofrece si falta y lo completa charlando; al terminar lo guarda solo.
- **Protocolos guiados:** «qué hago» → paso 1; «listo» → paso siguiente.
- **Si no entiende al tripulante** dos veces, pregunta si está bien; a la tercera, o si no responde en 30 s, avisa al equipo.
- **Síntomas graves** (dolor de pecho, falta de aire, sangrado, fuego) o «ayuda»: avisa solo al médico y al Comandante.
- **Alertas con sonido y voz:** tonos suaves para avisos, pitidos para lo importante y alarma para lo crítico. Se pueden silenciar 15 minutos (la crisis propia del tripulante suena igual).
- **IA opcional:** IA local gratis de código abierto (WebLLM con Qwen o Llama, ~1 GB la primera vez) o Gemini con clave. Sin IA, usa reglas.

---

## 11. Vigilancia automática, crisis y escalamiento

El asistente revisa todo cada pocos segundos y abre un **protocolo** con pasos cuando algo se dispara:

| Qué vigila | Ejemplos de protocolo |
| --- | --- |
| Nave | CO₂ alto, pérdida de presión u oxígeno |
| Soporte vital | Las 3 reglas del módulo del equipo |
| Radiación | Tormenta solar, radiación elevada, dosis de carrera cerca del límite |
| Cada tripulante | Oxígeno bajo, fiebre, pulso fuera de rango, alerta temprana alta, mal sueño, vista, ruido, salud mental, sin señal del brazalete |
| Convivencia | Riesgo de tensión o conflicto (se avisa a todos, sin mostrar datos de salud) |
| Botiquín | Medicamentos vencidos o con poco stock |

**Escalamiento:**

1. **Crisis** (oxígeno bajo o emergencia de salud mental): llamada inmediata al tripulante con su motivo, alarma y cuenta regresiva en voz en todas las pantallas.
2. **Sin respuesta en 30 s:** alarma en su módulo → aviso al compañero más cercano → oficial médico → Control de Misión.
3. **Protocolo crítico sin avance en 90 s:** aviso al Comandante y al médico, y llamada al tripulante.
4. **Pedir ayuda:** botón del tripulante o «ayuda» por voz → aviso inmediato.

---

## 12. Accesibilidad y diseño

- **Tema:** oscuro (por defecto), claro o automático según el dispositivo. El inicio con la foto del espacio queda siempre oscuro.
- **Letra:** normal, grande o muy grande; todo escala sin romperse.
- **Contraste alto** para baja visión; se activa solo si el dispositivo lo pide.
- Contraste de texto según WCAG 2.1 AA, foco visible al navegar con teclado y botones táctiles de 44 px.
- **Responsive:** probado en compu (1366 px) y celular (375 px). Las tablas largas se desplazan dentro de su panel.
- **Privacidad:** cada rol ve lo suyo. El diario y los motivos personales no se muestran a otros.

---

## 13. El brazalete

- ESP32 + MAX30102 (pulso y oxígeno) + MLX90614 (temperatura sin contacto).
- Publica los servicios Bluetooth estándar de salud, así que la app también acepta dispositivos médicos comerciales compatibles.
- Código en `hardware/favaloro_band/` con modo simulado para probar sin sensores. Guía de armado en `hardware/README.md`.

---

## 14. Tecnología

| Parte | Cómo está hecha |
| --- | --- |
| Web | HTML, CSS y JavaScript sin frameworks ni instalación |
| Animaciones | Un solo bucle de animación y Lenis para el scroll suave |
| Datos | En el navegador (localStorage); fotos y audios en IndexedDB |
| Voz | Web Speech API (reconocimiento y síntesis) |
| Sonido | Web Audio (alarmas y tonos generados en el momento) |
| Bluetooth | Web Bluetooth con servicios estándar de salud |
| IA | WebLLM (modelos abiertos en el navegador) o Gemini; reglas propias como respaldo |
| Servidor | Python (`servidor.py`) sin caché, para que siempre se vea la última versión |
| Compartir | Cloudflare Tunnel desde la compu, o GitHub Pages |

---

## 15. Datos y fuentes

- **NASA:** NASA-STD-3001 (radiación de carrera de 600 mSv, CO₂ de 3 mmHg, ruido), los 5 peligros del Human Research Program, el catálogo médico MEDB, el plan de evaluaciones, los Technical Briefs OCHMO-TB-020 y TB-004, datos crudos de OSDR (OSD-608 y OSD-596) y fotos de dominio público.
- **Agencia Espacial Canadiense:** monitoreo de radiación (neutrones, ~30 % en la Estación Espacial).
- **Módulos del equipo:** planillas de salud mental y nutrición, motor de soporte vital y monitor de radiación (método de cálculo y umbrales de ejemplo).
- **Otros:** NEWS2 (Royal College of Physicians), adaptado como guía.
- **Demo:** los datos de la tripulación son simulados. No es un dispositivo médico.
