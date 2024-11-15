import {
  inject,
  injectable,
  multiInject,
  named,
  optional,
  type interfaces,
} from "inversify";

import {
  registerAppContribution,
  AppContribution,
} from "../app/app.extensions";
import { ScopedLogger } from "../log/scopedLogger";
import {
  defineService,
  ServicesContainer,
} from "../../utils/servicesContainer";
import { ExchangeProvider } from "./crypto.extensions";
import Elysia from "elysia";
import { IHttpService } from "../http/http.service";
import type { ICryptoSettings } from "./types/type";
import { IRedisService } from "../redis/redis.service";

export type ICryptoService = CryptoService;
export const ICryptoService = defineService<ICryptoService>("CryptoService");

export function registerCryptoService(
  container: ServicesContainer,
  providers: interfaces.Newable<ExchangeProvider>[]
) {
  container.registerImpl(ICryptoService, CryptoService);
  registerAppContribution(container, CryptoService);
  providers.forEach((provider) =>
    container.registerImpl(ExchangeProvider, provider)
  );
}

@injectable()
class CryptoService implements AppContribution {
  @inject(ScopedLogger)
  @named("CryptoService")
  private logService: ScopedLogger;
  @multiInject(ExchangeProvider)
  @optional()
  protected readonly exchangeProvider: ExchangeProvider[];

  @inject(IHttpService)
  private httpService: IHttpService;
  @inject(IRedisService)
  private redisService: IRedisService;

  settings: ICryptoSettings = {
    condition1: 50,
    condition2: 10,
  };
  onUpdateSettingHandlers: Set<() => void> = new Set();

  route = new Elysia({
    prefix: "/api/v1/crypto",
  });
  constructor() {
    this.route.get("/", () => {
      return this.exchangeProvider.map((provider) => provider.name);
    });
    this.route.get("/settings", () => {
      return this.settings;
    });
    this.route.post(
      "/settings",
      (req: { body: { setting: keyof ICryptoSettings; value: any } }) => {
        return this.setSetting(req.body.setting, req.body.value);
      }
    );
    /* this.route.get("/:provider", (req) => {
      const provider = this.exchangeProvider.find(
        (provider) => provider.name === req.params.provider
      );
      return provider?.name;
    }); */
  }

  async init() {
    const settingsRedis = await this.redisService.client.get("crypto:settings");
    if (settingsRedis) {
      this.settings = JSON.parse(settingsRedis);
    } else {
      await this.redisService.client.set(
        "crypto:settings",
        JSON.stringify(this.settings)
      );
    }

    this.logService.print.warning("Initializing");
    this.httpService.app.use(this.route);
    for (const provider of this.exchangeProvider) {
      await provider.init({
        test: false,
      });
    }
  }

  async setSetting<T extends keyof ICryptoSettings>(
    setting: T,
    value: ICryptoSettings[T]
  ) {
    this.settings[setting] = value;
    await this.redisService.client.set(
      "crypto:settings",
      JSON.stringify(this.settings)
    );
    this.onUpdateSettingHandlers.forEach((handler) => handler());
    this.exchangeProvider.forEach((provider) => {
      provider.symbols.forEach((symbol) => {
        symbol.orderBlocks.forEach((ob) => {
          symbol.calcConditions(ob);
        });
      });
    });
    return this.settings[setting];
  }

  getSetting<T extends keyof ICryptoSettings>(setting: T) {
    return this.settings[setting];
  }

  async start() {
    this.logService.print.success("Started");
  }
}
