# Datos de los módulos ECLSS y Radiación — referencia para programar crisis y monitor de radiación

Este documento describe **solo los datos y la lógica** de nuestros módulos (sin interfaz de
usuario), para que puedas replicar las crisis y el monitor de radiación en tu propia
página. Todo lo que aparece aquí sale de `backend/models.py`, `backend/app.py` y de
`systema_radiacion/prototipo-B/`.

Fuentes reales de código:

- Modelos de datos: `backend/models.py`
- Motor de crisis + endpoints: `backend/app.py`
- Núcleo de radiación: `systema_radiacion/prototipo-B/` (archivos `.py`)
- Escenarios de ejemplo: `systema_radiacion/ejemplo_monitor/*.csv`

> ⚠️ Los umbrales son valores de **EJEMPLO** (para el ejercicio del hackatón), **no normativos**.
> Los comentarios del propio código lo aclaran.

---

## 1. Catálogo de parámetros, rangos nominales y umbrales críticos

Los nombres de campo son los que devuelve la API en JSON (siempre `snake_case`).

### 1.1 Telemetría ambiental — `LecturaAmbiental` (clave JSON `ambiental`)

| Campo | Unidad | Rango nominal | Umbral crítico (regla que lo usa) |
|---|---|---|---|
| `modulo` | texto | `"Hábitat Principal"` | — (solo etiqueta) |
| `presion_kpa` | kPa | 70.3 – 101.3 | — (no dispara reglas) |
| `temperatura_c` | °C | 18.3 – 23.9 | — (no dispara reglas) |
| `co2_ppm` | ppm | < 2000 | **> 4000** → regla `ECLSS_CO2_ALTO` |
| `o2_porcentaje` | % | 19.5 – 23.5 | — (no dispara reglas) |
| `voc_ppb` | ppb | < 250 | — (no dispara reglas) |
| `ruido_db` | dB | < 60 | **> 68** → regla `CORR_CIRCADIANO_VIRAL` |
| `luz_lux` | lux | Día ≈ 500 · Noche < 10 | **Noche y > 50** → regla `CORR_CIRCADIANO_VIRAL` |
| `fase_circadiana` | texto | `"DIA"` \| `"NOCHE"` | combinada con `luz_lux` en la regla anterior |
| `timestamp` | ISO-8601 | — | — |

### 1.2 Microbiología — `MuestraMicrobiologica` (clave JSON `microbiologia`)

| Campo | Unidad | Rango nominal | Umbral crítico (regla que lo usa) |
|---|---|---|---|
| `ubicacion` | texto | `"Circuito Agua Potable (WRS-A)"` | — (solo etiqueta) |
| `tipo` | texto | `"AGUA"` \| `"SUPERFICIE"` | — |
| `bacterias_ufc` | UFC/mL | < 50 | **> 100** → regla `CORR_BIOFILM_INMUNE` |
| `hongos_ufc` | UFC/m³ | < 50 | **> 100** → regla `CORR_BIOFILM_INMUNE` |
| `patogeno_detectado` | texto | `"Ninguno"` | informativo |
| `timestamp` | ISO-8601 | — | — |

### 1.3 Biomarcadores de la tripulación — `BiomarcadorTripulante` (clave JSON `tripulacion`, es una lista)

| Campo | Unidad | Rango nominal | Umbral crítico (regla que lo usa) |
|---|---|---|---|
| `tripulante` | texto | — | — (solo etiqueta) |
| `cortisol_nmol` | nmol/L | 2 – 18 | **> 22** (junto a EBV) → regla `CORR_CIRCADIANO_VIRAL` |
| `siga_ug_ml` | µg/mL | > 100 | **< 60** → regla `CORR_BIOFILM_INMUNE` |
| `il6_pg_ml` | pg/mL | bajo | **> 5.0** → regla `CORR_BIOFILM_INMUNE` |
| `carga_viral_ebv` | copias/mL saliva | bajo | **> 10000** (junto a cortisol) → regla `CORR_CIRCADIANO_VIRAL` |
| `timestamp` | ISO-8601 | — | — |

### 1.4 Monitor de radiación solar — módulo `systema_radiacion`

Dos magnitudes independientes con sus propias referencias (umbrales de ejemplo):

