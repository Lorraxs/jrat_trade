import chalk from "chalk";
import { spacedStr } from "./utils";
import { injectable } from "inversify";

@injectable()
export class Logger {
  name: string;
  constructor() {}

  get prefix() {
    return chalk.bgRedBright("", chalk.white(this.name), "");
  }

  print = {
    error: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.red(...args));
    },
    info: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, ...args);
    },
    success: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.green(...args));
    },
    warning: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.yellow(...args));
    },
    errorBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgRed(...args));
    },
    infoBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgBlue(...args));
    },
    successBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgGreen(chalk.black(...args)));
    },
    warningBg: (...args: any) => {
      if (process.env.NODE_ENV === "test") return;
      console.log(this.prefix, chalk.bgYellow(chalk.black(...args)));
    },
  };
}

export const log = {
  error: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.red(...args));
  },
  info: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.blue(...args));
  },
  success: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.green(...args));
  },
  warning: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.yellow(...args));
  },
  errorBg: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.bgRed(...args));
  },
  infoBg: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.bgBlue(...args));
  },
  successBg: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.bgGreen("", chalk.black(...args), ""));
  },
  warningBg: (...args: any) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(chalk.bgYellow("", chalk.black(...args), ""));
  },
};
