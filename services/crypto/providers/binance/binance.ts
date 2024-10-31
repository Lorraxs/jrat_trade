import { inject, injectable } from "inversify";
import type {
  ExchangeProvider,
  ExchangeProviderOptions,
} from "../../crypto.extensions";
import { Logger } from "../../../../utils/logger";
import ccxt from "ccxt";
import { Binance } from "../../types/binance.type";
import axios, { Axios, AxiosError, type RawAxiosRequestHeaders } from "axios";
import {
  GetEnv,
  MakeQueryString,
  ParameterBuilder,
} from "../../../../utils/utils";
import { DiscordBotService } from "../../../discord/discordBot.service";
import { WsMarketStreamManager } from "./stream";
import { sleep } from "bun";
import { z } from "zod";
import crypto from "crypto";
import { ExchangeInfo } from "../../exchangeInfo";
import { KlineModel } from "../../../../models/candle.model";
import { CRAWL_AT, INTERVAL_RANGE } from "../../const";
import { Symbol } from "../../symbol";
import { IHttpService } from "../../../http/http.service";
import Elysia from "elysia";
import type { IOrderBlock } from "../../types/luxAlgo.type";

@injectable()
export class BinanceProvider extends Logger implements ExchangeProvider {
  route = new Elysia({
    prefix: `/api/v1/crypto/BinanceProvider`,
  });

  constructor() {
    super();
    this.name = "BinanceProvider";
    this.route.get("/", () => {
      /* const symbols: {
        symbol: string;
        interval: string;
        orderBlocks: IOrderBlock[];
      }[] = [];
      for (const symbol of this.symbols) {
        symbols.push({
          symbol: symbol.symbol,
          interval: symbol.interval,
          orderBlocks: symbol.orderBlocks,
        });
      }
      return symbols; */
      const symbols = Array.from(this.symbols).map((symbol) => {
        return {
          symbol: symbol.symbol,
          interval: symbol.interval,
          orderBlocksLength: symbol.orderBlocks.length,
        };
      });
      return symbols;
    });
    this.route.get("/:symbol/:interval", (req) => {
      const symbol = Array.from(this.symbols).find(
        (symbol) =>
          symbol.symbol === req.params.symbol &&
          symbol.interval === req.params.interval
      );
      if (symbol) {
        return symbol.orderBlocks;
      }
      return [];
    });
  }

  baseUrl = "https://testnet.binancefuture.com";
  wsBaseUrl = "https://testnet.binancefuture.com";
  private timeOffset = 0;
  private apiKey: string;
  private apiSecret: string;
  testMode: boolean;

  @inject(DiscordBotService)
  private discordBotService: DiscordBotService;
  @inject(IHttpService)
  private httpService: IHttpService;

  wsMarketStreamManager: WsMarketStreamManager;

  exchangeInfo: ExchangeInfo;
  symbols: Set<Symbol> = new Set();

  async init({ test = false }: ExchangeProviderOptions) {
    this.print.info("Init BinanceProvider");
    this.httpService.app.use(this.route);
    this.apiKey = test
      ? GetEnv("BINANCE_TESTNET_API_KEY", "")
      : GetEnv("BINANCE_API_KEY", "");
    this.apiSecret = test
      ? GetEnv("BINANCE_TESTNET_API_SECRET", "")
      : GetEnv("BINANCE_API_SECRET", "");
    this.testMode = test;
    if (this.testMode) {
      this.baseUrl = "https://testnet.binancefuture.com";
      this.wsBaseUrl = "wss://fstream.binancefuture.com";
    } else {
      this.baseUrl = "https://fapi.binance.com";
      this.wsBaseUrl = "wss://fstream.binance.com";
    }
    const serverTime = await this.getApi("/fapi/v1/time", undefined);
    this.print.info("Server time", serverTime.serverTime);
    this.timeOffset = serverTime.serverTime - Date.now();
    this.print.info("Time offset", this.timeOffset);
    this.wsMarketStreamManager = new WsMarketStreamManager(
      this,
      this.discordBotService,
      this.testMode
    );
    const exchangeData = await this.getExchangeInfo();
    this.print.info(
      "Getted exchange info at:",
      new Date(exchangeData.serverTime).toISOString()
    );
    this.exchangeInfo = new ExchangeInfo(
      {
        type: "binance",
        data: exchangeData,
      },
      this.testMode
    );
    this.start();
  }

  async start() {
    const handler = await this.wsMarketStreamManager.subscribe(
      "<symbol>@compositeIndex",
      {
        symbol: "ETHUSDT",
      },
      (data) => {
        this.print.info(JSON.stringify(data));
      }
    );

    const symbols = this.testMode ? ["ETHUSDT"] : this.exchangeInfo.symbolList;
    //const symbols = this.exchangeInfo.symbolList;
    //const symbols = ["ETHUSDT", "BTCUSDT"];
    await this.initSymbols(symbols);
  }