| Magnitud | Campo en JSON | Referencia (default) |
|---|---|---|
| Tasa de dosis equivalente | `tasa_usv_dia` | **umbral = 1500 µSv/día** |
| Dosis acumulada | `acumulado_msv` | **límite = 50 mSv** |

Escala de 4 niveles (aplica a tasa, acumulado y global por igual). El nivel sale de la
**fracción** `valor / referencia`:

| Nivel | Nombre (`nombres`) | Color (`colores`) | Fracción (`valor/referencia`) |
|---|---|---|---|
| 0 | `"Normal"` | `#1e8449` | < 0.25 |
| 1 | `"Precaución"` | `#b7950b` | 0.25 – 0.60 |
| 2 | `"Alerta"` | `#d35400` | 0.60 – 1.00 |
| 3 | `"Crítico"` | `#c0392b` | ≥ 1.00 |

Evento individual de entrada (la unidad atómica del detector):

| Campo | Unidad | Significado |
|---|---|---|
| `energia_dep_kev` | keV | energía depositada en el sensor |
| `angulo_grados` | grados | ángulo respecto a la normal (opcional, default 0) |
| `tiempo_s` | s | instante de la medición |

---

## 2. Motor de crisis — paso a paso

### 2.1 Estado nominal al iniciar (siembra idempotente)

`inicializar_datos_nominales()` siembra **solo si la tabla de ambientales está vacía**. Valores exactos:

**Ambiental**
```json
{
  "modulo": "Hábitat Principal",
  "presion_kpa": 101.1, "temperatura_c": 21.5, "co2_ppm": 950,
  "o2_porcentaje": 21.0, "voc_ppb": 110, "ruido_db": 52.0,
  "luz_lux": 480, "fase_circadiana": "DIA"
}
```

**Microbiología**
```json
{ "ubicacion": "Circuito Agua Potable (WRS-A)", "tipo": "AGUA",
  "bacterias_ufc": 18, "hongos_ufc": 12, "patogeno_detectado": "Ninguno" }
```

**Biomarcadores (2 tripulantes)**
```json
[
  { "tripulante": "Cmdt. Vega",      "cortisol_nmol": 11.4, "siga_ug_ml": 135.0, "il6_pg_ml": 1.8, "carga_viral_ebv": 120 },
  { "tripulante": "Esp. Castillo",   "cortisol_nmol": 12.1, "siga_ug_ml": 128.0, "il6_pg_ml": 2.1, "carga_viral_ebv": 95 }
]
```

### 2.2 Valores que inyecta la crisis — `POST /api/simular-crisis` (sin `restaurar`)

```json
// ambiental
{ "modulo": "Hábitat Principal", "presion_kpa": 99.8, "temperatura_c": 25.4, "co2_ppm": 4350,
  "o2_porcentaje": 20.2, "voc_ppb": 410, "ruido_db": 76.5, "luz_lux": 240, "fase_circadiana": "NOCHE" }

// microbiología
{ "ubicacion": "Circuito Agua Potable (WRS-A)", "tipo": "AGUA",
  "bacterias_ufc": 340, "hongos_ufc": 185, "patogeno_detectado": "Pseudomonas aeruginosa / Aspergillus" }

// biomarcadores
[
  { "tripulante": "Cmdt. Vega",    "cortisol_nmol": 28.4, "siga_ug_ml": 42.0, "il6_pg_ml": 8.7, "carga_viral_ebv": 24500 },
  { "tripulante": "Esp. Castillo", "cortisol_nmol": 24.1, "siga_ug_ml": 55.0, "il6_pg_ml": 6.4, "carga_viral_ebv": 14200 }
]
```

Con estos valores se activan **las 3 reglas** a la vez (ver 2.4).

### 2.3 Valores que inyecta "restaurar nominal" — `POST /api/simular-crisis` con `{"restaurar": true}`

Además de marcar todas las alertas `ACTIVA` → `RESUELTA`, inserta:

```json
// ambiental
{ "presion_kpa": 101.2, "temperatura_c": 21.2, "co2_ppm": 890, "o2_porcentaje": 21.1,
  "voc_ppb": 95, "ruido_db": 50.0, "luz_lux": 5, "fase_circadiana": "NOCHE" }

// microbiología
{ "ubicacion": "Circuito Agua Potable (WRS-B)", "tipo": "AGUA",
  "bacterias_ufc": 14, "hongos_ufc": 10, "patogeno_detectado": "Ninguno" }

// biomarcadores
[
  { "tripulante": "Cmdt. Vega",    "cortisol_nmol": 10.5, "siga_ug_ml": 140.0, "il6_pg_ml": 1.6, "carga_viral_ebv": 80 },
  { "tripulante": "Esp. Castillo", "cortisol_nmol": 11.0, "siga_ug_ml": 132.0, "il6_pg_ml": 1.9, "carga_viral_ebv": 90 }
]
```

