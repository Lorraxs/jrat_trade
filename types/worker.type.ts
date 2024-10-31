export type IWorkerMessage<T = any> =
  | {
      event: "callback";
      id: string;
      data: T;
    }
  | {
      event: "callback:fromWorker";
      id: string;
    };
