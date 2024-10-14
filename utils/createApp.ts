import { getAppService, registerAppService } from "../services/app/app.service";
import { ServicesContainer } from "./servicesContainer";

export interface AppDefinition {
  defineServices(container: ServicesContainer): void;
  beforeStart(container: ServicesContainer): void;
  start(): void;
}

export async function startApp(definition: AppDefinition) {
  const { defineServices, start, beforeStart } = definition;
  const container = new ServicesContainer(defineServices);
  registerAppService(container);
  const appService = getAppService(container);
  await beforeStart(container);
  await appService.start();
  start();
}