### 2.4 Reglas de correlación (motor autónomo)

`ejecutar_motor_correlacion()` cruza la **última** lectura ambiental + muestra microbiológica + los
**2 últimos** biomarcadores. Una alerta se crea solo si no existe ya otra **activa** con el mismo
`codigo_regla` (idempotente).

#### Regla 1 — `CORR_BIOFILM_INMUNE` · nivel `CRITICA`

- **Disparador:** `(bacterias_ufc > 100 OR hongos_ufc > 100)` **Y** algún tripulante con `siga_ug_ml < 60` **o** `il6_pg_ml > 5.0`.
- **Título:** `"Biopelícula Microbiana + Compromiso Inmunológico"`.
- **Diagnóstico:** `"Conteo elevado en {ubicacion} ({bacterias} UFC/mL bact, {hongos} UFC hongos) correlacionado con caída de sIgA e inflamación (IL-6) en {nombres}."`.
- **Checklist (5 pasos, en orden):**
  1. Aislar válvula solenoide del Circuito Hídrico A y conmutar a Reserva Estéril B.
  2. Iniciar ciclo de pasteurización térmica a 85 °C durante 60 min en Circuito A.
  3. Colocar respirador N95 y descontaminar paneles adyacentes con peróxido al 0.5%.
  4. Administrar protocolo profiláctico: Zinc 30 mg + Vitamina D3 4000 UI + Probiótico LGG.
  5. Registrar paquete telemétrico en cola de transmisión diferida a Houston (24 min).

#### Regla 2 — `CORR_CIRCADIANO_VIRAL` · nivel `CRITICA`

- **Disparador:** `(ruido_db > 68.0 OR (fase_circadiana == "NOCHE" AND luz_lux > 50))` **Y** algún tripulante con `cortisol_nmol > 22.0` **y** `carga_viral_ebv > 10000`.
- **Título:** `"Disrupción Circadiana/Acústica + Reactivación Viral (EBV)"`.
- **Diagnóstico:** `"Ruido ({ruido} dB) / Luz ({luz} lux en fase {fase}) elevó cortisol (>22 nmol/L) y reactivó carga viral EBV (>10,000 copias/mL) en {nombres}."`.
- **Checklist (4 pasos):**
  1. Forzar filtro espectral ámbar (<550 nm) y activar cancelación acústica en módulos de descanso.
  2. Administrar Melatonina 3 mg (1 h antes del ciclo oscuro) para resincronizar eje HPA.
  3. Extraer Valaciclovir 1000 mg del Casillero Médico B4 (escanear QR antes de administrar).
  4. Reasignar tareas extravehiculares o de alta carga cognitiva durante las próximas 48 horas.

#### Regla 3 — `ECLSS_CO2_ALTO` · nivel `ADVERTENCIA`

- **Disparador:** `co2_ppm > 4000`.
- **Título:** `"Hipercapnia de Cabina (CO₂ > 4000 ppm)"`.
- **Diagnóstico:** `"Acumulación de CO₂ ({co2} ppm) detectada en {modulo}. Riesgo de fatiga cognitiva."`.
- **Checklist (2 pasos):**
  1. Aumentar flujo de ventilación hacia lechos de zeolita regenerativa (CDRA) al 100%.
  2. Verificar saturación del filtro de aminas sólidas en bahía ECLSS-2.

### 2.5 Ciclo de vida de una alerta (`ACTIVA` → `RESUELTA`)

- El objeto `AlertaAutonoma` tiene `estado: "ACTIVA" | "RESUELTA"` y `protocolo_pasos` como **lista JSON**:
  `[{"orden": 1, "accion": "...", "completado": false}, ...]` (la clave del texto es **`accion`**).
- `POST /api/alertas/<alerta_id>/paso/<orden>` **alterna** `completado` de ese paso.
- Si tras el toggling **todos** los pasos tienen `completado: true`, la alerta pasa a `"RESUELTA"`;
  si alguno se desmarca, vuelve a `"ACTIVA"`.

