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

  loading = false;

  async init() {
    this.logService.print.warning("Initializing");
  }

  async start() {
    this.logService.print.success("Started");
    for (const provider of this.exchangeProvider) {
      await provider.init({
        test: true,
      });
    }
  }
}
