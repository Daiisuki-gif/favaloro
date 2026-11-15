# FAVALORO · Instrucciones para que otra IA arme los entregables de Space Apps 2026

> **Cómo usar este archivo (para el equipo)**
> 1. Abrí una IA (ChatGPT, Gemini, Claude, Copilot, etc.).
> 2. Adjuntá **este archivo** y, si la IA acepta más archivos, también:
>    - `entrega/descripcion_app_web.md` (descripción completa de cada pantalla)
>    - `entrega/kit_presentacion_video.md` (guiones, preguntas del jurado)
>    - `entrega/textos_entrega.md` (textos del formulario, datos NASA con links)
>    - 6 a 10 capturas de la app (inicio, escaneo, Mi día, asistente hablando, ficha del médico, protocolos, logros).
> 3. Escribí: **«Leé todo el archivo y hacé las tareas de la sección 4, en orden.»**
> 4. Revisá lo que devuelve con la **lista de control de la sección 6** antes de subir nada.
>
> Todo lo que está desde acá para abajo está escrito **para la IA**.

---

## 1. Tu rol

Sos el redactor y director creativo de un equipo de estudiantes argentinos (equipo **The Muds Devs**, sede **Santiago del Estero**) que compite en el **NASA Space Apps Challenge 2026**, desafío **«Create Health Monitoring Software for Astronauts on Space Missions»**. Tenés que producir los textos y guiones de entrega. No programás nada: la app ya está hecha.

**Reglas que no podés romper**
- **No inventes datos.** Usá solo lo que está en este archivo y en los adjuntos. Si falta algo, escribí `[COMPLETAR: …]`.
- Los datos de salud de la app son **simulados** (salvo los del brazalete real). FAVALORO **no es un dispositivo médico** y **no indica dosis de medicamentos**. Decilo así, sin exagerar.
- **No uses logos, banderas ni insignias de la NASA** ni sugieras que la NASA respalda el proyecto.
- **Nada de nombres, voces ni imágenes de menores de 18 años** en ningún entregable.
- Español rioplatense neutro (vos) para lo que va en español; inglés claro y simple para lo que va en inglés.
- Respetá exactamente los límites de palabras, láminas y segundos de la sección 3.

---

## 2. El proyecto: FAVALORO (contexto completo)

### El problema
En misiones largas (Luna, Marte) los astronautas quedan expuestos a los **5 peligros del vuelo espacial** que estudia el Human Research Program de la NASA: radiación, aislamiento y confinamiento, distancia de la Tierra, gravedad alterada y ambiente cerrado y hostil. Esto trae cambios inmunes, pérdida ósea, eventos cardiovasculares, mala nutrición y problemas de salud mental. Lejos de la Tierra **los médicos no pueden contestar a tiempo** (en Marte, un mensaje tarda entre 4 y 24 minutos por tramo y solo se transmite en los pases de los satélites relé), así que **el astronauta tiene que poder evaluarse y actuar solo**.

### La solución en una frase
**FAVALORO es una app web que mide sola, charla para completar lo que ningún sensor mide, avisa antes de que algo empeore y guía paso a paso qué hacer, aunque la Tierra no pueda responder.**

### Qué hace (funciones reales de la app)
**Medición y registro**
- Brazalete propio (ESP32 + MAX30102 + MLX90614) que mide **pulso, oxígeno en sangre y temperatura** por Bluetooth estándar. La web se conecta con Web Bluetooth. Los valores llegan solos y se autocompletan.
- Indicadores: presión arterial, pulso, glucosa (mg/dL), temperatura, oxígeno, respiración, horas y **fases del sueño** (profundo, REM, ligero, despierto), actividad, dosis de radiación diaria y de carrera, ánimo y estrés.
- **Escaneo del cuerpo**: figura del astronauta con sensores clickeables que muestran qué mide cada uno en vivo.

**Acompañante y asistente por voz**
- Un acompañante charla con el tripulante y **completa solo** el chequeo de mente y estrés (14 preguntas) y el de nutrición. Entiende palabras, errores de tipeo y frases mal dichas. Las preguntas que ya responde el brazalete no las hace.
- Si el tripulante **no logra comunicarse** (3 respuestas que no se entienden), avisa al equipo.
- IA de código abierto (WebLLM con Qwen o Llama) que corre **dentro del navegador, sin internet**. Si no hay IA, sigue funcionando con reglas.

**Prevención y alertas**
- **Línea base personal**: aprende el «normal» de cada tripulante y avisa cuando se aleja de él, no solo de un rango general.
- **Puntaje de alerta temprana** adaptado de NEWS2 (respiración, oxígeno, temperatura, pulso, presión).
- **¿Apto para la tarea?** antes de una caminata espacial o tarea crítica, con los motivos.
- **Tests**: visión (rejilla de Amsler, para el síndrome SANS), memoria, atención, reacción y audición; control de **ruido** de 24 h contra el límite de NASA-STD-3001 (67 dBA).
- **Protocolos vigilados por el asistente**: si algo se sale de rango (CO₂, aire, tormenta solar, radiación, oxígeno, fiebre, pulso, sueño, ruido, vista, convivencia, botiquín), abre el protocolo, avisa en voz alta con sonido y guía paso a paso. Si un protocolo crítico no avanza en 90 s, escala al comandante y al médico.
- **Llamada de crisis con cuenta regresiva hablada**: si hay valores peligrosos y el tripulante no responde en 30 s, escala sola (alarma, compañero más cercano, médico y Control de Misión).
- **Riesgo de conflicto en la tripulación**: avisa al equipo cómo ayudar **sin mostrar los datos de salud** de la persona.
- Alertas habladas y con sonido, con opción de **silenciar**.

