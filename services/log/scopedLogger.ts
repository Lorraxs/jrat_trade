import { inject, named } from "inversify";
import type { LogService } from "./logService";
import chalk from "chalk";
import { spacedStr } from "../../utils/utils";

export const scopedLogger =
  (name: string): ReturnType<typeof inject<ScopedLogger>> =>
  (...args) => {
    inject(ScopedLogger)(...args);
    named(name)(...args);
  };

export class ScopedLogger {
  private prefix = "";

  constructor(protected readonly logService: LogService, private name: string) {
    this.prefix = chalk.bgCyanBright(chalk.black(` ${name} `));
  }

  log<T extends any[]>(...args: T) {
    this.logService.log(this.prefix, ...args);
  }

  error<T extends Error>(error: T, extra: Record<string, any> = {}) {
    this.logService.error(error, { ...extra, loggerName: this.name });
  }

  print = {
    error: (...args: any) => {
      this.logService.log(this.prefix, chalk.red(...args));
    },
    info: (...args: any) => {
      this.logService.log(this.prefix, chalk.blue(...args));
    },
    success: (...args: any) => {
      this.logService.log(this.prefix, chalk.green(...args));
    },
    warning: (...args: any) => {
      this.logService.log(this.prefix, chalk.yellow(...args));
    },
    errorBg: (...args: any) => {
      this.logService.log(this.prefix, chalk.bgRed(...args));
    },
    infoBg: (...args: any) => {
      this.logService.log(this.prefix, chalk.bgBlue(...args));
    },
    successBg: (...args: any) => {
      this.logService.log(this.prefix, chalk.bgGreen(chalk.black(...args)));
    },
    warningBg: (...args: any) => {
      this.logService.log(this.prefix, chalk.bgYellow(chalk.black(...args)));
    },
  };
}
