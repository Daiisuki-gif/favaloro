# NASA Space Life Sciences Data & Fractional Gravity Adaptation Repository
### FAVALORO Autonomous Biomedical Analytics for Mars (0.38g)

Este repositorio contiene datasets biológicos y médicos oficiales descargados y estructurados directamente desde las APIs y archivos de la NASA (**NASA OSDR / LSDA**, **NASA Open Data Portal** y **NASA Human Research Roadmap - HRR**), orientados a la adaptación humana a gravedades parciales (especialmente la gravedad marciana: **0.38g** o $\frac{3}{8}\text{g}$ terrestre).

---

## 1. Estructura de Directorios

```text
data/
├── database_schema_bcnf.sql       # Script SQL MySQL en Forma Normal de Boyce-Codd (FNBC) + Álgebra Relacional
├── raw_nasa_osdr/                 # Datasets crudos descargados vía API desde NASA OSDR / LSDA
│   ├── OSD-616_Force_Plate_Mars_Soleus.csv       (120 KB - Dinamometría de Sóleo en gravedad marciana 0.38g)
│   ├── OSD-608_pQCT_Bone_Mineral_Density.csv     (10 KB - Tomografía pQCT trabecular/cortical en carga fraccional)
│   ├── OSD-583_Tonometry_IOP_SANS.csv            (5 KB - Presión Intraocular e ICP en vuelo orbital RR-9)
│   ├── OSD-596_Locomotion_ArtificialGravity.csv  (2.2 KB - Locomoción y reflejo vestibular en centrífuga ISS)
│   └── osdr_search_summary.json                  (260 KB - Índice de estudios espaciales NASA OSDR)
└── curated_csv/                   # Tablas curadas y normalizadas para ingesta y frontend/backend
    ├── sistemas_anatomicos.csv           # 4 Pilares: Músculos, Huesos, Sistema Vestibular, Cardiovascular
    ├── efectos_gravedad.csv              # Coeficientes de degradación a 0g, 0.16g (Luna), 0.38g (Marte) y 1g
    ├── parametros_cuantitativos_hrr.csv  # Métricas cuantitativas del NASA Human Research Roadmap
    ├── contramedidas.csv                 # ARED, T2 HIIT, LBNP, Solución salina, Bifosfonatos, etc.
    ├── estudios_nasa_lsda.csv            # Mapeo de estudios OSD / LSDS de NASA
    └── telemetria_tripulacion_marte.csv  # Telemetría de los 5 astronautas de la misión FAVALORO
```

---

## 2. Los 4 Pilares Fisiológicos en Gravedad Marciana (0.38g)

### A. Músculos (Atrofia y Transición Fenotípica)
* **Dataset Crudo:** `OSD-616` (`LSDS-61_Force Plate_Force_Plate_Transformed_Reusable_Files.csv`)
* **Hallazgo Clave:** A 0.38g (modelo PWB40 de carga fraccional en roedores), la masa del complejo sóleo/gastrocnemio experimenta una atrofia del ~15-20% y una caída de fuerza tetánica pico de ~25-30% si no se aplican contramedidas. Aunque es significativamente menor que en microgravedad pura ($\approx 40\%$ de pérdida en 0g), el 38% de carga gravitacional terrestre **no es suficiente por sí solo** para sostener la masa muscular a largo plazo.
* **Mecanismo:** Disminución en la síntesis proteica miofibrilar y conversión de fibras posturales de contracción lenta oxidativas (Tipo I) a fibras rápidas glucolíticas fatigables (Tipo IIx).

### B. Huesos (Densidad Mineral Ósea y Mechanostat)
* **Dataset Crudo:** `OSD-608` (`LSDS-41_pQCT_KoTRANSFORMED.csv`) y `OSD-477` (`LSDS-40`)
* **Hallazgo Clave:** La teoría del mecanostato de Harold Frost demuestra que la remodelación ósea requiere deformaciones mecánicas fisiológicas superiores a **$1000 - 1500\ \mu\varepsilon$ (microstrain)**. En la superficie de Marte (0.38g), la marcha normal genera únicamente entre **$400$ y $650\ \mu\varepsilon$**.
* **Tasa de Pérdida Cuantitativa:** En 0g, la pérdida de DMO en fémur y columna lumbar oscila entre **$1.0\%$ y $1.5\%$ por mes**. En Marte (0.38g), la tasa se reduce a aproximadamente **$0.35\% - 0.48\%$ por mes**, lo cual requiere entrenamiento resistivo de alta intensidad (ARED) con cargas axiales añadidas para evitar osteopenia severa y nefrolitiasis por hipercalciuria.

### C. Oído Interno y Sistema Vestibular (Reflejo VOR y SMS)
* **Dataset Crudo:** `OSD-596` (`LSDS-43_Locomotion_mhatreTRANSFORMED.csv`)
* **Hallazgo Clave:** Los órganos otolíticos (utrículo y sáculo) experimentan en Marte un vector de cizallamiento estático del 38% respecto al terrestre. En los primeros 2 a 5 días tras el aterrizaje en Marte, la tripulación sufre el fenómeno **OTTR (Otolith Tilt-Translation Reinterpretation)**, donde el encéfalo interpreta erróneamente las inclinaciones de cabeza como traslaciones horizontales.
* **Parámetros Clínicos:** La ganancia del reflejo vestíbulo-ocular (VOR gain) cae a $0.76$ en microgravedad y se estabiliza en torno a $0.94$ en Marte tras $48-96\text{ h}$.

