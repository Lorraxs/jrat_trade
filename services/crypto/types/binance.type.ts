import { time } from "console";
import { z } from "zod";

export namespace Binance {
  export const zWorkingType = z.union([
    z.literal("MARK_PRICE"),
    z.literal("CONTRACT_PRICE"),
  ]);
  export type WorkingType = z.infer<typeof zWorkingType>;

  export const zNewOrderRespType = z.union([
    z.literal("ACK"),
    z.literal("RESULT"),
  ]);
  export type NewOrderRespType = z.infer<typeof zNewOrderRespType>;

  export const zPriceMatch = z.union([
    z.literal("NONE"),
    z.literal("OPPONENT"),
    z.literal("OPPONENT_5"),
    z.literal("OPPONENT_10"),
    z.literal("OPPONENT_20"),
    z.literal("QUEUE"),
    z.literal("QUEUE_5"),
    z.literal("QUEUE_10"),
    z.literal("QUEUE_20"),
  ]);
  export type PriceMatch = z.infer<typeof zPriceMatch>;

  export const zSelfTradePreventionMode = z.union([
    z.literal("NONE"),
    z.literal("EXPIRE_TAKER"),
    z.literal("EXPIRE_MAKER"),
    z.literal("EXPIRE_BOTH"),
  ]);
  export type SelfTradePreventionMode = z.infer<
    typeof zSelfTradePreventionMode
  >;

  export const zSide = z.union([z.literal("BUY"), z.literal("SELL")]);
  export type Side = z.infer<typeof zSide>;

  export const zPositionSide = z.union([
    z.literal("BOTH"),
    z.literal("LONG"),
    z.literal("SHORT"),
  ]);
  export type PositionSide = z.infer<typeof zPositionSide>;

  export const zRateLimit = z.object({
    interval: z.string(),
    intervalNum: z.number(),
    limit: z.number(),
    rateLimitType: z.string(),
  });
  export type RateLimit = z.infer<typeof zRateLimit>;

  export const zAsset = z.object({
    asset: z.string(),
    marginAvailable: z.boolean(),
    autoAssetExchange: z.string(),
  });
  export type Asset = z.infer<typeof zAsset>;

  export const zFilter = z.object({
    filterType: z.string(),
    maxPrice: z.string().optional(),
    minPrice: z.string().optional(),
    tickSize: z.string().optional(),
    maxQty: z.string().optional(),
    minQty: z.string().optional(),
    stepSize: z.string().optional(),
    limit: z.number().optional(),
    notional: z.string().optional(),
    multiplierUp: z.string().optional(),
    multiplierDown: z.string().optional(),
    multiplierDecimal: z.string().optional(),
  });
  export type Filter = z.infer<typeof zFilter>;

  export const zOrderType = z.union([
    z.literal("LIMIT"),
    z.literal("MARKET"),
    z.literal("STOP"),
    z.literal("STOP_MARKET"),
    z.literal("TAKE_PROFIT"),
    z.literal("TAKE_PROFIT_MARKET"),
    z.literal("TRAILING_STOP_MARKET"),
  ]);
  export type OrderType = z.infer<typeof zOrderType>;

  export const zTimeInForce = z.union([
    z.literal("GTC"),
    z.literal("IOC"),
    z.literal("FOK"),
    z.literal("GTX"),
    z.literal("GTD"),
  ]);
  export type TimeInForce = z.infer<typeof zTimeInForce>;

  export const zInterval = z.union([
    z.literal("5m"),
    z.literal("15m"),
    z.literal("30m"),
    z.literal("1h"),
    z.literal("2h"),
    z.literal("4h"),
    z.literal("6h"),
    z.literal("12h"),
    z.literal("1d"),
  ]);
  export type Interval = z.infer<typeof zInterval>;

  export const zSymbol = z.object({
    symbol: z.string(),
    pair: z.string(),
    contractType: z.string(),
    deliveryDate: z.number(),
    onboardDate: z.number(),
    status: z.string(),
    maintMarginPercent: z.string(),
    requiredMarginPercent: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    marginAsset: z.string(),
    pricePrecision: z.number(),
    quantityPrecision: z.number(),
    baseAssetPrecision: z.number(),
    quotePrecision: z.number(),
    underlyingType: z.string(),
    underlyingSubType: z.array(z.string()),
    settlePlan: z.number().optional(),
    triggerProtect: z.string(),
    filters: z.array(zFilter),
    OrderType: z.array(zOrderType).optional(),
    timeInForce: z.array(zTimeInForce),
    liquidationFee: z.string(),
    marketTakeBound: z.string(),
  });
  export type Symbol = z.infer<typeof zSymbol>;

