-- ======================================================================================
-- ARCHIVO DE BASE DE DATOS FAVALORO / NASA SPACE BIOLOGY
-- MODELO RELACIONAL EN FORMA NORMAL DE BOYCE-CODD (FNBC / BCNF)
-- MOTOR: MySQL 8.0+ / MariaDB / PostgreSQL compatible
-- ======================================================================================
-- Justificación de Normalización FNBC:
-- Una relación R está en FNBC si para toda Dependencia Funcional (DF) no trivial X -> Y,
-- X es una superclave de R.
-- Se eliminan completamente anomalías de inserción, actualización y borrado,
-- asegurando integridad médica crítica para telemetría espacial en gravedad parcial (0.38g).
-- ======================================================================================

CREATE DATABASE IF NOT EXISTS nasa_space_biology_favaloro 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE nasa_space_biology_favaloro;

-- --------------------------------------------------------------------------------------
-- 1. TABLA: Niveles_Gravedad (Catálogo de Entornos Gravitatorios)
-- DF: gravedad_g -> nombre_entorno, ratio_terrestre, descripcion_ambiente
-- Superclave: {gravedad_g}
-- --------------------------------------------------------------------------------------
DROP TABLE IF EXISTS Telemetria_Biomedica;
DROP TABLE IF EXISTS Contramedidas;
DROP TABLE IF EXISTS Parametros_Cuantitativos_HRR;
DROP TABLE IF EXISTS Efectos_Gravedad;
DROP TABLE IF EXISTS Estudios_NASA_LSDA;
DROP TABLE IF EXISTS Astronautas;
DROP TABLE IF EXISTS Niveles_Gravedad;
DROP TABLE IF EXISTS Sistemas_Anatomicos;

CREATE TABLE Niveles_Gravedad (
    gravedad_g DECIMAL(4, 2) NOT NULL,
    nombre_entorno VARCHAR(50) NOT NULL,
    ratio_terrestre VARCHAR(20) NOT NULL,
    descripcion_ambiente TEXT NOT NULL,
    PRIMARY KEY (gravedad_g)
) ENGINE=InnoDB;

INSERT INTO Niveles_Gravedad (gravedad_g, nombre_entorno, ratio_terrestre, descripcion_ambiente) VALUES
(0.00, 'Microgravedad Orbital (ISS / Tránsito)', '0/1 g (0%)', 'Ingravidez total, ausencia de carga mecánica estática y dinámica. Desplazamiento cefálico de fluidos masivo.'),
(0.16, 'Superficie Lunar', '1/6 g (16.6%)', 'Gravedad lunar reducida. Carga mecánica subcrítica, insuficiente para sostener la masa ósea sin ejercicio asistido.'),
(0.38, 'Superficie Marciana', '3/8 g (38.0%)', 'Gravedad marciana. Gradiente hidrostático parcial, remodelación ósea sub-umbral (Mechanostat 650 microstrain), recalibración otolítica requerida.'),
(1.00, 'Tierra (1g Terrestre)', '1/1 g (100%)', 'Línea base fisiológica nominal humana. Carga de 1g gravitacional y presión atmosférica estándar a nivel del mar.');

-- --------------------------------------------------------------------------------------
-- 2. TABLA: Sistemas_Anatomicos (4 Pilares Fisiológicos de Adaptación)
-- DF: sistema_id -> nombre_sistema, organos_principales, mecanismo_fisiopatologico, marcador_clinico
-- Superclave: {sistema_id}
-- --------------------------------------------------------------------------------------
CREATE TABLE Sistemas_Anatomicos (
    sistema_id VARCHAR(10) NOT NULL,
    nombre_sistema VARCHAR(100) NOT NULL,
    organos_principales VARCHAR(255) NOT NULL,
    mecanismo_fisiopatologico TEXT NOT NULL,
    marcador_clinico VARCHAR(255) NOT NULL,
    PRIMARY KEY (sistema_id)
) ENGINE=InnoDB;

