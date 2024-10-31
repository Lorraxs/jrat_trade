import type { z } from "zod";
import { Logger } from "../../../../utils/logger";
import { Binance } from "../../types/binance.type";
import type { IStreamWorkerMessage } from "../../types/streamWorker.type";
import chalk from "chalk";
import type { RWorker } from "../../../../utils/worker";
import type { IWorkerMessage } from "../../../../types/worker.type";

// prevents TS errors
declare var self: Worker;

class Stream implements Logger {
  constructor() {}
  get prefix() {
    return chalk.bgRedBright("", chalk.white(this.name), "");
  }

  print = {
    error: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.red(...args));
    },
    info: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, ...args);
    },
    success: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.green(...args));
    },
    warning: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.yellow(...args));
    },
    errorBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgRed(...args));
    },
    infoBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgBlue(...args));
    },
    successBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgGreen(chalk.black(...args)));
    },
    warningBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgYellow(chalk.black(...args)));
    },
  };
  name = "uninitialized";
  testMode = false;
  ws: WebSocket;
  connected = false;
  init(name: string, testMode: boolean) {
    this.name = name;
    this.testMode = testMode;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(
      this.testMode
        ? "wss://fstream.binancefuture.com/stream"
        : "wss://fstream.binance.com/stream"
    );
    this.ws.onopen = async () => {
      this.print.info("Connected to stream");
      this.connected = true;
      this.postMessage({
        event: "on_ws_connected",
      });
    };
    this.ws.onmessage = (e: MessageEvent<string>) => {
      try {
        this.postMessage({
          event: "on_ws_message",
          data: e.data,
        });
      } catch (error) {
        console.error(error);
      }
    };
    this.ws.onclose = async () => {
      this.postMessage({
        event: "on_ws_close",
      });
      this.print.errorBg("Stream closed");
      this.connected = false;
      this.print.warning("Reconnecting...");
      setTimeout(() => {
        this.connect();
      }, 1000);
    };
    this.ws.onerror = (e) => {
      this.postMessage({
        event: "on_ws_error",
        error: e,
      });
      this.print.error("Stream error", e);
      this.ws.close();
    };
  }

  postMessage(data: IStreamWorkerMessage) {
    postMessage(data);
  }

  send(data: any) {
    this.ws.send(data);
  }
}

const stream = new Stream();

self.onmessage = (e: MessageEvent<IStreamWorkerMessage>) => {
  switch (e.data.event) {
    case "init":
      stream.init(e.data.data.name, e.data.data.testMode);
      break;
    case "send":
      stream.send(e.data.data);
      break;
    default:
      break;
  }
};
