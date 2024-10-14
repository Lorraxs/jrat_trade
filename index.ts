import "reflect-metadata";
import { startApp } from "./utils/createApp";
import { registerLogService } from "./services/log/logService";
import { ConsoleLogProvider } from "./services/log/providers/consoleLogProvider";

startApp({
  defineServices: (container) => {
    registerLogService(container, [ConsoleLogProvider]);
  },
  beforeStart: (contailer) => {},
  start: async () => {
    console.log("App started");
  },
});
