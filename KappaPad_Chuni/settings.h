void readConfig() {
  keyLeft.loadConfig(EEPROM.read(0), EEPROM.read(7), EEPROM.read(6));
  keyRight.loadConfig(EEPROM.read(1),EEPROM.read(8),EEPROM.read(6));
  key1.loadConfig(EEPROM.read(2),EEPROM.read(9));
  key2.loadConfig(EEPROM.read(3),EEPROM.read(10));
  key3.loadConfig(EEPROM.read(4),EEPROM.read(11));
  key4.loadConfig(EEPROM.read(5),EEPROM.read(12));
  doWeNeedToRead = 0;
}

void sendConfig() {
  int addr = 0;
  while(addr < 12) {
    Serial.print(EEPROM.read(addr));
    //Serial.print("f");
    Serial.print(',');
    addr++;
  }
  Serial.print(EEPROM.read(12));
}

void emptySerial() {
  int bytesLeft = Serial.available();
  while (bytesLeft > 0) {
    Serial.read();
    bytesLeft--;
  }
}

int targetToCode(string target) {
  if (target == "left") {return 0}
  else if (target == "right") {return 1}
  else if (target == "k1") {return 2}
  else if (target == "k2") {return 3}
  else if (target == "k3") {return 4}
  else if (target == "k4") {return 5}
}

void settingsMode() {
  string command = "";
  string target = "";
  int targetCode = 0;
  int stillSetting = 1;
  while (stillSetting) {
    while(!Serial.available()){}
    command = Serial.readStringUntil('.');
    target = Serial.readStringUntil('.');
    if (command == "key") {
      //only expects a single byte because I'm tired right now
      //0x04 - 0x27 are letters and then numbers, can be sent and read as single char
      //only implementing function keys 0xc2 - 0xfb for F1-F24
      EEPROM.write(targetToCode(target), Serial.read());
    }
    else if (command == "mod") {
      EEPROM.write(targetToCode(target) + 7, Serial.read());
    }
    else if (command == "thresh") {
      EEPROM.write(6, Serial.read());
    }
    else if (command == "save") {
      EEPROM.commit();
      delay(1000);
    }
    else if (command == "exit") {
      Serial.print("see you next time");
      Serial.flush();
      stillSetting = 0;
    }
    else {
      emptySerial();
    }
  }
}

void doWeChangeSettings() {
  if (Serial.available()) {
    String start = Serial.readString();
    start.trim();
    if (start == "change settings") {
      sendConfig();
      Serial.flush();
      settingsMode();
    }
  }
}