  async testKlineData() {
    try {
      const data = await KlineModel.find({
        symbol: "ETHUSDT",
        interval: "30m",
      })
        .sort({
          openTime: -1,
        })
        .limit(500);

      console.log(data.length);
      console.log(new Date(data[data.length - 1].openTime).toISOString());
      const dataFromBinance = (
        await this.getKlinesFromApi({
          symbol: "ETHUSDT",
          interval: "30m",
          limit: 500,
        })
      ).reverse();
      console.log(new Date(dataFromBinance[0].openTime).toISOString());
      console.log(
        new Date(
          dataFromBinance[dataFromBinance.length - 1].openTime
        ).toISOString()
      );
      const curTime = new Date().getTime();
      const insertData: Binance.FormatedKline[] = [];
      for (let i = 0; i < dataFromBinance.length; i++) {
        if (dataFromBinance[i].closeTime > curTime) {
          console.log(
            `Kline at index ${i} ${new Date(
              dataFromBinance[i].openTime
            ).toISOString()} not closed yet. Skip`
          );
          if (data.length >= 500) {
            data.pop();
          }
        } else {
          insertData.push(dataFromBinance[i]);
        }
      }
      if (data.length !== insertData.length) {
        throw new Error("Data length not match");
      }
      for (let i = 0; i < insertData.length; i++) {
        if (data[i].openTime !== insertData[i].openTime) {
          throw new Error("Open time not match");
        }
        if (data[i].open !== insertData[i].open) {
          throw new Error("Open not match");
        }
        if (data[i].high !== insertData[i].high) {
          throw new Error("High not match");
        }
        if (data[i].low !== insertData[i].low) {
          throw new Error("Low not match");
        }
        if (data[i].close !== insertData[i].close) {
          throw new Error("Close not match");
        }
        /* if (data[i].volume !== insertData[i].volume) {
          throw new Error("Volume not match");
        } */
        if (data[i].closeTime !== insertData[i].closeTime) {
          throw new Error("Close time not match");
        }
        /* if (data[i].quoteAssetVolume !== insertData[i].quoteAssetVolume) {
          throw new Error("Quote asset volume not match");
        } */
        /* if (data[i].numberOfTrades !== insertData[i].numberOfTrades) {
          throw new Error("Number of trades not match");
        } */
        /* if (
          data[i].takerBuyBaseAssetVolume !==
          insertData[i].takerBuyBaseAssetVolume
        ) {
          throw new Error("Taker buy base asset volume not match");
        } */
        /* if (
          data[i].takerBuyQuoteAssetVolume !==
          insertData[i].takerBuyQuoteAssetVolume
        ) {
          throw new Error("Taker buy quote asset volume not match");
        } */
      }
      return true;
    } catch (error) {
      this.print.error(error);
      return false;
    }
  }

  async getExchangeInfo() {
    return await this.getApi("/fapi/v1/exchangeInfo", undefined);
  }

  async getKlinesFromApi(
    payload: z.infer<Binance.GETEndPointConfig["/fapi/v1/klines"]["params"]>
  ): Promise<Binance.FormatedKline[]> {
    const rawData = await this.getApi("/fapi/v1/klines", payload);
    return rawData.map((data) => {
      return {
        openTime: data[0],
        open: data[1],
        high: data[2],
        low: data[3],
        close: data[4],
        volume: data[5],
        closeTime: data[6],
        quoteAssetVolume: data[7],
        numberOfTrades: data[8],
        takerBuyBaseAssetVolume: data[9],
        takerBuyQuoteAssetVolume: data[10],
        ignore: data[11],
        symbol: payload.symbol,
        interval: payload.interval,
      };
    });
  }

  async crawlKlines(symbol: string, interval: string, startTime?: number) {
    if (process.env.NODE_ENV === "test") return;
    try {
      const binanceData = startTime
        ? await this.getKlinesFromApi({
            symbol,
            interval,
            startTime,
            limit: 500,
          })
        : await this.getKlinesFromApi({
            symbol,
            interval,
            limit: 500,
            //startTime: new Date(CRAWL_AT).getTime(),
          });
      const curTime = new Date().getTime();
      this.print.info(`got ${binanceData.length} klines`);
      const insertData: Binance.FormatedKline[] = [];
      for (let i = 0; i < binanceData.length; i++) {
        if (binanceData[i].closeTime > curTime) {
          this.print.warning(
            `Kline at index ${i} ${new Date(
              binanceData[i].openTime
            ).toISOString()} not closed yet. Skip`
          );
        } else {
          insertData.push(binanceData[i]);
        }
      }
      const result = await KlineModel.insertMany(insertData);
      if (result.length > 0) {
        this.print.success(
          `Saved ${result.length} klines from ${new Date(
            result[0].openTime
          ).toLocaleString()} to ${new Date(
            result[result.length - 1].closeTime
          ).toLocaleString()}`
        );
        return true;
      }
      return false;
    } catch (error) {
      this.print.error(error);
      return false;
    }
  }