INSERT INTO Sistemas_Anatomicos (sistema_id, nombre_sistema, organos_principales, mecanismo_fisiopatologico, marcador_clinico) VALUES
('MUSC', 'Sistema Musculoesquelético - Muscular', 'Sóleo, Gastrocnemio, Cuádriceps, Erector de la columna', 'Descarga mecánica crónica, disminución de síntesis proteica miofibrilar, transición de fibras lentas (Tipo I) a rápidas oxidativas/glucolíticas.', 'Área de Sección Transversal (CSA cm2), Fuerza Tetanica Máxima (N), Potencia pico'),
('OSEO', 'Sistema Musculoesquelético - Óseo', 'Columna lumbar (L1-L4), Cuello femoral, Trocánter, Calcáneo, Tibia', 'Pérdida de deformación piezoeléctrica osteocítica (<1000 microstrain), secreción aumentada de esclerostina, hiperactivación osteoclástica y resorción trabecular.', 'Densidad Mineral Ósea (BMD g/cm2), Calcio urinario (mg/24h), T-score DXA, microCT'),
('VEST', 'Sistema Vestibular y Neuro-sensoriomotor', 'Órganos otolíticos (Utrículo, Sáculo), Canales semicirculares, Complejo vestibular', 'Ausencia/alteración del vector gravitatorio otolítico de cizallamiento estático, conflicto neurosensorial otolítico-visual-propioceptivo, descalibración del VOR.', 'Ganancia del VOR (Reflejo Vestíbulo-Ocular), Desviación Subjetiva Visual Vertical (SVV), Escala SMS'),
('CARD', 'Sistema Cardiovascular y Fluidos', 'Ventrículo izquierdo, Senos carotídeos, Sistema venoso de miembros inferiores, Vena yugular', 'Desplazamiento cefálico de fluidos (~1.5-2.0 L), reflejo de Gauer-Henry que induce diuresis natriurética, contracción de volemia plasmática (-15%) y remodelación ventricular.', 'Gasto Cardíaco (CO L/min), Volemia Plasmática (L), Presión Arterial (mmHg), Diámetro ONSD (mm)');

