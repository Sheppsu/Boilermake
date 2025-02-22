const button = document.getElementById("the-button");

async function test(port) {
  while (port.readable) {
    const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // |reader| has been canceled.
          break;
        }
        // Do something with |value|...
      }
    } catch (error) {
      // Handle |error|...
    } finally {
      reader.releaseLock();
    }
  }
}

export function run() {
  console.log("running");

  button.addEventListener("click", () => {
    navigator.serial
      .requestPort()
      .then((port) => {
        test(port);
      })
      .catch((e) => {
        console.log(e);
        // The user didn't select a port.
      });
  });
}