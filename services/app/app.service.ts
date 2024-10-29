import { inject, injectable, multiInject, named, optional } from "inversify";
import { AppContribution } from "./app.extensions";
import type { ServicesContainer } from "../../utils/servicesContainer";
import { ScopedLogger } from "../log/scopedLogger";

@injectable()
class AppService {
  @inject(ScopedLogger)
  @named("AppService")
  private logService: ScopedLogger;

  @multiInject(AppContribution)
  @optional()
  protected readonly appContributions: AppContribution[] = [];

  async start() {
    await Promise.all(
      this.appContributions.map((contribution) => contribution.init?.())
    );
    await Promise.all(
      this.appContributions.map((contribution) => contribution.start?.())
    );
    this.logService.print.success("Started");
  }
}

export function registerAppService(container: ServicesContainer) {
  container.register(AppService);
}

export function getAppService(container: ServicesContainer): AppService {
  return container.get(AppService);
}
