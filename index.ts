import "reflect-metadata";
import { startApp } from "./utils/createApp";
import { registerLogService } from "./services/log/logService";
import { ConsoleLogProvider } from "./services/log/providers/consoleLogProvider";
import { log } from "./utils/logger";
import { registerCryptoService } from "./services/crypto/crypto.service";
import { registerDiscordBotService } from "./services/discord/discordBot.service";
import { BinanceProvider } from "./services/crypto/providers/binance/binance";
import { registerRedisService } from "./services/redis/redis.service";
import { registerObWorkersService } from "./services/crypto/ob-workers.service";

startApp({
  defineServices: (container) => {
    registerLogService(container, [ConsoleLogProvider]);
    registerRedisService(container);
    registerObWorkersService(container);
    registerCryptoService(container, [BinanceProvider]);
    registerDiscordBotService(container);
  },
  beforeStart: (contailer) => {},
  start: async () => {
    log.successBg("App started");
  },
});
