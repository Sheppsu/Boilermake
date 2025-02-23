const connectBtn = document.getElementById("connect-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const saveBtn = document.getElementById("save-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");
const connectionState = document.getElementById("connection-state");
const keypadRow = document.getElementById("keypad-row");
const touchThresholdInput = document.getElementById("touch-threshold-input");
const touchThresholdDisplay = document.getElementById("touch-threshold-display");
const importExportContainer = document.getElementById("import-export-container");


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
    data[2] = convertToKeyCode(key.toLowerCase());

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

  async replaceSettings(settings) {
    this.settings = settings;
    for (const [k, v] of Object.entries(this.settings)) {
      if (key.startsWith("key")) {
        const id = parseInt(k.substring(k.length-1));
        await this.setKey(id, v);
      } else {
        break;
      }
    }

    await this.setThreshold(this.settings.threshold);
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

function exportSettings(settings) {
  const data = new Uint8Array(7);
  data[0] = settings.key1;
  data[1] = settings.key2;
  data[2] = settings.key3;
  data[3] = settings.key4;
  data[4] = settings.key5;
  data[5] = settings.key6;
  data[6] = settings.threshold;
  return Object.values(data).map((num) => num.toString(16).padStart(2, "0")).join("");
}

function importSettings(settingsString) {
  const data = new Uint8Array(7);
  for (let i=0; i<data.length; i++) {
    data[i] = parseInt(settingsString.substring(i*2, i*2+2), 16);
  }
  return {
    key1: data[0],
    key2: data[1],
    key3: data[2],
    key4: data[3],
    key5: data[4],
    key6: data[5],
    threshold: data[6]
  }
}

function convertToKeyCode(key) {
  return 0;
}

function onConnectionOpened() {
  keypadRow.classList.remove("hidden");
  disconnectBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  touchThresholdInput.classList.remove("hidden");
  touchThresholdDisplay.classList.remove("hidden");
  importExportContainer.classList.remove("hidden");
}

function onConnectionClosed() {
  keypadRow.classList.add("hidden");
  disconnectBtn.classList.add("hidden");
  saveBtn.classList.add("hidden");
  touchThresholdInput.classList.add("hidden");
  touchThresholdDisplay.classList.add("hidden");
  importExportContainer.classList.add("hidden");
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
    connectBtn.innerText = "Connecting...";
    connectBtn.classList.add("disabled");
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
        connectBtn.innerText = "Connect a device";
        connectBtn.classList.remove("disabled");
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
    if (saveBtn.innerText !== "Save" || connection === null) {
      return;
    }

    saveBtn.innerText = "Saving...";
    saveBtn.classList.add("disabled");
    connection.saveSettings().then(() => {
      saveBtn.innerText = "Saved!";
      setTimeout(() => {
        saveBtn.innerText = "Save";
        saveBtn.classList.remove("disabled");
      }, 3000);
    }).catch((e) => {
      console.log(e);
      saveBtn.innerText = "Error...";
      setTimeout(() => {
        saveBtn.innerText = "Save";
        saveBtn.classList.remove("disabled");
      }, 3000);
    });
  });

  // handle export button clicks
  exportBtn.addEventListener("click", (e) => {
    if (exportBtn.innerText !== "Export" || connection === null) {
      return;
    }

    exportBtn.innerText = "Exporting...";

    navigator.clipboard.writeText(exportSettings(connection.settings)).then(() => {
      exportBtn.innerText = "Copied to clipboard";
      setTimeout(() => {
        exportBtn.innerText = "Export";
      }, 3000);
    }).catch((e) => {
      console.log(e);
      exportBtn.innerText = "Error copying to clipboard...";
      setTimeout(() => {
        exportBtn.innerText = "Export";
      });
    });
  });

  // handle importing button clicks
  importBtn.addEventListener("click", (e) => {
    if (importBtn.innerText !== "Import" || connection === null) {
      return;
    }

    importBtn.innerText = "Importing...";
    const settings = importSettings(importInput.value);
    connection.replaceSettings(settings).then(() => {
      importBtn.innerText = "Imported!";
      setTimeout(() => {
        importBtn.innerText = "Import";
      }, 3000);
    }).catch((e) => {
      console.log(e);
      importBtn.innerText = "Error";
      setTimeout(() => {
        importBtn.innerText = "Import";
      });
    });
  });
}