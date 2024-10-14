import { injectable } from "inversify";
import { LogProvider } from "../logService.extensions";

@injectable()
export class ConsoleLogProvider implements LogProvider {
  log(...args: any[]) {
    console.log(...args);
  }

  error(error: any, extra: any) {
    console.error(error, extra);
  }
}
