const connectButton = document.getElementById("connect-btn");
const disconnectButton = document.getElementById("disconnect-btn");
const connectionState = document.getElementById("connection-state");
const key1Btn = document.getElementById("key1-btn");
const key2Btn = document.getElementById("key2-btn");
const key3Btn = document.getElementById("key3-btn");
const key4Btn = document.getElementById("key4-btn");
const keypadRow = document.getElementById("keypad-row");


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
      key4: null
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
  }
}


function applySettings(settings) {
  key1Btn.innerText = settings.key1 === null ? "" : settings.key1;
  key2Btn.innerText = settings.key2 === null ? "" : settings.key2;
  key3Btn.innerText = settings.key3 === null ? "" : settings.key3;
  key4Btn.innerText = settings.key4 === null ? "" : settings.key4;
}

function onConnectionOpened() {
  keypadRow.classList.remove("hidden");
  disconnectButton.classList.remove("hidden");
}

function onConnectionClosed() {
  keypadRow.classList.add("hidden");
  disconnectButton.classList.add("hidden");
}


var connection = null;

export function run() {
  console.log("running");

  connectButton.addEventListener("click", () => {
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

  disconnectButton.addEventListener("click", () => {
    if (connection !== null) {
      connection.close();
      connection = null;
    }
  });
}