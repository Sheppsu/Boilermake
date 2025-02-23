#define ENABLE 1
#define SERIAL_OUTPUT

#define THRESH 5
#define TIMEOUT 20
#define NUM_SAMPLES 50
#define KEYB_ENABLE 1
#define RELEASE_TIMER 10
#define SMOOTHING 10

  //send pin has the resistor between it and the touchpad, sense pin is directly connected to the touchpad
#define SEND_Z 8
#define SENSE_Z 6
#define SEND_X 17
#define SENSE_X 16

#define SEND_NORMAL 15
#define SENSE_C 12
#define SENSE_ESC 11
#define SENSE_RANDOM 13
#define SENSE_REWIND 14
//#define SENSE_GLHF 13
#define GLHF 72727
//#define SENSE_ENTER 12

int doWeNeedToRead = 1;

#include "PicoCapSensing.h"
#include <Adafruit_TinyUSB.h>
#include "TinyUSB_Mouse_and_Keyboard.h"
#include "keyFunctions.h"
#include "CapacitiveKey.h"
#include "NormalKey.h"
#include "MouseKey.h"
#include <EEPROM.h>

// ╔════════╦════════╦════════╦════════╗
// ║  rew   ║  rand  ║    c   ║   esc  ║
// ╚════════╩════════╩════════╩════════╝

// these are the default values of config stored in EEPROM
//vars are in this order from EEPROM addr 0 to 12
int left = 'z';
int right = 'x';
int k1 = KEY_ESC;
int k2 = 'c';
int k3 = KEY_F2;
int k4 = KEY_F2;

int threshold = THRESH;

int modL = 0b000;
int modR = 0b000;
int mod1 = 0b000;
int mod2 = 0b000;
int mod3 = 0b000;
int mod4 = 0b100;

void setup() {
  Serial.begin(9600);
  EEPROM.begin(16);
  pinMode(SEND_NORMAL, OUTPUT);
  digitalWrite(SEND_NORMAL, LOW);
  Keyboard.begin();
  Mouse.begin();

}

CapacitiveKey keyLeft(ENABLE, 0, SEND_Z, SENSE_Z, left, modL, THRESH, RELEASE_TIMER, TIMEOUT, NUM_SAMPLES);
CapacitiveKey keyRight(ENABLE, 0, SEND_X, SENSE_X, right, modR, THRESH, RELEASE_TIMER, TIMEOUT, NUM_SAMPLES);

PicoCapSensing sensorLeft(capPio0, SEND_Z, SENSE_Z);
PicoCapSensing sensorRight(capPio0, SEND_X, SENSE_X);

NormalKey key1(ENABLE, SENSE_ESC, k1, mod1, RELEASE_TIMER);
NormalKey key2(ENABLE, SENSE_C, k2, mod2, RELEASE_TIMER);
NormalKey key3(ENABLE, SENSE_RANDOM, k3, mod3, RELEASE_TIMER);
NormalKey key4(ENABLE, SENSE_REWIND, k4, mod4, RELEASE_TIMER);

#include "settings.h"

void loop() {
  if(doWeNeedToRead) {
    readConfig();
  }

  keyLeft.capKeyUpdate(sensorLeft.getCapSensingSample(TIMEOUT, NUM_SAMPLES));
  keyRight.capKeyUpdate(sensorRight.getCapSensingSample(TIMEOUT, NUM_SAMPLES));

  key1.keyUpdate();
  key2.keyUpdate();
  key3.keyUpdate();
  key4.keyUpdate();

  //Serial.print("\n");
  //Serial.print(" L: ");
  //Serial.print(keyLeft.sample);
  //Serial.print(" R: ");
  //Serial.print(keyRight.sample);
  //Serial.print(" 1: ");
  //Serial.print(key1.sample);
  //Serial.print(" 2: ");
  //Serial.print(key2.sample);
  //Serial.print(" 3: ");
  //Serial.print(key3.sample);
  //Serial.print(" 4: ");
  //Serial.print(key4.sample);
  
  doWeChangeSettings();
}

