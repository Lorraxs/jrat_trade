export type IStreamWorkerMessage =
  | {
      event: "init";
      data: {
        name: string;
        testMode: boolean;
      };
    }
  | {
      event: "send";
      data: any;
    }
  | {
      event: "on_ws_connected";
    }
  | {
      event: "on_ws_message";
      data: string;
    }
  | {
      event: "on_ws_close";
    }
  | {
      event: "on_ws_error";
      error: Event;
    };
