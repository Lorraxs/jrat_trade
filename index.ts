import "reflect-metadata";
import { startApp } from "./utils/createApp";
import { registerLogService } from "./services/log/logService";
import { ConsoleLogProvider } from "./services/log/providers/consoleLogProvider";
import { log } from "./utils/logger";
import { registerCryptoService } from "./services/crypto/crypto.service";
import { registerDiscordBotService } from "./services/discord/discordBot.service";
import { BinanceProvider } from "./services/crypto/providers/binance/binance";

startApp({
  defineServices: (container) => {
    registerLogService(container, [ConsoleLogProvider]);
    registerCryptoService(container, [BinanceProvider]);
    registerDiscordBotService(container);
  },
  beforeStart: (contailer) => {},
  start: async () => {
    log.successBg("App started");
  },
});
