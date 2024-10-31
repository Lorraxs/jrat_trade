import type { IStreamWorkerMessage } from "../services/crypto/types/streamWorker.type";
import type { IWorkerMessage } from "../types/worker.type";
import { Logger } from "./logger";

export class WorkerController extends Logger {
  constructor(readonly name: string, readonly path: string) {
    super();
    this.print.info(`path: ${path}`);
    this.worker = new Worker(path);
    this.worker.onmessage = (
      e: MessageEvent<IStreamWorkerMessage | IWorkerMessage>
    ) => {
      console.log(e.data);
      if (typeof e.data === "string") {
        return;
      }
      if ("event" in e.data) {
        const handlers = this.onMessageHandlers.get(e.data.event);
        if (handlers) {
          for (const handler of handlers) {
            handler(e.data);
          }
        }
      }
    };
    this.worker.postMessage("Hello from WorkerController");
    this.print.info(`Worker created`);
  }
  worker: Worker;
  onMessageHandlers: Map<string, Set<(data: any) => void>> = new Map();

  onmessage(eventName: string, handler: (data: any) => void) {
    if (!this.onMessageHandlers.has(eventName)) {
      this.onMessageHandlers.set(eventName, new Set());
    }
    this.onMessageHandlers.get(eventName)?.add(handler);
    return {
      remove: () => {
        this.onMessageHandlers.get(eventName)?.delete(handler);
      },
    };
  }

  postMessage(data: IStreamWorkerMessage | IWorkerMessage) {
    this.worker.postMessage(data);
  }

  callback(eventName: string, params: any, handler: (data: any) => void) {
    const id = crypto.randomUUID();
    this.postMessage({
      event: "callback",
      id,
      data: {
        eventName: eventName,
        params: params,
      },
    });
  }
}

export interface RWorker {
  onMessageHandlers: Map<string, Set<(data: any) => void>>;
  eventHandlers: Map<string, Set<(data: any) => void>>;
  postMessage: (data: IStreamWorkerMessage | IWorkerMessage) => void;
  onmessage: (
    eventName: string,
    handler: (data: any) => void
  ) => { remove: () => void };
}