### D. Órganos, Fluidos y Sistema Cardiovascular (Cephalad Fluid Shift y SANS)
* **Dataset Crudo:** `OSD-583` (`LSDS-16_tonometry_Transformed_Files.csv`)
* **Hallazgo Clave:** El desplazamiento cefálico de fluidos moviliza entre **$1.5$ y $2.0$ litros** de líquido intravascular e intersticial desde los miembros inferiores hacia el tórax y la cabeza.
* **Manifestaciones:** Aumento de la presión venosa central, distensión de la vena yugular interna y aumento del diámetro de la vaina del nervio óptico (**ONSD > 5.8 mm** vs normal 4.8 mm), característico del Síndrome Neuro-ocular Asociado al Vuelo Espacial (**SANS**). Al descender en Marte, se restaura parcialmente el gradiente hidrostático, reduciendo el riesgo de síncope ortostático a $<20\%$ con sobrecarga hidrosalina pre-landing.

---

## 3. Modelo Relacional en Forma Normal de Boyce-Codd (FNBC / BCNF)

El script [database_schema_bcnf.sql](file:///c:/Users/Usuario/Desktop/programacion/Nasa%20challenge/data/database_schema_bcnf.sql) estructura toda la información eliminando cualquier redundancia médica.

### Definición Formal de FNBC
Una relación $R$ con conjunto de dependencias funcionales $F$ está en **FNBC** si y solo si para cada dependencia funcional no trivial $X \to Y$ en $F^+$, $X$ es una **superclave** de $R$.

### Esquema de Tablas
1. **`Niveles_Gravedad`** $(\underline{\text{gravedad\_g}}, \text{nombre\_entorno}, \text{ratio\_terrestre}, \text{descripcion\_ambiente})$
2. **`Sistemas_Anatomicos`** $(\underline{\text{sistema\_id}}, \text{nombre\_sistema}, \text{organos\_principales}, \text{mecanismo\_fisiopatologico}, \text{marcador\_clinico})$
3. **`Efectos_Gravedad`** $(\underline{\text{efecto\_id}}, \text{sistema\_id}^*, \text{gravedad\_g}^*, \text{tasa\_degradacion\_mensual\_pct}, \text{estado\_remodelacion}, \text{mecanostato\_umbral\_microstrain}, \text{nivel\_riesgo})$
4. **`Parametros_Cuantitativos_HRR`** $(\underline{\text{parametro\_id}}, \text{sistema\_id}^*, \text{nombre\_metrica}, \text{unidad\_medida}, \text{valor\_0g}, \text{valor\_lunar\_016g}, \text{valor\_marte\_038g}, \text{valor\_tierra\_1g}, \text{referencia\_hrr})$
5. **`Contramedidas`** $(\underline{\text{contramedida\_id}}, \text{sistema\_id}^*, \text{nombre\_contramedida}, \text{tipo\_intervencion}, \text{prescripcion\_diaria}, \text{eficacia\_en\_marte\_pct}, \text{mecanismo\_accion})$
6. **`Estudios_NASA_LSDA`** $(\underline{\text{estudio\_acceso\_id}}, \text{archivo\_lsda\_ref}, \text{titulo\_estudio}, \text{plataforma\_mision}, \text{tipo\_organismo}, \text{tejido\_analizado}, \text{archivo\_csv\_local})$
7. **`Astronautas`** $(\underline{\text{astronauta\_id}}, \text{nombre\_completo}, \text{rol\_mision}, \text{dias\_en\_marte}, \text{estado\_general})$
8. **`Telemetria_Biomedica`** $(\underline{\text{astronauta\_id}^*, \text{timestamp\_registro}}, \text{gravedad\_ambiente}^*, \text{bp\_sistolica}, \text{bp\_diastolica}, \text{gasto\_cardiaco}, \text{fnirs\_cerebral\_pct}, \text{vor\_gain}, \text{otolith\_response}, \text{csa\_soleo\_cm2}, \text{microstrain\_tibia}, \text{grf\_bw}, \text{riesgo\_ortostatico\_pct}, \text{diagnostico\_autonomo})$

---

## 4. Consultas en Álgebra Relacional

### Consulta 1: Astronautas con deformación ósea sub-umbral en Marte (< 1000 microstrain)
$$\pi_{\text{astronauta\_id}, \text{nombre\_completo}, \text{microstrain\_tibia}} \left( \sigma_{\text{microstrain\_tibia} < 1000 \ \wedge \ \text{gravedad\_ambiente} = 0.38} (\text{Telemetria\_Biomedica} \bowtie \text{Astronautas}) \right)$$

### Consulta 2: Prescripción de contramedidas automáticas para déficit óseo detectado
$$\pi_{\text{nombre\_completo}, \text{nombre\_contramedida}, \text{prescripcion\_diaria}} \left( \sigma_{\text{microstrain\_tibia} < 1000} (\text{Telemetria\_Biomedica} \bowtie \text{Astronautas}) \bowtie (\sigma_{\text{sistema\_id} = 'OSEO'} (\text{Sistemas\_Anatomicos} \bowtie \text{Contramedidas})) \right)$$

### Consulta 3: Atenuación del impacto fisiológico por gravedad parcial marciana (0.38g vs 0g)
$$\pi_{\text{nombre\_metrica}, \text{valor\_0g}, \text{valor\_marte\_038g}, (\text{valor\_marte\_038g} - \text{valor\_0g}) \text{ AS atenuacion\_delta}} (\text{Parametros\_Cuantitativos\_HRR})$$
