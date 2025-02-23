void glhf() {
  Keyboard.press('g');
  Keyboard.press('l');
  Keyboard.press('h');
  Keyboard.press('f');
  Keyboard.press(KEY_RETURN);
  Keyboard.release('g');
  Keyboard.release('l');
  Keyboard.release('h');
  Keyboard.release('f');
  Keyboard.release(KEY_RETURN);
}

void bruh(int doIPressOrRelease, int whatToPress) {
  if (doIPressOrRelease) {
    if (whatToPress == GLHF) {
      glhf();
    }
    else {
      Keyboard.press(whatToPress);
    }
  }
  else {
    Keyboard.release(whatToPress);
  }
}

void modifier(int mod, int doIPressOrRelease) {
  if ((mod & 0b100) == 0b100) {
    bruh(doIPressOrRelease, KEY_LEFT_SHIFT);
  }
  if ((mod & 0b010) == 0b010) {
    bruh(doIPressOrRelease, KEY_LEFT_CTRL);
  }
  if ((mod & 0b001) == 0b001) {
    bruh(doIPressOrRelease, KEY_LEFT_ALT);
  }
}

void squeak(int doIPressOrRelease, int whatToPress) {
  if (doIPressOrRelease) {
    if (whatToPress == GLHF) {
      glhf();
    }
    else {
      Mouse.press(whatToPress);
    }
  }
  else {
    Mouse.release(whatToPress);
  }
}