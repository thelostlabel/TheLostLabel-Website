import { createReadStream } from "fs";

export function createFileWebStream(filePath, signal) {
  const nodeStream = createReadStream(filePath);
  let settled = false;

  const detachAbortListener = () => {
    if (signal && typeof signal.removeEventListener === "function") {
      signal.removeEventListener("abort", handleAbort);
    }
  };

  const settle = () => {
    if (settled) return true;
    settled = true;
    detachAbortListener();
    return false;
  };

  function handleAbort() {
    nodeStream.destroy();
  }

  if (signal?.aborted) {
    nodeStream.destroy();
  } else if (signal && typeof signal.addEventListener === "function") {
    signal.addEventListener("abort", handleAbort, { once: true });
  }

  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        if (settled) return;

        try {
          controller.enqueue(new Uint8Array(chunk));
        } catch {
          settle();
          nodeStream.destroy();
        }
      });

      nodeStream.on("end", () => {
        if (settle()) return;

        try {
          controller.close();
        } catch {
          // Ignore double-close behavior from already-aborted requests.
        }
      });

      nodeStream.on("error", (error) => {
        if (settle()) return;

        if (signal?.aborted || error?.code === "ERR_STREAM_PREMATURE_CLOSE" || error?.code === "ABORT_ERR") {
          return;
        }

        try {
          controller.error(error);
        } catch {
          // Ignore controller state errors after the response is already closed.
        }
      });

      nodeStream.on("close", () => {
        settle();
      });
    },

    cancel() {
      settle();
      nodeStream.destroy();
    },
  });
}
