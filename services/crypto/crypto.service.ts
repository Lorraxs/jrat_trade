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

  route = new Elysia({
    prefix: "/api/v1/crypto",
  });
  constructor() {
    this.route.get("/", () => {
      return this.exchangeProvider.map((provider) => provider.name);
    });
    /* this.route.get("/:provider", (req) => {
      const provider = this.exchangeProvider.find(
        (provider) => provider.name === req.params.provider
      );
      return provider?.name;
    }); */
  }

  async init() {
    this.logService.print.warning("Initializing");
    this.httpService.app.use(this.route);
    for (const provider of this.exchangeProvider) {
      await provider.init({
        test: false,
      });
    }
  }

  async start() {
    this.logService.print.success("Started");
  }
}
