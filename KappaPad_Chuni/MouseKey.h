class MouseKey {
  public:
    bool keyboardEnabled;
    int key;
    bool shift;
    int releaseDelay;
    int sample;
    int pin;
    bool keyReleased = true;
    int releaseTimer = 0;

    MouseKey(bool keyboardEnabled_setup, int sense, int key_setup, bool shift_setup, int releaseDelay_setup) {
      key = key_setup;
      shift = shift_setup;
      releaseDelay = releaseDelay_setup;
      pin = sense;
      keyboardEnabled = keyboardEnabled_setup;
      pinMode(sense, INPUT_PULLUP);
    }

    virtual ~MouseKey() {

    }
    
    void keyUpdate() {
      sample = digitalRead(pin);

      if (sample < 1) {
        if (keyReleased) {
          if (keyboardEnabled) {
            if (shift) {
              Keyboard.press(KEY_LEFT_SHIFT);
            }
            squeak(1, key);
          }
          keyReleased = false;
        }
        releaseTimer = releaseDelay;
      }
      else if (!keyReleased) {
        if (releaseTimer == 0) {
          if (keyboardEnabled) {
            squeak(0, key);
            if (shift) {
              Keyboard.release(KEY_LEFT_SHIFT);
            }
          }
          keyReleased = true;
        }
        else {
          releaseTimer--;
        }
      }
    }
};