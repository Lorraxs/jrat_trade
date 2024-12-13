import type { IOrderBlock } from "./luxAlgo.type";

class Box {
  top: number;
  bottom: number;
  left: number;
  constructor(left: number, top: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.bottom = bottom;
  }
}

export type IObWorkerMessage =
  | {
      event: "start";
      data: string;
    }
  | {
      event: "done";
      data: IOrderBlock[];
    };

export type IOldObWorkerMessage =
  | {
      event: "start";
      data: string;
    }
  | {
      event: "done";
      data: {
        bu_ob_boxes: Box[];
        bu_bb_boxes: Box[];
        be_ob_boxes: Box[];
        be_bb_boxes: Box[];
      };
    };
