
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include "ESP8266WiFi.h"
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

#define SEALEVELPRESSURE_HPA (1013.25)

//const char *ssid = "Domino-07F6"; 
const char *ssid = "TNGBOX1292555";     // replace with your wifi ssid and wpa2 key
//const char *pass = "18ABLDFD";
const char *pass = "81209288802948355234";
const char* server = "192.168.178.41";
WiFiClient client;

const char* RASPBERRY_PI_URL = "http://192.168.178.41:8000/esp8266_trigger";
const char* SERVER_PASSWORD = "tutorials-raspberrypi.de";


/*
 * SCL -> D1
 * SDA -> D2
 */

Adafruit_BME280 bme;

void setup() {
  unsigned long startTime = millis();
  Serial.begin(9600);

  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }

  // Wait for serial to initialize.
  while(!Serial) { }
  
  Serial.print("Connecting to ");
  Serial.print(ssid);
  WiFi.begin(ssid, pass);

  WiFi.mode(WIFI_STA);

  long del = 0;
  
  while (WiFi.status() != WL_CONNECTED){
    delay(1000);
    del++;
    Serial.print(".");
  }

  readAndWrite();

  unsigned long time = millis() - startTime;
  Serial.println("deepSleep ");
  Serial.println(time);

  unsigned long sleepTime = 40000 - time;
  Serial.println(sleepTime);

  ESP.deepSleep(sleepTime * 1000); //  sec

}


void loop() {
}

void readAndWrite() {
  float t = bme.readTemperature();
    
  Serial.print("Temperature = ");
  Serial.print(t);
  Serial.println("*C");

  Serial.print("Pressure = ");
  Serial.print(bme.readPressure() / 100.0F);
  Serial.println("hPa");

  Serial.print("Approx. Altitude = ");
  Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
  Serial.println("m");

  float h = bme.readHumidity();
  Serial.print("Humidity = ");
  Serial.print(h);
  Serial.println("%");

  Serial.println();

  const int capacity=JSON_OBJECT_SIZE(4);
  StaticJsonDocument<capacity> doc;
  
  doc["sender_id"] = "1";
  doc["password"] = SERVER_PASSWORD;
  doc["temperature"] = t;
  doc["humidity"] = h;

  // Convert the document to an object
  //JsonObject obj=doc.to<JsonObject>();

  // Declare a buffer to hold the result
  char output[128];
  // Produce a minified JSON document
  serializeJson(doc, output);
  
  Serial.println(output);
 
  HTTPClient http;    //Declare object of class HTTPClient
 
  http.begin(RASPBERRY_PI_URL);      //Specify request destination
  
  http.addHeader("Content-Type", "application/json");  //Specify content-type header

  int httpCode = http.POST(output);   //Send the request
  String payload = http.getString();                                        //Get the response payload
 
  Serial.println(httpCode);   //Print HTTP return code
  Serial.println(payload);    //Print request response payload
 
  http.end();  //Close connection

  Serial.print("wrote fields");
}