  async crawlAllKlines(symbols: string[]) {
    this.print.info(
      `Start crawling all klines at ${new Date(
        CRAWL_AT
      ).toLocaleString()} for ${symbols.length} symbols`
    );
    for (const interval of INTERVAL_RANGE) {
      let i = 0;
      for (const symbol of symbols) {
        i++;
        const savedData = await KlineModel.findOne({
          symbol: symbol,
          interval,
        }).sort({ closeTime: -1 });
        let startTime = savedData ? savedData.closeTime + 1 : undefined;
        this.print.warning(
          `${symbol} : ${interval} [${i}/${symbols.length}] [${interval}] Start crawling open time : `,
          new Date(startTime || -1).toLocaleString()
        );
        let crawlSuccess = await this.crawlKlines(symbol, interval, startTime);
        while (crawlSuccess) {
          const savedData = await KlineModel.findOne({
            symbol: symbol,
            interval,
          }).sort({ closeTime: -1 });
          let startTime = savedData ? savedData.closeTime + 1 : undefined;
          this.print.info(
            `${symbol} : ${interval} Start crawling open time (in loop) : `,
            new Date(startTime || -1).toLocaleString()
          );
          crawlSuccess = await this.crawlKlines(symbol, interval, startTime);
        }
      }
    }
  }

  async initSymbols(symbols: string[]) {
    const validKlines = await this.testKlineData();
    this.print.infoBg("Test kline data", validKlines);
    if (!validKlines) {
      await this.crawlAllKlines(symbols);
    }
    let i = 0;
    for (const symbol of symbols) {
      if (!symbol.endsWith("USDT") || symbol.startsWith("1000")) continue;
      for (const interval of INTERVAL_RANGE) {
        const symbolInstance = new Symbol("binance", symbol, interval, this);
        this.symbols.add(symbolInstance);
        await symbolInstance.init();
        i++;
      }
    }
    this.print.successBg(`Init ${i} symbols`);
  }

  getSymbols(): void {}

  private addSignature(params: any) {
    const timestamp = Date.now() + this.timeOffset;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(MakeQueryString({ ...params, timestamp }).substr(1))
      .digest("hex");
    return { ...params, timestamp, signature };
  }

  async getApi<T extends keyof Binance.GETEndPointConfig>(
    endpoint: T,
    params: z.infer<Binance.GETEndPointConfig[T]["params"]>
  ): Promise<z.infer<Binance.GETEndPointConfig[T]["response"]>> {
    const { securityType } = Binance.GETEndPointConfig[endpoint];
    const zParam = Binance.GETEndPointConfig[endpoint].params;
    if (zParam) {
      params = zParam.parse(params);
    }
    const headers: RawAxiosRequestHeaders = {};
    if (
      ["TRADE", "USER_DATA", "USER_STREAM", "MARKET_DATA"].includes(
        securityType
      )
    ) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }
    if (["TRADE", "USER_DATA"].includes(securityType)) {
      params = this.addSignature(params);
    }
    try {
      const response = await axios.get<
        z.infer<Binance.GETEndPointConfig[T]["response"]>
      >(`${this.baseUrl}${endpoint}`, {
        params,
        headers,
      });
      return response.data;
    } catch (error: any) {
      this.print.error(`${this.baseUrl}${endpoint}`);
      this.print.error(error.response?.data);
      return error.response?.data;
    }
  }

  async postApi<T extends keyof Binance.POSTEndPointConfig>(
    endpoint: T,
    params: z.infer<Binance.POSTEndPointConfig[T]["params"]>
  ) {
    const { securityType } = Binance.POSTEndPointConfig[endpoint];
    const zParam = Binance.POSTEndPointConfig[endpoint].params;
    if (zParam) {
      params = zParam.parse(params);
    }
    const headers: RawAxiosRequestHeaders = {};
    if (
      ["TRADE", "USER_DATA", "USER_STREAM", "MARKET_DATA"].includes(
        securityType
      )
    ) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }
    if (["TRADE", "USER_DATA"].includes(securityType)) {
      params = this.addSignature(params);
    }
    try {
      const response = await axios.post<
        z.infer<Binance.POSTEndPointConfig[T]["response"]>
      >(
        `${this.baseUrl}${endpoint}${MakeQueryString(params as any)}`,
        undefined,
        {
          headers,
        }
      );
      return response.data;
    } catch (error: any) {
      this.print.error(error.response?.data);
      return error.response?.data;
    }
  }
}
