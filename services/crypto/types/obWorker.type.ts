import type { Box } from "./type";

export type IObWorkerMessage =
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
