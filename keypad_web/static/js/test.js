const connectButton = document.getElementById("connect-button");
const disconnectButton = document.getElementById("disconnect-button");
const connectionState = document.getElementById("connection-state");
const key1Btn = document.getElementById("key1-button");

// async function readLoop(port) {
//   let state = false;
//   let counter = 0;
//
//   while (port.readable) {
//     const reader = port.readable.getReader();
//     try {
//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) {
//           console.log("reader is done")
//           break;
//         }
//
//         const press1State = parseInt(new TextDecoder("utf-8").decode(value).split(",")[0]);
//         if (press1State == 10 && state) {
//           state = false;
//         } else if (press1State > 10 && !state) {
//           state = true;
//           counter++;
//           pressCount.innerText = counter;
//         }
//       }
//     } catch (error) {
//       // Handle |error|...
//     } finally {
//       reader.releaseLock();
//     }
//   }
// }
//
// async function doWrite(port, writer) {
//   if (!port.writable) {
//     console.log("No longer writable");
//     return;
//   }
//
//   writer.write(new TextEncoder().encode("test"));
//
//   setTimeout(doWrite, 1000, port, writer);
// }
//
// async function writeLoop(port) {
//   const writer = port.writable.getWriter();
//   setTimeout(doWrite, 1000, port, writer);
// }

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

class Connection {
  port;
  settings;
  reader;
  writer;

  constructor(port) {
    this.port = port;
    this.settings = {
      key1: null,
    };

    port.addEventListener("disconnect", () => {
      console.log("disconnected");
      connectionState.innerText = "disconnected";
      this.port = null;
    });
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

    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();

    this.read();
  }

  close() {
    this.closeReader();
    if (this.port !== undefined) {
      this.port.close();
    }
  }

  async read() {
    if (this.reader === undefined) {
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

  async sendSettings() {
    if (!this.port.writable) {
      console.log("Not writable");
      return;
    }

    const data = new Uint8Array(1);
    data[0] = this.settings.key1.charCodeAt(0);

    this.writer.write(data);
  }

  setKey1(character) {
    this.settings.key1 = character;
  }
}