  export const zExchangeInfomation = z.object({
    exchangeFilters: z.array(z.unknown()),
    rateLimits: z.array(zRateLimit),
    serverTime: z.number(),
    assets: z.array(zAsset),
    symbols: z.array(zSymbol),
    timezone: z.string(),
  });
  export type ExchangeInfomation = z.infer<typeof zExchangeInfomation>;

  export const zOrderBook = z.object({
    lastUpdateId: z.number(),
    E: z.number(),
    T: z.number(),
    asks: z.array(z.tuple([z.string(), z.string()])),
    bids: z.array(z.tuple([z.string(), z.string()])),
  });
  export type OrderBook = z.infer<typeof zOrderBook>;

  export const zTrade = z.object({
    id: z.number(),
    price: z.string(),
    qty: z.string(),
    time: z.number(),
    isBuyerMaker: z.boolean(),
  });
  export type Trade = z.infer<typeof zTrade>;

  export const zAggTrade = z.object({
    a: z.number(),
    p: z.string(),
    q: z.string(),
    f: z.number(),
    l: z.number(),
    T: z.number(),
    m: z.boolean(),
  });
  export type AggTrade = z.infer<typeof zAggTrade>;

  export const zKline = z.tuple([
    z.number(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.number(),
    z.string(),
    z.number(),
    z.string(),
    z.string(),
    z.string(),
  ]);
  export type Kline = z.infer<typeof zKline>;
  export const zFormatedKline = z.object({
    symbol: z.string(),
    interval: z.string(),
    openTime: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string(),
    closeTime: z.number(),
    quoteAssetVolume: z.string(),
    numberOfTrades: z.number(),
    takerBuyBaseAssetVolume: z.string(),
    takerBuyQuoteAssetVolume: z.string(),
    ignore: z.string(),
  });
  export type FormatedKline = z.infer<typeof zFormatedKline>;

  export const zPremiumIndex = z.object({
    symbol: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    estimatedSettlePrice: z.string(),
    lastFundingRate: z.string(),
    nextFundingTime: z.number(),
    interestRate: z.string(),
    time: z.number(),
  });
  export type PremiumIndex = z.infer<typeof zPremiumIndex>;

  export const zFundingRate = z.object({
    symbol: z.string(),
    fundingTime: z.number(),
    fundingRate: z.string(),
    //markPrice: z.string(),
  });
  export type FundingRate = z.infer<typeof zFundingRate>;

  export const zFundingInfo = z.object({
    symbol: z.string(),
    adjustedFundingRateCap: z.string(),
    adjustedFundingRateFloor: z.string(),
    fundingIntervalHours: z.number(),
    disclaimer: z.boolean(),
  });
  export type FundingInfo = z.infer<typeof zFundingInfo>;

  export const z24hrTicker = z.object({
    symbol: z.string(),
    priceChange: z.string(),
    priceChangePercent: z.string(),
    weightedAvgPrice: z.string(),
    lastPrice: z.string(),
    lastQty: z.string(),
    openPrice: z.string(),
    highPrice: z.string(),
    lowPrice: z.string(),
    volume: z.string(),
    quoteVolume: z.string(),
    openTime: z.number(),
    closeTime: z.number(),
    firstId: z.number(),
    lastId: z.number(),
    count: z.number(),
  });
  export type T24hrTicker = z.infer<typeof z24hrTicker>;

  export const zSymbolPrice = z.object({
    symbol: z.string(),
    price: z.string(),
    time: z.number(),
  });
  export type SymbolPrice = z.infer<typeof zSymbolPrice>;

  export const zSymbolOrderBookTicker = z.object({
    lastUpdateId: z.number(),
    symbol: z.string(),
    bidPrice: z.string(),
    bidQty: z.string(),
    askPrice: z.string(),
    askQty: z.string(),
    time: z.number(),
  });
  export type SymbolOrderBookTicker = z.infer<typeof zSymbolOrderBookTicker>;

  export const zCompositeIndexSymbolInformation = z.object({
    symbol: z.string(),
    time: z.number(),
    component: z.string(),
    baseAssetList: z.array(
      z.object({
        baseAsset: z.string(),
        quoteAsset: z.string(),
        weightInQuantity: z.string(),
        weightInPercentage: z.string(),
      })
    ),
  });
  export type CompositeIndexSymbolInformation = z.infer<
    typeof zCompositeIndexSymbolInformation
  >;

  export const zOpenInterest = z.object({
    symbol: z.string(),
    openInterest: z.string(),
    time: z.number(),
  });
  export type OpenInterest = z.infer<typeof zOpenInterest>;

  export const zDeliveryPrice = z.object({
    deliveryTime: z.number(),
    deliveryPrice: z.number(),
  });
  export type DeliveryPrice = z.infer<typeof zDeliveryPrice>;

  export const zOpenInterestHist = z.object({
    symbol: z.string(),
    sumOpenInterest: z.string(),
    sumOpenInterestValue: z.string(),
    timestamp: z.string(),
  });
  export type OpenInterestHist = z.infer<typeof zOpenInterestHist>;

  export const zTopLongShortAccountRatio = z.object({
    symbol: z.string(),
    longShortRatio: z.string(),
    longAccount: z.string(),
    shortAccount: z.string(),
    timestamp: z.string(),
  });
  export type TopLongShortAccountRatio = z.infer<
    typeof zTopLongShortAccountRatio
  >;

  export const zTopLongShortPositionRatio = z.object({
    symbol: z.string(),
    longShortRatio: z.string(),
    longAccount: z.string(),
    shortAccount: z.string(),
    timestamp: z.string(),
  });
  export type TopLongShortPositionRatio = z.infer<
    typeof zTopLongShortPositionRatio
  >;

  export const zGlobalLongShortAccountRatio = z.object({
    symbol: z.string(),
    longShortRatio: z.string(),
    longAccount: z.string(),
    shortAccount: z.string(),
    timestamp: z.string(),
  });
  export type GlobalLongShortAccountRatio = z.infer<
    typeof zGlobalLongShortAccountRatio
  >;

  export const zTakerLongShortRatio = z.object({
    buySellRatio: z.string(),
    buyVol: z.string(),
    sellVol: z.string(),
    timestamp: z.string(),
  });
  export type TakerLongShortRatio = z.infer<typeof zTakerLongShortRatio>;

  export const zContractType = z.union([
    z.literal("PERPETUAL"),
    z.literal("CURRENT_QUARTER"),
    z.literal("NEXT_QUARTER"),
  ]);

  export const zBasis = z.object({
    indexPrice: z.string(),
    contractType: zContractType,
    basisRate: z.string(),
    futuresPrice: z.string(),
    annualizedBasisRate: z.string(),
    basis: z.string(),
    pair: z.string(),
    timestamp: z.number(),
  });
  export type Basis = z.infer<typeof zBasis>;

  export const zIndexInfo = z.object({
    symbol: z.string(),
    time: z.number(),
    component: z.string(),
    baseAssetList: z.array(
      z.object({
        baseAsset: z.string(),
        quoteAsset: z.string(),
        weightInQuantity: z.string(),
        weightInPercentage: z.string(),
      })
    ),
  });
  export type IndexInfo = z.infer<typeof zIndexInfo>;

  export const zAssetIndex = z.object({
    symbol: z.string(),
    time: z.number(),
    index: z.string(),
    bidBuffer: z.string(),
    askBuffer: z.string(),
    bidRate: z.string(),
    askRate: z.string(),
    autoExchangeBidBuffer: z.string(),
    autoExchangeAskBuffer: z.string(),
    autoExchangeBidRate: z.string(),
    autoExchangeAskRate: z.string(),
  });
  export type AssetIndex = z.infer<typeof zAssetIndex>;

  export const zConstituent = z.object({
    symbol: z.string(),
    time: z.number(),
    constituents: z.array(
      z.object({
        exchange: z.string(),
        symbol: z.string(),
      })
    ),
  });

  export const EndPoints = [
    "/fapi/v1/ping",
    "/fapi/v1/time",
    "/fapi/v1/exchangeInfo",
    "/fapi/v1/depth",
    "/fapi/v1/trades",
    "/fapi/v1/historicalTrades",
    "/fapi/v1/aggTrades",
    "/fapi/v1/klines",
    "/fapi/v1/continuousKlines",
    "/fapi/v1/indexPriceKlines",
    "/fapi/v1/markPriceKlines",
    "/fapi/v1/premiumIndexKlines",
    "/fapi/v1/premiumIndex",
    "/fapi/v1/fundingRate",
    "/fapi/v1/fundingInfo",
    "/fapi/v1/ticker/24hr",
    "/fapi/v1/ticker/price",
    "/fapi/v2/ticker/price",
    "/fapi/v1/ticker/bookTicker",
    "/fapi/v1/openInterest",
    "/futures/data/delivery-price",
    "/futures/data/openInterestHist",
    "/fapi/v1/indexInfo",
    "/fapi/v1/assetIndex",
    "/fapi/v1/constituents",
  ] as const;
  export type EndPoint = (typeof EndPoints)[number];

  export type WsMarketStreamResponse<T = unknown> =
    | {
        result: any;
        id: number;
      }
    | {
        stream: string;
        data: T;
      };

  export const IsStreamResponseWithId = (
    payload: WsMarketStreamResponse
  ): payload is { result: any; id: number } => "id" in payload;

  export const zWsAggTrade = z.object({
    e: z.literal("aggTrade"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    a: z.number(), // Aggregate trade ID
    p: z.string(), // Price
    q: z.string(), // Quantity
    f: z.number(), // First trade ID
    l: z.number(), // Last trade ID
    T: z.number(), // Trade time
    m: z.boolean(), // Is the buyer the market maker?
  });
  export type WsAggTrade = z.infer<typeof zWsAggTrade>;

  export const zWsMarkPrice = z.object({
    e: z.literal("markPriceUpdate"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    p: z.string(), // Mark price
    i: z.string(), // Index price
    P: z.string(), // Estimated Settle Price, only useful in the last hour before the settlement starts
    r: z.string(), // Funding rate
    T: z.number(), // Next funding time
  });
  export type WsMarkPrice = z.infer<typeof zWsMarkPrice>;

  export const zWsKline = z.object({
    e: z.literal("kline"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    k: z.object({
      t: z.number(), // Kline start time
      T: z.number(), // Kline close time
      s: z.string(), // Symbol
      i: z.string(), // Interval
      f: z.number(), // First trade ID
      L: z.number(), // Last trade ID
      o: z.string(), // Open price
      c: z.string(), // Close price
      h: z.string(), // High price
      l: z.string(), // Low price
      v: z.string(), // Base asset volume
      n: z.number(), // Number of trades
      x: z.boolean(), // Is this kline closed?
      q: z.string(), // Quote asset volume
      V: z.string(), // Taker buy base asset volume
      Q: z.string(), // Taker buy quote asset volume
      B: z.string(), // Ignore
    }),
  });
  export type WsKline = z.infer<typeof zWsKline>;

  export const zWsContinuousKline = z.object({
    e: z.literal("continuous_kline"), // Event type
    E: z.number(), // Event time
    ps: z.string(), // Pair
    ct: z.string(), // Contract type
    k: z.object({
      t: z.number(), // Kline start time
      T: z.number(), // Kline close time
      i: z.string(), // Interval
      f: z.number(), // First trade ID
      L: z.number(), // Last trade ID
      o: z.string(), // Open price
      c: z.string(), // Close price
      h: z.string(), // High price
      l: z.string(), // Low price
      v: z.string(), // Base asset volume
      n: z.number(), // Number of trades
      x: z.boolean(), // Is this kline closed?
      q: z.string(), // Quote asset volume
      V: z.string(), // Taker buy volume
      Q: z.string(), // Taker buy quote asset volume
      B: z.string(), // Ignore
    }),
  });
  export type WsContinuousKline = z.infer<typeof zWsContinuousKline>;

  export const zWsMiniTicker = z.object({
    e: z.literal("24hrMiniTicker"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    c: z.string(), // Close price
    o: z.string(), // Open price
    h: z.string(), // High price
    l: z.string(), // Low price
    v: z.string(), // Total traded base asset volume
    q: z.string(), // Total traded quote asset volume
  });
  export type WsMiniTicker = z.infer<typeof zWsMiniTicker>;

  export const zWsTicker = z.object({
    e: z.literal("24hrTicker"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    p: z.string(), // Price change
    P: z.string(), // Price change percent
    w: z.string(), // Weighted average price
    c: z.string(), // Current day's close price
    Q: z.string(), // Close trade's quantity
    o: z.string(), // Open price
    h: z.string(), // High price
    l: z.string(), // Low price
    v: z.string(), // Total traded base asset volume
    q: z.string(), // Total traded quote asset volume
    O: z.number(), // Statistics open time
    C: z.number(), // Statistics close time
    F: z.number(), // First trade ID
    L: z.number(), // Last trade Id
    n: z.number(), // Total number of trades
  });
  export type WsTicker = z.infer<typeof zWsTicker>;

  export const zWsBookTicker = z.object({
    e: z.literal("bookTicker"), // Event type
    u: z.number(), // order book updateId
    E: z.number(), // Event time
    T: z.number(), // Transaction time
    s: z.string(), // Symbol
    b: z.string(), // Best bid price
    B: z.string(), // Best bid quantity
    a: z.string(), // Best ask price
    A: z.string(), // Best ask quantity
  });
  export type WsBookTicker = z.infer<typeof zWsBookTicker>;

  export const zWsForceOrder = z.object({
    e: z.literal("forceOrder"), // Event type
    E: z.number(), // Event time
    o: z.object({
      s: z.string(), // Symbol
      S: z.string(), // Side
      o: z.string(), // Order type
      f: z.string(), // Time in force
      q: z.string(), // Original Quantity
      p: z.string(), // Price
      ap: z.string(), // Average price
      X: z.string(), // Order status
      l: z.string(), // Order last filled quantity
      z: z.string(), // Order filled accumulated quantity
      T: z.number(), // Order trade time
    }),
  });
  export type WsForceOrder = z.infer<typeof zWsForceOrder>;

  export const zWsDepth = z.object({
    e: z.literal("depthUpdate"), // Event type
    E: z.number(), // Event time
    T: z.number(), // Transaction time
    s: z.string(), // Symbol
    U: z.number(), // first update ID in event
    u: z.number(), // final update ID in event
    b: z.array(
      // Bids to be updated
      z.tuple([
        z.string(), // Price level to be
        z.string(), // Quantity
      ])
    ),
    a: z.array(
      // Asks to be updated
      z.tuple([
        z.string(), // Price level to be
        z.string(), // Quantity
      ])
    ),
  });
  export type WsDepth = z.infer<typeof zWsDepth>;

  export const zWsCompositeIndex = z.object({
    e: z.literal("compositeIndex"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    p: z.string(), // Price
    C: z.string(), // Composite index
    c: z.array(
      z.object({
        b: z.string(), // Base asset
        q: z.string(), // Quote asset
        w: z.string(), // Weight in quantity
        W: z.string(), // Weight in percentage
        i: z.string(), // Index price
      })
    ),
  });
  export type WsCompositeIndex = z.infer<typeof zWsCompositeIndex>;

  export const zWsContractInfo = z.object({
    e: z.literal("contractInfo"), // Event type
    E: z.number(), // Event time
    s: z.string(), // Symbol
    ps: z.string(), // Pair
    ct: z.string(), // Contract type
    dt: z.number(), // Delivery date
    ot: z.number(), // Onboard date
    cs: z.string(), // Contract status
    bks: z.array(
      z.object({
        bs: z.number(), // Notional bracket
        bnf: z.number(), // Floor notional of this bracket
        bnc: z.number(), //Cap notional of this bracket
        mmr: z.number(), //Maintenance ratio for this bracket
        cf: z.number(), //Auxiliary number for quick calculation
        mi: z.number(), //Min leverage for this bracket
        ma: z.number(), //Max leverage for this bracket
      })
    ),
  });
  export type WsContractInfo = z.infer<typeof zWsContractInfo>;

  export const zWsAssetIndex = z.object({
    e: z.literal("assetIndexUpdate"),
    E: z.number(),
    s: z.string(), // asset index symbol
    i: z.string(), // index price
    b: z.string(), // bid buffer
    a: z.string(), // ask buffer
    B: z.string(), // bid rate
    A: z.string(), // ask rate
    q: z.string(), // auto exchange bid buffer
    g: z.string(), // auto exchange ask buffer
    Q: z.string(), // auto exchange bid rate
    G: z.string(), // auto exchange ask rate
  });
  export type WsAssetIndex = z.infer<typeof zWsAssetIndex>;

  export const zOrder = z.object({
    clientOrderId: z.string(),
    cumQty: z.string(),
    cumQuote: z.string(),
    executedQty: z.string(),
    orderId: z.number(),
    avgPrice: z.string(),
    origQty: z.string(),
    price: z.string(),
    reduceOnly: z.boolean(),
    side: zSide,
    positionSide: zPositionSide,
    status: z.string(),
    stopPrice: z.string(), // please ogmpre when order type is TRAILING_STOP_MARKET
    closePosition: z.boolean(), // if close all
    symbol: z.string(),
    timeInForce: zTimeInForce,
    type: zOrderType,
    origType: zOrderType,
    activatePrice: z.string().optional(), // activation price, only return with TRAILING_STOP_MARKET order
    priceRate: z.string().optional(), // callback rate, only return with TRAILING_STOP_MARKET order
    updateTime: z.number(),
    workingType: zWorkingType,
    priceProtect: z.boolean(), // if conditional order trigger is protected
    priceMatch: zPriceMatch, //price match mode
    selfTradePreventionMode: zSelfTradePreventionMode, //self trading preventation mode
    goodTillDate: z.number(), //order pre-set auot cancel time for TIF GTD order
  });
  export type Order = z.infer<typeof zOrder>;

  const zDefaultOrderParams = z.object({
    symbol: z.string(),
    side: zSide,
    positionSide: zPositionSide.optional(),
    type: zOrderType,
    //timeInForce: zTimeInForce,
    price: z.number().optional(),
    newClientOrderId: z.string().optional(),
    workingType: zWorkingType.optional(),
    newOrderRespType: zNewOrderRespType.optional(),
    selfTradePreventionMode: zSelfTradePreventionMode.optional(),
    goodTillDate: z.number().optional(),
    recvWindow: z.number().optional(),
  });
  export const zOrderParams = z.union([
    zDefaultOrderParams.extend({
      type: z.literal("LIMIT"),
      timeInForce: zTimeInForce,
      quantity: z.number(),
      price: z.number(),
      priceMatch: zPriceMatch.optional(),
      reduceOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
    }),
    zDefaultOrderParams.extend({
      type: z.literal("MARKET"),
      quantity: z.number(),
      reduceOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
    }),
    zDefaultOrderParams.extend({
      type: z.union([z.literal("STOP"), z.literal("TAKE_PROFIT")]),
      quantity: z.number(),
      price: z.number(),
      stopPrice: z.number(),
      timeInForce: zTimeInForce.optional(),
      priceProtect: z.boolean().optional(),
      reduceOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
    }),
    zDefaultOrderParams.extend({
      type: z.union([
        z.literal("STOP_MARKET"),
        z.literal("TAKE_PROFIT_MARKET"),
      ]),
      stopPrice: z.number(),
      priceProtect: z.boolean().optional(),
      closePosition: z.literal(true),
    }),
    zDefaultOrderParams.extend({
      type: z.union([
        z.literal("STOP_MARKET"),
        z.literal("TAKE_PROFIT_MARKET"),
      ]),
      stopPrice: z.number(),
      priceProtect: z.boolean().optional(),
      closePosition: z.literal(false),
      quantity: z.number(),
      reduceOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
    }),
    zDefaultOrderParams.extend({
      type: z.literal("TRAILING_STOP_MARKET"),
      quantity: z.number(),
      callbackRate: z.number().min(0.1).max(10),
      reduceOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
    }),
  ]);

  export const GETEndPointConfig = {
    "/fapi/v1/ping": {
      params: z.undefined(),
      response: z.object({}),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/time": {
      params: z.undefined(),
      response: z.object({
        serverTime: z.number(),
      }),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/exchangeInfo": {
      params: z.undefined(),
      response: Binance.zExchangeInfomation,
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/depth": {
      params: z.object({
        symbol: z.string(),
        limit: z.number().optional(),
      }),
      response: Binance.zOrderBook,
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/trades": {
      params: z.object({
        symbol: z.string(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zTrade),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/historicalTrades": {
      params: z.object({
        symbol: z.string(),
        limit: z.number().optional(),
        fromId: z.number().optional(),
      }),
      response: z.array(Binance.zTrade),
      securityType: "MARKET_DATA",
      method: "GET",
    },
    "/fapi/v1/aggTrades": {
      params: z.object({
        symbol: z.string(),
        fromId: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zAggTrade),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/klines": {
      params: z.object({
        symbol: z.string(),
        interval: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zKline),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/continuousKlines": {
      params: z.object({
        pair: z.string(),
        contractType: z.string(),
        interval: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zKline),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/indexPriceKlines": {
      params: z.object({
        pair: z.string(),
        interval: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zKline),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/markPriceKlines": {
      params: z.object({
        symbol: z.string(),
        interval: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zKline),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/premiumIndexKlines": {
      params: z.object({
        symbol: z.string(),
        interval: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zKline),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/premiumIndex": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zPremiumIndex,
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/fundingRate": {
      params: z.object({
        symbol: z.string().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: z.array(Binance.zFundingRate),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/fundingInfo": {
      params: z.undefined(),
      response: z.array(Binance.zFundingInfo),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/ticker/24hr": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.union([z.array(Binance.z24hrTicker), Binance.z24hrTicker]),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/ticker/price": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.union([z.array(Binance.zSymbolPrice), Binance.zSymbolPrice]),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v2/ticker/price": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.union([z.array(Binance.zSymbolPrice), Binance.zSymbolPrice]),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/ticker/bookTicker": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.union([
        z.array(Binance.zSymbolOrderBookTicker),
        Binance.zSymbolOrderBookTicker,
      ]),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/openInterest": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zOpenInterest,
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/delivery-price": {
      params: z.object({
        symbol: z.string(),
      }),
      response: z.array(Binance.zDeliveryPrice),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/openInterestHist": {
      params: z.object({
        symbol: z.string(),
        period: z.string(),
        limit: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zOpenInterestHist),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/topLongShortAccountRatio": {
      params: z.object({
        symbol: z.string(),
        period: z.string(),
        limit: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zTopLongShortAccountRatio),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/topLongShortPositionRatio": {
      params: z.object({
        symbol: z.string(),
        period: Binance.zInterval,
        limit: z.number().min(1).max(500).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zTopLongShortPositionRatio),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/globalLongShortAccountRatio": {
      params: z.object({
        symbol: z.string(),
        period: Binance.zInterval,
        limit: z.number().min(1).max(500).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zGlobalLongShortAccountRatio),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/takerlongshortRatio": {
      params: z.object({
        symbol: z.string(),
        period: Binance.zInterval,
        limit: z.number().min(1).max(500).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zTakerLongShortRatio),
      securityType: "NONE",
      method: "GET",
    },
    "/futures/data/basis": {
      params: z.object({
        pair: z.string(),
        contractType: Binance.zContractType,
        period: Binance.zInterval,
        limit: z.number().min(1).max(500).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
      response: z.array(Binance.zBasis),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/indexInfo": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.array(Binance.zIndexInfo),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/assetIndex": {
      params: z.object({
        symbol: z.string().optional(),
      }),
      response: z.union([z.array(Binance.zAssetIndex), Binance.zAssetIndex]),
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/constituents": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zConstituent,
      securityType: "NONE",
      method: "GET",
    },
    "/fapi/v1/positionSide/dual": {
      params: z.object({
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        dualSidePosition: z.boolean(),
      }),
      securityType: "USER_DATA",
      method: "GET",
    },
    "/fapi/v1/multiAssetsMargin": {
      params: z.object({
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        multiAssetsMargin: z.boolean(),
      }),
      securityType: "USER_DATA",
    },
    "/fapi/v1/feeBurn": {
      params: z.object({
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        feeBurn: z.boolean(),
      }),
      securityType: "USER_DATA",
    },
  } as const;
  export type GETEndPointConfig = typeof GETEndPointConfig;

  export const POSTEndPointConfig = {
    "/fapi/v1/positionSide/dual": {
      params: z.object({
        dualSidePosition: z.string(),
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        code: z.number(),
        msg: z.string(),
      }),
      securityType: "TRADE",
    },
    "/fapi/v1/multiAssetsMargin": {
      params: z.object({
        multiAssetsMargin: z.string(),
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        code: z.number(),
        msg: z.string(),
      }),
      securityType: "TRADE",
    },
    "/fapi/v1/feeBurn": {
      params: z.object({
        feeBurn: z.string(),
        recvWindow: z.number().optional(),
      }),
      response: z.object({
        code: z.number(),
        msg: z.string(),
      }),
      securityType: "TRADE",
    },
    "/fapi/v1/order": {
      params: zOrderParams,
      response: Binance.zOrder,
      securityType: "TRADE",
    },
  } as const;
  export type POSTEndPointConfig = typeof POSTEndPointConfig;

  export const WsEndPointConfig = {
    "<symbol>@aggTrade": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsAggTrade,
    },
    "<symbol>@markPrice": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsMarkPrice,
    },
    "<symbol>@markPrice@1s": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsMarkPrice,
    },
    "!markPrice@arr": {
      params: z.undefined(),
      response: z.array(Binance.zWsMarkPrice),
    },
    "!markPrice@arr@1s": {
      params: z.undefined(),
      response: z.array(Binance.zWsMarkPrice),
    },
    "<symbol>@kline_<interval>": {
      params: z.object({
        symbol: z.string(),
        interval: z.union([
          z.literal("1m"),
          z.literal("3m"),
          z.literal("5m"),
          z.literal("15m"),
          z.literal("30m"),
          z.literal("1h"),
          z.literal("2h"),
          z.literal("4h"),
          z.literal("6h"),
          z.literal("8h"),
          z.literal("12h"),
          z.literal("1d"),
          z.literal("3d"),
          z.literal("1w"),
          z.literal("1M"),
        ]),
      }),
      response: Binance.zWsKline,
    },
    "<pair>_<contractType>@continuousKline_<interval>": {
      params: z.object({
        pair: z.string(),
        contractType: z.union([
          z.literal("perpetual"),
          z.literal("current_quarter"),
          z.literal("next_quarter"),
        ]),
        interval: z.union([
          z.literal("1m"),
          z.literal("3m"),
          z.literal("5m"),
          z.literal("15m"),
          z.literal("30m"),
          z.literal("1h"),
          z.literal("2h"),
          z.literal("4h"),
          z.literal("6h"),
          z.literal("8h"),
          z.literal("12h"),
          z.literal("1d"),
          z.literal("3d"),
          z.literal("1w"),
          z.literal("1M"),
        ]),
      }),
      response: Binance.zWsContinuousKline,
    },
    "<symbol>@miniTicker": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsMiniTicker,
    },
    "!miniTicker@arr": {
      params: z.undefined(),
      response: z.array(Binance.zWsMiniTicker),
    },
    "<symbol>@ticker": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsTicker,
    },
    "!ticker@arr": {
      params: z.undefined(),
      response: z.array(Binance.zWsTicker),
    },
    "<symbol>@bookTicker": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsBookTicker,
    },
    "!bookTicker": {
      params: z.undefined(),
      response: Binance.zWsBookTicker,
    },
    "<symbol>@forceOrder": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsForceOrder,
    },
    "!forceOrder@arr": {
      params: z.undefined(),
      response: Binance.zWsForceOrder,
    },
    "<symbol>@depth<levels>": {
      params: z.object({
        symbol: z.string(),
        levels: z.union([z.literal("5"), z.literal("10"), z.literal("20")]),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@depth<levels>@500ms": {
      params: z.object({
        symbol: z.string(),
        levels: z.union([z.literal("5"), z.literal("10"), z.literal("20")]),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@depth<levels>@100ms": {
      params: z.object({
        symbol: z.string(),
        levels: z.union([z.literal("5"), z.literal("10"), z.literal("20")]),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@depth": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@depth@500ms": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@depth@100ms": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsDepth,
    },
    "<symbol>@compositeIndex": {
      params: z.object({
        symbol: z.string(),
      }),
      response: Binance.zWsCompositeIndex,
    },
    "!contractInfo": {
      params: z.undefined(),
      response: Binance.zWsContractInfo,
    },
    "!assetIndex@arr": {
      params: z.undefined(),
      response: z.array(Binance.zWsAssetIndex),
    },
    "<assetSymbol>@assetIndex": {
      params: z.object({
        assetSymbol: z.string(),
      }),
      response: z.array(Binance.zWsAssetIndex),
    },
  } as const;

  export type WsEndPointConfig = typeof WsEndPointConfig;
}