-- --------------------------------------------------------------------------------------
-- 3. TABLA: Efectos_Gravedad (Coeficientes de Degradación según Gravedad)
-- DF: efecto_id -> sistema_id, gravedad_g, tasa_degradacion_mensual_pct, estado_remodelacion, mecanostato_umbral_microstrain, nivel_riesgo
-- Superclave: {efecto_id} y {(sistema_id, gravedad_g)}
-- --------------------------------------------------------------------------------------
CREATE TABLE Efectos_Gravedad (
    efecto_id VARCHAR(15) NOT NULL,
    sistema_id VARCHAR(10) NOT NULL,
    gravedad_g DECIMAL(4, 2) NOT NULL,
    tasa_degradacion_mensual_pct DECIMAL(5, 2) NOT NULL,
    estado_remodelacion VARCHAR(100) NOT NULL,
    mecanostato_umbral_microstrain INT NOT NULL,
    nivel_riesgo ENUM('Nulo', 'Bajo', 'Medio', 'Alto', 'Crítico') NOT NULL,
    PRIMARY KEY (efecto_id),
    UNIQUE KEY uq_sistema_gravedad (sistema_id, gravedad_g),
    FOREIGN KEY (sistema_id) REFERENCES Sistemas_Anatomicos(sistema_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (gravedad_g) REFERENCES Niveles_Gravedad(gravedad_g) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Efectos_Gravedad (efecto_id, sistema_id, gravedad_g, tasa_degradacion_mensual_pct, estado_remodelacion, mecanostato_umbral_microstrain, nivel_riesgo) VALUES
('EF-M-00', 'MUSC', 0.00, 5.00, 'Atrofia Muscular Acelerada', 150, 'Crítico'),
('EF-M-16', 'MUSC', 0.16, 3.20, 'Atrofia Moderada', 350, 'Alto'),
('EF-M-38', 'MUSC', 0.38, 1.80, 'Atrofia Parcial Compensable', 650, 'Medio'),
('EF-M-10', 'MUSC', 1.00, 0.00, 'Homeostasis Nominal', 1200, 'Nulo'),

('EF-O-00', 'OSEO', 0.00, 1.50, 'Resorción Ósea Severa (Osteopenia Crítica)', 180, 'Crítico'),
('EF-O-16', 'OSEO', 0.16, 0.90, 'Resorción Moderada Subcrítica', 420, 'Alto'),
('EF-O-38', 'OSEO', 0.38, 0.45, 'Resorción Leve Infraluminal', 720, 'Medio'),
('EF-O-10', 'OSEO', 1.00, 0.00, 'Equilibrio Osteoblasto/Osteoclasto', 1350, 'Nulo'),

('EF-V-00', 'VEST', 0.00, 0.00, 'Desconexión Gravitatoria / SMS Fase Aguda', 0, 'Crítico'),
('EF-V-16', 'VEST', 0.16, 0.00, 'Cizallamiento Otolítico Sub-umbral', 0, 'Medio'),
('EF-V-38', 'VEST', 0.38, 0.00, 'Recalibración Otolítica Marciana Incompleta (OTTR)', 0, 'Medio'),
('EF-V-10', 'VEST', 1.00, 0.00, 'Calibración Terrestre 1g Nominal', 0, 'Nulo'),

('EF-C-00', 'CARD', 0.00, 2.20, 'Desacondicionamiento Cardiovascular e Hipovolemia', 0, 'Crítico'),
('EF-C-16', 'CARD', 0.16, 1.40, 'Gradiente Hidrostático Débil', 0, 'Alto'),
('EF-C-38', 'CARD', 0.38, 0.80, 'Gradiente Parcial con Recuperación Hemodinámica', 0, 'Medio'),
('EF-C-10', 'CARD', 1.00, 0.00, 'Gradiente Hidrostático Normal 1g', 0, 'Nulo');

-- --------------------------------------------------------------------------------------
-- 4. TABLA: Parametros_Cuantitativos_HRR (Informes de Evidencia NASA HRR)
-- DF: parametro_id -> sistema_id, nombre_metrica, unidad_medida, valor_0g, valor_lunar_016g, valor_marte_038g, valor_tierra_1g, referencia_hrr
-- Superclave: {parametro_id}
-- --------------------------------------------------------------------------------------
CREATE TABLE Parametros_Cuantitativos_HRR (
    parametro_id VARCHAR(20) NOT NULL,
    sistema_id VARCHAR(10) NOT NULL,
    nombre_metrica VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    valor_0g DECIMAL(7, 2) NOT NULL,
    valor_lunar_016g DECIMAL(7, 2) NOT NULL,
    valor_marte_038g DECIMAL(7, 2) NOT NULL,
    valor_tierra_1g DECIMAL(7, 2) NOT NULL,
    referencia_hrr VARCHAR(255) NOT NULL,
    PRIMARY KEY (parametro_id),
    FOREIGN KEY (sistema_id) REFERENCES Sistemas_Anatomicos(sistema_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Parametros_Cuantitativos_HRR (parametro_id, sistema_id, nombre_metrica, unidad_medida, valor_0g, valor_lunar_016g, valor_marte_038g, valor_tierra_1g, referencia_hrr) VALUES
('PAR-BMD-LS', 'OSEO', 'Pérdida DMO Columna Lumbar (L1-L4)', '% por mes', -1.06, -0.65, -0.32, 0.00, 'Evidence Report: Bone Fracture Risk (NASA/TP-2016-218580)'),
('PAR-BMD-FN', 'OSEO', 'Pérdida DMO Cuello Femoral', '% por mes', -1.42, -0.88, -0.44, 0.00, 'HRR Bone Risk Evidence Report 2021'),
('PAR-BMD-PEL', 'OSEO', 'Pérdida DMO Pelvis / Trocánter', '% por mes', -1.56, -0.95, -0.48, 0.00, 'NASA LSDA In-flight DXA Bone Survey'),
('PAR-CAL-EXC', 'OSEO', 'Excreción Urinaria de Calcio', 'mg / 24h', 320.00, 260.00, 210.00, 140.00, 'Evidence Report: Renal Stone Risk (HRP-47060)'),
('PAR-MUSC-SOL', 'MUSC', 'Atrofia Sección Transversal Sóleo', '% reducción / 6m', -24.50, -16.00, -9.50, 0.00, 'HRR Muscle Atrophy Risk (NASA/TP-2017-219284)'),
('PAR-MUSC-FOR', 'MUSC', 'Fuerza Máxima Dorsiflexión / Plantarflexión', '% reducción / 6m', -28.00, -18.50, -11.00, 0.00, 'NASA OSDR OSD-616 Force Plate Dataset'),
('PAR-VEST-VOR', 'VEST', 'Ganancia Reflejo Vestíbulo-Ocular (VOR)', 'Ratio ganancia (ideal 1.0)', 0.76, 0.88, 0.94, 1.00, 'Evidence Report: Sensorimotor Impairment (NASA/TP-2016-218578)'),
('PAR-VEST-SMS', 'VEST', 'Incidencia Síndrome de Adaptación al Espacio (SMS)', '% tripulantes afectados', 72.00, 40.00, 35.00, 0.00, 'NASA Johnson Space Center Medical Operations'),
('PAR-CARD-VOL', 'CARD', 'Contracción de Volemia Plasmática', '% cambio respecto a 1g', -14.50, -9.00, -5.50, 0.00, 'Evidence Report: Cardiovascular Deconditioning (NASA/TM-2016-219285)'),
('PAR-CARD-CO', 'CARD', 'Gasto Cardíaco en Reposo (CO)', 'L / min', 4.10, 4.60, 4.90, 5.20, 'ESA Erasmus Archive Ultrasound In-flight Database'),
('PAR-SANS-ONSD', 'CARD', 'Diámetro Vaina Nervio Óptico (ONSD)', 'mm', 6.20, 5.60, 5.20, 4.80, 'Evidence Report: SANS Optic Disc Edema (NASA/TP-2017-219290)');

-- --------------------------------------------------------------------------------------
-- 5. TABLA: Contramedidas (Intervenciones Terapéuticas y de Entrenamiento)
-- DF: contramedida_id -> sistema_id, nombre_contramedida, tipo_intervencion, prescripcion_diaria, eficacia_en_marte_pct, mecanismo_accion
-- Superclave: {contramedida_id}
-- --------------------------------------------------------------------------------------
CREATE TABLE Contramedidas (
    contramedida_id VARCHAR(20) NOT NULL,
    sistema_id VARCHAR(10) NOT NULL,
    nombre_contramedida VARCHAR(100) NOT NULL,
    tipo_intervencion ENUM('Mecánica / Biomecánica', 'Fisiológica / Muscular', 'Presurización Pasiva', 'Farmacológica', 'Nutricional / Farmacológica', 'Aeroespacial / Gravitatoria') NOT NULL,
    prescripcion_diaria TEXT NOT NULL,
    eficacia_en_marte_pct DECIMAL(5, 2) NOT NULL,
    mecanismo_accion TEXT NOT NULL,
    PRIMARY KEY (contramedida_id),
    FOREIGN KEY (sistema_id) REFERENCES Sistemas_Anatomicos(sistema_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Contramedidas (contramedida_id, sistema_id, nombre_contramedida, tipo_intervencion, prescripcion_diaria, eficacia_en_marte_pct, mecanismo_accion) VALUES
('CM-ARED', 'OSEO', 'ARED (Advanced Resistive Exercise Device)', 'Mecánica / Biomecánica', '45 minutos/día, ejercicios de sentadilla, peso muerto y elevación de talones a cargas de 1500-2400 N.', 88.00, 'Restaura el estímulo piezoeléctrico en el hueso (>1200 microstrain), activando la vía Wnt/beta-catenina y frenando la esclerostina.'),
('CM-T2-HIIT', 'MUSC', 'Protocolo T2 Colbert HIIT Aeróbico & Resistencia', 'Fisiológica / Muscular', '30-40 minutos/día con sistema de arnés elástico al 70-80% del peso corporal.', 82.50, 'Mantiene la vascularización capilar muscular y previene la transición de miosina hacia fenotipos rápidos fatigables.'),
('CM-LBNP', 'CARD', 'Lower Body Negative Pressure (LBNP)', 'Presurización Pasiva', '20-30 minutos/día a -25 a -35 mmHg previo a reingreso y en superficie marciana.', 79.00, 'Simula el gradiente hidrostático terrestre, redistribuye 1000 mL de fluido hacia miembros inferiores, previene hipotensión ortostática y reduce PIC/SANS.'),
('CM-FLUID-SALT', 'CARD', 'Sobrecarga Hidrosalina Pre-Landing', 'Nutricional / Farmacológica', '1.2 L de solución isotónica (8 tabletas NaCl 1g) 2 horas previas a la deceleración / descenso.', 75.00, 'Expansión osmótica rápida del volumen intravascular, reduciendo la taquicardia refleja y síncope en la transición de 0g a 0.38g.'),
('CM-BISPHOS', 'OSEO', 'Alendronato / Ácido Zoledrónico', 'Farmacológica', 'Alendronato 70 mg vía oral semanal o Zoledronato 5 mg IV dosis única de misión.', 94.00, 'Inhibición selectiva de la farnesil pirofosfato sintasa en osteoclastos, bloqueando la resorción ósea y la hipercalciuria.'),
('CM-PROMETHA', 'VEST', 'Prometazina Intramuscular / Transdérmica', 'Farmacológica', '25-50 mg IM al iniciar maniobras críticas o síntomas de grado III en escala Graybiel.', 85.00, 'Antagonista histaminérgico H1 central con potente acción antiemética en el centro del vómito del tronco encefálico.'),
('CM-AG-CENTRIF', 'VEST', 'Centrífuga de Radio Corto (Gravedad Artificial Intermitente)', 'Aeroespacial / Gravitatoria', '15 minutos/día a 1g en pies (gradiente ~0.38g en corazón).', 91.00, 'Estimulación simultánea otolítica, vascular periférica y muscular, reentrenando la estimación interna del vector gravedad.');

-- --------------------------------------------------------------------------------------
-- 6. TABLA: Estudios_NASA_LSDA (Repositorio de Datasets Abiertos OSDR/LSDA)
-- DF: estudio_acceso_id -> archivo_lsda_ref, titulo_estudio, plataforma_mision, tipo_organismo, tejido_analizado, archivo_csv_local
-- Superclave: {estudio_acceso_id}
-- --------------------------------------------------------------------------------------
CREATE TABLE Estudios_NASA_LSDA (
    estudio_acceso_id VARCHAR(20) NOT NULL,
    archivo_lsda_ref VARCHAR(20) NOT NULL,
    titulo_estudio VARCHAR(255) NOT NULL,
    plataforma_mision VARCHAR(100) NOT NULL,
    tipo_organismo VARCHAR(100) NOT NULL,
    tejido_analizado VARCHAR(100) NOT NULL,
    archivo_csv_local VARCHAR(255) NOT NULL,
    PRIMARY KEY (estudio_acceso_id)
) ENGINE=InnoDB;

INSERT INTO Estudios_NASA_LSDA (estudio_acceso_id, archivo_lsda_ref, titulo_estudio, plataforma_mision, tipo_organismo, tejido_analizado, archivo_csv_local) VALUES
('OSD-616', 'LSDS-61', 'Influence of Sex Hormones on Musculoskeletal Health in Micro and Martian Fractional Gravity', 'Ground Analogue & ISS Centrifuge', 'Rattus norvegicus', 'Músculo Sóleo, Gastrocnemio', 'OSD-616_Force_Plate_Mars_Soleus.csv'),
('OSD-608', 'LSDS-41', 'Dose-dependent skeletal deficits due to varied reductions in mechanical loading in rats (Tibia pQCT)', 'NASA Partial Weight-Bearing Mars Model', 'Rattus norvegicus', 'Hueso Trabecular y Cortical de Tibia', 'OSD-608_pQCT_Bone_Mineral_Density.csv'),
('OSD-583', 'LSDS-16', 'Characterization of mouse ocular responses (tonometry) to 35-day spaceflight mission (RR-9)', 'ISS Mission Rodent Research 9', 'Mus musculus', 'Globo ocular, Retina, Presión intraocular', 'OSD-583_Tonometry_IOP_SANS.csv'),
('OSD-596', 'LSDS-43', 'Artificial gravity partially protects space-induced neurological deficits (Locomotion)', 'ISS Multi-use Variable-g Platform', 'Drosophila melanogaster', 'Sistema nervioso central, Locomoción', 'OSD-596_Locomotion_ArtificialGravity.csv');

-- --------------------------------------------------------------------------------------
-- 7. TABLA: Astronautas (Tripulación de Misión Marciana FAVALORO)
-- DF: astronauta_id -> nombre_completo, rol_mision, dias_en_marte, estado_general
-- Superclave: {astronauta_id}
-- --------------------------------------------------------------------------------------
CREATE TABLE Astronautas (
    astronauta_id VARCHAR(10) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol_mision VARCHAR(100) NOT NULL,
    dias_en_marte INT NOT NULL DEFAULT 0,
    estado_general ENUM('Nominal', 'Warning', 'Critical') NOT NULL DEFAULT 'Nominal',
    PRIMARY KEY (astronauta_id)
) ENGINE=InnoDB;

INSERT INTO Astronautas (astronauta_id, nombre_completo, rol_mision, dias_en_marte, estado_general) VALUES
('AST-01', 'CDR. Marcos Varela', 'Comandante de Misión', 42, 'Nominal'),
('AST-02', 'Dr. Elena Rostova', 'Oficial Médico / Neurobióloga', 42, 'Nominal'),
('AST-03', 'Ing. Kenji Sato', 'Especialista EVA / Estructuras', 42, 'Critical'),
('AST-04', 'Dra. Amara Okafor', 'Especialista de Carga Útil / Bioquímica', 42, 'Warning'),
('AST-05', 'Tte. Lucas Silva', 'Piloto de Módulo / Telecomunicaciones', 42, 'Nominal');

-- --------------------------------------------------------------------------------------
-- 8. TABLA: Telemetria_Biomedica (Monitoreo de Adaptación a 0.38g en Tiempo Real)
-- DF: (astronauta_id, timestamp_registro) -> gravedad_ambiente, bp_sistolica, bp_diastolica, gasto_cardiaco, fnirs_cerebral_pct, vor_gain, otolith_response, csa_soleo_cm2, microstrain_tibia, grf_bw, riesgo_ortostatico_pct, diagnostico_autonomo
-- Superclave: {(astronauta_id, timestamp_registro)}
-- --------------------------------------------------------------------------------------
CREATE TABLE Telemetria_Biomedica (
    astronauta_id VARCHAR(10) NOT NULL,
    timestamp_registro DATETIME NOT NULL,
    gravedad_ambiente DECIMAL(4, 2) NOT NULL,
    bp_sistolica INT NOT NULL,
    bp_diastolica INT NOT NULL,
    gasto_cardiaco DECIMAL(4, 2) NOT NULL,
    fnirs_cerebral_pct INT NOT NULL,
    vor_gain DECIMAL(4, 2) NOT NULL,
    otolith_response INT NOT NULL,
    csa_soleo_cm2 DECIMAL(4, 2) NOT NULL,
    microstrain_tibia INT NOT NULL,
    grf_bw DECIMAL(4, 2) NOT NULL,
    riesgo_ortostatico_pct INT NOT NULL,
    diagnostico_autonomo TEXT NOT NULL,
    PRIMARY KEY (astronauta_id, timestamp_registro),
    FOREIGN KEY (astronauta_id) REFERENCES Astronautas(astronauta_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (gravedad_ambiente) REFERENCES Niveles_Gravedad(gravedad_g) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Telemetria_Biomedica (astronauta_id, timestamp_registro, gravedad_ambiente, bp_sistolica, bp_diastolica, gasto_cardiaco, fnirs_cerebral_pct, vor_gain, otolith_response, csa_soleo_cm2, microstrain_tibia, grf_bw, riesgo_ortostatico_pct, diagnostico_autonomo) VALUES
('AST-01', '2026-11-14 12:00:00', 0.38, 116, 74, 5.20, 73, 0.96, 94, 28.40, 1240, 1.82, 8, 'Adaptación óptima a 0.38g. Apto para EVA sin restricciones.'),
('AST-02', '2026-11-14 12:00:00', 0.38, 112, 70, 4.90, 75, 0.98, 96, 26.80, 1180, 1.74, 10, 'Equilibrio hemodinámico estable. Reacción otolítica y VOR excelentes.'),
('AST-03', '2026-11-14 12:00:00', 0.38, 92, 54, 3.80, 59, 0.88, 85, 24.10, 920, 1.35, 34, 'ALERTA CRÍTICA: Hipotensión ortostática severa, microstrain sub-umbral (920 ue < 1000 ue). Riesgo de síncope en EVA.'),
('AST-04', '2026-11-14 12:00:00', 0.38, 120, 78, 5.00, 71, 0.91, 88, 25.50, 1040, 1.58, 18, 'Desacondicionamiento muscular leve en miembros inferiores. Reforzar protocolo ARED.'),
('AST-05', '2026-11-14 12:00:00', 0.38, 122, 80, 5.40, 74, 0.97, 95, 29.10, 1280, 1.88, 7, 'Parámetros nominales en los 4 sistemas fisiológicos a 0.38g.');

-- ======================================================================================
-- DEMOSTRACIÓN DE CONSULTAS CON ÁLGEBRA RELACIONAL APLICADA:
-- ======================================================================================

-- 1. CONSULTA: Detectar astronautas en riesgo de reabsorción ósea en Marte (microstrain < 1000)
-- Álgebra Relacional:
--   π astronauta_id, nombre_completo, microstrain_tibia ( σ microstrain_tibia < 1000 ∧ gravedad_ambiente = 0.38 (Telemetria_Biomedica ⨝ Astronautas) )
SELECT a.astronauta_id, a.nombre_completo, t.microstrain_tibia, t.csa_soleo_cm2, t.diagnostico_autonomo
FROM Telemetria_Biomedica t
JOIN Astronautas a ON t.astronauta_id = a.astronauta_id
WHERE t.gravedad_ambiente = 0.38 AND t.microstrain_tibia < 1000;

-- 2. CONSULTA: Prescribir automáticamente contramedidas según el sistema fisiológico comprometido
-- Álgebra Relacional:
--   π a.nombre_completo, c.nombre_contramedida, c.prescripcion_diaria (
--       σ t.microstrain_tibia < 1000 (Telemetria_Biomedica ⨝ Astronautas) ⨝ (Sistemas_Anatomicos ⨝ Contramedidas)
--   )
SELECT a.nombre_completo, s.nombre_sistema, c.nombre_contramedida, c.prescripcion_diaria, c.eficacia_en_marte_pct
FROM Telemetria_Biomedica t
JOIN Astronautas a ON t.astronauta_id = a.astronauta_id
JOIN Sistemas_Anatomicos s ON s.sistema_id = 'OSEO'
JOIN Contramedidas c ON c.sistema_id = s.sistema_id
WHERE t.gravedad_ambiente = 0.38 AND t.microstrain_tibia < 1000;

-- 3. CONSULTA: Comparativa Cuantitativa de Pérdida Fisiológica entre Tránsito (0g) y Superficie de Marte (0.38g)
-- Álgebra Relacional:
--   π p.nombre_metrica, p.unidad_medida, p.valor_0g, p.valor_marte_038g, (p.valor_0g - p.valor_marte_038g) AS delta_proteccion (Parametros_Cuantitativos_HRR)
SELECT 
    nombre_metrica, 
    unidad_medida, 
    valor_0g AS impacto_transito_0g, 
    valor_marte_038g AS impacto_superficie_marte_038g,
    ROUND(valor_marte_038g - valor_0g, 2) AS atenuacion_por_gravedad_parcial
FROM Parametros_Cuantitativos_HRR;
