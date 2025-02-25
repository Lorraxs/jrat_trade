import { injectable, inject, named } from "inversify";
import {
  defineService,
  ServicesContainer,
} from "../../utils/servicesContainer";
import {
  registerAppContribution,
  AppContribution,
} from "../app/app.extensions";
import { ScopedLogger } from "../log/scopedLogger";
import Redis from "ioredis";

export type IRedisService = RedisService;
export const IRedisService = defineService<IRedisService>("RedisService");

export function registerRedisService(container: ServicesContainer) {
  container.registerImpl(IRedisService, RedisService);
  registerAppContribution(container, RedisService);
}

@injectable()
class RedisService implements AppContribution {
  @inject(ScopedLogger)
  @named("RedisService")
  private logService: ScopedLogger;

  constructor() {}
  client = new Redis({
    lazyConnect: true,
    password: process.env.REDIS_PASSWORD || ""
  });

  async init() {
    this.logService.log("init");
    await this.client.connect();
    this.logService.print.successBg("Redis connected");
  }
}
