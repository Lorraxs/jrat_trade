import type { z } from "zod";
import { Logger } from "../../../../utils/logger";
import type { DiscordBotService } from "../../../discord/discordBot.service";
import { Binance } from "../../types/binance.type";
import type { BinanceProvider } from "./binance";
import type { IStreamWorkerMessage } from "../../types/streamWorker.type";

export class WsMarketStreamManager extends Logger {
  name: string = "Binance WsMarketStreamManager";
  url = "wss://fstream.binance.com/stream";
  private streamPool: Stream[] = [];

  async getStream(channel: string) {
    // find a stream was subscribed to channel
    for (const stream of this.streamPool) {
      if (stream.subscribedStreams.has(channel)) {
        return stream;
      }
    }
    // find a stream that has less than 200 subscribed channels
    for (const stream of this.streamPool) {
      if (stream.subscribedStreams.size < 200) {
        return stream;
      }
    }
    // create new stream instance if no stream is available
    const newStream = new Stream(
      "Stream:" + this.streamPool.length,
      this,
      this.testMode
    );
    await newStream.waitConnect();
    this.streamPool.push(newStream);
    return newStream;
  }

  constructor(
    readonly binanceProvider: BinanceProvider,
    readonly discordBotService: DiscordBotService,
    readonly testMode: boolean
  ) {
    super();
    this.url = binanceProvider.wsBaseUrl;
  }

  async subscribe<T extends keyof Binance.WsEndPointConfig>(
    stream: T,
    params: z.infer<Binance.WsEndPointConfig[T]["params"]>,
    handler: (data: z.infer<Binance.WsEndPointConfig[T]["response"]>) => void
  ) {
    let formattedStream = stream as string;
    const parsedParams = Binance.WsEndPointConfig[stream].params.parse(params);
    if (params) {
      for (const [key, value] of Object.entries(
        parsedParams as { [key: string]: any }
      )) {
        formattedStream = formattedStream.replaceAll(
          `<${key}>`,
          value.toLocaleLowerCase()
        );
      }
    }
    const streamInstance = await this.getStream(stream);

    const handlerId = await streamInstance.subscribe(
      formattedStream as T,
      handler
    );
    return handlerId;
  }
}

class Stream extends Logger {
  worker: Worker;
  connected = false;
  subscribedStreams: Set<string> = new Set();
  private id = 0;
  private onSubscribeMessageCallbacks: Map<number, () => void> = new Map();
  private onMessageStreamHandlers: Map<string, Set<(data: any) => void>> =
    new Map();
  private onConnectHandlers: Set<() => void> = new Set();
  constructor(
    readonly name: string,
    readonly manager: WsMarketStreamManager,
    readonly testMode: boolean
  ) {
    super();
    this.worker = new Worker(new URL("./stream-worker.ts", import.meta.url));
    this.worker.onmessage = (e: MessageEvent<IStreamWorkerMessage>) => {
      switch (e.data.event) {
        case "on_ws_connected":
          {
            this.print.info("Connected to stream");
            this.connected = true;
            for (const handler of this.onConnectHandlers) {
              handler();
            }
            if (this.subscribedStreams.size > 0) {
              const streams = Array.from(this.subscribedStreams);
              const messageId = this.id;
              this.id++;
              this.postMessage({
                event: "send",
                data: JSON.stringify({
                  method: "SUBSCRIBE",
                  params: streams,
                  id: messageId,
                }),
              });
              this.onSubscribeMessageCallbacks.set(messageId, () => {
                this.print.info(
                  `Reconnected and resubscribed to ${streams.length} streams`
                );
              });
            }
          }

          break;
        case "on_ws_close":
          {
            this.print.errorBg("Stream closed");
            this.connected = false;
          }
          break;
        case "on_ws_message": {
          try {
            const parsedData: Binance.WsMarketStreamResponse<any> = JSON.parse(
              e.data.data
            );
            if (Binance.IsStreamResponseWithId(parsedData)) {
              const id = parsedData.id;
              const callback = this.onSubscribeMessageCallbacks.get(id);
              if (callback) {
                callback();
                this.onSubscribeMessageCallbacks.delete(id);
              }
            } else {
              const { stream, data } = parsedData;
              const handlers = this.onMessageStreamHandlers.get(stream);
              if (handlers) {
                for (const handler of handlers) {
                  handler(data);
                }
              }
            }
          } catch (error) {
            console.error(error);
          }
          break;
        }
        default:
          break;
      }
    };
    this.postMessage({
      event: "init",
      data: {
        name: this.name,
        testMode: this.testMode,
      },
    });
  }
  postMessage(data: IStreamWorkerMessage) {
    this.worker.postMessage(data);
  }
  private connect() {
    /* this.ws = new WebSocket(
      this.testMode
        ? "wss://fstream.binancefuture.com/stream"
        : "wss://fstream.binance.com/stream"
    ); */
    /* this.ws.onopen = async () => {
      
    }; */
    /* this.ws.onclose = async () => {
      this.print.errorBg("Stream closed");
      this.connected = false;
      this.print.warning("Reconnecting...");
      setTimeout(() => {
        this.connect();
      }, 1000);
    }; */
    /* this.ws.onerror = (e) => {
      this.print.error("Stream error", e);
      this.ws.close();
    }; */
  }

