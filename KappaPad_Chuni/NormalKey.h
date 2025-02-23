class NormalKey {
  public:
    bool keyboardEnabled;
    int key;
    int mod;
    int releaseDelay;
    int sample;
    int pin;
    bool keyReleased = true;
    int releaseTimer = 0;

    NormalKey(bool keyboardEnabled_setup, int sense, int key_setup, int mod_setup, int releaseDelay_setup) {
      key = key_setup;
      mod = mod_setup;
      releaseDelay = releaseDelay_setup;
      pin = sense;
      keyboardEnabled = keyboardEnabled_setup;
      pinMode(sense, INPUT_PULLUP);
    }

    virtual ~NormalKey() {

    }

    void loadConfig(int key_read, int mod_read) {
      key = key_read;
      mod = mod_read;
    }
    
    void keyUpdate() {
      sample = digitalRead(pin);

      if (sample < 1) {
        if (keyReleased) {
          if (keyboardEnabled) {
            modifier(mod, 1);
            bruh(1, key);
          }
          keyReleased = false;
        }
        releaseTimer = releaseDelay;
      }
      else if (!keyReleased) {
        if (releaseTimer == 0) {
          if (keyboardEnabled) {
            bruh(0, key);
            modifier(mod, 0);
          }
          keyReleased = true;
        }
        else {
          releaseTimer--;
        }
      }
    }
};