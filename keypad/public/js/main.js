const connectBtn = document.getElementById("connect-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const saveBtn = document.getElementById("save-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");
const keypadRow = document.getElementById("keypad-row");
const touchThresholdInput = document.getElementById("touch-threshold-input");
const touchThresholdDisplay = document.getElementById("touch-threshold-display");
const importExportContainer = document.getElementById("import-export-container");
const thresholdContainer = document.getElementById("threshold-container");


const TARGET_NAMES = ["k1", "k2", "k3", "k4", "left", "right"];

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
      this.port = null;
    });
  }

  canWrite() {
    return this.writer !== undefined;
  }

  canRead() {
    return this.reader !== undefined;
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

    onConnectionOpened();

    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();

    await this.exitSettingsMode();  // in case it's still in settings change mode
    await this.writer.write(new TextEncoder().encode("change settings."));
    // exit.settings.change settings.

    this.read();
  }

  close() {
    console.log("closing");
    this.closeReader();
    this.closeWriter();
    if (this.port !== undefined) {
      this.port.close();
    }

    onConnectionClosed();
  }

  async read() {
    if (!this.canRead()) {
      console.log("Cannot read, reader is undefined");
      return;
    }

    let text = null;
    while (text === null || (text !== "" && text.split(",").length < 13)) {
      console.log(text);
      try {
        const { value, done } = await this.reader.read();
        console.log(value);
        if (done) {
          console.log("reader died idk");
          this.closeReader();
          return;
        }

        if (text === null) {
          text = "";
        }

        text += new TextDecoder().decode(value);
      } catch (e) {
        console.log(e)
        this.closeReader();
        return;
      }
    }

    console.log(text);

    if (text !== "") {
      this.handleDeviceOutput(text);
    }

    setTimeout(() => this.read());
  }

  handleDeviceOutput(text) {
    console.log(text);
    const values = text.split(",");
    console.log(values);
    this.settings.key5 = convertCodeToString(parseInt(values[0]), parseInt(values[7]));
    this.settings.key6 = convertCodeToString(parseInt(values[1]), parseInt(values[8]));
    this.settings.key1 = convertCodeToString(parseInt(values[2]), parseInt(values[9]));
    this.settings.key2 = convertCodeToString(parseInt(values[3]), parseInt(values[10]));
    this.settings.key3 = convertCodeToString(parseInt(values[4]), parseInt(values[11]));
    this.settings.key4 = convertCodeToString(parseInt(values[5]), parseInt(values[12]));
    this.settings.threshold = parseInt(values[6]);
    applySettings(this.settings);
    console.log(this.settings);
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

    // const data = new Uint8Array(3);
    // data[0] = 0x01;
    // data[1] = id;
    // data[2] = convertToKeyCode(key.toLowerCase());

    let data;
    const commands = convertToKeyCode(key);
    for (const [cmd, keyCode] of commands) {
      data = new TextEncoder().encode(`${cmd}.${TARGET_NAMES[id-1]}.${keyCode}`);
      await this.writer.write(data);
    }
  }

  async setThreshold(value) {
    if (!this.canWrite()) {
      return;
    }

    this.settings.threshold = value;

    // const data = new Uint8Array(2)
    // data[0] = 0x02;
    // data[1] = value;

    const data = new TextEncoder().encode("thresh.."+value.toString());
    console.log(data);

    await this.writer.write(data);
  }

  async saveSettings() {
    if (!this.canWrite()) {
      console.log("cannot write");
      return;
    }

    // const data = new Uint8Array(1);
    // data[0] = 0x03;

    const data = new TextEncoder().encode("save.settings.");

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

  async exitSettingsMode() {
    if (!this.canWrite()) {
      console.log("cannot write");
      return;
    }

    const data = new TextEncoder().encode("exit.settings.");
    this.writer.write(data);
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

  onKeyPress(e) {
    const key = e.key;
    if (!this.changing || key === "Alt" || key === "Shift" || key === "Control") {
      return;
    }

    const keys = [];
    if (e.ctrlKey) {
      keys.push("ctrl");
    }
    if (e.altKey) {
      keys.push("alt");
    }
    if (e.shiftKey) {
      keys.push("shift");
    }
    keys.push(key);

    const finalKey = keys.join(",");
    this.oldValue = finalKey;
    this.cancelChange();

    connection.setKey(this.id, finalKey);
  }

  apply(key) {
    this.displayElm.innerText = key;
    this.oldValue = key;
  }
}

function applySettings(settings) {
  for (let i=0; i<keyBtns.length; i++) {
    keyBtns[i].apply(settings[`key${keyBtns[i].id}`]);
  }
  touchThresholdInput.value = settings.threshold;
  touchThresholdDisplay.innerText = settings.threshold;

  onSettingsLoaded();
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
  key = key.toLowerCase();
  console.log(key);
  if (key.length > 1) {
    if (key.startsWith("f") && !isNaN(parseInt(key.substring(1)))) {
      return [["fkey", (parseInt(key.substring(1)) + 0xC1).toString()]];
    }

    const keys = key.split(",");
    return [
        ["mod", (keys.includes("shift") ? 1 : 0) + (keys.includes("ctrl") ? 2 : 0) + (keys.includes("alt") ? 4 : 0)],
        convertToKeyCode(keys[keys.length - 1])[0]
    ];
  } else {
    return [["key", key]];
  }
}

function convertCodeToString(code, mods) {
  const MODS = ["shift", "ctrl", "alt"];

  const keys = [];
  if (code >= 0xC2 && code <= 0xC2 + 23) {
    keys.push(`F${code - 0xC1}`);
  } else {
    keys.push(String.fromCharCode(code));
  }

  for (let i=0; i<3; i++) {
    if ((mods & (1 << i)) !== 0) {
      keys.push(MODS[i]);
    }
  }

  return keys.join(",");
}

function onConnectionOpened() {
  console.log("connection opened");
}

function onConnectionClosed() {
  keypadRow.classList.add("hidden");
  disconnectBtn.classList.add("hidden");
  saveBtn.classList.add("hidden");
  thresholdContainer.classList.add("hidden");
  importExportContainer.classList.add("hidden");
}

function onSettingsLoaded() {
  connectBtn.innerText = "Connect a device";
  connectBtn.classList.remove("disabled");
  keypadRow.classList.remove("hidden");
  disconnectBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  thresholdContainer.classList.remove("hidden");
  importExportContainer.classList.remove("hidden");
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
    if (connectBtn.innerText !== "Connect a device") {
      return;
    }

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
    if (disconnectBtn.innerText !== "Disconnect device") {
      return;
    }

    disconnectBtn.innerText = "Disconnecting...";
    if (connection !== null) {
      connection.exitSettingsMode().then(() => {
        connection.close();
        connection = null;
        disconnectBtn.innerText = "Disconnect device";
      });
    }
  });

  // clicking a key button
  document.addEventListener("keydown", (e) => {
    for (const keyBtn of keyBtns) {
      keyBtn.onKeyPress(e);
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