---

## 3. Monitor de radiación solar

### 3.1 Qué recibe y qué simula

El módulo trabaja sobre **eventos** (partículas), no sobre valores ya promediados. Cada evento es:

```
energia_dep_kev (keV), angulo_grados (°, opcional), tiempo_s (s)
```

Formato de los CSV (encabezado exacto): `tiempo_s,energia_dep_kev,angulo_grados`.

**Simulación** (`SimuladorEventos`, solo pruebas): tasa base **1.5 eventos/s**, semilla por defecto
**42** (la web usa `semilla=None` → aleatorio). Distribución de energías: **97 %** de partículas
ligeras (log-normal centrada en ~110 keV) y **3 %** de iones pesados (log-normal centrada en
~2000 keV).

### 3.2 Pipeline de cálculo (fuente única de verdad)

Con los eventos agrupados en ventanas de `ventana_s` segundos (default **600 s**):

1. **LET** (`calculador_let.py`): camino recorrido = `espesor / cos(ángulo)`; `LET_si = energía / camino`; `LET_agua = LET_si × 0.53`.
2. **Factor de calidad Q(L)** (`factor_calidad.py`, ICRP 60):
   - `L < 10 keV/µm` → `Q = 1.0`
   - `10 ≤ L ≤ 100` → `Q = 0.32·L − 2.2`
   - `L > 100` → `Q = 300 / √L`
3. **Dosis** (`calculador_dosis.py`): `D = Σ(energía_keV × 1.602176634e-16) / masa` (Gy); `H = Σ(D × Q)` (Sv).
   - Masa del detector (`detector.py`): espesor 300 µm, área 1 cm², densidad 2.33 g/cm³ → **6.99e-5 kg**.
4. **Tasa equivalente** (por ventana): `tasa_equivalente_usv_dia = H / duración_s × 86400 × 1e6` (µSv/día).
5. **Acumulado** (`nivel_radiacion.py`): `acumulado += H × 1e3` (mSv) ventana a ventana.
6. **Fracciones**: `f_tasa = tasa / umbral`; `f_acum = acumulado / límite`.
7. **Nivel** (`niveles.py`): fracción `< 0.25` → 0 · `< 0.60` → 1 · `< 1.0` → 2 · `≥ 1.0` → 3.
8. **Nivel global** de cada ventana = `max(nivel_tasa, nivel_acum)`. El **estado actual** que se
   muestra es el de la **última ventana**; aparte se guarda `nivel_maximo` (lo peor que se alcanzó).

### 3.3 Niveles, alertas y medidas de protección

`SistemaAlertas` (nivel simple de consola) lanza `"ALERTA: tasa de dosis equivalente por encima del
umbral"` cuando `tasa_equivalente_usv_dia > 1500`.

El `Recomendador` arma los pasos de protección según el nivel global (1=Precaución, 2=Alerta, 3=Crítico):

**Pasos generales por nivel**
- **Nivel 1:** Seguir las mediciones con atención y revisar la próxima ventana. / Verificar que el detector y los datos cargados sean correctos.
- **Nivel 2:** Avisar al responsable de la misión o del laboratorio. / Postergar actividades no esenciales con exposición. / Verificar el detector para descartar una falla en la medición.
- **Nivel 3:** Suspender las actividades con exposición y avisar de inmediato al responsable. / Pasar a la zona de mayor blindaje disponible. / Registrar la hora y los valores, y seguir el protocolo de emergencia.

**Pasos extra si la TASA está elevada** (`PASOS_TASA`)
- 1: La tasa viene subiendo: comparar con las ventanas anteriores.
- 2: Tasa alta: puede ser un evento de partículas. Permanecer en zona blindada hasta que baje.
- 3: Tasa por encima del umbral: refugiarse hasta que la tasa vuelva a niveles normales.

**Pasos extra si el ACUMULADO está elevado** (`PASOS_ACUMULADO`)
- 1: Ya se usó parte del límite de dosis: planificar la exposición restante.
- 2: Dosis acumulada alta: reducir la exposición futura y planificar descansos.
- 3: Límite de dosis alcanzado o superado: no continuar con exposición adicional.

**Nivel 0 (normal):** título `"Valores normales"` y un solo paso `"No se detectan valores inusuales.
Continuar con el monitoreo habitual."`.

