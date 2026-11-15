# Brazalete FAVALORO · prototipo con ESP32

Mide **pulso**, **oxígeno en sangre (SpO₂)** y **temperatura de la piel**, y los manda por Bluetooth a la web de FAVALORO. Usa los servicios **estándar** de salud de Bluetooth (los mismos que usan bandas y oxímetros comerciales), así que la web lo reconoce sola.

> Prototipo educativo para el NASA Space Apps Challenge. **No es un dispositivo médico.**

## Piezas (≈ USD 10–20 en total)

| Pieza | Para qué | Notas |
|---|---|---|
| ESP32 DevKit (ESP32-WROOM-32) | Cerebro y Bluetooth | Cualquier placa ESP32 con BLE |
| MAX30102 | Pulso y oxígeno | Módulo de 3,3 V |
| MLX90614 (opcional) | Temperatura de la piel sin contacto | Si no lo tienen, poner `USAR_TEMPERATURA 0` |
| Cables dupont y protoboard | Conexiones | |
| Cable USB de datos | Programar y alimentar | Que sea de datos, no solo de carga |
| Banda elástica o velcro (opcional) | Armarlo como brazalete | |

## Conexiones

Los dos sensores comparten el bus I²C (los mismos 4 cables):

| Sensor | ESP32 |
|---|---|
| VIN / VCC | 3V3 |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

## Paso a paso

1. Instalen **Arduino IDE** (gratis) desde arduino.cc.
2. En *Preferencias → URLs adicionales de gestor de placas*, agreguen:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
   y en *Herramientas → Placa → Gestor de placas* instalen **esp32** (de Espressif).
3. En *Herramientas → Administrar bibliotecas* instalen:
   - **SparkFun MAX3010x Pulse and Proximity Sensor Library**
   - **Adafruit MLX90614 Library**
4. Abran `favaloro_band/favaloro_band.ino`, elijan la placa **ESP32 Dev Module** y el puerto, y súbanlo.
5. **Primero prueben sin sensores:** el código viene con `SIMULAR 1`, que manda valores de ejemplo. Así comprueban que la conexión con la web funciona.
6. Con los sensores conectados, cambien a `SIMULAR 0` y vuelvan a subirlo.
7. Abran el *Monitor serie* (115200 baudios): ahí ven las lecturas.

## Conectarlo a la web

1. Abran la web con `web/iniciar.bat`, en **Chrome o Edge** (con Bluetooth activado en la PC).
2. Entren como **Tripulante** → *Mi día* → **«Conectar brazalete real (Bluetooth)»**.
3. Elijan **FAVALORO-Band** en la lista.
4. El panel del brazalete pasa a decir **«dispositivo real»**: el pulso, el oxígeno y la temperatura ahora son de verdad. Si se desconecta, la web vuelve sola a la simulación.

## Consejos para que mida bien

- El MAX30102 lee mejor en la **yema del dedo** que en la muñeca. Para la demo, apoyen el dedo sin apretar y sin moverse.
- Cada lectura junta 4 segundos de datos. Si el monitor dice «lectura no válida», reacomoden el dedo.
- La luz fuerte del ambiente puede interferir: tapen el sensor con el dedo completo.

## Cómo encaja con los datos de la NASA

Pulso, oxígeno y temperatura son los *vitals* que la NASA registra en sus evaluaciones clínicas (MEDB 1.1 y 1.2 del catálogo «Medical Data Available for Request»). El brazalete los toma en forma continua, sin que el astronauta tenga que hacer nada.
