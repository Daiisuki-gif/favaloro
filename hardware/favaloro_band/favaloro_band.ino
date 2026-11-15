/*
  FAVALORO · brazalete prototipo (ESP32)
  ---------------------------------------------------------------
  Mide pulso y oxígeno en sangre (MAX30102) y temperatura de la piel
  (MLX90614), y los transmite por Bluetooth Low Energy con los servicios
  ESTÁNDAR de salud. Por eso la web de FAVALORO lo reconoce sola con
  «Conectar brazalete real (Bluetooth)», sin programar nada en la web:

    Heart Rate          0x180D  → característica 0x2A37 (pulso, lpm)
    Pulse Oximeter      0x1822  → característica 0x2A5F (SpO2 %, pulso)
    Health Thermometer  0x1809  → característica 0x2A1C (temperatura °C)

  PROTOTIPO EDUCATIVO: no es un dispositivo médico.

  Bibliotecas (Arduino IDE → Herramientas → Administrar bibliotecas):
    - "SparkFun MAX3010x Pulse and Proximity Sensor Library" (SparkFun)
    - "Adafruit MLX90614 Library" (Adafruit)
  Placa: "ESP32 Dev Module" (paquete esp32 de Espressif, ya trae BLE).

  Para probar SIN sensores: dejá SIMULAR en 1. El ESP32 manda valores
  de ejemplo y podés comprobar la conexión con la web enseguida.
*/

#define SIMULAR 1          // 1 = valores de prueba sin sensores · 0 = sensores reales
#define USAR_TEMPERATURA 1 // 0 si todavía no conectaste el MLX90614

#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

#if !SIMULAR
  #include "MAX30105.h"        // SparkFun: sirve para MAX30102
  #include "spo2_algorithm.h"  // algoritmo de Maxim para SpO2 y pulso
  #if USAR_TEMPERATURA
    #include <Adafruit_MLX90614.h>
  #endif
#endif

/* ---------------- Bluetooth ---------------- */
BLECharacteristic *chPulso, *chOximetro, *chTemp;
bool conectado = false;

class Conexion : public BLEServerCallbacks {
  void onConnect(BLEServer *s) override { conectado = true; }
  void onDisconnect(BLEServer *s) override {
    conectado = false;
    BLEDevice::startAdvertising();  // vuelve a estar visible para reconectar
  }
};

// SFLOAT de 16 bits (IEEE-11073) con exponente 0: alcanza para valores enteros.
uint16_t sfloat(int valor) { return (uint16_t)(valor & 0x0FFF); }

// FLOAT de 32 bits (IEEE-11073): mantisa de 24 bits y exponente -2 (centésimas).
uint32_t float32(float valor) {
  int32_t mantisa = (int32_t)lroundf(valor * 100.0f);
  return ((uint32_t)0xFE << 24) | ((uint32_t)mantisa & 0x00FFFFFF);
}

void enviarPulso(int lpm) {
  uint8_t d[2] = {0x00, (uint8_t)constrain(lpm, 0, 255)};  // flags: pulso en 8 bits
  chPulso->setValue(d, 2);
  chPulso->notify();
}

void enviarOximetro(int spo2, int lpm) {
  uint16_t s = sfloat(spo2), p = sfloat(lpm);
  uint8_t d[5] = {0x00, (uint8_t)(s & 0xFF), (uint8_t)(s >> 8), (uint8_t)(p & 0xFF), (uint8_t)(p >> 8)};
  chOximetro->setValue(d, 5);
  chOximetro->notify();
}

void enviarTemperatura(float c) {
  uint32_t t = float32(c);
  uint8_t d[5] = {0x00, (uint8_t)(t & 0xFF), (uint8_t)(t >> 8), (uint8_t)(t >> 16), (uint8_t)(t >> 24)};  // flags: Celsius
  chTemp->setValue(d, 5);
  chTemp->indicate();
}

BLECharacteristic *crearServicio(BLEServer *srv, uint16_t servicio, uint16_t caracteristica, uint32_t propiedad) {
  BLEService *s = srv->createService(BLEUUID(servicio));
  BLECharacteristic *c = s->createCharacteristic(BLEUUID(caracteristica), propiedad);
  c->addDescriptor(new BLE2902());  // permite que la web active las notificaciones
  s->start();
  return c;
}

