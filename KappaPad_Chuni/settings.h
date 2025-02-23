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

int targetToCode(String target) {
  if (target == "left") {return 0;}
  else if (target == "right") {return 1;}
  else if (target == "k1") {return 2;}
  else if (target == "k2") {return 3;}
  else if (target == "k3") {return 4;}
  else if (target == "k4") {return 5;}
  return 6;
}

void settingsMode() {
  String command = "";
  String target = "";
  int targetCode = 0;
  int stillSetting = 1;
  while (stillSetting) {
    while(!Serial.available()){}
    //commands should be formatted as <command>.<target>.<value> where value is an ascii character
    //<command> can be any of the Strings in the if(command == "<String>") blocks below
    //<target> must be which keypad key is being changed (left, right, k1, k2, k3, k4) for both the 'key' and 'mod' commands
    //<value> is specified in it's command's if() block, not needed for save or exit
    command = Serial.readStringUntil('.');
    target = Serial.readStringUntil('.');
    if (command == "key") {
      //only expects liteally just the letter or number the button is being set to because I'm tired right now
      //0x04 - 0x27 are letters and then numbers, can be sent and read as single char
      //probably also works all the rest of the normal 
      EEPROM.write(targetToCode(target), Serial.read());
    }
    else if (command == "fkey") {
      //function keys 0xc2 - 0xfb (194-251) for F1-F24
      //expects input of the entire number as a base 10 integer
      EEPROM.write(targetToCode(target), Serial.parseInt(SKIP_ALL));
    }
    else if (command == "mod") {
      //expects values from 0 to 7 corresponding to three bits 0bABC
      //the A bit controls the shift key
      //the B bit controls the ctrl key
      //the C bit controls the alt key
      EEPROM.write(targetToCode(target) + 7, Serial.parseInt(SKIP_ALL));
    }
    else if (command == "thresh") {
      //give it an integer 0 to 255
      EEPROM.write(6, Serial.parseInt(SKIP_ALL));
    }
    else if (command == "save") {
      //<target> should probably not be blank, I suggest the String "settings"
      EEPROM.commit();
      delay(1000);
    }
    else if (command == "exit") {
      //same comment as save command
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
      emptySerial();
      Serial.flush();
      doWeNeedToRead = 1;
    }
  }
}