Si en ventanas anteriores hubo un nivel peor que el actual, se añade una **nota de historial**:
`"Antes se llegó a nivel {NIVEL} (ventana {n}): revisar el historial en la tabla."`.

### 3.4 Valores exactos de los ejemplos precargados

Evaluados con la configuración por defecto (ventana 600 s, umbral 1500 µSv/día, límite 50 mSv, previo 0):

| Archivo | Eventos | Ventanas | Nivel actual | Tasa máx | Acumulado final |
|---|---|---|---|---|---|
| `01_leo_tranquila.csv` | 10 821 | 12 | Normal | 197 µSv/día | ≈ 0.002 mSv |
| `02_leo_anomalia_atlantico_sur.csv` | 56 538 | 18 | Normal (pico transitorio 2 419) | 2 419 µSv/día | bajo |
| `03_tormenta_solar.csv` | 101 933 | 18 | Precaución | 4 614 µSv/día | 0.223 mSv |
| `04_espacio_profundo_rayos_cosmicos.csv` | 5 890 | 12 | Normal | 1 467 µSv/día | bajo |
| `05_mision_completa_6h.csv` | 159 946 | 36 | Precaución | 1 942 µSv/día | 0.168 mSv |

Interpretación útil: el acumulado real de estas misiones (≈ 0.2 mSv) es **mucho menor** que el
límite (50 mSv), por eso el gráfico de acumulado debe escalarse a los datos (y dibujar el límite
como "fuera de escala") en lugar de usar 0–50 mSv, o la curva queda aplastada contra el fondo.

### 3.5 Mapa de archivos del módulo de radiación

| Archivo | Responsabilidad |
|---|---|
| `evento.py` | `Evento(energia_dep_kev, angulo_grados, tiempo_s)` |
| `constantes.py` | `KEV_A_JOULE = 1.602176634e-16`, `SEGUNDOS_POR_DIA = 86400` |
| `detector.py` | `DetectorSilicio` (300 µm, 1 cm², 2.33 g/cm³, factor Si→agua 0.53, masa 6.99e-5 kg) |
| `calculador_let.py` | LET en silicio y en agua |
| `factor_calidad.py` | Q(L) ICRP 60 |
| `calculador_dosis.py` | `ResultadoDosis` (D, H, `tasa_equivalente_usv_dia`, `tasa_dosis_ugy_dia`) |
| `monitor.py` | `Monitor.ejecutar(ventanas, ventana_s)` → `InformeMonitoreo` |
| `alertas.py` | `SistemaAlertas` (aviso si tasa > 1500) |
| `acumulador.py` | `AcumuladorMision` (suma de dosis) |
| `histograma_let.py` | histograma de LET (bordes `[0,1,2,5,10,20,50,100,1000]`) |
| `niveles.py` | `NOMBRES`, `COLORES`, `CORTES = (0.25, 0.60, 1.0)` |
| `nivel_radiacion.py` | `EvaluadorRadiacion`, `ClasificadorNivel`, `PuntoEvaluacion`, `EvaluacionRadiacion` |
| `recomendaciones.py` | `Recomendador`, `PASOS_GENERALES`, `PASOS_TASA`, `PASOS_ACUMULADO` |
| `indicador.py` | `Indicador(nombre, valor_texto, nivel, fraccion, detalle)` |
| `lector_csv.py` | `LectorCSV.leer()`, `.leer_texto()`, `.agrupar_ventanas()` |
| `simulador.py` | `SimuladorEventos` (tasa 1.5, semilla 42, 97 % ligeras / 3 % pesadas) |

---

## 4. Estructura de datos y contratos JSON de la API

Base URL en desarrollo: `http://127.0.0.1:5000`. Todos los JSON usan `snake_case`. `timestamp` es
ISO-8601 UTC.

### 4.1 `GET /api/dashboard`

Devuelve el último estado completo. `radiacion` es `null` hasta que se simule/cargue radiación.