**Comunicación con la Tierra**
- **Consulta médica diferida** con la demora real según dónde está la misión: Estación Espacial ≈0,7 s, Luna ≈1,3 s, Marte ≈12,5 min por tramo (rango real 4 a 24 min) con pases del relé cada ~4 h de 15 min.

**Bienestar**
- **Diario privado**, mensajes a la familia con fotos y audio (con la demora real de envío), pedido de charla con el psicólogo, respiración guiada y ejercicio de anclaje.
- **Botiquín**: stock de medicamentos y avisos de faltantes (sin indicar dosis).

**Gamificación (lo pide el desafío como opcional)**
- Racha de días seguidos, nivel por puntos (de «Cadete» a «Comandante de su salud»), **misión de la semana** y **8 logros** con anillo de progreso. Al ganar uno aparece un aviso y el asistente felicita.
- **Decisión de diseño clave**: los puntos premian el **hábito** de cuidarse, **nunca el resultado**. Un valor malo no resta, para que nadie esconda un síntoma.

**Cuatro roles, cada uno con su vista**
- **Tripulante**: Mi día, mente y estrés, tests, familia y diario, nutrición, registros, historial.
- **Oficial médico**: tripulación, ficha clínica, mente, nutrición, botiquín, consulta con la Tierra, plan de evaluaciones, alertas.
- **Comandante**: parte del día, ¿apto para la tarea?, reportes diarios y semanales, decisiones, emergencias, evolución.
- **Especialista de misión**: entorno, nave, soporte vital (CO₂, agua, aire), radiación solar, los 5 peligros.

**Diseño y accesibilidad**
- Estética espacial tipo HUD con fotos reales (la Tierra saliendo sobre la Luna, foto del Apollo 11).
- **Tema oscuro y claro**, **letra grande y muy grande**, **alto contraste** (WCAG AA), funciona en **celular y computadora**.
- Gráficos dinámicos y colores por estado (en rango, vigilar, alerta, emergencia).

### Datos y estándares de la NASA usados
- **NASA-STD-3001** Vol. 1 y 2: límite de radiación de carrera 600 mSv, CO₂ 3 mmHg, ruido 67 dBA en 24 h y protección auditiva sobre 85 dBA.
- **Human Research Program**: los 5 peligros del vuelo espacial.
- **Catálogo médico MEDB** (evaluaciones nutricionales y médicas).
- Technical Briefs **OCHMO-TB-020** (radiación) y **OCHMO-TB-004** (CO₂).
- Foto Apollo 11 **AS11-40-5903** (dominio público) y foto lunar LRO.
- Datos crudos de **NASA OSDR** (ver `datos/nasa_osdr_equipo/README_NASA_DATA.md`).
- Agencia Espacial Canadiense: monitoreo de radiación y salud.
- Los links están en `entrega/textos_entrega.md`, sección 6 y 7.

### Tecnología
HTML, CSS y JavaScript sin instalación · Web Bluetooth · Web Speech API (voz) · WebLLM (IA en el navegador con WebGPU) · IndexedDB (fotos y audios) · Lenis · ESP32 + Arduino IDE · Python (servidor local).

### Impacto
Menos tiempo de la tripulación en cuestionarios, detección temprana, ayuda aunque no haya conexión con la Tierra, decisiones basadas en estándares NASA. Sirve también en la Tierra: bases antárticas, plataformas petroleras, zonas rurales sin médico.

### El nombre
Homenaje al cardiocirujano argentino **René Favaloro**. `[COMPLETAR: confirmar con el equipo cómo explicarlo]`

---

## 3. Lo que pide la organización (pautas oficiales)

**3.1 Página del proyecto (global)**
- **Resumen general**: claro, **entre 50 y 200 palabras**, que explique **el problema, la solución y su impacto**.
- **Detalles técnicos**: qué hace, cómo funciona, beneficios, stack tecnológico y **datos de la NASA utilizados**.

**3.2 Demo del proyecto (global)**
- **Un solo enlace público**, sin contraseñas, permisos ni login (probarlo en modo incógnito).
- Formato, **uno de los dos**:
  - **Diapositivas en inglés, máximo 7 láminas** (la portada cuenta), **o**
  - **Video pitch de 30 segundos** (puede ser en español **con subtítulos en inglés**).
- **Seguridad**: sin nombres, voces ni imágenes de menores de 18 años.

**3.3 Comité evaluador local (jurado de Santiago del Estero)**
- **Video de hasta 2 minutos en español** mostrando la solución funcionando.
- **Link al proyecto**: web desplegada, repositorio de GitHub o carpeta de Google Drive.