void iniciarBluetooth() {
  BLEDevice::init("FAVALORO-Band");
  BLEServer *srv = BLEDevice::createServer();
  srv->setCallbacks(new Conexion());
  chPulso    = crearServicio(srv, 0x180D, 0x2A37, BLECharacteristic::PROPERTY_NOTIFY);
  chOximetro = crearServicio(srv, 0x1822, 0x2A5F, BLECharacteristic::PROPERTY_NOTIFY);
  chTemp     = crearServicio(srv, 0x1809, 0x2A1C, BLECharacteristic::PROPERTY_INDICATE);
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(BLEUUID((uint16_t)0x180D));
  adv->addServiceUUID(BLEUUID((uint16_t)0x1822));
  adv->addServiceUUID(BLEUUID((uint16_t)0x1809));
  adv->setScanResponse(true);  // el nombre va en la respuesta de escaneo
  BLEDevice::startAdvertising();
  Serial.println("Bluetooth listo: buscá FAVALORO-Band desde la web.");
}

/* ---------------- Sensores ---------------- */
#if !SIMULAR
MAX30105 sensor;
  #if USAR_TEMPERATURA
Adafruit_MLX90614 termometro;
  #endif
const int MUESTRAS = 100;  // 4 s a 25 muestras por segundo
uint32_t ir[MUESTRAS], rojo[MUESTRAS];
#endif

void iniciarSensores() {
#if SIMULAR
  Serial.println("Modo SIMULAR: se envían valores de prueba.");
#else
  Wire.begin(21, 22);  // SDA = GPIO21, SCL = GPIO22
  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("No encuentro el MAX30102: revisá las conexiones.");
    while (true) delay(1000);
  }
  // brillo LED, promedio, modo (2 = rojo + infrarrojo), muestras/s, ancho de pulso, rango ADC
  sensor.setup(60, 4, 2, 100, 411, 4096);
  #if USAR_TEMPERATURA
  if (!termometro.begin()) Serial.println("No encuentro el MLX90614: sigo sin temperatura.");
  #endif
#endif
}

/* ---------------- Ciclo principal ---------------- */
void setup() {
  Serial.begin(115200);
  iniciarSensores();
  iniciarBluetooth();
}

void loop() {
  int lpm = 0, spo2 = 0;
  float temp = 0;
  bool valido = false;

#if SIMULAR
  // Valores de prueba que varían un poco, como un astronauta en reposo.
  lpm = 70 + random(-4, 5);
  spo2 = 97 + random(0, 2);
  temp = 36.6f + random(-2, 3) / 10.0f;
  valido = true;
  delay(1000);
#else
  // Junta 4 segundos de lecturas y calcula pulso y oxígeno con el algoritmo de Maxim.
  for (int i = 0; i < MUESTRAS; i++) {
    while (!sensor.available()) sensor.check();
    rojo[i] = sensor.getRed();
    ir[i] = sensor.getIR();
    sensor.nextSample();
  }
  int32_t s, hr;
  int8_t sOk, hrOk;
  maxim_heart_rate_and_oxygen_saturation(ir, MUESTRAS, rojo, &s, &sOk, &hr, &hrOk);
  bool dedoPuesto = ir[MUESTRAS - 1] > 50000;  // sin dedo, el infrarrojo es muy bajo
  valido = dedoPuesto && hrOk && sOk && hr > 30 && hr < 220 && s > 70 && s <= 100;
  lpm = hr;
  spo2 = s;
  #if USAR_TEMPERATURA
  temp = termometro.readObjectTempC();
  #endif
#endif

  if (valido) {
    Serial.printf("Pulso %d lpm · SpO2 %d %% · Temp %.1f °C · %s\n", lpm, spo2, temp, conectado ? "enviando" : "esperando conexión");
    if (conectado) {
      enviarPulso(lpm);
      enviarOximetro(spo2, lpm);
      if (temp > 25 && temp < 45) enviarTemperatura(temp);
    }
  } else {
    Serial.println("Lectura no válida: apoyá bien el dedo sobre el sensor, sin moverte.");
  }
}
