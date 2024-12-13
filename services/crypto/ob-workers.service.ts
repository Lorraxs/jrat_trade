import { injectable, inject, named } from "inversify";
import {
  defineService,
  ServicesContainer,
} from "../../utils/servicesContainer";
import {
  registerAppContribution,
  AppContribution,
} from "../app/app.extensions";
import { ScopedLogger } from "../log/scopedLogger";
import { Logger } from "../../utils/logger";
import { Queue } from "../../utils/queue";
import type {
  IObWorkerMessage,
  IOldObWorkerMessage,
} from "./types/obWorker.type";
import type { Box } from "./types/type";
import type { IOrderBlock } from "./types/luxAlgo.type";

export type IObWorkersService = ObWorkersService;
export const IObWorkersService =
  defineService<IObWorkersService>("ObWorkersService");

export function registerObWorkersService(container: ServicesContainer) {
  container.registerImpl(IObWorkersService, ObWorkersService);
  registerAppContribution(container, ObWorkersService);
}

@injectable()
class ObWorkersService extends Logger implements AppContribution {
  @inject(ScopedLogger)
  @named("ObWorkersService")
  private logService: ScopedLogger;

  constructor() {
    super();
    this.name = "ObWorkersService";
  }
  workers: Set<ObWorker> = new Set();
  callQueue = new Queue<{
    key: string;
    resolve: (data: any) => void;
    type: "luxAlgo" | "oldOb";
  }>();

  async init() {
    this.logService.log("init");
    for (let i = 0; i < Number(process.env.MAX_OB_WORKER); i++) {
      const worker = new ObWorker(this, `Worker ${i}`);
      this.workers.add(worker);
    }
  }

  getFreeWorker() {
    for (const worker of this.workers) {
      if (!worker.working) {
        return worker;
      }
    }
  }

  async calcOb(key: string) {
    this.print.info("Calc OB", key);
    const worker = this.getFreeWorker();
    if (!worker) {
      return new Promise<IOrderBlock[]>((resolve) => {
        this.callQueue.enqueue({ key, resolve, type: "luxAlgo" });
      });
    }
    return worker.start(key);
  }

  async calcOldOb(key: string) {
    this.print.info("Calc Old OB", key);
    const worker = this.getFreeWorker();
    if (!worker) {
      return new Promise<{
        bu_ob_boxes: Box[];
        bu_bb_boxes: Box[];
        be_ob_boxes: Box[];
        be_bb_boxes: Box[];
      }>((resolve) => {
        this.callQueue.enqueue({ key, resolve, type: "oldOb" });
      });
    }
    return worker.startOldOb(key);
  }

  onWorkerDone(worker: ObWorker) {
    const data = this.callQueue.dequeue();
    if (data) {
      if (data.type === "oldOb") worker.startOldOb(data.key).then(data.resolve);
      else if (data.type === "luxAlgo")
        worker.start(data.key).then(data.resolve);
    }
  }
}

class ObWorker extends Logger {
  constructor(
    private readonly obWorkersService: ObWorkersService,
    readonly name: string
  ) {
    super();
    this.worker = new Worker(new URL("./luxAlgo-worker.ts", import.meta.url));
    this.oldObWorker = new Worker(
      new URL("./old-ob-worker.ts", import.meta.url)
    );
  }
  worker: Worker;
  oldObWorker: Worker;
  working = false;

  async start(key: string) {
    this.working = true;
    this.print.info("Start working");
    this.worker.postMessage({ event: "start", data: key });
    return new Promise<IOrderBlock[]>((resolve) => {
      this.worker.onmessage = (e: MessageEvent<IObWorkerMessage>) => {
        const { event, data } = e.data;
        if (event === "done") {
          this.working = false;
          this.obWorkersService.onWorkerDone(this);
          this.print.infoBg("Done", key, JSON.stringify(data));
          resolve(data);
        }
      };
    });
  }

  async startOldOb(key: string) {
    this.working = true;
    this.print.info("Start working");
    this.oldObWorker.postMessage({ event: "start", data: key });
    return new Promise<{
      bu_ob_boxes: Box[];
      bu_bb_boxes: Box[];
      be_ob_boxes: Box[];
      be_bb_boxes: Box[];
    }>((resolve) => {
      this.oldObWorker.onmessage = (e: MessageEvent<IOldObWorkerMessage>) => {
        const { event, data } = e.data;
        if (event === "done") {
          this.working = false;
          this.obWorkersService.onWorkerDone(this);
          this.print.infoBg("Done", key, JSON.stringify(data));
          resolve(data);
        }
      };
    });
  }
}
