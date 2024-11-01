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
import { Elysia, t, type TSchema } from "elysia";
import swagger from "@elysiajs/swagger";
import { sleep, type Server, type ServerWebSocket } from "bun";
import type { ElysiaWS } from "elysia/ws";
import type { TypeCheck } from "elysia/type-system";
import type { IBroadcastMessage } from "./types/http.type";
import cors from "@elysiajs/cors";

export type IHttpService = HttpService;
export const IHttpService = defineService<IHttpService>("HttpService");

export function registerHttpService(container: ServicesContainer) {
  container.registerImpl(IHttpService, HttpService);
  registerAppContribution(container, HttpService);
}

@injectable()
class HttpService implements AppContribution {
  @inject(ScopedLogger)
  @named("HttpService")
  private logService: ScopedLogger;

  constructor() {}
  app: Elysia = new Elysia({
    serve: {
      maxRequestBodySize: 1024 * 1024 * 256,
    },
  });
  server: Server;
  wsSubscribedChannels: Map<string, Set<string>> = new Map();

  async init() {
    this.logService.log("init");
    const self = this;
    this.app
      .use(
        cors({
          origin: "*", // Allow all origins
        })
      )
      .use(swagger())
      .get("/api/v1", () => "JRATTRADE API v1")
      .ws("/ws", {
        // validate incoming message
        body: t.Union([
          t.Object({
            event: t.Union([t.Literal("subscribe")]),
            channel: t.String(),
          }),
          t.Object({
            event: t.Union([t.Literal("unsubscribe")]),
            channel: t.String(),
          }),
        ]),
        /* query: t.Object({
          id: t.String(),
        }), */
        response: t.Object({
          channel: t.String(),
          data: t.Any(),
        }),

        open(ws) {
          self.logService.log("ws open", ws.id);
          self.subscribe(ws, ["client_message", "new_client", "remove_client"]);
          self.publish({
            data: {
              id: ws.id,
            },
            channel: "new_client",
          });
        },
        close(ws, code, message) {
          self.unsubscribeAll(ws);
          self.logService.log("ws close", ws.id, code, message);
        },
        message(ws, data) {
          self.logService.log("ws message", ws.id, data);
          switch (data.event) {
            case "subscribe": {
              self.subscribe(ws, data.channel);
              break;
            }
            case "unsubscribe": {
              self.unsubscribe(ws, data.channel);
              break;
            }
          }
          /* self.publish("client_message", {
            id: ws.id,
            payload: data,
            time: Date,
          }); */
          /* ws.send({
            id: ws.id,
            message,
            time: Date.now(),
          }); */
        },
      });
  }

  subscribe<T = any>(ws: T, channels: string | string[]): T {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }
    const storage = this.wsSubscribedChannels.get((ws as any).id);
    if (!storage) {
      this.wsSubscribedChannels.set((ws as any).id, new Set([...channels]));
    } else {
      channels.forEach((channel) => {
        storage.add(channel);
      });
    }
    channels.forEach((channel) => {
      (ws as any).subscribe(channel);
    });
    return ws;
  }

  unsubscribe<T = any>(ws: T, channel: string): T {
    const storage = this.wsSubscribedChannels.get((ws as any).id);
    if (!storage) {
      return ws;
    } else {
      storage.delete(channel);
    }
    (ws as any).unsubscribe(channel);
    return ws;
  }

  unsubscribeAll<T = any>(ws: T): T {
    const storage = this.wsSubscribedChannels.get((ws as any).id);
    if (!storage) {
      return ws;
    } else {
      for (const channel of storage) {
        (ws as any).unsubscribe(channel);
      }
      this.wsSubscribedChannels.delete((ws as any).id);
    }
    return ws;
  }

  publish<T>(data: { channel: string; data: T }) {
    const payload: {
      channel: string;
      data: T;
      time: number;
    } = { ...data, time: Date.now() };
    this.server.publish(data.channel, JSON.stringify(payload));
  }

  async start() {
    const self = this;
    this.logService.log("start");
    this.app.listen(3000, async (server) => {
      self.logService.log("Server started on port 3000");
      self.server = server;
    });
    setInterval(() => {
      self.publish<{
        foo: string;
      }>({
        channel: "test",
        data: {
          foo: "bar",
        },
      });
    }, 1000);
  }
}
