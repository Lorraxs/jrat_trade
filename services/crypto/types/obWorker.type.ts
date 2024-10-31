import type { IOrderBlock } from "./luxAlgo.type";
import type { Box } from "./type";

export type IObWorkerMessage =
  | {
      event: "start";
      data: string;
    }
  | {
      event: "done";
      data: IOrderBlock[];
    };
