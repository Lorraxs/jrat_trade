import type { interfaces } from "inversify";
import type { ServicesContainer } from "../../utils/servicesContainer";

export const AppContribution = Symbol("AppContribution");
export interface AppContribution {
  init?(): any;
  start?(): any;
}

export function registerAppContribution<T extends AppContribution>(
  container: ServicesContainer,
  service: interfaces.Newable<T>
) {
  container.registerImpl(AppContribution, service);
}
