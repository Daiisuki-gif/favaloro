# FAVALORO · Health monitoring for astronauts

**The Muds Devs · NASA Space Apps Challenge 2026 · Santiago del Estero, Argentina**
Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

> **App online:** https://daiisuki-gif.github.io/favaloro/
> No login, no install. Works best in Chrome or Edge on a computer or phone.

FAVALORO is a web app that helps astronauts on long missions check their own health and act on it, even when Earth cannot answer in time. A wristband measures heart rate, blood oxygen and temperature on its own. A voice companion chats with the crewmember to fill in what no sensor measures, such as mood, stress and meals. The assistant watches vital signs, ship air and radiation. When something goes out of range, it opens a protocol, warns out loud and guides each step. If nobody answers, it escalates to the crew, the medical officer and Mission Control. Its limits come from NASA standards (NASA-STD-3001) and from the Human Research Program's five hazards of spaceflight.

## Qué hay en el repositorio

| Carpeta / archivo | Qué es |
|---|---|
| `web/` | **La app FAVALORO** (HTML, CSS y JavaScript, sin instalación) |
| `hardware/` | Código del brazalete (ESP32 + MAX30102 + MLX90614, Bluetooth estándar) |
| `entrega/` | Descripción de la app, textos de entrega, guiones del video y prompt para generar los entregables |
| `datos/` | Datos de NASA OSDR resumidos y planillas del equipo |
| `The_Muds_Devs_Monitoreo_Salud_Astronautas.pdf` | Informe de investigación (con fuentes) |
| `demo/`, `companera/` | Prototipos anteriores |
| `assets/` | Logo e ilustración |

## Cómo abrirla en la compu

- Abrí `web/iniciar.bat` (Windows, necesita Python), o
- en una terminal: `python -m http.server 8080 --directory web` y entrá a `http://localhost:8080`.

El brazalete por Bluetooth y el micrófono necesitan `https` o `localhost`.

## Aviso

Es un prototipo de competencia. Los datos de salud son **simulados**, salvo los del brazalete real. **No es un dispositivo médico, no indica dosis de medicamentos y no reemplaza una evaluación médica.** No usa logos ni insignias de la NASA. Las fotos de la NASA son de dominio público.
