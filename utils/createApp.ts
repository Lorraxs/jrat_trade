import mongoose from "mongoose";
import { getAppService, registerAppService } from "../services/app/app.service";
import { ServicesContainer } from "./servicesContainer";
import { log } from "./logger";

export interface AppDefinition {
  defineServices(container: ServicesContainer): void;
  beforeStart(container: ServicesContainer): void;
  start(): void;
}

export async function startApp(definition: AppDefinition) {
  const mongoURI = process.env.MONGO_URI;
  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI, {
        autoIndex: true,
      });
      log.successBg("Connected to mongodb");
    } catch (error) {
      console.error(error);
    }
  }
  const { defineServices, start, beforeStart } = definition;
  const container = new ServicesContainer(defineServices);
  registerAppService(container);
  const appService = getAppService(container);
  await beforeStart(container);
  await appService.start();
  start();
}
