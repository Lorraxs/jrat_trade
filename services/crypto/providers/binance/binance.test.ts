import "reflect-metadata";
import { test, expect, describe } from "bun:test";
import { BinanceProvider } from "./binance";
import type { AxiosError } from "axios";
import { Binance } from "../../types/binance.type";
import { KlineModel } from "../../../../models/candle.model";
import mongoose from "mongoose";

describe("BinanceAPI", async () => {
  const testInstance = new BinanceProvider();
  await testInstance.init({
    test: true,
  });
  test("Test Connectivity", async () => {
    const response = await testInstance.getApi("/fapi/v1/ping", undefined);
    expect(
      Binance.GETEndPointConfig["/fapi/v1/ping"].response.parse(response)
    ).toBeDefined();
  });

  test("Check Server Time", async () => {
    const response = await testInstance.getApi("/fapi/v1/time", undefined);
    expect(
      Binance.GETEndPointConfig["/fapi/v1/time"].response.parse(response)
    ).toBeDefined();
  });

  test("Exchange Information", async () => {
    const response = await testInstance.getApi(
      "/fapi/v1/exchangeInfo",
      undefined
    );
    expect(
      Binance.GETEndPointConfig["/fapi/v1/exchangeInfo"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("Order Book", async () => {
    const symbol = "BTCUSDT";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/depth", {
      symbol,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/depth"].response.parse(response)
    ).toBeDefined();
  });

  test("Recent Trades List", async () => {
    const symbol = "BTCUSDT";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/trades", {
      symbol,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/trades"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/historicalTrades", async () => {
    const symbol = "BTCUSDT";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/historicalTrades", {
      symbol,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/historicalTrades"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/aggTrades", async () => {
    const symbol = "BTCUSDT";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/aggTrades", {
      symbol,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/aggTrades"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/klines", async () => {
    const symbol = "BTCUSDT";
    const interval = "1m";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/klines", {
      symbol,
      interval,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/klines"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/continuousKlines", async () => {
    const pair = "BTCUSDT";
    const contractType = "PERPETUAL";
    const interval = "1m";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/continuousKlines", {
      pair,
      contractType,
      interval,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/continuousKlines"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/indexPriceKlines", async () => {
    const pair = "BTCUSDT";
    const interval = "1m";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/indexPriceKlines", {
      pair,
      interval,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/indexPriceKlines"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/markPriceKlines", async () => {
    const symbol = "BTCUSDT";
    const interval = "1m";
    const limit = 5;
    const response = await testInstance.getApi("/fapi/v1/markPriceKlines", {
      symbol,
      interval,
      limit,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/markPriceKlines"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/premiumIndex", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/premiumIndex", {
      symbol,
    });

    expect(
      Binance.GETEndPointConfig["/fapi/v1/premiumIndex"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/fundingRate", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/fundingRate", {
      symbol,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/fundingRate"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/ticker/24hr", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/ticker/24hr", {
      symbol,
    });

    expect(
      Binance.GETEndPointConfig["/fapi/v1/ticker/24hr"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/ticker/price", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/ticker/price", {
      symbol,
    });

    expect(
      Binance.GETEndPointConfig["/fapi/v1/ticker/price"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v2/ticker/price", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v2/ticker/price", {
      symbol,
    });

    expect(
      Binance.GETEndPointConfig["/fapi/v2/ticker/price"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/ticker/bookTicker", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/ticker/bookTicker", {
      symbol,
    });

    expect(
      Binance.GETEndPointConfig["/fapi/v1/ticker/bookTicker"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/openInterest", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/openInterest", {
      symbol,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/openInterest"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("/fapi/v1/assetIndex", async () => {
    const response = await testInstance.getApi("/fapi/v1/assetIndex", {});
    expect(
      Binance.GETEndPointConfig["/fapi/v1/assetIndex"].response.parse(response)
    ).toBeDefined();
  });

  test("/fapi/v1/constituents", async () => {
    const symbol = "BTCUSDT";
    const response = await testInstance.getApi("/fapi/v1/constituents", {
      symbol,
    });
    expect(
      Binance.GETEndPointConfig["/fapi/v1/constituents"].response.parse(
        response
      )
    ).toBeDefined();
  });
});

describe("Binance_Account_Trades_Endpoints", async () => {
  const testInstance = new BinanceProvider();
  await testInstance.init({
    test: true,
  });

  test("POST /fapi/v1/positionSide/dual", async () => {
    const response = await testInstance.postApi("/fapi/v1/positionSide/dual", {
      dualSidePosition: "true",
    });

    expect(
      Binance.POSTEndPointConfig["/fapi/v1/positionSide/dual"].response.parse(
        response
      )
    ).toBeDefined();
  });
  test("GET /fapi/v1/positionSide/dual", async () => {
    const response = await testInstance.getApi(
      "/fapi/v1/positionSide/dual",
      {}
    );

    expect(
      Binance.GETEndPointConfig["/fapi/v1/positionSide/dual"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("POST /fapi/v1/multiAssetsMargin", async () => {
    const response = await testInstance.postApi("/fapi/v1/multiAssetsMargin", {
      multiAssetsMargin: "true",
    });

    expect(
      Binance.POSTEndPointConfig["/fapi/v1/multiAssetsMargin"].response.parse(
        response
      )
    ).toBeDefined();
  });
  test("GET /fapi/v1/multiAssetsMargin", async () => {
    const response = await testInstance.getApi(
      "/fapi/v1/multiAssetsMargin",
      {}
    );

    expect(
      Binance.GETEndPointConfig["/fapi/v1/multiAssetsMargin"].response.parse(
        response
      )
    ).toBeDefined();
  });

  test("POST /fapi/v1/feeBurn", async () => {
    const response = await testInstance.postApi("/fapi/v1/feeBurn", {
      feeBurn: "true",
    });

    expect(
      Binance.POSTEndPointConfig["/fapi/v1/feeBurn"].response.parse(response)
    ).toBeDefined();
  });
  test("GET /fapi/v1/feeBurn", async () => {
    const response = await testInstance.getApi("/fapi/v1/feeBurn", {});

    expect(
      Binance.GETEndPointConfig["/fapi/v1/feeBurn"].response.parse(response)
    ).toBeDefined();
  });
});

describe("BinanceWebsocket", async () => {
  const testInstance = new BinanceProvider();
  await testInstance.init({
    test: true,
  });
  test("<symbol>@aggTrade", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@aggTrade",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@aggTrade"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@markPrice", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@markPrice",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@markPrice"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@markPrice@1s", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@markPrice@1s",
          {
            symbol: "BTCUSDT",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@markPrice@1s"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("!markPrice@arr", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!markPrice@arr",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!markPrice@arr"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("!markPrice@arr@1s", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!markPrice@arr@1s",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!markPrice@arr@1s"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@kline_<interval>", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@kline_<interval>",
          {
            symbol: "btcusdt",
            interval: "1m",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig[
                "<symbol>@kline_<interval>"
              ].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<pair>_<contractType>@continuousKline_<interval>", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<pair>_<contractType>@continuousKline_<interval>",
          {
            pair: "btcusdt",
            contractType: "perpetual",
            interval: "1m",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig[
                "<pair>_<contractType>@continuousKline_<interval>"
              ].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@miniTicker", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@miniTicker",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@miniTicker"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("!miniTicker@arr", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!miniTicker@arr",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!miniTicker@arr"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@ticker", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@ticker",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@ticker"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("!ticker@arr", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!ticker@arr",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!ticker@arr"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@bookTicker", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@bookTicker",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@bookTicker"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("!bookTicker", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!bookTicker",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!bookTicker"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  /* test("<symbol>@forceOrder", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@forceOrder",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@forceOrder"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  }); */

  /* test("!forceOrder@arr", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!forceOrder@arr",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!forceOrder@arr"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  }); */

  test("<symbol>@depth<levels>", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth<levels>",
          {
            symbol: "btcusdt",
            levels: "5",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@depth<levels>"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@depth<levels>@500ms", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth<levels>@500ms",
          {
            symbol: "btcusdt",
            levels: "5",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig[
                "<symbol>@depth<levels>@500ms"
              ].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@depth<levels>@100ms", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth<levels>@100ms",
          {
            symbol: "btcusdt",
            levels: "5",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig[
                "<symbol>@depth<levels>@100ms"
              ].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@depth", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@depth"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@depth@500ms", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth@500ms",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@depth@500ms"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  test("<symbol>@depth@100ms", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@depth@100ms",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@depth@100ms"].response.parse(
                data
              );
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  /* test("<symbol>@compositeIndex", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<symbol>@compositeIndex",
          {
            symbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<symbol>@compositeIndex"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  }); */

  /* test("!contractInfo", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!contractInfo",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!contractInfo"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  }); */

  test("!assetIndex@arr", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "!assetIndex@arr",
          undefined,
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["!assetIndex@arr"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  });

  /* test("<assetSymbol>@assetIndex", async () => {
    return expect(
      new Promise(async (resolve) => {
        const handler = await testInstance.wsMarketStreamManager.subscribe(
          "<assetSymbol>@assetIndex",
          {
            assetSymbol: "btcusdt",
          },
          (data) => {
            handler.unsubscribe();
            const parsedData =
              Binance.WsEndPointConfig["<assetSymbol>@assetIndex"].response.parse(data);
            resolve(parsedData);
          }
        );
      })
    ).resolves.toBeDefined();
  }); */
});

describe("Order Tests", async () => {
  const testInstance = new BinanceProvider();
  await testInstance.init({
    test: true,
  });

  test("BUY LIMIT", async () => {
    const response = await testInstance.postApi("/fapi/v1/order", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.01,
      reduceOnly: "false",
      price: 14800,
      timeInForce: "GTC",
    });
    console.log(response);
    expect(
      Binance.POSTEndPointConfig["/fapi/v1/order"].response.parse(response)
    ).toBeDefined();
  });

  test("BUY MARKET", async () => {
    const response = await testInstance.postApi("/fapi/v1/order", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.01,
      reduceOnly: "false",
    });
    console.log(response);
    expect(
      Binance.POSTEndPointConfig["/fapi/v1/order"].response.parse(response)
    ).toBeDefined();
  });

  test("BUY STOP", async () => {
    const response = await testInstance.postApi("/fapi/v1/order", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "STOP",
      quantity: 0.01,
      reduceOnly: "false",
      price: 65000,
      stopPrice: 66000,
    });
    console.log(response);
    expect(
      Binance.POSTEndPointConfig["/fapi/v1/order"].response.parse(response)
    ).toBeDefined();
  });
});

describe("Test Klines", async () => {
  const testInstance = new BinanceProvider();
  const mongoURI = process.env.MONGO_URI;
  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI, {
        autoIndex: true,
      });
    } catch (error) {
      console.error(error);
    }
  }
  await testInstance.init({
    test: false,
  });

  test("Assert Kline timeline", async () => {
    const data = await KlineModel.find({
      symbol: "BTCUSDT",
      interval: "30m",
    }).sort({ openTime: -1 });
    for (let i = 0; i < data.length - 1; i++) {
      if (i === 0 || i === data.length - 1) continue;
      expect(data[i].openTime).toBe(data[i + 1].closeTime + 1);
    }
  });

  test("Valid klines", async () => {
    const data = await KlineModel.find({
      symbol: "ETHUSDT",
      interval: "30m",
    })
      .sort({
        openTime: -1,
      })
      .limit(500);

    console.log(new Date(data[0].openTime).toISOString());
    console.log(new Date(data[data.length - 1].openTime).toISOString());
    const dataFromBinance = (
      await testInstance.getKlinesFromApi({
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
    expect(data.length).toBe(insertData.length);
    for (let i = 0; i < insertData.length; i++) {
      expect(data[i].openTime).toBe(insertData[i].openTime);
      expect(data[i].closeTime).toBe(insertData[i].closeTime);
      expect(
        data[i].high,
        JSON.stringify({ from: data[i], to: insertData[i] })
      ).toBe(insertData[i].high);
      expect(data[i].open).toBe(insertData[i].open);
      expect(data[i].low).toBe(insertData[i].low);
      expect(data[i].close).toBe(insertData[i].close);
      expect(data[i].volume).toBe(insertData[i].volume);
      expect(data[i].quoteAssetVolume).toBe(insertData[i].quoteAssetVolume);
      expect(data[i].numberOfTrades).toBe(insertData[i].numberOfTrades);
      expect(data[i].takerBuyBaseAssetVolume).toBe(
        insertData[i].takerBuyBaseAssetVolume
      );
      expect(data[i].takerBuyQuoteAssetVolume).toBe(
        insertData[i].takerBuyQuoteAssetVolume
      );
    }
  });
});
