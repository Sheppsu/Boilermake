PicoPIO capPio0(pio0);
PicoPIO capPio1(pio1);
class CapacitiveKey {
  public:
    //PicoCapSensing* sensor;

    bool keyboardEnabled;
    int key;
    int mod;
    int thresh;
    int releaseDelay;
    int timeout;
    int numSamples;

    int sample;
    bool keyReleased = true;
    int releaseTimer = 0;

    CapacitiveKey(bool keyboardEnabled_setup, int pioUsed, int send, int sense, int key_setup, int mod_setup, int thresh_setup, int releaseDelay_setup, int timeout_setup, int numSamples_setup) {
      // if (pioUsed == 0) {
      //   PicoCapSensing sensor(capPio0, send, sense);
      // }
      // else if (pioUsed == 1) {
      //   PicoCapSensing sensor(capPio1, send, sense);
      // }

      key = key_setup;
      mod = mod_setup;
      thresh = thresh_setup;
      releaseDelay = releaseDelay_setup;
      timeout = timeout_setup;
      numSamples = numSamples_setup;
      keyboardEnabled = keyboardEnabled_setup;
    }

    virtual ~CapacitiveKey() {

    }

    void test() {
      while (true) {}
    }

    void loadConfig(int key_read, int mod_read, int thresh_read) {
      key = key_read;
      mod = mod_read;
      thresh = thresh_read;
    }
    
    void capKeyUpdate(int yeah) {
      //sample = sensor->getCapSensingSample(timeout, numSamples);
      sample = yeah;
      if (sample > thresh) {
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