  async waitConnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.connected) {
        resolve();
      } else {
        this.onConnectHandlers.add(resolve);
      }
    });
  }

  onMessage(stream: string, handler: (data: any) => void) {
    const handlers = this.onMessageStreamHandlers.get(stream);
    if (handlers) {
      handlers.add(handler);
    } else {
      this.onMessageStreamHandlers.set(stream, new Set([handler]));
    }
    return handler;
  }

  async subscribe<T extends keyof Binance.WsEndPointConfig>(
    stream: T,
    handler: (data: z.infer<Binance.WsEndPointConfig[T]["response"]>) => void
  ) {
    const streamHandlers = this.onMessageStreamHandlers.get(stream);
    if (streamHandlers) {
      streamHandlers.add(handler);
      this.print.info(`Added handler to ${stream}`);
      return {
        unsubscribe: () => {
          this.unsubscribe(stream, handler);
        },
      };
    } else {
      const messageId = this.id;
      this.id++;
      this.postMessage({
        event: "send",
        data: JSON.stringify({
          method: "SUBSCRIBE",
          params: [stream],
          id: messageId,
        }),
      });
      return new Promise<{ unsubscribe: () => void }>((resolve, reject) => {
        const timeoutTimer = setTimeout(() => {
          reject(new Error("Timeout"));
        }, 5000);
        this.onSubscribeMessageCallbacks.set(messageId, () => {
          this.subscribedStreams.add(stream);
          this.onMessage(stream, handler);
          this.print.info(`Added handler to ${stream}`);
          this.print.info(`Subscribed to stream ${stream}`);
          clearTimeout(timeoutTimer);
          resolve({
            unsubscribe: () => {
              this.unsubscribe(stream, handler);
            },
          });
        });
      });
    }
  }

  unsubscribe(stream: string, handler: (data: any) => void) {
    const handlers = this.onMessageStreamHandlers.get(stream);
    if (handlers) {
      handlers.delete(handler);
      this.print.info(`Removed handler from ${stream}`);
      if (handlers.size === 0) {
        this.subscribedStreams.delete(stream);
        const messageId = this.id;
        this.id++;
        this.postMessage({
          event: "send",
          data: JSON.stringify({
            method: "UNSUBSCRIBE",
            params: [stream],
            id: messageId,
          }),
        });
        this.onSubscribeMessageCallbacks.set(messageId, () => {
          this.print.info(`Unsubscribed from stream ${stream}`);
        });
      }
    }
  }
}
