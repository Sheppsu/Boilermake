const connectBtn = document.getElementById("connect-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const saveBtn = document.getElementById("save-btn");
const connectionState = document.getElementById("connection-state");
const keypadRow = document.getElementById("keypad-row");
const touchThresholdInput = document.getElementById("touch-threshold-input");
const touchThresholdDisplay = document.getElementById("touch-threshold-display");


class Connection {
  port;
  settings;
  reader;
  writer;

  constructor(port) {
    this.port = port;
    this.settings = {
      key1: null,
      key2: null,
      key3: null,
      key4: null,
      key5: null,
      key6: null,
      threshold: null
    };

    port.addEventListener("disconnect", () => {
      console.log("disconnected");
      connectionState.innerText = "disconnected";
      this.port = null;
    });
  }

  canWrite() {
    return this.writer === undefined;
  }

  canRead() {
    return this.reader === undefined;
  }

  async open() {
    if (this.port === undefined) {
      console.log("Cannot open, port is undefined");
      return;
    }

    await this.port.open({
      baudRate: 9600
    });

    console.log("connected")
    connectionState.innerText = "connected";

    onConnectionOpened();

    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();

    this.read();
  }

  close() {
    this.closeReader();
    this.closeWriter();
    if (this.port !== undefined) {
      this.port.close();
    }

    onConnectionClosed();
  }

  async read() {
    if (this.canRead()) {
      console.log("Cannot read, reader is undefined");
      return;
    }

    try {
      const { value, done } = await this.reader.read();
      if (done) {
        console.log("reader died idk");
        this.closeReader();
        return;
      }

      this.handleDeviceOutput(value);

      setTimeout(() => this.read());
    } catch (e) {
      console.log(e)
      this.closeReader();
    }
  }

  handleDeviceOutput(value) {
    const text = new TextDecoder("utf-8").decode(value);
    console.log(text);
  }

  closeReader() {
    if (this.reader === undefined) {
      return;
    }
    this.reader.releaseLock();
    this.reader = undefined;
  }

  closeWriter() {
    if (this.writer === undefined) {
      return;
    }
    this.writer.releaseLock();
    this.writer = undefined;
  }

  async sendSettings() {
    if (!this.canWrite()) {
      return;
    }

    const data = new Uint8Array(1);
    data[0] = this.settings.key1.charCodeAt(0);
    await this.writer.write(data);
  }

  async requestSettings() {
    if (!this.canWrite()) {
      return;
    }

    const data = new Uint8Array(1);
    data[0] = 0x00;

    await this.writer.write(data);
  }

  async setKey(id, key) {
    if (!this.canWrite()) {
      return;
    }

    this.settings[`key${id}`] = key;

    const data = new Uint8Array(3);
    data[0] = 0x01;
    data[1] = id;
    data[2] = key.toLowerCase().charCodeAt(0);

    await this.writer.write(data);
  }

  async setThreshold(value) {
    if (!this.canWrite()) {
      return;
    }

    this.settings.threshold = value;

    const data = new Uint8Array(2)
    data[0] = 0x02;
    data[1] = value;

    await this.writer.write(data);
  }

  async saveSettings() {
    if (!this.canWrite()) {
      return;
    }

    const data = new Uint8Array(1);
    data[0] = 0x03;

    await this.writer.write(data);
  }
}

class KeyButton {
  clickElm;
  displayElm;
  id;
  changing;
  oldValue;

  constructor(clickElm, displayElm, id) {
    this.clickElm = clickElm;
    this.displayElm = displayElm;
    this.id = id;
    this.changing = false;
    this.oldValue = "";

    clickElm.addEventListener("click", () => {
      for (const btn of keyBtns) {
        btn.cancelChange();
      }

      this.changing = true;
      this.oldValue = this.displayElm.innerText;
      this.displayElm.innerText = "...";
    });
  }

  cancelChange() {
    this.displayElm.innerText = this.oldValue;
    this.changing = false;
  }

  onKeyPress(key) {
    if (!this.changing) {
      return;
    }

    this.oldValue = key;
    this.cancelChange();

    connection.setKey(this.id, key);
  }
}

function onConnectionOpened() {
  keypadRow.classList.remove("hidden");
  disconnectBtn.classList.remove("hidden");
}

function onConnectionClosed() {
  keypadRow.classList.add("hidden");
  disconnectBtn.classList.add("hidden");
}


var connection = null;
const keyBtns = [];

export function run() {
  console.log("running");

  // initialized KeyButton objects
  for (let i=1; i<7; i++) {
    const clickElm = document.getElementById(`key${i}-btn`);
    const displayElm = document.getElementById(`key${i}-display`);
    keyBtns.push(new KeyButton(clickElm, displayElm ?? clickElm, i));
  }

  // connecting a device event
  connectBtn.addEventListener("click", () => {
    navigator.serial
      .requestPort()
      .then((port) => {
        if (port !== null) {
          connection = new Connection(port);
          connection.open();
        }
      })
      .catch((e) => {
        console.log(e);
      });
  });

  // disconnecting a device event
  disconnectBtn.addEventListener("click", () => {
    if (connection !== null) {
      connection.close();
      connection = null;
    }
  });

  // clicking a key button
  document.addEventListener("keydown", (e) => {
    for (const keyBtn of keyBtns) {
      keyBtn.onKeyPress(e.key);
    }
  });

  // handle inputs to threshold slider
  touchThresholdInput.addEventListener("input", (e) => {
    touchThresholdDisplay.innerText = touchThresholdInput.value;
  });
  touchThresholdInput.addEventListener("change", () => {
    connection.setThreshold(touchThresholdInput.value);
  });

  // clicking the save button
  saveBtn.addEventListener("click", (e) => {
    if (saveBtn.innerText !== "Save") {
      return;
    }

    saveBtn.innerText = "Saving...";
    connection.saveSettings().then(() => {
      saveBtn.innerText = "Saved!";
      setTimeout(() => {
        saveBtn.innerText = "Save";
      }, 3000);
    }).catch((e) => {
      console.log(e);
      saveBtn.innerText = "Error...";
      setTimeout(() => {
        saveBtn.innerText = "Save";
      }, 3000);
    });
  });
}