```json
{
  "ambiental": {
    "id": 1, "modulo": "Hábitat Principal",
    "presion_kpa": 101.1, "temperatura_c": 21.5, "co2_ppm": 950,
    "o2_porcentaje": 21.0, "voc_ppb": 110, "ruido_db": 52.0, "luz_lux": 480,
    "fase_circadiana": "DIA", "timestamp": "2026-10-01T00:00:00+00:00"
  },
  "microbiologia": {
    "id": 1, "ubicacion": "Circuito Agua Potable (WRS-A)", "tipo": "AGUA",
    "bacterias_ufc": 18, "hongos_ufc": 12, "patogeno_detectado": "Ninguno",
    "timestamp": "2026-10-01T00:00:00+00:00"
  },
  "tripulacion": [
    { "id": 1, "tripulante": "Cmdt. Vega", "cortisol_nmol": 11.4, "siga_ug_ml": 135.0,
      "il6_pg_ml": 1.8, "carga_viral_ebv": 120, "timestamp": "2026-10-01T00:00:00+00:00" },
    { "id": 2, "tripulante": "Esp. Castillo", "cortisol_nmol": 12.1, "siga_ug_ml": 128.0,
      "il6_pg_ml": 2.1, "carga_viral_ebv": 95, "timestamp": "2026-10-01T00:00:00+00:00" }
  ],
  "alertas": [],
  "radiacion": null
}
```

### 4.2 `POST /api/simular-crisis`

**Entrada (crisis):** `{}` (cuerpo vacío). **Entrada (restaurar):** `{"restaurar": true}`.

**Salida (crisis):** `201`
```json
{
  "status": "crisis_simulada",
  "alertas": [
    {
      "id": 1, "codigo_regla": "CORR_BIOFILM_INMUNE", "nivel": "CRITICA",
      "titulo": "Biopelícula Microbiana + Compromiso Inmunológico",
      "diagnostico": "Conteo elevado en Circuito Agua Potable (WRS-A) (340 UFC/mL bact, 185 UFC hongos) correlacionado con caída de sIgA e inflamación (IL-6) en Cmdt. Vega, Esp. Castillo.",
      "protocolo_pasos": [
        { "orden": 1, "accion": "Aislar válvula solenoide del Circuito Hídrico A y conmutar a Reserva Estéril B.", "completado": false },
        { "orden": 2, "accion": "Iniciar ciclo de pasteurización térmica a 85 °C durante 60 min en Circuito A.", "completado": false },
        { "orden": 3, "accion": "Colocar respirador N95 y descontaminar paneles adyacentes con peróxido al 0.5%.", "completado": false },
        { "orden": 4, "accion": "Administrar protocolo profiláctico: Zinc 30 mg + Vitamina D3 4000 UI + Probiótico LGG.", "completado": false },
        { "orden": 5, "accion": "Registrar paquete telemétrico en cola de transmisión diferida a Houston (24 min).", "completado": false }
      ],
      "estado": "ACTIVA", "lectura_id": 2, "timestamp": "2026-10-01T01:00:00+00:00"
    }
  ]
}
```
(La crisis activa también `CORR_CIRCADIANO_VIRAL` y `ECLSS_CO2_ALTO`; aquí se muestra una de ejemplo.)

**Salida (restaurar):** `200`
```json
{ "status": "nominal_restaurado" }
```

### 4.3 `POST /api/telemetria`

Ingesta genérica (acepta cualquiera de las tres secciones). Cada campo tiene default si se omite.

**Entrada**
```json
{
  "ambiental": { "co2_ppm": 4200, "ruido_db": 70.0, "luz_lux": 200, "fase_circadiana": "NOCHE" },
  "microbiologia": { "bacterias_ufc": 130, "hongos_ufc": 90 },
  "biomarcador": { "tripulante": "Cmdt. Vega", "cortisol_nmol": 25.0, "siga_ug_ml": 50.0, "il6_pg_ml": 6.0, "carga_viral_ebv": 12000 }
}
```

**Salida** `201`
```json
{ "status": "ok", "alertas_disparadas": 2, "alertas": [ /* AlertaAutonoma... */ ] }
```

### 4.4 `POST /api/alertas/<alerta_id>/paso/<orden>`

**Entrada:** sin cuerpo. **Salida:** `200` con la alerta completa (mismo formato que en 4.2), con el
paso `completado` alternado y `estado` = `"ACTIVA"` o `"RESUELTA"` según corresponda.

### 4.5 `GET /api/radiacion/ejemplos`

