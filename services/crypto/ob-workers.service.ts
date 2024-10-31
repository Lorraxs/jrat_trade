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
import type { IObWorkerMessage } from "./types/obWorker.type";
import type { Box } from "./types/type";

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
  }
  workers: Set<ObWorker> = new Set();
  callQueue = new Queue<{
    key: string;
    resolve: (data: {
      bu_ob_boxes: Box[];
      bu_bb_boxes: Box[];
      be_ob_boxes: Box[];
      be_bb_boxes: Box[];
    }) => void;
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
      /* this.callQueue.enqueue((data) => this.calcOb(data));
      return; */
      return new Promise<{
        bu_ob_boxes: Box[];
        bu_bb_boxes: Box[];
        be_ob_boxes: Box[];
        be_bb_boxes: Box[];
      }>((resolve) => {
        this.callQueue.enqueue({ key, resolve });
      });
    }
    return worker.start(key);
  }

  onWorkerDone(worker: ObWorker) {
    const data = this.callQueue.dequeue();
    if (data) {
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
  }
  worker: Worker;
  working = false;

  async start(key: string) {
    this.working = true;
    this.print.info("Start working");
    this.worker.postMessage({ event: "start", data: key });
    return new Promise<{
      bu_ob_boxes: Box[];
      bu_bb_boxes: Box[];
      be_ob_boxes: Box[];
      be_bb_boxes: Box[];
    }>((resolve) => {
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
}