---

## 4. Tus tareas (hacelas en este orden)

### Tarea 1 · Resumen general (ES y EN)
- Una versión en español y otra en inglés, **de 150 a 190 palabras cada una** (contalas y escribí el número al final entre paréntesis).
- Estructura: 1 oración de problema → 2-3 de solución → 2-3 de cómo funciona → 1-2 de impacto.
- Mencioná al menos: brazalete propio, acompañante por voz que completa los formularios, alertas que escalan solas, protocolos guiados, IA que funciona sin internet, estándares NASA.

### Tarea 2 · Detalles técnicos (EN, con versión ES)
Con estos títulos, en viñetas cortas:
1. **What it does**
2. **How it works** (arquitectura: brazalete → Bluetooth → web → asistente → alertas y protocolos → médico/comandante → Tierra con demora)
3. **Benefits**
4. **Tech stack**
5. **NASA data and standards used** (con los links de `textos_entrega.md`)
6. **Space agency partner data**
7. **Use of AI tools** (Claude para programar y redactar; WebLLM con modelos abiertos dentro de la app; `[COMPLETAR: otras herramientas]`)
8. **Limitations and next steps** (datos simulados, no es dispositivo médico, validar umbrales con médicos, probar el brazalete con más personas)

### Tarea 3 · Diapositivas en inglés (máximo 7)
Para cada lámina entregá: **título**, **texto en pantalla** (máx. 25 palabras), **imagen o captura sugerida** y **notas del orador** (2-3 oraciones).
1. Portada: FAVALORO, tagline, equipo The Muds Devs, Space Apps 2026, Santiago del Estero.
2. The problem: 5 hazards + Earth can't answer in time (demora de Marte).
3. The solution: mide sola · charla · avisa · guía.
4. How it works: diagrama brazalete → app → asistente → equipo → Tierra.
5. Four roles + prevention (línea base, NEWS2, tests, apto para la tarea, gamificación).
6. Built on NASA data: estándares y números concretos (600 mSv, 3 mmHg, 67 dBA, 5 peligros).
7. Impact & next steps + link a la demo.

Diseño sugerido: fondo espacial oscuro, títulos en tipografía tipo Michroma, texto en Manrope, acento azul (#6fb6ff). **Sin logos de la NASA.**

### Tarea 4 · Video pitch de 30 segundos
- Tabla con: **segundos · qué se ve · voz en español · subtítulo en inglés**. Total exacto 30 s, máximo 75 palabras de locución.
- Empezá con un gancho fuerte (por ejemplo «Lejos de la Tierra, nadie te toma el pulso»).
- Entregá también el archivo de subtítulos en formato **.srt** en inglés, con tiempos.

### Tarea 5 · Video de hasta 2 minutos en español (jurado local)
- Guion por escenas con tiempos (total entre 1:45 y 2:00), qué grabar en pantalla, qué se dice y textos en pantalla.
- Recorrido sugerido: problema (15 s) → inicio y escaneo del cuerpo (15 s) → tripulante: Mi día, brazalete real y logros (20 s) → acompañante por voz completando el chequeo (20 s) → alerta: protocolo guiado + llamada de crisis que escala (25 s) → médico y consulta con la Tierra con demora (15 s) → accesibilidad: tema claro, letra grande (5 s) → cierre con impacto y link (10 s).
- Indicá cómo forzar cada situación en la demo (ver «cómo grabar cada demo» en `kit_presentacion_video.md`; por ejemplo el botón «Simular pulso alto»).

### Tarea 6 · Texto para publicar el link y checklist final
- Un mensaje corto para el formulario con el link público y qué se ve.
- La lista de control de la sección 6, completada con ✅ / ❌ según lo que puedas verificar con los adjuntos.

---

## 5. Formato de tu respuesta
- Una sección por tarea con título `## Tarea N`.
- Textos listos para copiar y pegar, sin comentarios en el medio.
- Marcá con `[COMPLETAR: …]` todo lo que necesite un dato del equipo.
- Al final, una lista de **dudas** que el equipo tiene que resolver.

---

## 6. Lista de control antes de entregar (para el equipo)

- [ ] Resumen ES y EN entre 50 y 200 palabras (contadas).
- [ ] Detalles técnicos incluyen qué hace, cómo funciona, beneficios, stack y **datos NASA con links**.
- [ ] Demo: **un solo link**, abre en **modo incógnito** sin login ni permisos.
- [ ] Diapositivas en inglés **≤ 7 láminas** (portada incluida) **o** video de **30 s** con **subtítulos en inglés**.
- [ ] Video local en español **≤ 2:00** + link al proyecto (GitHub Pages / repositorio / Drive).
- [ ] La app está publicada en un link fijo (GitHub Pages recomendado; el túnel de la compu cambia y no sirve para el jurado).
- [ ] Sin nombres, voces ni caras de **menores de 18 años**.
- [ ] Sin logos ni insignias de la NASA.
- [ ] Dice que los datos son simulados y que no reemplaza una evaluación médica.
- [ ] Se nombraron las herramientas de IA usadas.
- [ ] Los `[COMPLETAR]` están todos resueltos.