```json
{
  "ejemplos": [
    { "archivo": "01_leo_tranquila.csv", "etiqueta": "LEO — actividad tranquila" },
    { "archivo": "02_leo_anomalia_atlantico_sur.csv", "etiqueta": "LEO — anomalía Atlántico Sur (SAA)" },
    { "archivo": "03_tormenta_solar.csv", "etiqueta": "Tormenta solar (SPE)" },
    { "archivo": "04_espacio_profundo_rayos_cosmicos.csv", "etiqueta": "Espacio profundo — rayos cósmicos (GCR)" },
    { "archivo": "05_mision_completa_6h.csv", "etiqueta": "Misión completa — 6 h" }
  ]
}
```

### 4.6 `POST /api/radiacion/cargar-ejemplo`

**Entrada**
```json
{ "archivo": "03_tormenta_solar.csv" }
```

**Salida** `201`
```json
{ "status": "ok", "archivo": "03_tormenta_solar.csv", "radiacion": { /* ver 4.8 */ } }
```

### 4.7 `POST /api/radiacion/simular`

**Entrada** (todos opcionales)
```json
{ "ventana_s": 600, "n_ventanas": 6, "umbral_usv_dia": 1500, "limite_acum_msv": 50, "previo_msv": 0 }
```

**Salida** `201`
```json
{ "status": "ok", "radiacion": { /* ver 4.8 */ } }
```

### 4.8 `POST /api/radiacion/cargar` — y la estructura completa de `radiacion`

**Entrada**
```json
{ "csv": "tiempo_s,energia_dep_kev,angulo_grados\n0.42,108.3,12.5\n1.1,128.6,47.0" }
```

**Salida** `201`. Estructura exacta de `radiacion` (común a `simular`, `cargar` y `cargar-ejemplo`,
y a la clave `radiacion` de `/api/dashboard`):

```json
{
  "umbral_usv_dia": 1500,
  "limite_acum_msv": 50,
  "colores": ["#1e8449", "#b7950b", "#d35400", "#c0392b"],
  "nombres": ["Normal", "Precaución", "Alerta", "Crítico"],
  "tasa": {
    "nombre": "Tasa de dosis (actual)", "valor": "197 µSv/día",
    "nivel": 0, "nivel_etiqueta": "Normal", "color": "#1e8449",
    "fraccion": 0.1313, "detalle": "13 % del umbral (1500 µSv/día)"
  },
  "acumulado": {
    "nombre": "Dosis acumulada", "valor": "0.002 mSv",
    "nivel": 0, "nivel_etiqueta": "Normal", "color": "#1e8449",
    "fraccion": 0.0, "detalle": "0.0 % del límite · restan 49.998 mSv"
  },
  "global": {
    "nombre": "Radiación espacial (global)", "valor": "Nivel 0 de 3",
    "nivel": 0, "nivel_etiqueta": "Normal", "color": "#1e8449",
    "fraccion": 0.1313, "detalle": "Tasa y acumulado en el mismo nivel"
  },
  "tasa_maxima_usv_dia": 197.0,
  "ventana_tasa_maxima": 3,
  "nivel_maximo": 0,
  "nivel_maximo_etiqueta": "Normal",
  "puntos": [
    { "ventana": 1, "tasa_usv_dia": 150.0, "acumulado_msv": 0.001,
      "nivel_tasa": 0, "nivel_acum": 0, "nivel_global": 0 },
    { "ventana": 2, "tasa_usv_dia": 197.0, "acumulado_msv": 0.002,
      "nivel_tasa": 0, "nivel_acum": 0, "nivel_global": 0 }
  ],
  "recomendacion": {
    "nivel": 0, "titulo": "Valores normales", "es_inusual": false,
    "pasos": ["No se detectan valores inusuales. Continuar con el monitoreo habitual."],
    "nota": ""
  }
}
```

Claves que conviene recordar al renderizar:

- `radiacion.nombres` y `radiacion.colores` son **arreglos de 4** alineados con `nivel` (0–3): úsalos
  para pintar el color/nombre de cualquier nivel (tarjetas, gráfico, tabla), sin hardcodear la paleta.
- `radiacion.puntos[]` es la serie por ventana para graficar (tasa y acumulado) y para la tabla.
- `radiacion.tasa` / `acumulado` / `global` son el **estado actual** (última ventana);
  `nivel_maximo` / `tasa_maxima_usv_dia` / `ventana_tasa_maxima` son el peor histórico.
- `recomendacion.pasos[]` es la lista de medidas de protección; `recomendacion.nota` avisa si hubo
  un nivel peor en el pasado.
