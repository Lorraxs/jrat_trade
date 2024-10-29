import type { z } from "zod";
import { Logger } from "../../../../utils/logger";
import { Binance } from "../../types/binance.type";
// prevents TS errors
declare var self: Worker;

class Stream extends Logger {
  ws: WebSocket;
  connected = false;
  subscribedStreams: Set<string> = new Set();
  private id = 0;
  private onSubscribeMessageCallbacks: Map<number, () => void> = new Map();
  private onMessageStreamHandlers: Map<string, Set<(data: any) => void>> =
    new Map();
  private onConnectHandlers: Set<() => void> = new Set();
  constructor(readonly name: string, readonly testMode: boolean) {
    super();
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(
      this.testMode
        ? "wss://fstream.binancefuture.com/stream"
        : "wss://fstream.binance.com/stream"
    );
    this.ws.onopen = async () => {
      this.print.info("Connected to stream");
      this.connected = true;
      for (const handler of this.onConnectHandlers) {
        handler();
      }
      if (this.subscribedStreams.size > 0) {
        const streams = Array.from(this.subscribedStreams);
        const messageId = this.id;
        this.id++;
        this.ws.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: streams,
            id: messageId,
          })
        );
        this.onSubscribeMessageCallbacks.set(messageId, () => {
          this.print.info(
            `Reconnected and resubscribed to ${streams.length} streams`
          );
        });
      }
    };
    this.ws.onmessage = (e: MessageEvent<string>) => {
      try {
        const parsedData: Binance.WsMarketStreamResponse<any> = JSON.parse(
          e.data
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
    };
    this.ws.onclose = async () => {
      this.print.errorBg("Stream closed");
      this.connected = false;
      this.print.warning("Reconnecting...");
      setTimeout(() => {
        this.connect();
      }, 1000);
    };
    this.ws.onerror = (e) => {
      this.print.error("Stream error", e);
      this.ws.close();
    };
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
      this.ws.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [stream],
          id: messageId,
        })
      );
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
        this.ws.send(
          JSON.stringify({
            method: "UNSUBSCRIBE",
            params: [stream],
            id: messageId,
          })
        );
        this.onSubscribeMessageCallbacks.set(messageId, () => {
          this.print.info(`Unsubscribed from stream ${stream}`);
        });
      }
    }
  }
}

self.onmessage = (e: MessageEvent<{ name: string; testMode: boolean }>) => {
  const { name, testMode } = e.data;
  const stream = new Stream(name, testMode);
  self.postMessage(stream);
};
