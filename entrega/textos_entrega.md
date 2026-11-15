# FAVALORO · textos para el formulario de Space Apps 2026

Completar lo que está entre [corchetes]. Cada bloque va en español y en inglés (los jueces globales leen en inglés).

---

## 1. Nombre del proyecto
**FAVALORO**

## 2. Resumen general (50–200 palabras)

**ES (≈150 palabras)**
FAVALORO es una app web de monitoreo de salud para astronautas en misiones largas, pensada para cuando la Tierra no puede contestar a tiempo. Un brazalete propio con ESP32 mide pulso, oxígeno en sangre y temperatura por Bluetooth estándar, sin que el astronauta haga nada. Lo que ningún sensor mide (ánimo, estrés, sueño percibido, comidas) lo completa un acompañante por voz que charla con el tripulante y llena los formularios solo. La app tiene cuatro vistas (tripulante, oficial médico, comandante y especialista de misión), avisa cuando un signo cambia y, si un tripulante no responde una llamada de emergencia, escala sola: alarma, compañero más cercano, médico y Control de Misión. Sus límites y reglas salen de datos de la NASA: NASA-STD-3001 (radiación de carrera de 600 mSv, CO₂ de 3 mmHg), los 5 peligros del Human Research Program y el catálogo médico MEDB. Funciona con una IA de código abierto dentro del navegador, sin internet.

**EN (≈150 words)**
FAVALORO is a health-monitoring web app for astronauts on long missions, built for the moment when Earth can’t answer in time. Our own ESP32 wristband measures heart rate, blood oxygen and temperature over standard Bluetooth health services, with no effort from the crew. What no sensor can measure (mood, stress, perceived sleep, meals) is gathered by a voice companion that chats with the crewmember and fills in the forms automatically. The app has four views (crewmember, medical officer, commander and mission specialist), alerts when a vital sign changes and, if a crewmember misses an emergency call, escalates on its own: module alarm, nearest crewmate, medical officer and Mission Control. Its limits and rules come from NASA data: NASA-STD-3001 (600 mSv career radiation limit, 3 mmHg CO₂), the Human Research Program’s five hazards and the MEDB medical data catalog. It runs an open-source AI inside the browser, with no internet needed.

## 3. Enlace a la demo
[Enlace público a las diapositivas exportadas a PDF en Google Drive, o al video de 30 s en YouTube con subtítulos en inglés]
Comprobar que se abre sin iniciar sesión. Sin nombres, voces ni caras de menores de 18 años.

## 4. Detalles del proyecto

**¿Qué hace?**
- Mide solo: pulso, SpO₂ y temperatura con el brazalete; sueño, actividad y dosis de radiación.
- Charla: un acompañante por voz pregunta lo que falta (14 preguntas de salud mental y estrés, chequeo de nutrición) y completa los formularios. Las preguntas que el brazalete ya responde no se hacen.
- Avisa: detecta cambios en los signos y pregunta «¿cómo estás?»; si hay una emergencia sin respuesta, escala sola en 30 segundos.
- Cuatro vistas: el tripulante ve su día; el oficial médico, la ficha clínica, las alertas y el plan de evaluaciones de la NASA; el comandante, el parte del día, las decisiones y los reportes diario y semanal; el especialista, el entorno, el aire de la nave y los 5 peligros.

**¿Cómo funciona?**
- Web en HTML, CSS y JavaScript, sin instalación (se abre con `iniciar.bat`).
- Brazalete: ESP32 + MAX30102 + MLX90614, con los servicios Bluetooth estándar de pulso (0x180D), oxímetro (0x1822) y termómetro (0x1809). La web se conecta con Web Bluetooth.
- IA: WebLLM corre un modelo abierto (Qwen 2.5 o Llama 3.2) dentro del navegador con WebGPU. Si no hay IA, el acompañante sigue con reglas.
- Voz: reconocimiento y síntesis de voz del navegador (Web Speech API).

**Beneficios**
Menos tiempo de la tripulación en cuestionarios, detección temprana, ayuda aunque no haya conexión con la Tierra y decisiones basadas en estándares de la NASA. Sirve también en la Tierra: bases antárticas, plataformas y zonas rurales.

**Qué esperamos lograr**
[Completar: próximos pasos, por ejemplo validar los umbrales con médicos y probar el brazalete con más personas.]

**Herramientas**
HTML, CSS, JavaScript, Web Bluetooth, Web Speech API, WebLLM (MLC), Lenis, Arduino IDE, ESP32, MAX30102, MLX90614, Python (servidor local).

## 5. Uso de inteligencia sintética (IS)
- **Claude (Anthropic):** asistencia para programar la web, el código del ESP32 y redactar textos.
- **WebLLM con modelos abiertos (Qwen / Llama):** el acompañante y el asistente dentro de la app.
- [Agregar cualquier otra herramienta que hayan usado, por ejemplo la que generó el logo.]
- No usamos ni modificamos logotipos, banderas ni identificadores de misión de la NASA.

## 6. Datos de la NASA
- NASA Human Research Program · los 5 peligros del vuelo espacial: https://www.nasa.gov/hrp/hazards/
- Medical Data Available for Request (catálogo de datos médicos, MEDB/MR): [enlace del recurso en la pestaña Resources del desafío]
- MEDB N3.06 Nutritional Assessments y MR013S, MR042S, MEDB 1.5, 1.8, 1.15 (JSC 28913): [enlaces de los recursos usados]
- NASA-STD-3001 Vol. 1 Rev. C: https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf
- Technical Brief OCHMO-TB-020 (radiación): https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf
- Technical Brief OCHMO-TB-004 (CO₂): https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- Foto Apollo 11 AS11-40-5903 (dominio público): https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~orig.jpg

## 7. Datos de agencias asociadas y otros recursos
- Agencia Espacial Canadiense · Monitoreo de radiación y salud (CANS): https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- Agencia Espacial Canadiense · Experimentos en el espacio: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- WebLLM: https://github.com/mlc-ai/web-llm
- Lenis (scroll suave): https://github.com/darkroomengineering/lenis
- SparkFun MAX3010x y Adafruit MLX90614 (bibliotecas del brazalete)
- Fuentes tipográficas Michroma, Manrope e IBM Plex Mono (Google Fonts)
- Paisaje del inicio: pack de imágenes SELENE (uso libre personal y para clientes)
- Preguntas y protocolos de salud mental y nutrición: trabajo de nuestra compañera [nombre]

---

## Guion del video de 30 segundos (si eligen video en lugar de diapositivas)

| Tiempo | Imagen | Voz (ES) | Subtítulo (EN) |
|---|---|---|---|
| 0–5 s | Inicio: la Tierra saliendo sobre la Luna | «Lejos de la Tierra, nadie te toma el pulso.» | “Far from Earth, no one checks your pulse.” |
| 5–11 s | Escaneo con la mira sobre el traje | «FAVALORO mide solo con un brazalete…» | “FAVALORO measures on its own with a wristband…” |
| 11–17 s | El acompañante hablando y llenando el formulario | «…y charla para completar lo que ningún sensor mide.» | “…and chats to fill in what no sensor can measure.” |
| 17–23 s | Llamada sin respuesta que escala sola | «Si alguien no responde, avisa solo hasta la Tierra.» | “If someone doesn’t answer, it escalates all the way to Earth.” |
| 23–28 s | Ficha clínica con los datos NASA | «Con límites y reglas de la NASA.» | “Built on NASA limits and rules.” |
| 28–30 s | Logo | «FAVALORO. The Muds Devs.» | “FAVALORO. The Muds Devs.” |
